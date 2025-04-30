import { useState, useEffect } from 'react';
import { Logger, LogEntry, LogLevel } from '../services/logger';
import './DebugPanel.css';

export function DebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');

  useEffect(() => {
    const logger = Logger.getInstance();
    const unsubscribe = logger.subscribe((entry) => {
      setLogs(prev => [...prev, entry].slice(-100)); // Keep last 100 logs
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter(log => 
    filter === 'ALL' || log.level === filter
  );

  const getLevelStyle = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'debug';
      case LogLevel.INFO: return 'info';
      case LogLevel.WARN: return 'warn';
      case LogLevel.ERROR: return 'error';
      default: return '';
    }
  };

  return (
    <div className={`debug-panel ${isVisible ? 'visible' : ''}`}>
      <button 
        className="debug-toggle"
        onClick={() => setIsVisible(!isVisible)}
      >
        {isVisible ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {isVisible && (
        <div className="debug-content">
          <div className="debug-controls">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as LogLevel | 'ALL')}
            >
              <option value="ALL">All Levels</option>
              <option value={LogLevel.DEBUG}>Debug</option>
              <option value={LogLevel.INFO}>Info</option>
              <option value={LogLevel.WARN}>Warn</option>
              <option value={LogLevel.ERROR}>Error</option>
            </select>
            <button onClick={() => setLogs([])}>Clear</button>
          </div>
          
          <div className="log-container">
            {filteredLogs.map((log, index) => (
              <div key={index} className={`log-entry ${getLevelStyle(log.level)}`}>
                <span className="timestamp">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="level">{log.level}</span>
                <span className="category">{log.category}</span>
                <span className="message">{log.message}</span>
                {log.data && (
                  <pre className="data">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 