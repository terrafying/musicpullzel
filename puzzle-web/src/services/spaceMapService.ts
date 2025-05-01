import { Logger } from './logger';

interface Point {
    x: number;
    y: number;
    z?: number;
    metadata?: Record<string, any>;
}

interface SpaceMapConfig {
    dimensions: number;
    learningRate: number;
    iterations: number;
    perplexity: number;
    momentum: number;
    epsilon: number;
}

export class SpaceMapService {
    private static instance: SpaceMapService;
    private logger: Logger;
    private config: SpaceMapConfig;
    private points: Point[] = [];
    private distances: number[][] = [];
    private probabilities: number[][] = [];

    private constructor() {
        this.logger = Logger.create('SpaceMapService');
        this.config = {
            dimensions: 2,
            learningRate: 200,
            iterations: 1000,
            perplexity: 30,
            momentum: 0.9,
            epsilon: 1e-7
        };
    }

    public static getInstance(): SpaceMapService {
        if (!SpaceMapService.instance) {
            SpaceMapService.instance = new SpaceMapService();
        }
        return SpaceMapService.instance;
    }

    public configure(config: Partial<SpaceMapConfig>): void {
        this.config = { ...this.config, ...config };
        this.logger.info('SpaceMapService', 'Configuration updated', { config: this.config });
    }

    public addPoint(point: Point): void {
        this.points.push(point);
        this.logger.debug('SpaceMapService', 'Point added', { point });
    }

    public clearPoints(): void {
        this.points = [];
        this.distances = [];
        this.probabilities = [];
        this.logger.debug('SpaceMapService', 'Points cleared');
    }

    private computeDistances(): void {
        const n = this.points.length;
        this.distances = Array(n).fill(0).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const dx = this.points[i].x - this.points[j].x;
                const dy = this.points[i].y - this.points[j].y;
                const dz = (this.points[i].z || 0) - (this.points[j].z || 0);
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                this.distances[i][j] = this.distances[j][i] = distance;
            }
        }
    }

    private computeProbabilities(): void {
        const n = this.points.length;
        this.probabilities = Array(n).fill(0).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const distance = this.distances[i][j];
                    const probability = Math.exp(-distance * distance / (2 * this.config.perplexity * this.config.perplexity));
                    this.probabilities[i][j] = probability;
                    sum += probability;
                }
            }
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    this.probabilities[i][j] /= sum;
                }
            }
        }
    }

    public reduceDimensions(): Point[] {
        if (this.points.length === 0) {
            this.logger.warn('SpaceMapService', 'No points to reduce dimensions');
            return [];
        }

        this.computeDistances();
        this.computeProbabilities();

        const n = this.points.length;
        const outputPoints: Point[] = this.points.map(p => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
            metadata: p.metadata
        }));

        const gradients = Array(n).fill(0).map(() => ({ x: 0, y: 0 }));
        const gains = Array(n).fill(0).map(() => ({ x: 1, y: 1 }));

        for (let iter = 0; iter < this.config.iterations; iter++) {
            // Compute output distances and probabilities
            const outputDistances = Array(n).fill(0).map(() => Array(n).fill(0));
            const outputProbabilities = Array(n).fill(0).map(() => Array(n).fill(0));

            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const dx = outputPoints[i].x - outputPoints[j].x;
                    const dy = outputPoints[i].y - outputPoints[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    outputDistances[i][j] = outputDistances[j][i] = distance;
                }
            }

            let sum = 0;
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const probability = 1 / (1 + outputDistances[i][j] * outputDistances[i][j]);
                    outputProbabilities[i][j] = outputProbabilities[j][i] = probability;
                    sum += probability;
                }
            }

            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        outputProbabilities[i][j] /= sum;
                    }
                }
            }

            // Compute gradients
            for (let i = 0; i < n; i++) {
                gradients[i].x = 0;
                gradients[i].y = 0;

                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        const dx = outputPoints[i].x - outputPoints[j].x;
                        const dy = outputPoints[i].y - outputPoints[j].y;
                        const distance = outputDistances[i][j];
                        const probabilityDiff = this.probabilities[i][j] - outputProbabilities[i][j];
                        const gradient = 4 * probabilityDiff * (1 / (1 + distance * distance));

                        gradients[i].x += gradient * dx;
                        gradients[i].y += gradient * dy;
                    }
                }
            }

            // Update positions
            for (let i = 0; i < n; i++) {
                gains[i].x = (gains[i].x + 0.2) * (Math.sign(gradients[i].x) === Math.sign(gains[i].x) ? 1 : 0.8);
                gains[i].y = (gains[i].y + 0.2) * (Math.sign(gradients[i].y) === Math.sign(gains[i].y) ? 1 : 0.8);

                gains[i].x = Math.max(0.01, gains[i].x);
                gains[i].y = Math.max(0.01, gains[i].y);

                outputPoints[i].x += this.config.learningRate * gains[i].x * gradients[i].x;
                outputPoints[i].y += this.config.learningRate * gains[i].y * gradients[i].y;
            }

            if (iter % 100 === 0) {
                this.logger.debug('SpaceMapService', 'Iteration progress', { iteration: iter });
            }
        }

        this.logger.info('SpaceMapService', 'Dimension reduction completed', {
            inputPoints: this.points.length,
            outputPoints: outputPoints.length
        });

        return outputPoints;
    }

    public getPoints(): Point[] {
        return this.points;
    }

    public getReducedPoints(): Point[] {
        return this.reduceDimensions();
    }
} 