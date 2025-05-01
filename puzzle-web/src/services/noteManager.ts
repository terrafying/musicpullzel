import { Logger } from './logger';
import { NoteState, ModulationParams, ADSR, SpatialPosition } from './audio/types';
import { SACRED_RATIOS, SacredRatioKey } from './audio/types';

export class NoteManager {
  private context: AudioContext;
  private activeNotes: Map<number, NoteState>;
  private adsr: ADSR;
  private volume: number;
  private logger: Logger;

  constructor(context: AudioContext) {
    this.context = context;
    this.activeNotes = new Map();
    this.adsr = {
      attack: 0.05,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3
    };
    this.volume = 0.5;
    this.logger = Logger.create('NoteManager');
  }

  public createNote(
    frequency: number,
    waveform: OscillatorType = 'sine',
    isRhythmic: boolean = false,
    modulationParams?: ModulationParams,
    position?: SpatialPosition
  ): NoteState {
    const now = this.context.currentTime;

    // Create main oscillator
    const oscillator = this.context.createOscillator();
    oscillator.type = waveform;

    // Apply sacred ratio modulation
    const ratioKeys = Object.keys(SACRED_RATIOS) as SacredRatioKey[];
    const sacredRatio = SACRED_RATIOS[ratioKeys[Math.floor(Math.random() * ratioKeys.length)]];
    const sacredFrequency = frequency * sacredRatio;
    oscillator.frequency.setValueAtTime(sacredFrequency, now);

    // Create gain node
    const gainNode = this.context.createGain();
    gainNode.gain.setValueAtTime(0, now);

    // Create modulation oscillator
    const modOscillator = this.context.createOscillator();
    const modGain = this.context.createGain();

    if (modulationParams) {
      modOscillator.frequency.setValueAtTime(modulationParams.rate, now);
      modGain.gain.setValueAtTime(modulationParams.depth * 0.5, now);
      
      switch (modulationParams.type) {
        case 'frequency':
          modOscillator.connect(modGain);
          modGain.connect(oscillator.frequency);
          break;
        case 'amplitude':
          modOscillator.connect(modGain);
          modGain.connect(gainNode.gain);
          break;
        case 'ring':
          modOscillator.connect(modGain);
          modGain.connect(gainNode);
          break;
        case 'phase':
          const phaseNode = this.context.createGain();
          phaseNode.gain.setValueAtTime(modulationParams.spinorPhase, now);
          modOscillator.connect(phaseNode);
          phaseNode.connect(oscillator.detune);
          break;
      }
    } else {
      // Default modulation
      modOscillator.frequency.setValueAtTime(5, now);
      modGain.gain.setValueAtTime(2, now);
      modOscillator.connect(modGain);
      modGain.connect(oscillator.frequency);
    }

    // Create spinor oscillator if needed
    let spinorOscillator, spinorGain;
    if (modulationParams?.spinorRate) {
      spinorOscillator = this.context.createOscillator();
      spinorGain = this.context.createGain();
      spinorOscillator.frequency.setValueAtTime(modulationParams.spinorRate, now);
      spinorGain.gain.setValueAtTime(modulationParams.depth * 0.5, now);
      spinorOscillator.connect(spinorGain);
      spinorGain.connect(oscillator.detune);
      spinorOscillator.start();
    }

    // Create rhythmic elements if needed
    let rhythmOscillator, rhythmGain;
    if (isRhythmic) {
      rhythmOscillator = this.context.createOscillator();
      rhythmGain = this.context.createGain();
      rhythmOscillator.type = 'square';
      rhythmOscillator.frequency.setValueAtTime(120 / 60, now); // 120 BPM
      rhythmGain.gain.setValueAtTime(0.2, now);
      rhythmOscillator.connect(rhythmGain);
      rhythmGain.connect(gainNode);
      rhythmOscillator.start();
    }

    // Start oscillators
    oscillator.start();
    modOscillator.start();

    const note: NoteState = {
      oscillator,
      gainNode,
      modOscillator,
      modGain,
      rhythmOscillator,
      rhythmGain,
      spinorOscillator,
      spinorGain,
      startTime: now,
      isReleased: false,
      waveform,
      isRhythmic,
      sacredRatio,
      position: position || { x: 0, y: 0, z: 0 }
    };

    this.activeNotes.set(frequency, note);
    return note;
  }

  public applyADSR(note: NoteState, params?: ModulationParams): void {
    const now = this.context.currentTime;
    const { attack, decay, sustain } = this.adsr;
    const release = params?.releaseTime || this.adsr.release;
    const gateTime = params?.gateTime || (attack + decay);

    if (note.isReleased) {
      // Release phase
      note.gainNode.gain.cancelScheduledValues(now);
      note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
      note.gainNode.gain.linearRampToValueAtTime(0, now + release);
    } else {
      // Attack and decay phases
      note.gainNode.gain.cancelScheduledValues(now);
      note.gainNode.gain.setValueAtTime(0, now);
      note.gainNode.gain.linearRampToValueAtTime(this.volume, now + attack);
      note.gainNode.gain.linearRampToValueAtTime(this.volume * sustain, now + gateTime);
      
      if (params?.gateTime) {
        note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now + gateTime);
        note.gainNode.gain.linearRampToValueAtTime(0, now + gateTime + release);
        note.isReleased = true;
      }
    }
  }

  public stopNote(frequency: number): void {
    const note = this.activeNotes.get(frequency);
    if (note && !note.isReleased) {
      this.applyADSR(note, {
        type: 'amplitude',
        depth: 0,
        rate: 0,
        spinorRate: 0,
        spinorPhase: 0,
        gateTime: 0,
        releaseTime: this.adsr.release
      });
      
      // Clean up after release phase
      setTimeout(() => {
        if (this.activeNotes.has(frequency)) {
          const noteToCleanup = this.activeNotes.get(frequency);
          if (noteToCleanup) {
            noteToCleanup.oscillator.stop();
            noteToCleanup.modOscillator.stop();
            noteToCleanup.rhythmOscillator?.stop();
            noteToCleanup.spinorOscillator?.stop();
            noteToCleanup.oscillator.disconnect();
            noteToCleanup.gainNode.disconnect();
            noteToCleanup.modOscillator.disconnect();
            noteToCleanup.modGain.disconnect();
            noteToCleanup.rhythmGain?.disconnect();
            noteToCleanup.spinorGain?.disconnect();
            this.activeNotes.delete(frequency);
          }
        }
      }, this.adsr.release * 1000);
    }
  }

  public stopAllNotes(): void {
    this.activeNotes.forEach((note, frequency) => {
      this.stopNote(frequency);
    });
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  public setADSR(adsr: Partial<ADSR>): void {
    this.adsr = { ...this.adsr, ...adsr };
  }

  public getActiveNotes(): Map<number, NoteState> {
    return new Map(this.activeNotes);
  }

  public cleanup(): void {
    this.stopAllNotes();
    this.activeNotes.clear();
  }
} 