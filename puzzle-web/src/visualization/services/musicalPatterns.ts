import { MusicalPattern } from '../types/strokeOrder';

export class MusicalPatterns {
    private patterns: Map<string, MusicalPattern>;

    constructor() {
        this.patterns = new Map([
            ['horizontal', {
                waveform: 'sine',
                filterType: 'lowpass',
                filterFreq: 1000,
                filterQ: 1,
                attack: 0.1,
                decay: 0.2,
                sustain: 0.7,
                release: 0.3,
                description: 'Smooth horizontal line'
            }],
            ['vertical', {
                waveform: 'square',
                filterType: 'highpass',
                filterFreq: 2000,
                filterQ: 2,
                attack: 0.05,
                decay: 0.1,
                sustain: 0.8,
                release: 0.2,
                description: 'Strong vertical stroke'
            }],
            ['dot', {
                waveform: 'triangle',
                filterType: 'bandpass',
                filterFreq: 1500,
                filterQ: 3,
                attack: 0.01,
                decay: 0.05,
                sustain: 0.5,
                release: 0.1,
                description: 'Quick dot'
            }],
            ['hook', {
                waveform: 'sawtooth',
                filterType: 'notch',
                filterFreq: 1200,
                filterQ: 4,
                attack: 0.08,
                decay: 0.15,
                sustain: 0.6,
                release: 0.25,
                description: 'Curved hook'
            }],
            ['slant', {
                waveform: 'sine',
                filterType: 'peaking',
                filterFreq: 1800,
                filterQ: 2,
                attack: 0.06,
                decay: 0.12,
                sustain: 0.75,
                release: 0.2,
                description: 'Diagonal slant'
            }]
        ]);
    }

    getPattern(strokeType: string): MusicalPattern {
        return this.patterns.get(strokeType) || this.patterns.get('horizontal')!;
    }

    addPattern(strokeType: string, pattern: MusicalPattern): void {
        this.patterns.set(strokeType, pattern);
    }

    removePattern(strokeType: string): void {
        this.patterns.delete(strokeType);
    }

    getAllPatterns(): Map<string, MusicalPattern> {
        return new Map(this.patterns);
    }
} 