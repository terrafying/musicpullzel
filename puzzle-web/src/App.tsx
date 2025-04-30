import React, { useState, useEffect } from 'react'
import { AudioService } from './services/audio'
import { PuzzleService, ResonancePattern } from './services/puzzle'
import { Logger } from './services/logger'
import { DebugPanel } from './components/DebugPanel'
import ConnectionLines from './components/ConnectionLines'
import AudioVisualizer from './components/AudioVisualizer'
import { SpatialControls } from './components/SpatialControls'
import './App.css'

// Type definitions
type NoteVisual = {
  color: string;
  shape: 'circle' | 'square' | 'rectangle' | 'spinner';
  ratio: number;
  name: string;
  x: number;
  y: number;
  waveform: OscillatorType;
  isRhythmic: boolean;
};

// Base frequency (A4 = 440Hz)
const BASE_FREQUENCY = 440;

// Note visuals configuration using just intonation ratios
const noteVisuals: NoteVisual[] = [
  { color: '#FF0000', shape: 'circle', ratio: 1/1, name: '1/1', x: 350, y: 0, waveform: 'sine', isRhythmic: false },          // Unison
  { color: '#FF7F00', shape: 'square', ratio: 16/15, name: '16/15', x: 247.5, y: -247.5, waveform: 'square', isRhythmic: false }, // Minor second
  { color: '#FFFF00', shape: 'rectangle', ratio: 9/8, name: '9/8', x: 0, y: -350, waveform: 'sawtooth', isRhythmic: true },    // Major second
  { color: '#00FF00', shape: 'spinner', ratio: 6/5, name: '6/5', x: -247.5, y: -247.5, waveform: 'triangle', isRhythmic: true }, // Minor third
  { color: '#0000FF', shape: 'circle', ratio: 5/4, name: '5/4', x: -350, y: 0, waveform: 'sine', isRhythmic: false },         // Major third
  { color: '#4B0082', shape: 'square', ratio: 4/3, name: '4/3', x: -247.5, y: 247.5, waveform: 'square', isRhythmic: false },  // Perfect fourth
  { color: '#8F00FF', shape: 'rectangle', ratio: 3/2, name: '3/2', x: 0, y: 350, waveform: 'sawtooth', isRhythmic: true },     // Perfect fifth
  { color: '#FF1493', shape: 'spinner', ratio: 8/5, name: '8/5', x: 247.5, y: 247.5, waveform: 'triangle', isRhythmic: true },  // Minor sixth
  { color: '#00CED1', shape: 'circle', ratio: 5/3, name: '5/3', x: 175, y: -87.5, waveform: 'sine', isRhythmic: false },      // Major sixth
  { color: '#FF69B4', shape: 'square', ratio: 16/9, name: '16/9', x: -175, y: -87.5, waveform: 'square', isRhythmic: false }, // Minor seventh
  { color: '#32CD32', shape: 'rectangle', ratio: 15/8, name: '15/8', x: -175, y: 87.5, waveform: 'sawtooth', isRhythmic: true }, // Major seventh
  { color: '#FFD700', shape: 'spinner', ratio: 2/1, name: '2/1', x: 175, y: 87.5, waveform: 'triangle', isRhythmic: true },    // Octave
];

// Helper functions to convert between note names and indices
const noteToIndex = (note: string): number => {
  const idx = noteVisuals.findIndex(n => n.name === note);
  return idx >= 0 ? idx : 0;
};

const indexToNote = (index: number): string => {
  return noteVisuals[index]?.name || '1/1';
};

// Helper function to calculate frequency from ratio
const ratioToFrequency = (ratio: number): number => {
  return BASE_FREQUENCY * ratio;
};

// Sacred geometry patterns
const SACRED_PATTERNS = {
  vesica: {
    points: 2,
    radius: 1.0,
    rotation: Math.PI / 2
  },
  triquetra: {
    points: 3,
    radius: 1.2,
    rotation: 0
  },
  tetrahedron: {
    points: 4,
    radius: 1.4,
    rotation: Math.PI / 4
  },
  pentagram: {
    points: 5,
    radius: 1.6,
    rotation: -Math.PI / 2
  },
  hexagram: {
    points: 6,
    radius: 1.8,
    rotation: 0
  },
  heptagram: {
    points: 7,
    radius: 2.0,
    rotation: Math.PI / 7
  }
} as const;

