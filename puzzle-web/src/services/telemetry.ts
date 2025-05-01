export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    error?: Error;
}

export interface TelemetryConfig {
    minLevel: LogLevel;
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
}

export class TelemetryService {
    private static instance: TelemetryService;
    private config: TelemetryConfig;
    private logBuffer: LogEntry[] = [];
    private readonly MAX_BUFFER_SIZE = 100;

    private constructor(config: Partial<TelemetryConfig> = {}) {
        this.config = {
            minLevel: config.minLevel || 'info',
            enableConsole: config.enableConsole ?? true,
            enableRemote: config.enableRemote ?? false,
            remoteEndpoint: config.remoteEndpoint,
        };
    }

    static getInstance(config?: Partial<TelemetryConfig>): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService(config);
        }
        return TelemetryService.instance;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.config.minLevel);
    }

    private async sendToRemote(entry: LogEntry): Promise<void> {
        if (!this.config.enableRemote || !this.config.remoteEndpoint) {
            return;
        }

        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entry),
            });
        } catch (error) {
            console.error('Failed to send telemetry to remote endpoint:', error);
        }
    }

    private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            message,
            context,
            error,
        };

        // Add to buffer
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
            this.logBuffer.shift();
        }

        // Console output
        if (this.config.enableConsole) {
            const logMethod = console[level] || console.log;
            const contextStr = context ? ` ${JSON.stringify(context)}` : '';
            const errorStr = error ? `\nError: ${error.stack || error.message}` : '';
            logMethod(`[${new Date(entry.timestamp).toISOString()}] ${level.toUpperCase()}: ${message}${contextStr}${errorStr}`);
        }

        // Remote logging
        this.sendToRemote(entry);
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.log('debug', message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.log('info', message, context);
    }

    warn(message: string, context?: Record<string, unknown>, error?: Error): void {
        this.log('warn', message, context, error);
    }

    error(message: string, context?: Record<string, unknown>, error?: Error): void {
        this.log('error', message, context, error);
    }

    getLogBuffer(): LogEntry[] {
        return [...this.logBuffer];
    }

    clearBuffer(): void {
        this.logBuffer = [];
    }
} 