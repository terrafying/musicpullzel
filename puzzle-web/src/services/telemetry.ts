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
    private readonly MAX_BUFFER_SIZE = 1000;

    private constructor() {
        this.config = {
            minLevel: 'info',
            enableConsole: true,
            enableRemote: false
        };
    }

    static getInstance(): TelemetryService {
        if (!TelemetryService.instance) {
            TelemetryService.instance = new TelemetryService();
        }
        return TelemetryService.instance;
    }

    configure(config: Partial<TelemetryConfig>): void {
        this.config = { ...this.config, ...config };
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

    private log(
        level: LogLevel,
        message: string,
        context?: Record<string, unknown>,
        error?: Error
    ): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            message,
            context,
            error
        };

        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.MAX_BUFFER_SIZE) {
            this.logBuffer.shift();
        }

        if (this.config.enableConsole) {
            this.consoleLog(entry);
        }

        if (this.config.enableRemote && this.config.remoteEndpoint) {
            this.sendToRemote(entry);
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.config.minLevel);
    }

    private consoleLog(entry: LogEntry): void {
        const { level, message, context, error } = entry;
        const timestamp = new Date(entry.timestamp).toISOString();
        const contextStr = context ? JSON.stringify(context) : '';
        const errorStr = error ? `\nError: ${error.message}\n${error.stack}` : '';

        switch (level) {
            case 'debug':
                console.debug(`[${timestamp}] ${message} ${contextStr}${errorStr}`);
                break;
            case 'info':
                console.info(`[${timestamp}] ${message} ${contextStr}${errorStr}`);
                break;
            case 'warn':
                console.warn(`[${timestamp}] ${message} ${contextStr}${errorStr}`);
                break;
            case 'error':
                console.error(`[${timestamp}] ${message} ${contextStr}${errorStr}`);
                break;
        }
    }

    private async sendToRemote(entry: LogEntry): Promise<void> {
        if (!this.config.remoteEndpoint) return;

        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entry)
            });
        } catch (error) {
            console.error('Failed to send log to remote endpoint:', error);
        }
    }

    getLogBuffer(): LogEntry[] {
        return [...this.logBuffer];
    }

    clearLogBuffer(): void {
        this.logBuffer = [];
    }
} 