import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useStrokeOrderState } from '../hooks/useStrokeOrderState';
import { StrokeOrderStateManager } from '../state/StrokeOrderState';
import { StrokeData } from '../types/strokeOrder';

describe('useStrokeOrderState', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useStrokeOrderState());
        expect(result.current.state.currentStroke).toBe(0);
        expect(result.current.state.strokeHistory).toHaveLength(0);
        expect(result.current.state.languageMode).toBe('en');
        expect(result.current.state.isPlaying).toBe(false);
    });

    it('should update config', () => {
        const { result } = renderHook(() => useStrokeOrderState());
        const newConfig = {
            canvasSize: 400,
            strokeWidth: 3,
            colors: {
                completed: '#000000',
                current: '#ff0000',
                pending: '#cccccc'
            }
        };

        act(() => {
            result.current.updateConfig(newConfig);
        });

        expect(result.current.state.config.canvasSize).toBe(400);
        expect(result.current.state.config.strokeWidth).toBe(3);
    });

    it('should update current stroke', () => {
        const { result } = renderHook(() => useStrokeOrderState());

        act(() => {
            result.current.updateCurrentStroke(2);
        });

        expect(result.current.state.currentStroke).toBe(2);
    });

    it('should add stroke to history', () => {
        const { result } = renderHook(() => useStrokeOrderState());
        const stroke: StrokeData = {
            x: 100,
            y: 100,
            pressure: 0.5,
            timestamp: Date.now()
        };

        act(() => {
            result.current.addStrokeToHistory(stroke);
        });

        expect(result.current.state.strokeHistory).toHaveLength(1);
        expect(result.current.state.strokeHistory[0]).toEqual(stroke);
    });

    it('should change language mode', () => {
        const { result } = renderHook(() => useStrokeOrderState());

        act(() => {
            result.current.setLanguageMode('zh');
        });

        expect(result.current.state.languageMode).toBe('zh');
    });

    it('should update playing state', () => {
        const { result } = renderHook(() => useStrokeOrderState());

        act(() => {
            result.current.setIsPlaying(true);
        });

        expect(result.current.state.isPlaying).toBe(true);
    });

    it('should clear history', () => {
        const { result } = renderHook(() => useStrokeOrderState());
        const stroke: StrokeData = {
            x: 100,
            y: 100,
            pressure: 0.5,
            timestamp: Date.now()
        };

        act(() => {
            result.current.addStrokeToHistory(stroke);
            result.current.updateCurrentStroke(1);
            result.current.clearHistory();
        });

        expect(result.current.state.strokeHistory).toHaveLength(0);
        expect(result.current.state.currentStroke).toBe(0);
    });

    it('should reset state', () => {
        const { result } = renderHook(() => useStrokeOrderState());

        act(() => {
            result.current.updateCurrentStroke(2);
            result.current.setIsPlaying(true);
            result.current.setLanguageMode('zh');
            result.current.reset();
        });

        expect(result.current.state.currentStroke).toBe(0);
        expect(result.current.state.strokeHistory).toHaveLength(0);
        expect(result.current.state.isPlaying).toBe(false);
    });

    it('should get musical pattern', () => {
        const { result } = renderHook(() => useStrokeOrderState());
        const pattern = result.current.getMusicalPattern('horizontal');
        expect(pattern).toBeDefined();
        expect(pattern.waveform).toBe('sine');
    });

    it('should get English feedback', () => {
        const { result } = renderHook(() => useStrokeOrderState());
        const feedback = result.current.getEnglishFeedback('horizontal');
        expect(feedback).toBeDefined();
        expect(typeof feedback).toBe('string');
    });

    it('should update state when manager changes', () => {
        const { result } = renderHook(() => useStrokeOrderState());
        const manager = StrokeOrderStateManager.getInstance();

        act(() => {
            manager.updateCurrentStroke(3);
        });

        expect(result.current.state.currentStroke).toBe(3);
    });
}); 