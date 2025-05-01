import { useState, useEffect } from 'react';
import { StrokeOrderStateManager, StrokeOrderState } from '../state/StrokeOrderState';
import { StrokeOrderConfig, StrokeData } from '../types/strokeOrder';

export const useStrokeOrderState = () => {
    const [state, setState] = useState<StrokeOrderState>(() => {
        const manager = StrokeOrderStateManager.getInstance();
        return manager.getState();
    });

    useEffect(() => {
        const manager = StrokeOrderStateManager.getInstance();
        const unsubscribe = manager.subscribe(setState);
        return unsubscribe;
    }, []);

    const updateConfig = (config: Partial<StrokeOrderConfig>) => {
        const manager = StrokeOrderStateManager.getInstance();
        manager.updateConfig(config);
    };

    const updateCurrentStroke = (strokeIndex: number) => {
        const manager = StrokeOrderStateManager.getInstance();
        manager.updateCurrentStroke(strokeIndex);
    };

    const addStrokeToHistory = (stroke: StrokeData) => {
        const manager = StrokeOrderStateManager.getInstance();
        manager.addStrokeToHistory(stroke);
    };

    const setLanguageMode = (mode: 'zh' | 'en') => {
        const manager = StrokeOrderStateManager.getInstance();
        manager.setLanguageMode(mode);
    };

    const setIsPlaying = (isPlaying: boolean) => {
        const manager = StrokeOrderStateManager.getInstance();
        manager.setIsPlaying(isPlaying);
    };

    const clearHistory = () => {
        const manager = StrokeOrderStateManager.getInstance();
        manager.clearHistory();
    };

    const reset = () => {
        const manager = StrokeOrderStateManager.getInstance();
        manager.reset();
    };

    const getMusicalPattern = (strokeType: string) => {
        const manager = StrokeOrderStateManager.getInstance();
        return manager.getMusicalPattern(strokeType);
    };

    const getEnglishFeedback = (strokeType: string) => {
        const manager = StrokeOrderStateManager.getInstance();
        return manager.getEnglishFeedback(strokeType);
    };

    return {
        state,
        updateConfig,
        updateCurrentStroke,
        addStrokeToHistory,
        setLanguageMode,
        setIsPlaying,
        clearHistory,
        reset,
        getMusicalPattern,
        getEnglishFeedback
    };
}; 