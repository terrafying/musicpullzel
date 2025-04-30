import { Logger } from './logger';

// Semantic state types
type HarmonicState = 'tension' | 'resolution' | 'transition' | 'stasis';
type RhythmicState = 'pulse' | 'flow' | 'counterpoint' | 'chaos';
type ResonanceType = 'harmonic' | 'subharmonic' | 'overtone' | 'interference';

export interface ResonancePattern {
  strength: number;
  activeNotes: number[];
  resonatingPairs: Array<[number, number, number]>; // [note1, note2, strength]
  harmonicState: HarmonicState;
  rhythmicState: RhythmicState;
  resonanceTypes: Array<'harmonic' | 'subharmonic' | 'overtone' | 'interference'>;
  pathways: Array<{
    notes: number[];
    strength: number;
    type: 'harmonic' | 'subharmonic' | 'overtone' | 'interference';
  }>;
}

// Define resonance relationships between notes with semantic meaning
const RESONANCE_MAP: Record<number, { 
  notes: number[], 
  strength: number,
  type: ResonanceType,
  semantics: {
    harmonic: HarmonicState,
    rhythmic: RhythmicState
  }
}[]> = {
  0: [
    { 
      notes: [4, 7], 
      strength: 1.0, 
      type: 'harmonic',
      semantics: { harmonic: 'resolution', rhythmic: 'pulse' }
    }
  ],
  1: [
    { 
      notes: [5, 8], 
      strength: 0.8, 
      type: 'overtone',
      semantics: { harmonic: 'tension', rhythmic: 'counterpoint' }
    }
  ],
  2: [
    { 
      notes: [6, 9], 
      strength: 0.9, 
      type: 'harmonic',
      semantics: { harmonic: 'transition', rhythmic: 'flow' }
    }
  ],
  3: [
    { 
      notes: [7, 10], 
      strength: 0.7, 
      type: 'subharmonic',
      semantics: { harmonic: 'stasis', rhythmic: 'chaos' }
    }
  ],
  4: [
    { 
      notes: [0, 8, 11], 
      strength: 1.0, 
      type: 'harmonic',
      semantics: { harmonic: 'resolution', rhythmic: 'pulse' }
    }
  ],
  5: [
    { 
      notes: [1, 9], 
      strength: 0.8, 
      type: 'interference',
      semantics: { harmonic: 'tension', rhythmic: 'counterpoint' }
    }
  ],
  6: [
    { 
      notes: [2, 10], 
      strength: 0.9, 
      type: 'overtone',
      semantics: { harmonic: 'transition', rhythmic: 'flow' }
    }
  ],
  7: [
    { 
      notes: [3, 11], 
      strength: 0.7, 
      type: 'subharmonic',
      semantics: { harmonic: 'stasis', rhythmic: 'chaos' }
    }
  ],
  8: [
    { 
      notes: [1, 4], 
      strength: 0.8, 
      type: 'interference',
      semantics: { harmonic: 'tension', rhythmic: 'flow' }
    }
  ],
  9: [
    { 
      notes: [2, 5], 
      strength: 0.9, 
      type: 'harmonic',
      semantics: { harmonic: 'transition', rhythmic: 'counterpoint' }
    }
  ],
  10: [
    { 
      notes: [3, 6], 
      strength: 0.7, 
      type: 'overtone',
      semantics: { harmonic: 'stasis', rhythmic: 'pulse' }
    }
  ],
  11: [
    { 
      notes: [4, 7], 
      strength: 1.0, 
      type: 'harmonic',
      semantics: { harmonic: 'resolution', rhythmic: 'flow' }
    }
  ]
};

export class PuzzleService {
  private bits: number = 0;
  private moves: number = 0;
  private startTime: number;
  private logger: Logger;
  private currentHarmonicState: HarmonicState = 'stasis';
  private currentRhythmicState: RhythmicState = 'pulse';
  private activePathways: Set<string> = new Set();

  constructor() {
    this.startTime = Date.now();
    this.logger = Logger.getInstance();
  }

  private calculateSemanticState(activeNotes: number[]): {
    harmonic: HarmonicState,
    rhythmic: RhythmicState,
    resonanceTypes: ResonanceType[]
  } {
    let harmonicWeights = {
      tension: 0,
      resolution: 0,
      transition: 0,
      stasis: 0
    };

    let rhythmicWeights = {
      pulse: 0,
      flow: 0,
      counterpoint: 0,
      chaos: 0
    };

    let resonanceTypes = new Set<ResonanceType>();

    // Calculate weights based on active resonances
    activeNotes.forEach(note => {
      const resonances = RESONANCE_MAP[note];
      if (resonances) {
        resonances.forEach(({ notes, strength, type, semantics }) => {
          const isActive = notes.every(n => activeNotes.includes(n));
          if (isActive) {
            harmonicWeights[semantics.harmonic] += strength;
            rhythmicWeights[semantics.rhythmic] += strength;
            resonanceTypes.add(type);
          }
        });
      }
    });

    // Determine dominant states
    const harmonicState = Object.entries(harmonicWeights)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0] as HarmonicState;

