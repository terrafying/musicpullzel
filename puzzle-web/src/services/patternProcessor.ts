import { AudioContext, GainNode, DelayNode } from 'web-audio-api';
import { Logger } from './logger';

export class PatternProcessor {
  private context: AudioContext;
  private input: GainNode;
  private feedback: DelayNode;
  private feedbackGain: GainNode;
  private mixer: GainNode;
  private logger: Logger;

  constructor(context: AudioContext) {
    this.context = context;
    this.logger = Logger.create('PatternProcessor');
    
    // Create pattern processing chain
    this.input = this.context.createGain();
    this.feedback = this.context.createDelay(2.0);
    this.feedbackGain = this.context.createGain();
    this.mixer = this.context.createGain();
    
    // Set up pattern feedback loop
    this.feedback.connect(this.feedbackGain);
    this.feedbackGain.connect(this.feedback);
    this.feedbackGain.gain.value = 0.3;
    
    // Connect pattern chain
    this.input.connect(this.mixer);
    this.feedback.connect(this.mixer);
  }

  public getInput(): GainNode {
    return this.input;
  }

  public getOutput(): GainNode {
    return this.mixer;
  }

  public setFeedbackLevel(level: number): void {
    this.feedbackGain.gain.value = Math.max(0, Math.min(0.8, level));
  }

  public setMixLevel(level: number): void {
    this.mixer.gain.value = Math.max(0, Math.min(1, level));
  }

  public cleanup(): void {
    this.input.disconnect();
    this.feedback.disconnect();
    this.feedbackGain.disconnect();
    this.mixer.disconnect();
  }
} 