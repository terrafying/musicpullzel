import { NoteState } from './audio/types';

export interface HexState {
  id: string;
  note: number;  // MIDI note number
  isActive: boolean;
  sphericalCoords: {
    radius: number;
    theta: number;  // azimuthal angle
    phi: number;    // polar angle
  };
  harmonicValue: number;  // Value between 0-1 representing harmonic resonance
}

export interface GameState {
  hexagons: Map<string, HexState>;
  activeNotes: Map<number, NoteState>;
  sphericalPhase: number;  // Current phase of spherical pattern
  harmonicResonance: number;  // Overall harmonic resonance of the pattern
}

export class GameStateManager {
  private state: GameState;
  private subscribers: Set<(state: GameState) => void>;

  constructor() {
    this.state = {
      hexagons: new Map(),
      activeNotes: new Map(),
      sphericalPhase: 0,
      harmonicResonance: 0
    };
    this.subscribers = new Set();
  }

  // Initialize a hexagonal grid with spherical coordinates
  initializeGrid(radius: number, numLayers: number) {
    const hexagons = new Map<string, HexState>();
    let id = 0;

    // Create center hexagon
    hexagons.set('0', {
      id: '0',
      note: 60, // Middle C
      isActive: false,
      sphericalCoords: {
        radius: 0,
        theta: 0,
        phi: 0
      },
      harmonicValue: 0
    });

    // Create surrounding layers
    for (let layer = 1; layer <= numLayers; layer++) {
      const hexesInLayer = layer * 6;
      for (let i = 0; i < hexesInLayer; i++) {
        id++;
        const angle = (i * 2 * Math.PI) / hexesInLayer;
        const layerRadius = radius * layer;
        
        hexagons.set(id.toString(), {
          id: id.toString(),
          note: 60 + layer + i, // Increment notes based on layer and position
          isActive: false,
          sphericalCoords: {
            radius: layerRadius,
            theta: angle,
            phi: Math.PI / 2 * (layer / numLayers) // Gradually increase elevation
          },
          harmonicValue: 0
        });
      }
    }

    this.state.hexagons = hexagons;
    this.notifySubscribers();
  }

  // Toggle a hexagon's state and update related harmonics
  toggleHexagon(id: string) {
    const hex = this.state.hexagons.get(id);
    if (!hex) return;

    hex.isActive = !hex.isActive;
    
    if (hex.isActive) {
      // Add note to active notes
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const modOscillator = audioContext.createOscillator();
      const modGain = audioContext.createGain();
      
      oscillator.connect(gainNode);
      modOscillator.connect(modGain);
      modGain.connect(oscillator.frequency);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 440 * Math.pow(2, (hex.note - 69) / 12);
      oscillator.start();
      modOscillator.start();
      
      this.state.activeNotes.set(hex.note, {
        oscillator,
        gainNode,
        modOscillator,
        modGain,
        startTime: Date.now(),
        isReleased: false,
        waveform: 'sine',
        isRhythmic: false,
        sacredRatio: 1,
        position: {
          x: hex.sphericalCoords.radius * Math.sin(hex.sphericalCoords.phi) * Math.cos(hex.sphericalCoords.theta),
          y: hex.sphericalCoords.radius * Math.sin(hex.sphericalCoords.phi) * Math.sin(hex.sphericalCoords.theta),
          z: hex.sphericalCoords.radius * Math.cos(hex.sphericalCoords.phi)
        }
      });
    } else {
      // Remove note from active notes
      const note = this.state.activeNotes.get(hex.note);
      if (note) {
        note.oscillator.stop();
        note.modOscillator.stop();
        note.gainNode.disconnect();
        note.modGain.disconnect();
      }
      this.state.activeNotes.delete(hex.note);
    }

    // Update harmonic values based on spherical relationships
    this.updateHarmonics();
    this.notifySubscribers();
  }

  // Update harmonic values based on spherical relationships
  private updateHarmonics() {
    const activeHexes = Array.from(this.state.hexagons.values())
      .filter(hex => hex.isActive);

    // Calculate harmonic resonance based on spherical relationships
    let totalResonance = 0;
    activeHexes.forEach(hex => {
      const resonance = this.calculateHarmonicResonance(hex, activeHexes);
      hex.harmonicValue = resonance;
      totalResonance += resonance;
    });

    this.state.harmonicResonance = totalResonance / (activeHexes.length || 1);
    this.state.sphericalPhase = (this.state.sphericalPhase + 0.01) % (2 * Math.PI);
  }

  // Calculate harmonic resonance between hexagons
  private calculateHarmonicResonance(hex: HexState, activeHexes: HexState[]): number {
    let resonance = 0;
    
    activeHexes.forEach(other => {
      if (other.id === hex.id) return;

      // Calculate spherical distance
      const dx = other.sphericalCoords.radius * Math.sin(other.sphericalCoords.phi) * Math.cos(other.sphericalCoords.theta) -
                hex.sphericalCoords.radius * Math.sin(hex.sphericalCoords.phi) * Math.cos(hex.sphericalCoords.theta);
      const dy = other.sphericalCoords.radius * Math.sin(other.sphericalCoords.phi) * Math.sin(other.sphericalCoords.theta) -
                hex.sphericalCoords.radius * Math.sin(hex.sphericalCoords.phi) * Math.sin(hex.sphericalCoords.theta);
      const dz = other.sphericalCoords.radius * Math.cos(other.sphericalCoords.phi) -
                hex.sphericalCoords.radius * Math.cos(hex.sphericalCoords.phi);
      
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Calculate harmonic relationship based on note intervals
      const noteInterval = Math.abs(other.note - hex.note);
      const harmonicFactor = 1 / (1 + noteInterval / 12); // Stronger resonance for octaves and fifths

      resonance += harmonicFactor * Math.exp(-distance / 2);
    });

    return Math.min(1, resonance);
  }

  // Subscribe to state changes
  subscribe(callback: (state: GameState) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Notify all subscribers of state changes
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }

  // Get current state
  getState(): GameState {
    return this.state;
  }
} 