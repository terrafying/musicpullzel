export interface Vector2D {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface GradientStop {
  position: number;
  color: Color;
  alpha: number;
}

export interface Gradient {
  stops: GradientStop[];
}

export interface PatternVisual {
  color: Color;
  shape: 'circle' | 'square' | 'rectangle' | 'spinner';
  ratio: number;
  name: string;
  position: Vector2D;
  waveform: OscillatorType;
  isRhythmic: boolean;
}

export interface ResonanceField {
  center: Vector2D;
  radius: number;
  intensity: number;
}

export interface EmergentPattern {
  patternType: 'harmonic' | 'rhythmic' | 'spatial' | 'imaginary';
  nodes: number[];
  strength: number;
  stability: number;
  resonanceField: ResonanceField;
  evolution: {
    transformations: Array<{
      timestamp: number;
      type: string;
    }>;
  };
} 