export type Symbol = '•' | '∘' | '×';

export interface Note {
  frequency: number;
  duration: number;
  amplitude: number;
  symbol: Symbol;
} 