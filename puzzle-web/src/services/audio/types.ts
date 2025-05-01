export interface ADSR {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
}

export interface NoteState {
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

export interface DelayNetwork {
  delay: DelayNode;
  feedback: GainNode;
  filter: BiquadFilterNode;
  mix: GainNode;
}

export interface AudioMode {
  isNightMode: boolean;
  filterCutoff: number;
  reverbAmount: number;
  delayFeedback: number;
}

export interface ModulationParams {
  type: 'frequency' | 'amplitude' | 'ring' | 'phase';
  depth: number;
  rate: number;
  spinorRate: number;
  spinorPhase: number;
  gateTime: number;
  releaseTime: number;
}

export const SACRED_RATIOS = {
  unison: 1,
  phi: 1.618034,
  sqrt2: 1.4142,
  sqrt3: 1.7321,
  pi: 3.14159,
  e: 2.71828,
  subPhi: 0.618034,
  subOctave: 0.5,
  subFifth: 0.666667,
  subFourth: 0.75,
  subThird: 0.8,
  subSecond: 0.888889
} as const;

export type SacredRatioKey = keyof typeof SACRED_RATIOS; 