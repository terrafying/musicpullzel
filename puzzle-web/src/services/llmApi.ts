import { TelemetryService } from './telemetry';

export interface LLMRequest {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    context?: Record<string, unknown>;
}

export interface LLMResponse {
    text: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export class LLMApiError extends Error {
    constructor(
        message: string,
        public readonly statusCode?: number,
        public readonly response?: unknown,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = 'LLMApiError';
    }
}

export class LLMApiClient {
    private telemetry: TelemetryService;

    constructor(
        private readonly endpoint: string,
        private readonly apiKey?: string,
        private readonly defaultMaxTokens: number = 100,
        private readonly defaultTemperature: number = 0.7
    ) {
        this.telemetry = TelemetryService.getInstance();
    }

    private async makeRequest<T>(path: string, options: RequestInit): Promise<T> {
        const url = new URL(path, this.endpoint).toString();
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new LLMApiError(
                    `LLM API request failed: ${response.statusText}`,
                    response.status,
                    errorData
                );
            }

            return await response.json();
        } catch (error) {
            if (error instanceof LLMApiError) {
                throw error;
            }
            throw new LLMApiError(
                'Failed to make LLM API request',
                undefined,
                undefined,
                error
            );
        }
    }

    async analyzeEmotion(emotionState: Record<string, unknown>): Promise<string> {
        const request: LLMRequest = {
            prompt: `Analyze the following emotion state and provide insights: ${JSON.stringify(emotionState)}`,
            maxTokens: this.defaultMaxTokens,
            temperature: this.defaultTemperature,
            context: { type: 'emotion_analysis' },
        };

        try {
            this.telemetry.info('Sending emotion analysis request to LLM API', { request });
            
            const response = await this.makeRequest<LLMResponse>('/v1/analyze', {
                method: 'POST',
                body: JSON.stringify(request),
            });

            this.telemetry.info('Received emotion analysis response', { 
                usage: response.usage 
            });

            return response.text;
        } catch (error) {
            this.telemetry.error('Failed to analyze emotion with LLM API', {
                emotionState,
                error: error instanceof Error ? error : new Error(String(error)),
            });
            throw error;
        }
    }

    async generatePattern(context: Record<string, unknown>): Promise<string> {
        const request: LLMRequest = {
            prompt: `Generate a musical pattern based on the following context: ${JSON.stringify(context)}`,
            maxTokens: this.defaultMaxTokens * 2, // More tokens for pattern generation
            temperature: this.defaultTemperature,
            context: { type: 'pattern_generation' },
        };

        try {
            this.telemetry.info('Sending pattern generation request to LLM API', { request });
            
            const response = await this.makeRequest<LLMResponse>('/v1/generate', {
                method: 'POST',
                body: JSON.stringify(request),
            });

            this.telemetry.info('Received pattern generation response', { 
                usage: response.usage 
            });

            return response.text;
        } catch (error) {
            this.telemetry.error('Failed to generate pattern with LLM API', {
                context,
                error: error instanceof Error ? error : new Error(String(error)),
            });
            throw error;
        }
    }
} 