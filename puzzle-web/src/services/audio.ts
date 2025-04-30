import { Logger } from './logger';

interface ADSR {
  attack: number;   // Time to reach peak amplitude (seconds)
  decay: number;    // Time to reach sustain level (seconds)
  sustain: number;  // Sustain level (0-1)
  release: number;  // Time to fade to zero (seconds)
}

interface SpatialPosition {
  x: number;  // -1 to 1 (left to right)
  y: number;  // -1 to 1 (back to front)
  z: number;  // -1 to 1 (bottom to top)
}

interface NoteState {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  modOscillator: OscillatorNode;
  modGain: GainNode;
  rhythmOscillator?: OscillatorNode;
  rhythmGain?: GainNode;
  spinorOscillator?: OscillatorNode;
  spinorGain?: GainNode;
  panner?: PannerNode;
  startTime: number;
  isReleased: boolean;
  waveform: OscillatorType;
  isRhythmic: boolean;
  delayNetwork?: DelayNetwork;
  sacredRatio: number;
  position: SpatialPosition;
}

interface ModulationParams {
  type: 'frequency' | 'amplitude' | 'ring' | 'phase';
  depth: number;
  rate: number;
  spinorRate: number;
  spinorPhase: number;
  gateTime: number;
  releaseTime: number;
}

type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

// Sacred frequency ratios with subharmonics for dark mode
const SACRED_RATIOS = {
  unison: 1,      // 1:1 - Unity
  phi: 1.618034,  // Golden Ratio
  sqrt2: 1.4142,  // Square root of 2
  sqrt3: 1.7321,  // Square root of 3
  pi: 3.14159,    // π
  e: 2.71828,     // Euler's number
  // Dark mode subharmonic ratios
  subPhi: 0.618034,   // 1/φ - Divine proportion inverse
  subOctave: 0.5,     // 1/2 - Octave below
  subFifth: 0.666667, // 2/3 - Perfect fifth below
  subFourth: 0.75,    // 3/4 - Perfect fourth below
  subThird: 0.8,      // 4/5 - Major third below
  subSecond: 0.888889 // 8/9 - Major second below
} as const;

type SacredRatioKey = keyof typeof SACRED_RATIOS;

// Base frequency lowered for dark mode (54Hz - subharmonic of 432Hz)
const BASE_FREQUENCY = 54;

interface DelayNetwork {
  delay: DelayNode;
  feedback: GainNode;
  filter: BiquadFilterNode;
  mix: GainNode;
}

interface AudioMode {
  isNightMode: boolean;
  filterCutoff: number;
  reverbAmount: number;
  delayFeedback: number;
}

