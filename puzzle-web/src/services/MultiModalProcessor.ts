import { PatternGenerator } from './PatternGenerator';
import { Note } from '../types/Note';

interface SensoryOutput {
  visual: {
    color: string;
    intensity: number;
    pattern: string[];
  };
  auditory: {
    frequency: number;
    duration: number;
    amplitude: number;
    waveform: 'sine' | 'square' | 'sawtooth';
  };
  haptic: {
    intensity: number;
    pattern: number[];
    duration: number;
  };
  olfactory: {
    intensity: number;
    scent: string;
    duration: number;
  };
}

export class MultiModalProcessor {
  private audioContext: AudioContext;
  private patternGenerator: PatternGenerator;
  private currentOutput: SensoryOutput;

  constructor(patternGenerator: PatternGenerator) {
    this.patternGenerator = patternGenerator;
    this.audioContext = new AudioContext();
    this.currentOutput = this.createDefaultOutput();
  }

  private createDefaultOutput(): SensoryOutput {
    return {
      visual: {
        color: '#000000',
        intensity: 0,
        pattern: []
      },
      auditory: {
        frequency: 440,
        duration: 0,
        amplitude: 0,
        waveform: 'sine'
      },
      haptic: {
        intensity: 0,
        pattern: [],
        duration: 0
      },
      olfactory: {
        intensity: 0,
        scent: 'neutral',
        duration: 0
      }
    };
  }

  public processPattern(): SensoryOutput {
    const notes = this.patternGenerator.generateNotes();
    const output: SensoryOutput = this.createDefaultOutput();

    notes.forEach(note => {
      // Visual processing
      output.visual.pattern.push(note.symbol);
      output.visual.intensity = this.mapFrequencyToIntensity(note.frequency);
      output.visual.color = this.getSymbolColor(note.symbol);

      // Auditory processing
      output.auditory.frequency = note.frequency;
      output.auditory.duration = note.duration;
      output.auditory.amplitude = note.amplitude;
      output.auditory.waveform = this.getWaveformForSymbol(note.symbol);

      // Haptic processing
      output.haptic.intensity = this.mapAmplitudeToHaptic(note.amplitude);
      output.haptic.pattern = this.generateHapticPattern(note.symbol);
      output.haptic.duration = note.duration;

      // Olfactory processing
      output.olfactory.intensity = this.mapFrequencyToScentIntensity(note.frequency);
      output.olfactory.scent = this.getScentForSymbol(note.symbol);
      output.olfactory.duration = note.duration;
    });

    this.currentOutput = output;
    return output;
  }

  private mapFrequencyToIntensity(frequency: number): number {
    return Math.min(1, frequency / 2000);
  }

  private mapAmplitudeToHaptic(amplitude: number): number {
    return amplitude * 0.8;
  }

  private mapFrequencyToScentIntensity(frequency: number): number {
    return Math.min(1, frequency / 1500);
  }

  private getSymbolColor(symbol: string): string {
    switch (symbol) {
      case '•': return '#FF6B6B';
      case '∘': return '#4ECDC4';
      case '×': return '#45B7D1';
      default: return '#000000';
    }
  }

  private getWaveformForSymbol(symbol: string): 'sine' | 'square' | 'sawtooth' {
    switch (symbol) {
      case '•': return 'sine';
      case '∘': return 'square';
      case '×': return 'sawtooth';
      default: return 'sine';
    }
  }

  private generateHapticPattern(symbol: string): number[] {
    switch (symbol) {
      case '•': return [1, 0, 0, 0];
      case '∘': return [1, 1, 0, 0];
      case '×': return [1, 1, 1, 1];
      default: return [0, 0, 0, 0];
    }
  }

  private getScentForSymbol(symbol: string): string {
    switch (symbol) {
      case '•': return 'ozone';
      case '∘': return 'petrichor';
      case '×': return 'static';
      default: return 'neutral';
    }
  }

  public async playAudio(): Promise<void> {
    const output = this.currentOutput;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = output.auditory.waveform;
    oscillator.frequency.setValueAtTime(output.auditory.frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(output.auditory.amplitude, this.audioContext.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + output.auditory.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + output.auditory.duration);
  }

  public getCurrentOutput(): SensoryOutput {
    return this.currentOutput;
  }
} 