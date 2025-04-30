export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private subscribers: ((entry: LogEntry) => void)[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, category: string, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      data
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Notify subscribers
    this.subscribers.forEach(callback => callback(entry));

    // Console output with styling
    const style = this.getStyleForLevel(level);
    console.log(
      `%c${new Date(entry.timestamp).toISOString()} %c${level} %c${category}%c ${message}`,
      'color: #666',
      style,
      'color: #888',
      'color: inherit',
      data ? data : ''
    );
  }

  private getStyleForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: #6b7280';
      case LogLevel.INFO:
        return 'color: #3b82f6';
      case LogLevel.WARN:
        return 'color: #f59e0b';
      case LogLevel.ERROR:
        return 'color: #ef4444';
      default:
        return 'color: inherit';
    }
  }

  debug(category: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log(LogLevel.ERROR, category, message, data);
  }

  subscribe(callback: (entry: LogEntry) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
} 