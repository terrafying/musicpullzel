// Emotion types
export interface EmotionState {
  valence: number;
  arousal: number;
  dominance: number;
}

// Pattern types
export interface Pattern {
  nodes: number[];
  connections: Array<[number, number]>;
  resonance: number;
  complexity: number;
}

// Interaction types
export interface Interaction {
  pattern: string;
  success: boolean;
  timeToComplete: number;
}

// Visualization types
export interface Vector2D {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface Gradient {
  stops: Array<{
    position: number;
    color: Color;
    alpha: number;
  }>;
}

export interface ResonanceField {
  center: Vector2D;
  radius: number;
  intensity: number;
}

export interface EmergentPattern {
  patternType: 'harmonic' | 'rhythmic' | 'melodic';
  nodes: number[];
  strength: number;
  stability: number;
  resonanceField: ResonanceField;
  evolution: {
    transformations: Array<{
      timestamp: number;
      type: 'merge' | 'split' | 'transform';
    }>;
  };
}

// Game types
export interface GameState {
  currentPattern: EmergentPattern;
  difficulty: number;
  score: number;
  emotionalState: EmotionState;
}

export interface GameConfig {
  initialDifficulty: number;
  maxDifficulty: number;
  minDifficulty: number;
  difficultyStep: number;
  patternComplexity: number;
}

// AI types
export interface LearningState {
  successRate: number;
  averageTime: number;
  learningProgress: number;
}

export interface AIStrategy {
  type: 'aggressive' | 'defensive' | 'adaptive';
  parameters: Record<string, number>;
}

// LLM types
export interface LLMResponse {
  text: string;
  suggestions: string[];
  confidence: number;
}

export interface LLMContext {
  gameState: GameState;
  playerHistory: Interaction[];
  emotionalState: EmotionState;
} 