    const rhythmicState = Object.entries(rhythmicWeights)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0] as RhythmicState;

    return {
      harmonic: harmonicState,
      rhythmic: rhythmicState,
      resonanceTypes: Array.from(resonanceTypes)
    };
  }

  private findResonancePathways(activeNotes: number[]): Array<{
    notes: number[];
    strength: number;
    type: ResonanceType;
  }> {
    const pathways: Array<{
      notes: number[];
      strength: number;
      type: ResonanceType;
    }> = [];

    const visited = new Set<string>();

    const explorePathway = (
      start: number,
      current: number[],
      strength: number,
      type: ResonanceType
    ) => {
      const key = current.sort().join(',');
      if (visited.has(key)) return;
      visited.add(key);

      pathways.push({ notes: [...current], strength, type });

      const resonances = RESONANCE_MAP[current[current.length - 1]];
      if (resonances) {
        resonances.forEach(({ notes, strength: newStrength, type: newType }) => {
          const nextNotes = notes.filter(n => 
            activeNotes.includes(n) && !current.includes(n)
          );
          
          nextNotes.forEach(next => {
            explorePathway(
              start,
              [...current, next],
              strength * newStrength,
              newType
            );
          });
        });
      }
    };

    activeNotes.forEach(start => {
      explorePathway(start, [start], 1.0, 'harmonic');
    });

    return pathways.filter(p => p.notes.length > 1);
  }

  public toggleNote(position: number): ResonancePattern {
    if (position < 0 || position >= 12) {
      return this.calculateResonance();
    }

    const posMask = 1 << position;
    this.bits ^= posMask;

    const resonances = RESONANCE_MAP[position];
    if (resonances) {
      resonances.forEach(({ notes }) => {
        notes.forEach(pos => {
          const affectedMask = 1 << pos;
          if (this.bits & posMask) {
            this.bits |= affectedMask;
          }
        });
      });
    }

    this.moves++;
    return this.calculateResonance();
  }

  private calculateResonance(): ResonancePattern {
    const activeNotes = this.getActiveNotes();
    let totalStrength = 0;
    const resonatingPairs: Array<[number, number, number]> = [];

    activeNotes.forEach(note => {
      const resonances = RESONANCE_MAP[note];
      if (resonances) {
        resonances.forEach(({ notes, strength }) => {
          notes.forEach(relatedNote => {
            if (activeNotes.includes(relatedNote)) {
              totalStrength += strength;
              resonatingPairs.push([note, relatedNote, strength]);
            }
          });
        });
      }
    });

    const normalizedStrength = activeNotes.length > 0 
      ? totalStrength / (activeNotes.length * 2)
      : 0;

    const semanticState = this.calculateSemanticState(activeNotes);
    const pathways = this.findResonancePathways(activeNotes);

    this.currentHarmonicState = semanticState.harmonic;
    this.currentRhythmicState = semanticState.rhythmic;

    return {
      strength: normalizedStrength,
      activeNotes,
      resonatingPairs,
      harmonicState: semanticState.harmonic,
      rhythmicState: semanticState.rhythmic,
      resonanceTypes: semanticState.resonanceTypes,
      pathways
    };
  }

  public getActiveNotes(): number[] {
    const active: number[] = [];
    for (let i = 0; i < 12; i++) {
      if (this.bits & (1 << i)) {
        active.push(i);
      }
    }
    return active;
  }

  public getStats() {
    const timeElapsed = (Date.now() - this.startTime) / 1000;
    const resonance = this.calculateResonance();
    
    return {
      moves: this.moves,
      time: timeElapsed,
      resonanceStrength: resonance.strength,
      activeNotes: resonance.activeNotes.length,
      resonatingPairs: resonance.resonatingPairs.length,
      harmonicState: this.currentHarmonicState,
      rhythmicState: this.currentRhythmicState
    };
  }

  public reset() {
    this.bits = 0;
    this.moves = 0;
    this.startTime = Date.now();
    this.currentHarmonicState = 'stasis';
    this.currentRhythmicState = 'pulse';
    this.activePathways.clear();
  }
} 