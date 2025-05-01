import init, { WasmEmotionDetector, WasmEmotionLLM, EmotionState } from 'puzzle-core';
import { TelemetryService } from './telemetry';
import { LLMApiClient, LLMApiError } from './llmApi';

export { EmotionState };

export class EmotionServiceError extends Error {
    constructor(message: string, public readonly cause?: unknown) {
        super(message);
        this.name = 'EmotionServiceError';
    }
}

export class RustEmotionService {
    private detector: WasmEmotionDetector | null = null;
    private llm: WasmEmotionLLM | null = null;
    private isInitialized = false;
    private telemetry: TelemetryService;
    private llmClient: LLMApiClient;

    constructor(
        private llmEndpoint: string,
        private llmApiKey?: string
    ) {
        this.telemetry = TelemetryService.getInstance();
        this.llmClient = new LLMApiClient(llmEndpoint, llmApiKey);
    }

    async initialize(): Promise<void> {
        try {
            if (this.isInitialized) return;

            this.telemetry.info('Initializing emotion service');
            await init();
            this.detector = new WasmEmotionDetector();
            this.llm = new WasmEmotionLLM(this.llmEndpoint);
            this.isInitialized = true;
            this.telemetry.info('Emotion service initialized successfully');
        } catch (error) {
            this.telemetry.error('Failed to initialize emotion service', {
                error: error instanceof Error ? error : new Error(String(error))
            });
            throw new EmotionServiceError('Failed to initialize emotion service', error);
        }
    }

    private ensureInitialized(): void {
        if (!this.isInitialized || !this.detector || !this.llm) {
            throw new EmotionServiceError('Emotion service not initialized');
        }
    }

    async processFrame(videoElement: HTMLVideoElement): Promise<EmotionState> {
        try {
            this.ensureInitialized();

            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new EmotionServiceError('Could not get canvas context');
            }

            ctx.drawImage(videoElement, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            this.telemetry.debug('Processing video frame', {
                width: canvas.width,
                height: canvas.height,
                timestamp: Date.now()
            });

            const state = await this.detector!.process_frame(
                new Uint8Array(imageData.data), 
                canvas.width, 
                canvas.height
            );

            this.telemetry.debug('Frame processed successfully', {
                emotion: state.dominant_emotion,
                intensity: state.intensity,
                confidence: state.confidence
            });

            return state;
        } catch (error) {
            this.telemetry.error('Failed to process video frame', {
                error: error instanceof Error ? error : new Error(String(error))
            });
            if (error instanceof EmotionServiceError) {
                throw error;
            }
            throw new EmotionServiceError('Failed to process video frame', error);
        }
    }

    async analyzeEmotionContext(emotionState: EmotionState): Promise<string> {
        try {
            this.ensureInitialized();

            this.telemetry.info('Analyzing emotion context', {
                emotion: emotionState.dominant_emotion,
                intensity: emotionState.intensity,
                confidence: emotionState.confidence
            });

            try {
                // Try LLM API first
                return await this.llmClient.analyzeEmotion({
                    dominant_emotion: emotionState.dominant_emotion,
                    intensity: emotionState.intensity,
                    confidence: emotionState.confidence,
                    timestamp: emotionState.timestamp
                });
            } catch (llmError) {
                if (llmError instanceof LLMApiError) {
                    this.telemetry.warn('LLM API failed, falling back to WASM implementation', {
                        error: llmError
                    });
                }
                // Fall back to WASM implementation
                return await this.llm!.analyze_emotion(emotionState);
            }
        } catch (error) {
            this.telemetry.error('Failed to analyze emotion context', {
                error: error instanceof Error ? error : new Error(String(error))
            });
            throw new EmotionServiceError('Failed to analyze emotion context', error);
        }
    }

    async startDetection(
        videoElement: HTMLVideoElement, 
        callback: (state: EmotionState) => void,
        onError?: (error: Error) => void
    ): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const processFrame = async () => {
            try {
                const state = await this.processFrame(videoElement);
                callback(state);
            } catch (error) {
                const wrappedError = error instanceof Error ? 
                    error : 
                    new EmotionServiceError('Unknown error during frame processing', error);
                
                this.telemetry.error('Error in frame processing loop', {
                    error: wrappedError
                });
                onError?.(wrappedError);
            }
            requestAnimationFrame(() => processFrame());
        };

        this.telemetry.info('Starting emotion detection');
        processFrame();
    }

    stopDetection(): void {
        try {
            this.telemetry.info('Stopping emotion detection');
            this.detector?.free();
            this.llm?.free();
        } catch (error) {
            this.telemetry.warn('Error while cleaning up emotion service', {
                error: error instanceof Error ? error : new Error(String(error))
            });
        } finally {
            this.detector = null;
            this.llm = null;
            this.isInitialized = false;
            this.telemetry.info('Emotion detection stopped');
        }
    }
} 