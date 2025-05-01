import React, { useState, useEffect } from 'react';
import { ExoService, ExoConfig } from '../services/exoService';
import './ExoCursorAddon.css';

interface ExoCursorAddonProps {
    onCompletion?: (text: string) => void;
}

export const ExoCursorAddon: React.FC<ExoCursorAddonProps> = ({ onCompletion }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<ExoConfig>({
        endpoint: 'http://localhost:3000',
        model: 'exo-1',
        temperature: 0.7,
        maxTokens: 1000
    });

    const exoService = ExoService.getInstance();

    useEffect(() => {
        checkConnection();
    }, [config.endpoint]);

    const checkConnection = async () => {
        try {
            const isEndpointAvailable = await exoService.checkEndpoint();
            setIsConnected(isEndpointAvailable);
            setError(null);
        } catch (err) {
            setIsConnected(false);
            setError('Failed to connect to Exo endpoint');
        }
    };

    const handleConfigChange = (newConfig: Partial<ExoConfig>) => {
        setConfig(prev => ({ ...prev, ...newConfig }));
        exoService.configure(newConfig);
    };

    const handleGenerate = async (prompt: string) => {
        if (!isConnected) {
            setError('Not connected to Exo endpoint');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await exoService.generateCompletion(prompt);
            onCompletion?.(response.text);
        } catch (err) {
            setError('Failed to generate completion');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="exo-cursor-addon">
            <div className="status-bar">
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
                {error && <div className="error-message">{error}</div>}
            </div>

            <div className="config-panel">
                <div className="config-group">
                    <label>Endpoint:</label>
                    <input
                        type="text"
                        value={config.endpoint}
                        onChange={(e) => handleConfigChange({ endpoint: e.target.value })}
                        placeholder="http://localhost:3000"
                    />
                </div>
                <div className="config-group">
                    <label>Model:</label>
                    <input
                        type="text"
                        value={config.model}
                        onChange={(e) => handleConfigChange({ model: e.target.value })}
                    />
                </div>
                <div className="config-group">
                    <label>Temperature:</label>
                    <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) => handleConfigChange({ temperature: parseFloat(e.target.value) })}
                    />
                </div>
                <div className="config-group">
                    <label>Max Tokens:</label>
                    <input
                        type="number"
                        min="1"
                        value={config.maxTokens}
                        onChange={(e) => handleConfigChange({ maxTokens: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            <div className="controls">
                <button
                    onClick={() => checkConnection()}
                    disabled={isLoading}
                >
                    Check Connection
                </button>
            </div>
        </div>
    );
}; 