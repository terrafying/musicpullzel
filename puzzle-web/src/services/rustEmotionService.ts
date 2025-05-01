import init, { WasmEmotionDetector, WasmEmotionLLM, EmotionState } from 'puzzle-core';

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

    constructor(private llmEndpoint: string) {}

    async initialize(): Promise<void> {
        try {
            if (this.isInitialized) return;

            await init();
            this.detector = new WasmEmotionDetector();
            this.llm = new WasmEmotionLLM(this.llmEndpoint);
            this.isInitialized = true;
        } catch (error) {
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
            
            return await this.detector!.process_frame(
                new Uint8Array(imageData.data), 
                canvas.width, 
                canvas.height
            );
        } catch (error) {
            if (error instanceof EmotionServiceError) {
                throw error;
            }
            throw new EmotionServiceError('Failed to process video frame', error);
        }
    }

    async analyzeEmotionContext(emotionState: EmotionState): Promise<string> {
        try {
            this.ensureInitialized();
            return await this.llm!.analyze_emotion(emotionState);
        } catch (error) {
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
                
                console.error('Error processing frame:', wrappedError);
                onError?.(wrappedError);
            }
            requestAnimationFrame(() => processFrame());
        };

        processFrame();
    }

    stopDetection(): void {
        try {
            this.detector?.free();
            this.llm?.free();
        } catch (error) {
            console.warn('Error while cleaning up emotion service:', error);
        } finally {
            this.detector = null;
            this.llm = null;
            this.isInitialized = false;
        }
    }
} 