function App() {
  const [audioService] = useState(() => new AudioService());
  const [puzzleService] = useState(() => new PuzzleService());
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [resonancePattern, setResonancePattern] = useState<ResonancePattern | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [tempo] = useState(120);
  const logger = Logger.getInstance();
  const [totalResonance, setTotalResonance] = useState(0);
  const [resonatingPairs, setResonatingPairs] = useState<[number, number, number][]>([]);
  const [pathways, setPathways] = useState<Array<{
    notes: number[];
    strength: number;
    type: 'harmonic' | 'subharmonic' | 'overtone' | 'interference';
  }>>([]);
  const [semanticState, setSemanticState] = useState<{
    harmonic: string;
    rhythmic: string;
    types: string[];
  }>({
    harmonic: 'stasis',
    rhythmic: 'pulse',
    types: []
  });
  const [spinorStates, setSpinorStates] = useState<Map<number, {
    rate: number,
    phase: number,
    startTime: number
  }>>(new Map());
  const [delayEchoes, setDelayEchoes] = useState<Map<number, {
    positions: { x: number; y: number }[];
    opacity: number;
  }>>(new Map());

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await audioService.initialize();
        setIsAudioInitialized(true);
        logger.info('App', 'Audio initialized successfully');
      } catch (error) {
        logger.error('App', 'Failed to initialize audio', { error });
      }
    };

    initializeAudio();
    updateGameState();

    return () => {
      audioService.cleanup();
    };
  }, [audioService]);

  const updateGameState = () => {
    const pattern = puzzleService.toggleNote(0);
    setActiveNotes(pattern.activeNotes);
    setResonatingPairs(pattern.resonatingPairs);
    setSemanticState({
      harmonic: pattern.harmonicState,
      rhythmic: pattern.rhythmicState,
      types: pattern.resonanceTypes
    });
    setPathways(pattern.pathways);
  };

  // Calculate resonating pairs based on active notes
  const calculateResonatingPairs = (): { pairs: [number, number, number][], resonanceSum: number } => {
    const pairs: [number, number, number][] = [];
    let resonanceSum = 0;

    if (resonancePattern) {
      resonancePattern.resonatingPairs.forEach(pair => {
        pairs.push(pair);
        resonanceSum += pair[2];
      });
    }

    return { pairs, resonanceSum };
  };

  // Update resonance whenever active notes change
  useEffect(() => {
    const { resonanceSum } = calculateResonatingPairs();
    setTotalResonance(resonanceSum);
  }, [activeNotes]);

  // Update spinor animation frames
  useEffect(() => {
    let animationFrame: number;
    const updateSpinors = () => {
      setSpinorStates(prevStates => {
        const newStates = new Map(prevStates);
        activeNotes.forEach(noteIndex => {
          const state = newStates.get(noteIndex);
          if (state) {
            const elapsed = (Date.now() - state.startTime) / 1000;
            const rotation = (elapsed * state.rate * 360 + state.phase * 180 / Math.PI) % 360;
            const note = document.querySelector(`[data-note-index="${noteIndex}"]`);
            if (note) {
              note.setAttribute('style', `${note.getAttribute('style')}; transform: translate(-50%, -50%) rotate(${rotation}deg)`);
            }
          }
        });
        return newStates;
      });
      animationFrame = requestAnimationFrame(updateSpinors);
    };
    
    animationFrame = requestAnimationFrame(updateSpinors);
    return () => cancelAnimationFrame(animationFrame);
  }, [activeNotes, spinorStates]);

  // Update delay visualization
  useEffect(() => {
    const updateEchoes = () => {
      setDelayEchoes(prevEchoes => {
        const newEchoes = new Map(prevEchoes);
        activeNotes.forEach(noteIndex => {
          const note = noteVisuals[noteIndex];
          const pattern = Object.values(SACRED_PATTERNS)[noteIndex % Object.keys(SACRED_PATTERNS).length];
          const positions = [];
          
          // Generate sacred geometry echo positions
          for (let i = 0; i < pattern.points; i++) {
            const angle = (i * 2 * Math.PI / pattern.points) + pattern.rotation;
            const radius = pattern.radius * 50; // Scale for pixels
            positions.push({
              x: note.x + Math.cos(angle) * radius,
              y: note.y + Math.sin(angle) * radius
            });
          }
          
          newEchoes.set(noteIndex, {
            positions,
            opacity: 0.7
          });
        });
        return newEchoes;
      });
    };

    const interval = setInterval(updateEchoes, 60 / tempo * 750); // 3/4 of beat duration
    return () => clearInterval(interval);
  }, [activeNotes, tempo]);

  const toggleNote = (noteIndex: number) => {
    const pattern = puzzleService.toggleNote(noteIndex);
    setActiveNotes(pattern.activeNotes);
    setResonatingPairs(pattern.resonatingPairs);
    setSemanticState({
      harmonic: pattern.harmonicState,
      rhythmic: pattern.rhythmicState,
      types: pattern.resonanceTypes
    });
    setPathways(pattern.pathways);
    
    const frequency = ratioToFrequency(noteVisuals[noteIndex].ratio);
    const { waveform, isRhythmic } = noteVisuals[noteIndex];
    
    // Enhanced audio parameters with spinor motion effects
    const spinorRate = pattern.resonatingPairs.length * 0.5;
    const spinorPhase = pattern.activeNotes.length * Math.PI / 6;
    
    // Update spinor state for the toggled note
    setSpinorStates(prevStates => {
      const newStates = new Map(prevStates);
      if (pattern.activeNotes.includes(noteIndex)) {
        newStates.set(noteIndex, {
          rate: spinorRate,
          phase: spinorPhase,
          startTime: Date.now()
        });
      } else {
        newStates.delete(noteIndex);
      }
      return newStates;
    });
    
    const audioParams = {
      waveform,
      isRhythmic,
      modulation: (pattern.harmonicState === 'tension' ? 'frequency' : 
                  pattern.harmonicState === 'resolution' ? 'amplitude' : 
                  pattern.harmonicState === 'transition' ? 'ring' : 'phase') as 'frequency' | 'amplitude' | 'ring' | 'phase',
      modDepth: pattern.strength * 15 + 5,
      modRate: pattern.rhythmicState === 'chaos' ? 8 : 
              pattern.rhythmicState === 'pulse' ? 2 :
              pattern.rhythmicState === 'flow' ? 4 : 6,
      spinorRate,
      spinorPhase,
      gateTime: pattern.rhythmicState === 'pulse' ? 0.2 :
                pattern.rhythmicState === 'flow' ? 0.4 :
                pattern.rhythmicState === 'counterpoint' ? 0.6 : 0.8,
      releaseTime: pattern.harmonicState === 'resolution' ? 0.5 :
                  pattern.harmonicState === 'tension' ? 0.1 :
                  pattern.harmonicState === 'transition' ? 0.3 : 0.2
    };
    
    // Play note with enhanced parameters
    audioService.playNote(
      frequency,
      audioParams.waveform,
      audioParams.isRhythmic,
      audioParams.modulation,
      audioParams.modDepth,
      audioParams.modRate,
      audioParams.spinorRate,
      audioParams.spinorPhase,
      audioParams.gateTime,
      audioParams.releaseTime
    );
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    audioService.setVolume(newVolume);
  };

  const { pairs: calculatedPairs } = calculateResonatingPairs();
  const resonancePercentage = Math.min(100, (totalResonance / 3) * 100);

  // Helper function to get semantic state colors
  const getSemanticStateColors = () => {
    const colors = {
      tension: '#FF4136',
      resolution: '#2ECC40',
      transition: '#FF851B',
      stasis: '#7FDBFF',
      pulse: '#B10DC9',
      flow: '#01FF70',
      counterpoint: '#FFDC00',
      chaos: '#85144b'
    };
    
    return {
      harmonic: colors[semanticState.harmonic as keyof typeof colors],
      rhythmic: colors[semanticState.rhythmic as keyof typeof colors]
    };
  };

  // Get semantic state colors
  const stateColors = getSemanticStateColors();

  return (
    <div className="app">
      <div className="semantic-state-display">
        <div className="state-indicator harmonic" style={{ backgroundColor: stateColors.harmonic }}>
          {semanticState.harmonic}
        </div>
        <div className="state-indicator rhythmic" style={{ backgroundColor: stateColors.rhythmic }}>
          {semanticState.rhythmic}
        </div>
      </div>

      <div className="game-board">
        <ConnectionLines 
          activeNotes={activeNotes}
          resonatingPairs={resonatingPairs}
          pathways={pathways}
          noteVisuals={noteVisuals}
        />
        
        {/* Render delay echoes */}
        {Array.from(delayEchoes.entries()).map(([noteIndex, echo]) => (
          <div key={`echo-${noteIndex}`} className="echo-container">
            {echo.positions.map((pos, i) => {
              const note = noteVisuals[noteIndex];
              return (
                <div
                  key={`echo-${noteIndex}-${i}`}
                  className={`note-echo ${note.shape}`}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    backgroundColor: note.color,
                    opacity: echo.opacity * (1 - i / echo.positions.length),
                    transform: `translate(-50%, -50%) scale(${0.8 - i * 0.1})`,
                    transition: 'all 0.3s ease-out'
                  }}
                />
              );
            })}
          </div>
        ))}

        {/* Existing note buttons with sacred geometry patterns */}
        {noteVisuals.map((note, index) => {
          const spinorState = spinorStates.get(index);
          const isActive = activeNotes.includes(index);
          const pattern = Object.values(SACRED_PATTERNS)[index % Object.keys(SACRED_PATTERNS).length];
          
          return (
            <button
              key={note.name}
              data-note-index={index}
              className={`note-button ${note.shape} ${isActive ? 'active' : ''}`}
              style={{
                position: 'absolute',
                left: `${note.x}px`,
                top: `${note.y}px`,
                backgroundColor: note.color,
                transform: `translate(-50%, -50%) rotate(${pattern.rotation}rad)`,
                transition: isActive ? 'none' : 'transform 0.3s ease-out'
              }}
              onClick={() => toggleNote(index)}
            >
              <div 
                className={`resonator ${isActive ? 'active' : ''}`}
                style={{
                  animation: isActive ? `pulse ${60 / tempo}s infinite` : 'none',
                  clipPath: generateSacredGeometryPath(pattern)
                }}
              />
              <span className="ratio-label">{note.name}</span>
              <span className="key-hint">{index + 1}</span>
            </button>
          );
        })}
      </div>

      <div className="visualizer-container">
        <AudioVisualizer 
          audioContext={audioService.getAudioContext()}
          analyser={audioService.getAnalyser()}
        />
      </div>

      <div className="controls">
        <div className="volume-control">
          <label>Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>

      <SpatialControls audioService={audioService} />

      {debugMode && <DebugPanel />}

      <button 
        className="debug-toggle"
        onClick={() => setDebugMode(!debugMode)}
      >
        {debugMode ? 'Hide Debug' : 'Show Debug'}
      </button>
    </div>
  );
}

// Helper function to generate SVG-style path for sacred geometry
function generateSacredGeometryPath(pattern: typeof SACRED_PATTERNS[keyof typeof SACRED_PATTERNS]): string {
  const points: string[] = [];
  const radius = 20; // Base size for the clip path

  for (let i = 0; i < pattern.points; i++) {
    const angle = (i * 2 * Math.PI / pattern.points) + pattern.rotation;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    points.push(`${x}% ${y}%`);
  }

  return `polygon(${points.join(', ')})`;
}

export default App
