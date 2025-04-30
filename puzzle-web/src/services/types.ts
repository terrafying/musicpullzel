export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface ResonanceField {
  center: Vector3;
  radius: number;
  intensity: number;
}

export interface Transformation {
  type: 'harmonic' | 'rhythmic' | 'spatial' | 'imaginary';
  strength: number;
  timestamp: number;
}

export interface EmergentPattern {
  id: string;
  nodes: string[];
  patternType: 'harmonic' | 'rhythmic' | 'spatial' | 'imaginary';
  strength: number;
  stability: number;
  resonanceField: {
    center: { x: number; y: number; z: number };
    radius: number;
    intensity: number;
  };
  evolution: {
    birth: number;
    death?: number;
    transitions: Array<{
      timestamp: number;
      type: string;
      strength: number;
    }>;
  };
  rotation: number;
} 