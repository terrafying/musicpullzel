import { StrokeOrderConfig, LanguageMode, MusicalPattern, StrokeData } from '../types/strokeOrder';
import { MusicalPatterns } from '../services/musicalPatterns';
import { EnglishStrokeMappings } from '../services/englishFeedback';
import { TelemetryService } from '../../../services/telemetry';

export interface StrokeOrderState {
    config: StrokeOrderConfig;
    currentStroke: number;
    strokeHistory: StrokeData[];
    musicalPatterns: Map<string, MusicalPattern>;
    languageMode: LanguageMode;
    isPlaying: boolean;
    lastUpdate: number;
}

export class StrokeOrderStateManager {
    private static instance: StrokeOrderStateManager;
    private state: StrokeOrderState;
    private musicalPatterns: MusicalPatterns;
    private englishFeedback: EnglishStrokeMappings;
    private telemetry: TelemetryService;
    private stateChangeListeners: Set<(state: StrokeOrderState) => void>;

    private constructor() {
        this.telemetry = TelemetryService.getInstance();
        this.musicalPatterns = new MusicalPatterns();
        this.englishFeedback = new EnglishStrokeMappings();
        this.stateChangeListeners = new Set();

        // Initialize default state
        this.state = {
            config: {
                canvasSize: 300,
                strokeWidth: 2,
                colors: {
                    completed: '#000000',
                    current: '#ff0000',
                    pending: '#cccccc'
                },
                language: {
                    mode: 'en',
                    hints: true,
                    audio: true,
                    visual: true
                },
                musical: {
                    enabled: true,
                    patterns: true,
                    effects: true
                },
                accessibility: {
                    screenReader: true,
                    highContrast: false,
                    largeText: false,
                    reducedMotion: false
                }
            },
            currentStroke: 0,
            strokeHistory: [],
            musicalPatterns: this.musicalPatterns.getAllPatterns(),
            languageMode: 'en',
            isPlaying: false,
            lastUpdate: Date.now()
        };

        // Load persisted state if available
        this.loadState();
    }

    static getInstance(): StrokeOrderStateManager {
        if (!StrokeOrderStateManager.instance) {
            StrokeOrderStateManager.instance = new StrokeOrderStateManager();
        }
        return StrokeOrderStateManager.instance;
    }

    private loadState(): void {
        try {
            const savedState = localStorage.getItem('strokeOrderState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                this.state = {
                    ...this.state,
                    ...parsedState,
                    lastUpdate: Date.now()
                };
                this.telemetry.info('Loaded persisted state', { state: this.state });
            }
        } catch (error) {
            this.telemetry.error('Failed to load persisted state', { error });
        }
    }

    private saveState(): void {
        try {
            const stateToSave = {
                ...this.state,
                lastUpdate: Date.now()
            };
            localStorage.setItem('strokeOrderState', JSON.stringify(stateToSave));
            this.telemetry.debug('Saved state', { state: stateToSave });
        } catch (error) {
            this.telemetry.error('Failed to save state', { error });
        }
    }

    private notifyStateChange(): void {
        this.stateChangeListeners.forEach(listener => {
            try {
                listener(this.state);
            } catch (error) {
                this.telemetry.error('Error in state change listener', { error });
            }
        });
    }

    subscribe(listener: (state: StrokeOrderState) => void): () => void {
        this.stateChangeListeners.add(listener);
        return () => {
            this.stateChangeListeners.delete(listener);
        };
    }

    getState(): StrokeOrderState {
        return { ...this.state };
    }

    updateConfig(config: Partial<StrokeOrderConfig>): void {
        this.state = {
            ...this.state,
            config: {
                ...this.state.config,
                ...config
            },
            lastUpdate: Date.now()
        };
        this.saveState();
        this.notifyStateChange();
        this.telemetry.info('Updated config', { config });
    }

    updateCurrentStroke(strokeIndex: number): void {
        this.state = {
            ...this.state,
            currentStroke: strokeIndex,
            lastUpdate: Date.now()
        };
        this.saveState();
        this.notifyStateChange();
        this.telemetry.debug('Updated current stroke', { strokeIndex });
    }

    addStrokeToHistory(stroke: StrokeData): void {
        this.state = {
            ...this.state,
            strokeHistory: [...this.state.strokeHistory, stroke],
            lastUpdate: Date.now()
        };
        this.saveState();
        this.notifyStateChange();
        this.telemetry.debug('Added stroke to history', { stroke });
    }

    setLanguageMode(mode: LanguageMode): void {
        this.state = {
            ...this.state,
            languageMode: mode,
            lastUpdate: Date.now()
        };
        this.saveState();
        this.notifyStateChange();
        this.telemetry.info('Changed language mode', { mode });
    }

    setIsPlaying(isPlaying: boolean): void {
        this.state = {
            ...this.state,
            isPlaying,
            lastUpdate: Date.now()
        };
        this.saveState();
        this.notifyStateChange();
        this.telemetry.debug('Updated playing state', { isPlaying });
    }

    getMusicalPattern(strokeType: string): MusicalPattern {
        return this.musicalPatterns.getPattern(strokeType);
    }

    getEnglishFeedback(strokeType: string): string {
        const feedback = this.englishFeedback.getFeedback(strokeType);
        return feedback.audio;
    }

    clearHistory(): void {
        this.state = {
            ...this.state,
            strokeHistory: [],
            currentStroke: 0,
            lastUpdate: Date.now()
        };
        this.saveState();
        this.notifyStateChange();
        this.telemetry.info('Cleared stroke history');
    }

    reset(): void {
        this.state = {
            ...this.state,
            currentStroke: 0,
            strokeHistory: [],
            isPlaying: false,
            lastUpdate: Date.now()
        };
        this.saveState();
        this.notifyStateChange();
        this.telemetry.info('Reset state');
    }
} 