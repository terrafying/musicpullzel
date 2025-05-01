import { Logger } from './logger';

export interface ExoConfig {
    endpoint: string;
    model: string;
    temperature: number;
    maxTokens: number;
}

export interface ExoResponse {
    text: string;
    confidence: number;
    latency: number;
}

export class ExoService {
    private static instance: ExoService;
    private config: ExoConfig;
    private logger: Logger;

    private constructor() {
        this.logger = Logger.create('ExoService');
        this.config = {
            endpoint: 'http://localhost:3000', // Default local endpoint
            model: 'exo-1',
            temperature: 0.7,
            maxTokens: 1000
        };
    }

    public static getInstance(): ExoService {
        if (!ExoService.instance) {
            ExoService.instance = new ExoService();
        }
        return ExoService.instance;
    }

    public configure(config: Partial<ExoConfig>): void {
        this.config = { ...this.config, ...config };
        this.logger.info('ExoService', 'Configuration updated', { config: this.config });
    }

    public async generateCompletion(prompt: string): Promise<ExoResponse> {
        try {
            const startTime = performance.now();
            
            const response = await fetch(`${this.config.endpoint}/v1/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.config.model,
                    prompt,
                    temperature: this.config.temperature,
                    max_tokens: this.config.maxTokens
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const endTime = performance.now();
            const latency = endTime - startTime;

            this.logger.debug('ExoService', 'Completion generated', {
                prompt,
                latency,
                confidence: data.confidence || 1.0
            });

            return {
                text: data.choices[0].text,
                confidence: data.confidence || 1.0,
                latency
            };
        } catch (error) {
            this.logger.error('ExoService', 'Failed to generate completion', { error });
            throw error;
        }
    }

    public async checkEndpoint(): Promise<boolean> {
        try {
            const response = await fetch(`${this.config.endpoint}/health`);
            return response.ok;
        } catch (error) {
            this.logger.error('ExoService', 'Failed to check endpoint', { error });
            return false;
        }
    }
} 