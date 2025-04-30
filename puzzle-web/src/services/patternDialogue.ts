import { PatternSynthService } from './patternSynth';
import { EmergentPattern } from './types';

interface DialogueState {
  userInfluence: number;
  systemInfluence: number;
  evolutionRate: number;
  lastInteraction: number;
  patternHistory: EmergentPattern[];
}

export class PatternDialogueService {
  private patternSynth: PatternSynthService;
  private dialogueStates: Map<number, DialogueState> = new Map();
  private evolutionInterval: number | null = null;
  private context: AudioContext;
  
  // Routing matrices for different pattern types
  private routingMatrices = {
    harmonic: [
      [0.8, 0.2, 0.0], // User influence
      [0.2, 0.6, 0.2], // System influence
      [0.0, 0.2, 0.8]  // Evolution rate
    ],
    rhythmic: [
      [0.6, 0.3, 0.1],
      [0.3, 0.5, 0.2],
      [0.1, 0.2, 0.7]
    ],
    emergent: [
      [0.4, 0.4, 0.2],
      [0.4, 0.4, 0.2],
      [0.2, 0.2, 0.6]
    ]
  };

  constructor(patternSynth: PatternSynthService) {
    this.patternSynth = patternSynth;
    this.context = patternSynth.getAudioContext();
    this.startEvolutionLoop();
  }

  // Initialize dialogue for a new pattern
  initializeDialogue(noteIndex: number, pattern: EmergentPattern) {
    const state: DialogueState = {
      userInfluence: 0.5,
      systemInfluence: 0.5,
      evolutionRate: 0.1,
      lastInteraction: Date.now(),
      patternHistory: [pattern]
    };
    
    this.dialogueStates.set(noteIndex, state);
    this.updateRouting(noteIndex, pattern);
  }

  // Handle user interaction with a pattern
  handleUserInteraction(noteIndex: number, pattern: EmergentPattern) {
    const state = this.dialogueStates.get(noteIndex);
    if (!state) return;

    const timeSinceLastInteraction = Date.now() - state.lastInteraction;
    const interactionStrength = Math.min(1, timeSinceLastInteraction / 1000);

    // Update influence based on interaction
    state.userInfluence = Math.min(1, state.userInfluence + interactionStrength * 0.2);
    state.systemInfluence = Math.max(0, state.systemInfluence - interactionStrength * 0.1);
    
    // Add to pattern history
    state.patternHistory.push(pattern);
    if (state.patternHistory.length > 10) {
      state.patternHistory.shift();
    }

    state.lastInteraction = Date.now();
    this.updateRouting(noteIndex, pattern);
  }

  // Update routing based on current state
  private updateRouting(noteIndex: number, pattern: EmergentPattern) {
    const state = this.dialogueStates.get(noteIndex);
    if (!state) return;

    const matrix = this.routingMatrices[pattern.type];
    const routing = this.calculateRouting(matrix, state);

    // Update pattern synthesis parameters
    this.patternSynth.updateRouting(noteIndex, {
      feedbackPath: routing.feedbackPath,
      modulationPath: routing.modulationPath,
      evolutionPath: routing.evolutionPath
    });
  }

  // Calculate routing based on current state and matrix
  private calculateRouting(matrix: number[][], state: DialogueState) {
    return {
      feedbackPath: matrix[0][0] * state.userInfluence + matrix[1][0] * state.systemInfluence,
      modulationPath: matrix[0][1] * state.userInfluence + matrix[1][1] * state.systemInfluence,
      evolutionPath: matrix[0][2] * state.userInfluence + matrix[1][2] * state.systemInfluence
    };
  }

  // Start the evolution loop
  private startEvolutionLoop() {
    this.evolutionInterval = window.setInterval(() => {
      this.dialogueStates.forEach((state, noteIndex) => {
        this.evolvePattern(noteIndex, state);
      });
    }, 100); // Update every 100ms
  }

  // Evolve pattern based on current state
  private evolvePattern(noteIndex: number, state: DialogueState) {
    const timeSinceLastInteraction = Date.now() - state.lastInteraction;
    
    // Gradually shift influence back to system
    if (timeSinceLastInteraction > 2000) {
      state.userInfluence = Math.max(0.2, state.userInfluence - 0.01);
      state.systemInfluence = Math.min(0.8, state.systemInfluence + 0.01);
    }

    // Evolve pattern based on history and current state
    const evolution = this.calculateEvolution(state);
    this.patternSynth.evolvePattern(noteIndex, evolution);
  }

  // Calculate pattern evolution based on history
  private calculateEvolution(state: DialogueState) {
    if (state.patternHistory.length < 2) return { strength: 0, type: 'harmonic' };

    const current = state.patternHistory[state.patternHistory.length - 1];
    const previous = state.patternHistory[state.patternHistory.length - 2];

    // Calculate evolution based on pattern history
    const strengthDelta = current.strength - previous.strength;
    const evolutionStrength = Math.abs(strengthDelta) * state.evolutionRate;

    return {
      strength: evolutionStrength,
      type: this.determineEvolutionType(current, previous)
    };
  }

  // Determine evolution type based on pattern changes
  private determineEvolutionType(current: EmergentPattern, previous: EmergentPattern): string {
    if (current.type !== previous.type) return 'emergent';
    if (Math.abs(current.strength - previous.strength) > 0.5) return 'rhythmic';
    return 'harmonic';
  }

  // Clean up dialogue for a pattern
  cleanupDialogue(noteIndex: number) {
    this.dialogueStates.delete(noteIndex);
  }

  // Clean up the service
  cleanup() {
    if (this.evolutionInterval) {
      clearInterval(this.evolutionInterval);
    }
    this.dialogueStates.clear();
  }
} 