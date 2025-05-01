import { StrokeOrderStateManager } from '../state/StrokeOrderState';
import { StrokeData } from '../types/strokeOrder';

describe('StrokeOrderStateManager', () => {
    let stateManager: StrokeOrderStateManager;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        stateManager = StrokeOrderStateManager.getInstance();
    });

    it('should initialize with default state', () => {
        const state = stateManager.getState();
        expect(state.currentStroke).toBe(0);
        expect(state.strokeHistory).toHaveLength(0);
        expect(state.languageMode).toBe('en');
        expect(state.isPlaying).toBe(false);
    });

    it('should update config', () => {
        const newConfig = {
            canvasSize: 400,
            strokeWidth: 3,
            colors: {
                completed: '#000000',
                current: '#ff0000',
                pending: '#cccccc'
            }
        };

        stateManager.updateConfig(newConfig);
        const state = stateManager.getState();
        expect(state.config.canvasSize).toBe(400);
        expect(state.config.strokeWidth).toBe(3);
    });

    it('should update current stroke', () => {
        stateManager.updateCurrentStroke(2);
        const state = stateManager.getState();
        expect(state.currentStroke).toBe(2);
    });

    it('should add stroke to history', () => {
        const stroke: StrokeData = {
            x: 100,
            y: 100,
            pressure: 0.5,
            timestamp: Date.now()
        };

        stateManager.addStrokeToHistory(stroke);
        const state = stateManager.getState();
        expect(state.strokeHistory).toHaveLength(1);
        expect(state.strokeHistory[0]).toEqual(stroke);
    });

    it('should change language mode', () => {
        stateManager.setLanguageMode('zh');
        const state = stateManager.getState();
        expect(state.languageMode).toBe('zh');
    });

    it('should update playing state', () => {
        stateManager.setIsPlaying(true);
        const state = stateManager.getState();
        expect(state.isPlaying).toBe(true);
    });

    it('should clear history', () => {
        // Add some strokes
        const stroke: StrokeData = {
            x: 100,
            y: 100,
            pressure: 0.5,
            timestamp: Date.now()
        };
        stateManager.addStrokeToHistory(stroke);
        stateManager.updateCurrentStroke(1);

        // Clear history
        stateManager.clearHistory();
        const state = stateManager.getState();
        expect(state.strokeHistory).toHaveLength(0);
        expect(state.currentStroke).toBe(0);
    });

    it('should reset state', () => {
        // Modify state
        stateManager.updateCurrentStroke(2);
        stateManager.setIsPlaying(true);
        stateManager.setLanguageMode('zh');

        // Reset
        stateManager.reset();
        const state = stateManager.getState();
        expect(state.currentStroke).toBe(0);
        expect(state.strokeHistory).toHaveLength(0);
        expect(state.isPlaying).toBe(false);
    });

    it('should persist state to localStorage', () => {
        stateManager.updateCurrentStroke(3);
        stateManager.setLanguageMode('zh');

        // Create new instance to test persistence
        const newStateManager = StrokeOrderStateManager.getInstance();
        const state = newStateManager.getState();
        expect(state.currentStroke).toBe(3);
        expect(state.languageMode).toBe('zh');
    });

    it('should notify subscribers of state changes', () => {
        const mockListener = jest.fn();
        stateManager.subscribe(mockListener);

        stateManager.updateCurrentStroke(1);
        expect(mockListener).toHaveBeenCalled();
        expect(mockListener.mock.calls[0][0].currentStroke).toBe(1);
    });

    it('should get musical pattern', () => {
        const pattern = stateManager.getMusicalPattern('horizontal');
        expect(pattern).toBeDefined();
        expect(pattern.waveform).toBe('sine');
    });

    it('should get English feedback', () => {
        const feedback = stateManager.getEnglishFeedback('horizontal');
        expect(feedback).toBeDefined();
        expect(typeof feedback).toBe('string');
    });
}); 