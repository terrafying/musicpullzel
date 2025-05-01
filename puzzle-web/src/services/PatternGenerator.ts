import { Note } from '../types/Note';

type Symbol = '•' | '∘' | '×';

interface PatternNode {
  symbol: Symbol;
  value: number;
  children: PatternNode[];
}

export class PatternGenerator {
  private static readonly SYMBOLS: Symbol[] = ['•', '∘', '×'];
  private static readonly BASE_FREQUENCIES = {
    '•': 440, // A4
    '∘': 523.25, // C5
    '×': 659.25, // E5
  };

  private static readonly PATTERN_MATRIX = [
    ['•', '∘', '×'],
    ['•', '∘', '×', '•', '∘'],
    ['•', '∘', '×', '•', '∘', '×', '•'],
    ['∘', '×', '•', '∘', '×', '•', '∘', '×'],
    ['×', '•', '∘', '×', '•', '∘', '×', '•', '∘', '×'],
  ];

  private static readonly REVERSE_MATRIX = [
    ['×', '•', '∘', '×', '•', '∘', '×'],
    ['•', '×', '∘', '•', '×', '∘'],
    ['•', '×', '∘', '•', '×'],
    ['•', '×', '∘', '•'],
    ['•', '×'],
  ];

  private currentPattern: PatternNode[] = [];
  private patternHistory: PatternNode[][] = [];

  constructor() {
    this.initializePattern();
  }

  private initializePattern(): void {
    this.currentPattern = this.generateBasePattern();
    this.patternHistory.push([...this.currentPattern]);
  }

  private generateBasePattern(): PatternNode[] {
    return PatternGenerator.PATTERN_MATRIX.map(row => 
      row.map(symbol => this.createNode(symbol as Symbol))
    ).flat();
  }

  private createNode(symbol: Symbol): PatternNode {
    return {
      symbol,
      value: PatternGenerator.BASE_FREQUENCIES[symbol],
      children: []
    };
  }

  private applyTransform(node: PatternNode): PatternNode {
    const transformedNode = { ...node };
    
    switch (node.symbol) {
      case '•':
        transformedNode.value *= 1.5; // Quantum leap
        break;
      case '∘':
        transformedNode.value *= 1.25; // Pattern resonance
        break;
      case '×':
        transformedNode.value *= 2; // Feedback amplification
        break;
    }

    return transformedNode;
  }

  public generateNotes(): Note[] {
    const notes: Note[] = [];
    
    this.currentPattern.forEach(node => {
      const transformedNode = this.applyTransform(node);
      notes.push({
        frequency: transformedNode.value,
        duration: this.calculateDuration(node.symbol),
        amplitude: this.calculateAmplitude(node.symbol),
        symbol: node.symbol
      });
    });

    return notes;
  }

  private calculateDuration(symbol: Symbol): number {
    switch (symbol) {
      case '•': return 0.25; // Short, quantum-like
      case '∘': return 0.5;  // Medium, pattern-like
      case '×': return 1.0;  // Long, feedback-like
    }
  }

  private calculateAmplitude(symbol: Symbol): number {
    switch (symbol) {
      case '•': return 0.8;  // Strong, focused
      case '∘': return 0.6;  // Medium, balanced
      case '×': return 0.4;  // Soft, resonant
    }
  }

  public evolvePattern(): void {
    const newPattern: PatternNode[] = [];
    
    this.currentPattern.forEach(node => {
      const transformedNode = this.applyTransform(node);
      newPattern.push(transformedNode);
    });

    this.currentPattern = newPattern;
    this.patternHistory.push([...this.currentPattern]);
  }

  public getPatternHistory(): PatternNode[][] {
    return this.patternHistory;
  }

  public getCurrentPattern(): PatternNode[] {
    return this.currentPattern;
  }

  public reset(): void {
    this.initializePattern();
  }
} 