import init, { WasmEmotionDetector, WasmEmotionLLM, EmotionState } from 'puzzle-core';

export { EmotionState };

export class RustEmotionService {
    private detector: WasmEmotionDetector | null = null;
    private llm: WasmEmotionLLM | null = null;
    private isInitialized = false;

    constructor(private llmEndpoint: string) {}

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        await init();
        this.detector = new WasmEmotionDetector();
        this.llm = new WasmEmotionLLM(this.llmEndpoint);
        this.isInitialized = true;
    }

    async processFrame(videoElement: HTMLVideoElement): Promise<EmotionState> {
        if (!this.isInitialized || !this.detector) {
            throw new Error('Emotion detector not initialized');
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        ctx.drawImage(videoElement, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        return this.detector.process_frame(
            new Uint8Array(imageData.data), 
            canvas.width, 
            canvas.height
        );
    }

    async analyzeEmotionContext(emotionState: EmotionState): Promise<string> {
        if (!this.isInitialized || !this.llm) {
            throw new Error('Emotion LLM not initialized');
        }

        return this.llm.analyze_emotion(emotionState);
    }

    async startDetection(videoElement: HTMLVideoElement, callback: (state: EmotionState) => void): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const processFrame = async () => {
            try {
                const state = await this.processFrame(videoElement);
                callback(state);
            } catch (error) {
                console.error('Error processing frame:', error);
            }
            requestAnimationFrame(() => processFrame());
        };

        processFrame();
    }

    stopDetection(): void {
        this.detector = null;
        this.llm = null;
        this.isInitialized = false;
    }
} 