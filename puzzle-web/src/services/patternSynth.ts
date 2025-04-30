import { AudioService } from './audio';
import { EmergentPattern } from './types';

interface RoutingConfig {
  feedbackPath: number;
  modulationPath: number;
  evolutionPath: number;
}

export class PatternSynthService {
  private audioService: AudioService;
  private feedbackNodes: Map<number, GainNode> = new Map();
  private controlLoops: Map<number, OscillatorNode> = new Map();
  private patternFilters: Map<number, BiquadFilterNode> = new Map();
  private feedbackDelay: DelayNode;
  private feedbackGain: GainNode;
  private patternMixer: GainNode;
  private context: AudioContext;
  private routingNodes: Map<number, {
    feedback: GainNode;
    modulation: GainNode;
    evolution: GainNode;
  }> = new Map();

  constructor(audioService: AudioService) {
    this.audioService = audioService;
    this.context = audioService.getAudioContext();
    
    // Create feedback delay
    this.feedbackDelay = this.context.createDelay(2.0);
    this.feedbackGain = this.context.createGain();
    this.patternMixer = this.context.createGain();
    
    // Set up feedback loop
    this.feedbackDelay.connect(this.feedbackGain);
    this.feedbackGain.connect(this.feedbackDelay);
    this.feedbackGain.gain.value = 0.3;
    
    // Connect to main output
    this.feedbackDelay.connect(this.patternMixer);
    this.patternMixer.connect(this.audioService.getMasterGain());
  }

  getAudioContext(): AudioContext {
    return this.context;
  }

  // Initialize pattern-based synthesis for a note
  initializePatternSynth(noteIndex: number, pattern: EmergentPattern) {
    const { frequency, waveform } = this.getPatternParameters(pattern);
    
    // Create oscillator for the pattern
    const oscillator = this.context.createOscillator();
    oscillator.type = waveform as OscillatorType;
    oscillator.frequency.value = frequency;
    
    // Create pattern-specific filter
    const filter = this.context.createBiquadFilter();
    this.configureFilter(filter, pattern);
    this.patternFilters.set(noteIndex, filter);
    
    // Create routing nodes
    const routing = {
      feedback: this.context.createGain(),
      modulation: this.context.createGain(),
      evolution: this.context.createGain()
    };
    this.routingNodes.set(noteIndex, routing);
    
    // Create feedback node
    const feedback = this.context.createGain();
    feedback.gain.value = this.calculateFeedbackGain(pattern);
    this.feedbackNodes.set(noteIndex, feedback);
    
    // Create control loop oscillator
    const controlLoop = this.context.createOscillator();
    controlLoop.frequency.value = this.calculateControlFrequency(pattern);
    this.controlLoops.set(noteIndex, controlLoop);
    
    // Connect the nodes with routing
    oscillator.connect(filter);
    filter.connect(routing.feedback);
    routing.feedback.connect(feedback);
    feedback.connect(this.feedbackDelay);
    
    // Set up modulation routing
    controlLoop.connect(routing.modulation);
    routing.modulation.connect(feedback.gain);
    
    // Set up evolution routing
    const evolutionOsc = this.context.createOscillator();
    evolutionOsc.frequency.value = 0.1;
    evolutionOsc.connect(routing.evolution);
    routing.evolution.connect(filter.frequency);
    
    // Start the oscillators
    oscillator.start();
    controlLoop.start();
    evolutionOsc.start();
    
    return { oscillator, filter, feedback, controlLoop, evolutionOsc };
  }

  // Update routing configuration
  updateRouting(noteIndex: number, config: RoutingConfig) {
    const routing = this.routingNodes.get(noteIndex);
    if (!routing) return;

    // Update routing gains
    routing.feedback.gain.value = config.feedbackPath;
    routing.modulation.gain.value = config.modulationPath;
    routing.evolution.gain.value = config.evolutionPath;
  }

