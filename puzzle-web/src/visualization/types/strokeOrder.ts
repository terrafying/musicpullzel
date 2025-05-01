export type LanguageMode = 'zh' | 'en';

export interface StrokeData {
    x: number;
    y: number;
    pressure?: number;
    timestamp: number;
}

export interface MusicalPattern {
    waveform: OscillatorType;
    filterType: BiquadFilterType;
    filterFreq: number;
    filterQ: number;
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    description: string;
}

export interface EnglishFeedback {
    visual: string;
    audio: string;
    haptic: number[];
}

export interface StrokeOrderConfig {
    canvasSize: number;
    strokeWidth: number;
    colors: {
        completed: string;
        current: string;
        pending: string;
    };
    language: {
        mode: LanguageMode;
        hints: boolean;
        audio: boolean;
        visual: boolean;
    };
    musical: {
        enabled: boolean;
        patterns: boolean;
        effects: boolean;
    };
    accessibility: {
        screenReader: boolean;
        highContrast: boolean;
        largeText: boolean;
        reducedMotion: boolean;
    };
}

export interface MIDIConfig {
    enabled: boolean;
    baseNote: number;
    velocitySensitivity: number;
    hapticFeedback: boolean;
    audioFeedback: boolean;
} 