export class AudioService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mainGainNode: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private darkFilter: BiquadFilterNode | null = null;
  private darkReverb: ConvolverNode | null = null;
  private mode: AudioMode = {
    isNightMode: false,
    filterCutoff: 2000,
    reverbAmount: 0.3,
    delayFeedback: 0.4
  };
  private delayNetworks: Map<number, DelayNetwork> = new Map();
  private logger: Logger;
  private volume: number = 0.5;
  private activeNotes: Map<number, NoteState> = new Map();
  private tempo: number = 120; // BPM
  private currentBeat: number = 0;
  private beatInterval: ReturnType<typeof setInterval> | null = null;
  private listener: AudioListener | null = null;
  private spatialMode: boolean = false;
  private currentPosition: SpatialPosition = { x: 0, y: 0, z: 0 };
  private moveSpeed: number = 0.1;
  private rotationSpeed: number = 0.05;

  // Default ADSR settings
  private adsr: ADSR = {
    attack: 0.05,
    decay: 0.1,
    sustain: 0.7,
    release: 0.3
  };

  constructor() {
    this.logger = Logger.getInstance();
  }

  public async initialize(): Promise<void> {
    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.mainGainNode = this.audioContext.createGain();
      this.limiter = this.audioContext.createDynamicsCompressor();
      this.darkFilter = this.audioContext.createBiquadFilter();
      this.listener = this.audioContext.listener;
      
      // Configure listener for spatial audio
      this.listener.setOrientation(0, 0, -1, 0, 1, 0);
      this.listener.setPosition(0, 0, 0);
      
      // Configure dark filter
      this.darkFilter.type = 'lowpass';
      this.darkFilter.frequency.setValueAtTime(this.mode.filterCutoff, this.audioContext.currentTime);
      this.darkFilter.Q.setValueAtTime(0.7, this.audioContext.currentTime);

      // Create dark reverb
      this.darkReverb = this.audioContext.createConvolver();
      await this.createDarkReverb();
      
      // Updated audio chain: mainGain -> darkFilter -> darkReverb -> limiter -> analyser -> destination
      this.mainGainNode.connect(this.darkFilter);
      this.darkFilter.connect(this.darkReverb);
      this.darkReverb.connect(this.limiter);
      this.limiter.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      this.setVolume(this.volume);
      this.startBeatClock();
      this.logger.info('AudioService', 'Audio context initialized with soft limiter');
    } catch (error) {
      this.logger.error('AudioService', 'Failed to initialize audio context', { error });
      throw error;
    }
  }

  private async createDarkReverb(): Promise<void> {
    if (!this.audioContext || !this.darkReverb) return;

    // Create a dark, long reverb impulse response
    const length = this.audioContext.sampleRate * 4.0; // 4 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with some randomness for a dark character
        const decay = Math.exp(-2.0 * i / length);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
      }
    }

    this.darkReverb.buffer = impulse;
  }

  private startBeatClock(): void {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
    }
    
    const beatDuration = (60 / this.tempo) * 1000; // Convert BPM to milliseconds
    this.beatInterval = setInterval(() => {
      this.currentBeat = (this.currentBeat + 1) % 4; // 4/4 time signature
      this.logger.debug('AudioService', `Beat: ${this.currentBeat + 1}`);
      this.updateRhythmicNotes();
    }, beatDuration);
  }

  private updateRhythmicNotes(): void {
    if (!this.audioContext) return;

    this.activeNotes.forEach((note, frequency) => {
      if (note.isRhythmic && note.rhythmGain) {
        const now = this.audioContext!.currentTime;
        // Create a rhythmic pulse on each beat
        note.rhythmGain.gain.cancelScheduledValues(now);
        note.rhythmGain.gain.setValueAtTime(0.2, now);
        note.rhythmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      }
    });
  }

  public setTempo(bpm: number): void {
    this.tempo = Math.max(40, Math.min(200, bpm));
    this.startBeatClock();
  }

  public setADSR(adsr: Partial<ADSR>): void {
    this.adsr = { ...this.adsr, ...adsr };
  }

  private createDelayNetwork(frequency: number): DelayNetwork {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const network: DelayNetwork = {
      delay: this.audioContext.createDelay(5.0),
      feedback: this.audioContext.createGain(),
      filter: this.audioContext.createBiquadFilter(),
      mix: this.audioContext.createGain()
    };

    // Set up delay network
    network.delay.delayTime.setValueAtTime(60 / this.tempo * 0.75, this.audioContext.currentTime);
    network.feedback.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    network.filter.type = 'lowpass';
    network.filter.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime);
    network.filter.Q.setValueAtTime(2, this.audioContext.currentTime);
    network.mix.gain.setValueAtTime(0.3, this.audioContext.currentTime);

    // Connect delay feedback loop
    network.delay.connect(network.filter);
    network.filter.connect(network.feedback);
    network.feedback.connect(network.delay);
    network.delay.connect(network.mix);

    if (this.mode.isNightMode) {
      // Longer delay times and higher feedback for dark mode
      network.delay.delayTime.setValueAtTime(60 / this.tempo * 1.5, this.audioContext!.currentTime);
      network.feedback.gain.setValueAtTime(this.mode.delayFeedback * 1.5, this.audioContext!.currentTime);
      network.filter.frequency.setValueAtTime(frequency * 0.3, this.audioContext!.currentTime);
      network.filter.Q.setValueAtTime(4, this.audioContext!.currentTime);
    }

    return network;
  }

  private createPannerNode(): PannerNode {
    if (!this.audioContext) throw new Error('Audio context not initialized');
    
    const panner = this.audioContext.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 10000;
    panner.rolloffFactor = 1;
    panner.coneInnerAngle = 360;
    panner.coneOuterAngle = 0;
    panner.coneOuterGain = 0;
    
    return panner;
  }

  public setSpatialMode(enabled: boolean): void {
    this.spatialMode = enabled;
    if (enabled) {
      this.activeNotes.forEach((note, frequency) => {
        if (!note.panner) {
          note.panner = this.createPannerNode();
          note.gainNode.disconnect();
          note.gainNode.connect(note.panner);
          note.panner.connect(this.mainGainNode!);
        }
        this.updateNotePosition(frequency, note.position);
      });
    } else {
      this.activeNotes.forEach((note, frequency) => {
        if (note.panner) {
          note.gainNode.disconnect();
          note.gainNode.connect(this.mainGainNode!);
          note.panner.disconnect();
          note.panner = undefined;
        }
      });
    }
  }

  public moveListener(direction: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down'): void {
    if (!this.listener || !this.spatialMode) return;

    const now = this.audioContext!.currentTime;
    const { x, y, z } = this.currentPosition;
    
    switch (direction) {
      case 'forward':
        this.currentPosition.y = Math.min(1, y + this.moveSpeed);
        break;
      case 'backward':
        this.currentPosition.y = Math.max(-1, y - this.moveSpeed);
        break;
      case 'left':
        this.currentPosition.x = Math.max(-1, x - this.moveSpeed);
        break;
      case 'right':
        this.currentPosition.x = Math.min(1, x + this.moveSpeed);
        break;
      case 'up':
        this.currentPosition.z = Math.min(1, z + this.moveSpeed);
        break;
      case 'down':
        this.currentPosition.z = Math.max(-1, z - this.moveSpeed);
        break;
    }

    this.listener.setPosition(x, y, z);
    this.updateAllNotePositions();
  }

  public rotateListener(direction: 'left' | 'right'): void {
    if (!this.listener || !this.spatialMode) return;

    const now = this.audioContext!.currentTime;
    const rotation = direction === 'left' ? -this.rotationSpeed : this.rotationSpeed;
    
    // Calculate new orientation based on current position
    const { x, y, z } = this.currentPosition;
    const angle = Math.atan2(z, x) + rotation;
    const newX = Math.cos(angle);
    const newZ = Math.sin(angle);
    
    this.listener.setOrientation(newX, 0, newZ, 0, 1, 0);
  }

  private updateNotePosition(frequency: number, position: SpatialPosition): void {
    const note = this.activeNotes.get(frequency);
    if (!note || !note.panner) return;

    const now = this.audioContext!.currentTime;
    note.panner.setPosition(position.x * 10, position.y * 10, position.z * 10);
  }

  private updateAllNotePositions(): void {
    this.activeNotes.forEach((note, frequency) => {
      this.updateNotePosition(frequency, note.position);
    });
  }

  private createNote(
    frequency: number, 
    waveform: OscillatorType = 'sine', 
    isRhythmic: boolean = false,
    modulationParams?: ModulationParams
  ): NoteState {
    if (!this.audioContext || !this.mainGainNode) {
      throw new Error('Audio context not initialized');
    }

    const now = this.audioContext.currentTime;

    // Create main oscillator first
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = waveform;

    // Apply sacred ratio modulation
    const ratioKeys = Object.keys(SACRED_RATIOS) as SacredRatioKey[];
    const sacredRatio = SACRED_RATIOS[ratioKeys[Math.floor(Math.random() * ratioKeys.length)]];
    let sacredFrequency = frequency * sacredRatio;

    // Apply dark mode modifications
    if (this.mode.isNightMode) {
      // Use subharmonic ratios in dark mode
      const darkRatioKeys = Object.keys(SACRED_RATIOS).filter(k => k.startsWith('sub')) as SacredRatioKey[];
      const darkRatio = SACRED_RATIOS[darkRatioKeys[Math.floor(Math.random() * darkRatioKeys.length)]];
      sacredFrequency = sacredFrequency * darkRatio;

      // Add subtle detuning for darkness
      oscillator.detune.setValueAtTime(-12, now); // Slight detune
      
      // Modify waveform for darker timbre
      if (waveform === 'sine') waveform = 'triangle';
      else if (waveform === 'triangle') waveform = 'sawtooth';
      oscillator.type = waveform;
    }

    // Set the frequency after all modifications
    oscillator.frequency.setValueAtTime(sacredFrequency, now);

    // Create delay network for this note
    const delayNetwork = this.createDelayNetwork(sacredFrequency);

    // Create gain node for amplitude envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);

    // Create modulation oscillator with enhanced parameters
    const modOscillator = this.audioContext.createOscillator();
    const modGain = this.audioContext.createGain();
    
    // Adjust gain staging for better limiter interaction
    gainNode.gain.setValueAtTime(0, now);
    const baseGain = this.volume * 0.7; // Reduce base gain to leave headroom for limiter

    if (modulationParams) {
      modOscillator.frequency.setValueAtTime(modulationParams.rate, now);
      modGain.gain.setValueAtTime(modulationParams.depth * 0.5, now); // Reduce modulation depth
      
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
          const phaseNode = this.audioContext.createGain();
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

    // Create spinor oscillator if params provided
    let spinorOscillator, spinorGain;
    if (modulationParams?.spinorRate) {
      spinorOscillator = this.audioContext.createOscillator();
      spinorGain = this.audioContext.createGain();
      spinorOscillator.frequency.setValueAtTime(modulationParams.spinorRate, now);
      spinorGain.gain.setValueAtTime(modulationParams.depth * 0.5, now);
      spinorOscillator.connect(spinorGain);
      spinorGain.connect(oscillator.detune);
      spinorOscillator.start();
    }

    // Create rhythmic elements if needed
    let rhythmOscillator, rhythmGain;
    if (isRhythmic) {
      rhythmOscillator = this.audioContext.createOscillator();
      rhythmGain = this.audioContext.createGain();
      rhythmOscillator.type = 'square';
      rhythmOscillator.frequency.setValueAtTime(this.tempo / 60, now);
      rhythmGain.gain.setValueAtTime(0.2, now);
      rhythmOscillator.connect(rhythmGain);
      rhythmGain.connect(gainNode);
      rhythmOscillator.start();
    }

    // Add spatial positioning
    const position: SpatialPosition = {
      x: (Math.random() * 2 - 1) * 0.5,  // Random position within -0.5 to 0.5
      y: (Math.random() * 2 - 1) * 0.5,
      z: (Math.random() * 2 - 1) * 0.5
    };

    const panner = this.spatialMode ? this.createPannerNode() : undefined;
    if (panner) {
      panner.setPosition(position.x * 10, position.y * 10, position.z * 10);
      gainNode.connect(panner);
      panner.connect(this.mainGainNode!);
    } else {
      gainNode.connect(this.mainGainNode!);
    }

    // Connect everything
    oscillator.connect(gainNode);
    gainNode.connect(delayNetwork.delay);
    delayNetwork.mix.connect(this.mainGainNode);

    // Start oscillators
    oscillator.start();
    modOscillator.start();

    return {
      oscillator,
      gainNode,
      modOscillator,
      modGain,
      rhythmOscillator,
      rhythmGain,
      spinorOscillator,
      spinorGain,
      delayNetwork,
      panner,
      position,
      startTime: now,
      isReleased: false,
      waveform,
      isRhythmic,
      sacredRatio
    };
  }

  private applyADSR(note: NoteState, params?: ModulationParams): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const { attack, decay, sustain } = this.adsr;
    const release = params?.releaseTime || this.adsr.release;
    const gateTime = params?.gateTime || (attack + decay);

    if (note.isReleased) {
      // Release phase
      note.gainNode.gain.cancelScheduledValues(now);
      note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
      note.gainNode.gain.linearRampToValueAtTime(0, now + release);
    } else {
      // Attack and decay phases with gate time
      note.gainNode.gain.cancelScheduledValues(now);
      note.gainNode.gain.setValueAtTime(0, now);
      note.gainNode.gain.linearRampToValueAtTime(this.volume, now + attack);
      note.gainNode.gain.linearRampToValueAtTime(this.volume * sustain, now + gateTime);
      
      // Schedule automatic release if gate time is specified
      if (params?.gateTime) {
        note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now + gateTime);
        note.gainNode.gain.linearRampToValueAtTime(0, now + gateTime + release);
        note.isReleased = true;
      }
    }
  }

  public playNote(
    frequency: number,
    waveform: OscillatorType = 'sine',
    isRhythmic: boolean = false,
    modulationType: 'frequency' | 'amplitude' | 'ring' | 'phase' = 'frequency',
    modDepth: number = 5,
    modRate: number = 5,
    spinorRate: number = 0,
    spinorPhase: number = 0,
    gateTime: number = 0,
    releaseTime: number = 0.3
  ): void {
    if (!this.audioContext || !this.mainGainNode) {
      this.logger.warn('AudioService', 'Audio context not initialized');
      return;
    }

    try {
      // Stop any existing note at this frequency
      this.stopNote(frequency);

      const modulationParams: ModulationParams = {
        type: modulationType,
        depth: modDepth,
        rate: modRate,
        spinorRate,
        spinorPhase,
        gateTime,
        releaseTime
      };

      // Create and store new note
      const note = this.createNote(frequency, waveform, isRhythmic, modulationParams);
      this.activeNotes.set(frequency, note);
      this.applyADSR(note, modulationParams);

      this.logger.info('AudioService', `Playing note at ${frequency}Hz with ${waveform} waveform and ${modulationType} modulation`);
    } catch (error) {
      this.logger.error('AudioService', 'Failed to play note', { error });
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
    if (this.mainGainNode && this.audioContext) {
      this.mainGainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    }
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public cleanup(): void {
    if (this.beatInterval) {
      clearInterval(this.beatInterval);
    }
    this.stopAllNotes();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
      this.mainGainNode = null;
      this.limiter = null;
    }
    this.delayNetworks.forEach(network => {
      network.delay.disconnect();
      network.feedback.disconnect();
      network.filter.disconnect();
      network.mix.disconnect();
    });
    this.delayNetworks.clear();
  }

  public setDarkMode(enabled: boolean): void {
    if (!this.audioContext || !this.darkFilter) return;

    this.mode.isNightMode = enabled;
    const now = this.audioContext.currentTime;

    if (enabled) {
      // Dark mode audio settings
      this.darkFilter.frequency.setValueAtTime(1000, now);
      this.darkFilter.Q.setValueAtTime(2, now);
      this.darkReverb!.connect(this.limiter!);
      this.mode.filterCutoff = 1000;
      this.mode.reverbAmount = 0.6;
      this.mode.delayFeedback = 0.6;
    } else {
      // Light mode audio settings
      this.darkFilter.frequency.setValueAtTime(2000, now);
      this.darkFilter.Q.setValueAtTime(0.7, now);
      this.darkReverb!.disconnect();
      this.mode.filterCutoff = 2000;
      this.mode.reverbAmount = 0.3;
      this.mode.delayFeedback = 0.4;
    }

    // Update all active notes
    this.activeNotes.forEach((note, frequency) => {
      if (note.delayNetwork) {
        note.delayNetwork.feedback.gain.setValueAtTime(
          this.mode.delayFeedback,
          now
        );
      }
    });
  }
} 