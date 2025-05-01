import { Logger } from './logger';
import { AudioMode } from './audio/types';

export class DarkModeProcessor {
  private context: AudioContext;
  private filter: BiquadFilterNode;
  private reverb: ConvolverNode;
  private mode: AudioMode;
  private logger: Logger;

  constructor(context: AudioContext) {
    this.context = context;
    this.logger = Logger.create('DarkModeProcessor');
    
    // Initialize dark mode components
    this.filter = this.context.createBiquadFilter();
    this.reverb = this.context.createConvolver();
    this.mode = {
      isNightMode: false,
      filterCutoff: 2000,
      reverbAmount: 0.3,
      delayFeedback: 0.4
    };

    // Configure filter
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(this.mode.filterCutoff, this.context.currentTime);
    this.filter.Q.setValueAtTime(0.7, this.context.currentTime);

    // Create dark reverb
    this.createDarkReverb();
  }

  private async createDarkReverb(): Promise<void> {
    const length = this.context.sampleRate * 4.0; // 4 seconds
    const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
    
    for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.exp(-2.0 * i / length);
        channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
      }
    }

    this.reverb.buffer = impulse;
  }

  public getFilter(): BiquadFilterNode {
    return this.filter;
  }

  public getReverb(): ConvolverNode {
    return this.reverb;
  }

  public setDarkMode(enabled: boolean): void {
    this.mode.isNightMode = enabled;
    const now = this.context.currentTime;

    if (enabled) {
      // Dark mode audio settings
      this.filter.frequency.setValueAtTime(1000, now);
      this.filter.Q.setValueAtTime(2, now);
      this.mode.filterCutoff = 1000;
      this.mode.reverbAmount = 0.6;
      this.mode.delayFeedback = 0.6;
    } else {
      // Light mode audio settings
      this.filter.frequency.setValueAtTime(2000, now);
      this.filter.Q.setValueAtTime(0.7, now);
      this.mode.filterCutoff = 2000;
      this.mode.reverbAmount = 0.3;
      this.mode.delayFeedback = 0.4;
    }
  }

  public getMode(): AudioMode {
    return { ...this.mode };
  }

  public cleanup(): void {
    this.filter.disconnect();
    this.reverb.disconnect();
  }
} 