  // Evolve pattern based on evolution parameters
  evolvePattern(noteIndex: number, evolution: { strength: number; type: string }) {
    const filter = this.patternFilters.get(noteIndex);
    const controlLoop = this.controlLoops.get(noteIndex);
    
    if (filter && controlLoop) {
      // Update filter based on evolution
      const currentFreq = filter.frequency.value;
      const targetFreq = currentFreq * (1 + evolution.strength * 0.1);
      filter.frequency.setTargetAtTime(targetFreq, this.context.currentTime, 0.1);
      
      // Update control loop based on evolution type
      const baseFreq = this.calculateControlFrequency({ type: evolution.type, strength: evolution.strength } as EmergentPattern);
      controlLoop.frequency.setTargetAtTime(baseFreq, this.context.currentTime, 0.1);
    }
  }

  // Update pattern synthesis based on pattern evolution
  updatePatternSynth(noteIndex: number, pattern: EmergentPattern) {
    const filter = this.patternFilters.get(noteIndex);
    const feedback = this.feedbackNodes.get(noteIndex);
    const controlLoop = this.controlLoops.get(noteIndex);
    
    if (filter && feedback && controlLoop) {
      // Update filter parameters
      this.configureFilter(filter, pattern);
      
      // Update feedback gain
      feedback.gain.value = this.calculateFeedbackGain(pattern);
      
      // Update control loop frequency
      controlLoop.frequency.value = this.calculateControlFrequency(pattern);
    }
  }

  // Clean up pattern synthesis for a note
  cleanupPatternSynth(noteIndex: number) {
    const filter = this.patternFilters.get(noteIndex);
    const feedback = this.feedbackNodes.get(noteIndex);
    const controlLoop = this.controlLoops.get(noteIndex);
    
    if (filter && feedback && controlLoop) {
      filter.disconnect();
      feedback.disconnect();
      controlLoop.stop();
      
      this.patternFilters.delete(noteIndex);
      this.feedbackNodes.delete(noteIndex);
      this.controlLoops.delete(noteIndex);
    }
  }

  // Helper methods for parameter calculation
  private getPatternParameters(pattern: EmergentPattern) {
    const baseFrequency = 440; // A4
    const frequency = baseFrequency * Math.pow(2, pattern.strength / 12);
    const waveform = this.getPatternWaveform(pattern);
    
    return { frequency, waveform };
  }

  private getPatternWaveform(pattern: EmergentPattern): OscillatorType {
    // Map pattern types to waveforms
    switch (pattern.type) {
      case 'harmonic':
        return 'sine';
      case 'rhythmic':
        return 'square';
      case 'emergent':
        return 'sawtooth';
      default:
        return 'triangle';
    }
  }

  private configureFilter(filter: BiquadFilterNode, pattern: EmergentPattern) {
    // Configure filter based on pattern characteristics
    filter.type = 'bandpass';
    filter.frequency.value = 1000 + (pattern.strength * 500);
    filter.Q.value = 5 + (pattern.strength * 3);
    filter.gain.value = pattern.strength * 10;
  }

  private calculateFeedbackGain(pattern: EmergentPattern): number {
    // Calculate feedback gain based on pattern strength and type
    const baseGain = 0.3;
    const strengthFactor = pattern.strength * 0.5;
    const typeFactor = pattern.type === 'emergent' ? 0.2 : 0.1;
    
    return Math.min(0.8, baseGain + strengthFactor + typeFactor);
  }

  private calculateControlFrequency(pattern: EmergentPattern): number {
    // Calculate control loop frequency based on pattern characteristics
    const baseFreq = 0.5; // Hz
    return baseFreq * (1 + pattern.strength);
  }

  // Set overall feedback level
  setFeedbackLevel(level: number) {
    this.feedbackGain.gain.value = Math.max(0, Math.min(0.8, level));
  }

  // Set pattern mix level
  setPatternMixLevel(level: number) {
    this.patternMixer.gain.value = Math.max(0, Math.min(1, level));
  }
} 