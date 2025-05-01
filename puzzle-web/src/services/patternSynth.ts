import { AudioService } from './audio';
import { EmergentPattern } from './types';

interface PatternSynthConfig {
  frequency: number;
  waveform: OscillatorType;
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ: number;
  modulationRate: number;
  modulationDepth: number;
  cessationPhase?: number; // Phase of cessation kernel
  preNullification?: number; // Pre-nullification coefficient
}

// Cessation kernel patterns
const CESSATION_PATTERNS = {
  collapse: {
    phase: Math.PI / 4,
    preNullification: 0.8,
    waveform: 'sine' as OscillatorType,
    filterType: 'lowpass' as BiquadFilterType
  },
  decay: {
    phase: Math.PI / 2,
    preNullification: 0.6,
    waveform: 'triangle' as OscillatorType,
    filterType: 'bandpass' as BiquadFilterType
  },
  resonance: {
    phase: Math.PI,
    preNullification: 0.4,
    waveform: 'sawtooth' as OscillatorType,
    filterType: 'highpass' as BiquadFilterType
  },
  quantum: {
    phase: Math.PI * 1.5,
    preNullification: 0.2,
    waveform: 'square' as OscillatorType,
    filterType: 'notch' as BiquadFilterType
  }
} as const;

type CessationPatternType = keyof typeof CESSATION_PATTERNS;

export class PatternSynthService {
  private audioService: AudioService;
  private oscillators: Map<number, OscillatorNode> = new Map();
  private filters: Map<number, BiquadFilterNode> = new Map();
  private modulators: Map<number, OscillatorNode> = new Map();
  private context: AudioContext;
  private cessationPatterns: Map<number, CessationPatternType> = new Map();

  constructor(audioService: AudioService) {
    this.audioService = audioService;
    const context = audioService.getAudioContext();
    if (!context) {
      throw new Error('AudioService not initialized');
    }
    this.context = context;
  }

  // Initialize pattern-based synthesis for a note
  initializePatternSynth(noteIndex: number, pattern: EmergentPattern) {
    const config = this.getPatternConfig(pattern);
    const cessationPatternType = this.getCessationPattern(pattern);
    const cessationPattern = CESSATION_PATTERNS[cessationPatternType];
    
    // Create oscillator for the pattern
    const oscillator = this.context.createOscillator();
    oscillator.type = config.waveform;
    oscillator.frequency.value = config.frequency;
    
    // Create pattern-specific filter
    const filter = this.context.createBiquadFilter();
    filter.type = config.filterType;
    filter.frequency.value = config.filterFreq;
    filter.Q.value = config.filterQ;
    
    // Create modulator
    const modulator = this.context.createOscillator();
    modulator.frequency.value = config.modulationRate;
    
    // Create modulation gain
    const modGain = this.context.createGain();
    modGain.gain.value = config.modulationDepth;
    
    // Create cessation kernel oscillator
    const cessationOsc = this.context.createOscillator();
    cessationOsc.type = cessationPattern.waveform;
    cessationOsc.frequency.value = config.frequency * 0.5;
    
    // Create cessation gain
    const cessationGain = this.context.createGain();
    cessationGain.gain.value = cessationPattern.preNullification;
    
    // Connect the nodes
    oscillator.connect(filter);
    modulator.connect(modGain);
    modGain.connect(oscillator.frequency);
    cessationOsc.connect(cessationGain);
    cessationGain.connect(filter.frequency);
    
    // Store references
    this.oscillators.set(noteIndex, oscillator);
    this.filters.set(noteIndex, filter);
    this.modulators.set(noteIndex, modulator);
    this.cessationPatterns.set(noteIndex, cessationPatternType);
    
    // Start the oscillators
    oscillator.start();
    modulator.start();
    cessationOsc.start();
    
    // Connect to audio service's input
    filter.connect(this.audioService.getPatternInput());
    
    return { oscillator, filter, modulator, cessationOsc };
  }

  // Update pattern synthesis based on pattern evolution
  updatePatternSynth(noteIndex: number, pattern: EmergentPattern) {
    const config = this.getPatternConfig(pattern);
    const cessationPattern = this.getCessationPattern(pattern);
    const oscillator = this.oscillators.get(noteIndex);
    const filter = this.filters.get(noteIndex);
    const modulator = this.modulators.get(noteIndex);
    
    if (oscillator && filter && modulator) {
      oscillator.frequency.setTargetAtTime(config.frequency, this.context.currentTime, 0.1);
      filter.frequency.setTargetAtTime(config.filterFreq, this.context.currentTime, 0.1);
      filter.Q.setTargetAtTime(config.filterQ, this.context.currentTime, 0.1);
      modulator.frequency.setTargetAtTime(config.modulationRate, this.context.currentTime, 0.1);
      
      // Update cessation pattern
      this.cessationPatterns.set(noteIndex, cessationPattern);
    }
  }

  // Clean up pattern synthesis for a note
  cleanupPatternSynth(noteIndex: number) {
    const oscillator = this.oscillators.get(noteIndex);
    const filter = this.filters.get(noteIndex);
    const modulator = this.modulators.get(noteIndex);
    
    if (oscillator && filter && modulator) {
      oscillator.stop();
      modulator.stop();
      filter.disconnect();
      
      this.oscillators.delete(noteIndex);
      this.filters.delete(noteIndex);
      this.modulators.delete(noteIndex);
      this.cessationPatterns.delete(noteIndex);
    }
  }

  // Helper methods for parameter calculation
  private getPatternConfig(pattern: EmergentPattern): PatternSynthConfig {
    const baseFrequency = 440; // A4
    const frequency = baseFrequency * Math.pow(2, pattern.strength / 12);
    
    return {
      frequency,
      waveform: this.getPatternWaveform(pattern),
      filterType: 'bandpass',
      filterFreq: 1000 + (pattern.strength * 500),
      filterQ: 5 + (pattern.strength * 3),
      modulationRate: 5 + (pattern.strength * 3),
      modulationDepth: pattern.strength * 10
    };
  }

  private getPatternWaveform(pattern: EmergentPattern): OscillatorType {
    switch (pattern.patternType) {
      case 'harmonic':
        return 'sine';
      case 'rhythmic':
        return 'square';
      case 'spatial':
        return 'sawtooth';
      case 'imaginary':
        return 'triangle';
      default:
        return 'sine';
    }
  }

  private getCessationPattern(pattern: EmergentPattern): CessationPatternType {
    const patterns = Object.keys(CESSATION_PATTERNS) as CessationPatternType[];
    const index = Math.floor(pattern.strength * patterns.length) % patterns.length;
    return patterns[index];
  }
} 