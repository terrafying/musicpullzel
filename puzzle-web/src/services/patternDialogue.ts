import { PatternSynthService } from './patternSynth';

export interface EmergentPattern {
  strength: number;
  type: 'harmonic' | 'rhythmic' | 'emergent';
  patternType: string;
  resonanceField: {
    center: { x: number; y: number; z: number };
    radius: number;
  };
}

interface DialogueState {
  userInfluence: number;
  systemInfluence: number;
  evolutionRate: number;
  lastInteraction: number;
  patternHistory: EmergentPattern[];
}

interface CyberneticFeedback {
  homeostasis: number;
  adaptation: number;
  emergence: number;
  stability: number;
}

export class PatternDialogueService {
  private patternSynth: PatternSynthService;
  private dialogueStates: Map<number, DialogueState> = new Map();
  private evolutionInterval: number | null = null;
  private context: AudioContext;
  
  // Enhanced routing matrices with cybernetic feedback loops
  private routingMatrices = {
    harmonic: [
      [0.8, 0.2, 0.0, 0.1], // User influence
      [0.2, 0.6, 0.2, 0.1], // System influence
      [0.0, 0.2, 0.8, 0.1], // Evolution rate
      [0.1, 0.1, 0.1, 0.7]  // Feedback loop
    ],
    rhythmic: [
      [0.6, 0.3, 0.1, 0.2],
      [0.3, 0.5, 0.2, 0.1],
      [0.1, 0.2, 0.7, 0.1],
      [0.2, 0.1, 0.1, 0.6]
    ],
    emergent: [
      [0.4, 0.4, 0.2, 0.3],
      [0.4, 0.4, 0.2, 0.2],
      [0.2, 0.2, 0.6, 0.2],
      [0.3, 0.2, 0.2, 0.5]
    ]
  };

  // Add cybernetic state tracking
  private cyberneticState = {
    homeostasis: 0.5,
    adaptation: 0.3,
    emergence: 0.2,
    stability: 0.7
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

  // Enhanced evolution with cybernetic principles
  private evolvePattern(noteIndex: number, state: DialogueState) {
    const timeSinceLastInteraction = Date.now() - state.lastInteraction;
    
    // Calculate cybernetic feedback
    const feedback = this.calculateCyberneticFeedback(state);
    
    // Update cybernetic state
    this.updateCyberneticState(feedback);
    
    // Apply cybernetic principles to pattern evolution
    const evolution = this.calculateEvolution(state);
    evolution.strength *= this.cyberneticState.adaptation;
    evolution.type = this.determineEmergentType();
    
    // Apply homeostasis to maintain stability
    if (this.cyberneticState.stability < 0.3) {
      evolution.strength *= 0.5;
    }
    
    this.patternSynth.evolvePattern(noteIndex, evolution);
  }

  private calculateCyberneticFeedback(state: DialogueState): CyberneticFeedback {
    const recentPatterns = state.patternHistory.slice(-5);
    const feedback = {
      homeostasis: 0,
      adaptation: 0,
      emergence: 0,
      stability: 0
    };

    // Calculate homeostasis based on pattern consistency
    feedback.homeostasis = this.calculateHomeostasis(recentPatterns);
    
    // Calculate adaptation based on pattern changes
    feedback.adaptation = this.calculateAdaptation(recentPatterns);
    
    // Calculate emergence based on unexpected patterns
    feedback.emergence = this.calculateEmergence(recentPatterns);
    
    // Calculate stability based on overall system state
    feedback.stability = this.calculateStability(recentPatterns);

    return feedback;
  }

  private updateCyberneticState(feedback: CyberneticFeedback) {
    const learningRate = 0.1;
    
    this.cyberneticState.homeostasis = 
      this.cyberneticState.homeostasis * (1 - learningRate) + 
      feedback.homeostasis * learningRate;
      
    this.cyberneticState.adaptation = 
      this.cyberneticState.adaptation * (1 - learningRate) + 
      feedback.adaptation * learningRate;
      
    this.cyberneticState.emergence = 
      this.cyberneticState.emergence * (1 - learningRate) + 
      feedback.emergence * learningRate;
      
    this.cyberneticState.stability = 
      this.cyberneticState.stability * (1 - learningRate) + 
      feedback.stability * learningRate;
  }

  private calculateHomeostasis(patterns: EmergentPattern[]) {
    if (patterns.length < 2) return 0.5;
    
    const variations = patterns.slice(1).map((p, i) => 
      Math.abs(p.strength - patterns[i].strength)
    );
    
    return 1 - (variations.reduce((a, b) => a + b, 0) / variations.length);
  }

  private calculateAdaptation(patterns: EmergentPattern[]) {
    if (patterns.length < 2) return 0.3;
    
    const adaptations = patterns.slice(1).map((p, i) => 
      p.type !== patterns[i].type ? 1 : 0
    );
    
    return adaptations.reduce((sum: number, val: number) => sum + val, 0) / adaptations.length;
  }

  private calculateEmergence(patterns: EmergentPattern[]) {
    if (patterns.length < 3) return 0.2;
    
    const unexpectedPatterns = patterns.filter((p, i) => 
      i > 0 && p.strength > patterns[i-1].strength * 1.5
    );
    
    return unexpectedPatterns.length / patterns.length;
  }

  private calculateStability(patterns: EmergentPattern[]) {
    const homeostasis = this.calculateHomeostasis(patterns);
    const adaptation = this.calculateAdaptation(patterns);
    const emergence = this.calculateEmergence(patterns);
    
    return (homeostasis * 0.4 + adaptation * 0.3 + emergence * 0.3);
  }

  private determineEmergentType(): string {
    const types = ['harmonic', 'rhythmic', 'emergent'];
    const weights = [
      this.cyberneticState.homeostasis,
      this.cyberneticState.adaptation,
      this.cyberneticState.emergence
    ];
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (random <= cumulativeWeight) {
        return types[i];
      }
    }
    
    return types[types.length - 1];
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