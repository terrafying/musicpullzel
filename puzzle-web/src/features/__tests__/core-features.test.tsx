import React from 'react';
import { render, act } from '@testing-library/react';
import { EmotionDetector } from '../emotion/EmotionDetector';
import { DifficultyManager } from '../game/DifficultyManager';
import { PatternGenerator } from '../patterns/PatternGenerator';
import { MonsterAI } from '../ai/MonsterAI';
import { GeometryRenderer } from '../visualization/GeometryRenderer';
import { LLMIntegration } from '../ai/LLMIntegration';
import {
  renderHookWithWrapper,
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockEmotionState,
  createMockPattern,
  createMockInteraction,
  measurePerformance,
  measureFPS,
  measureMemoryUsage
} from '../../test/feature-test-utils';

describe('Core Features Integration', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  afterEach(() => {
    teardownTestEnvironment();
  });

  describe('Emotion Detection', () => {
    it('should initialize webcam and detect emotions', async () => {
      const { result } = renderHookWithWrapper(() => EmotionDetector.useEmotionDetection());
      
      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.currentEmotion).toBeDefined();
    });

    it('should handle webcam errors gracefully', async () => {
      const { result } = renderHookWithWrapper(() => EmotionDetector.useEmotionDetection());
      
      // Mock webcam error
      Object.defineProperty(global.navigator.mediaDevices, 'getUserMedia', {
        value: jest.fn().mockRejectedValue(new Error('Camera not available')),
        writable: true
      });
      
      await act(async () => {
        await result.current.initialize();
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('Adaptive Difficulty', () => {
    it('should adjust difficulty based on emotional state', () => {
      const { result } = renderHookWithWrapper(() => DifficultyManager.useDifficulty());
      
      act(() => {
        result.current.updateEmotionalState(createMockEmotionState(0.8, 0.6, 0.7));
      });

      expect(result.current.currentDifficulty).toBeGreaterThan(0);
      expect(result.current.currentDifficulty).toBeLessThanOrEqual(1);
    });

    it('should maintain difficulty within bounds', () => {
      const { result } = renderHookWithWrapper(() => DifficultyManager.useDifficulty());
      
      // Test extreme emotional states
      act(() => {
        result.current.updateEmotionalState(createMockEmotionState(1, 1, 1));
      });

      expect(result.current.currentDifficulty).toBeLessThanOrEqual(1);
    });
  });

  describe('Pattern Generation', () => {
    it('should generate valid musical patterns', () => {
      const pattern = PatternGenerator.generatePattern({
        difficulty: 0.5,
        emotionalState: createMockEmotionState(0.6, 0.4)
      });

      expect(pattern).toMatchObject({
        nodes: expect.any(Array),
        connections: expect.any(Array),
        resonance: expect.any(Number)
      });
    });

    it('should respect difficulty constraints', () => {
      const pattern = PatternGenerator.generatePattern({
        difficulty: 0.2,
        emotionalState: createMockEmotionState(0.5, 0.5)
      });

      expect(pattern.complexity).toBeLessThanOrEqual(0.3);
    });
  });

  describe('Monster AI', () => {
    it('should learn from player interactions', () => {
      const { result } = renderHookWithWrapper(() => MonsterAI.useLearning());
      
      act(() => {
        result.current.recordInteraction(createMockInteraction());
      });

      expect(result.current.learningProgress).toBeGreaterThan(0);
    });

    it('should adapt behavior based on learning', () => {
      const { result } = renderHookWithWrapper(() => MonsterAI.useBehavior());
      
      act(() => {
        result.current.updateLearning({
          successRate: 0.8,
          averageTime: 4000,
          learningProgress: 0.5
        });
      });

      expect(result.current.currentStrategy).toBeDefined();
    });
  });

  describe('Sacred Geometry', () => {
    it('should render geometric patterns correctly', () => {
      const { container } = render(
        <GeometryRenderer
          pattern={createMockPattern()}
          size={800}
        />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas?.getContext('2d')).toBeTruthy();
    });

    it('should animate patterns smoothly', async () => {
      const { rerender } = render(
        <GeometryRenderer
          pattern={createMockPattern()}
          size={800}
        />
      );

      const fps = await measureFPS(60, () => {
        act(() => {
          rerender(
            <GeometryRenderer
              pattern={createMockPattern([0, 1, 2, 3], 0.6)}
              size={800}
            />
          );
        });
      });

      expect(fps).toBeGreaterThanOrEqual(55); // Allow for some variance
    });
  });

  describe('LLM Integration', () => {
    it('should generate contextual responses', async () => {
      const { result } = renderHookWithWrapper(() => LLMIntegration.useGeneration());
      
      await act(async () => {
        const response = await result.current.generateResponse({
          context: 'player struggling with pattern',
          emotionalState: createMockEmotionState(0.3, 0.7)
        });

        expect(response).toMatchObject({
          text: expect.any(String),
          suggestions: expect.any(Array)
        });
      });
    });

    it('should handle API errors gracefully', async () => {
      const { result } = renderHookWithWrapper(() => LLMIntegration.useGeneration());
      
      // Mock API failure
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('API Error'));
      
      await act(async () => {
        await result.current.generateResponse({
          context: 'test',
          emotionalState: createMockEmotionState(0.5, 0.5)
        });
      });

      expect(result.current.error).toBeDefined();
    });
  });
}); 