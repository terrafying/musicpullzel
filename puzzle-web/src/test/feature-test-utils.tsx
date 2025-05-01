import { renderHook } from '@testing-library/react';
import { EmotionState, Pattern, Interaction } from '../types';
import React from 'react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock types for feature testing
export interface MockEmotionState extends EmotionState {
  valence: number;
  arousal: number;
  dominance: number;
}

export interface MockPattern extends Pattern {
  nodes: number[];
  connections: Array<[number, number]>;
  resonance: number;
  complexity: number;
}

export interface MockInteraction extends Interaction {
  pattern: string;
  success: boolean;
  timeToComplete: number;
}

// Mock implementations
export const createMockEmotionState = (
  valence: number = 0.5,
  arousal: number = 0.5,
  dominance: number = 0.5
): MockEmotionState => ({
  valence,
  arousal,
  dominance
});

export const createMockPattern = (
  nodes: number[] = [0, 1, 2],
  complexity: number = 0.5
): MockPattern => ({
  nodes,
  connections: nodes.map((_, i) => [i, (i + 1) % nodes.length]),
  resonance: 0.5,
  complexity
});

export const createMockInteraction = (
  pattern: string = 'harmonic',
  success: boolean = true,
  timeToComplete: number = 5000
): MockInteraction => ({
  pattern,
  success,
  timeToComplete
});

// Test helpers
export const renderHookWithWrapper = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  initialProps?: TProps
) => {
  return renderHook(hook, {
    initialProps,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="test-wrapper">{children}</div>
    )
  });
};

// Mock fetch
export const mockFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mock response' })
  })
);

// Performance measurement helpers
export const measurePerformance = async (
  operation: () => Promise<void> | void
): Promise<number> => {
  const startTime = performance.now();
  await operation();
  const endTime = performance.now();
  return endTime - startTime;
};

export const measureFPS = async (
  frames: number,
  render: () => void
): Promise<number> => {
  const frameTimes: number[] = [];
  let lastFrameTime = performance.now();

  for (let i = 0; i < frames; i++) {
    render();
    const currentTime = performance.now();
    frameTimes.push(currentTime - lastFrameTime);
    lastFrameTime = currentTime;
  }

  const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
  return 1000 / avgFrameTime; // Convert to FPS
};

// Setup and teardown helpers
export const setupTestEnvironment = () => {
  // Mock global objects
  Object.defineProperty(global, 'fetch', {
    value: mockFetch,
    writable: true
  });

  // Reset mocks
  jest.clearAllMocks();
};

export const teardownTestEnvironment = () => {
  // Clean up mocks
  jest.resetAllMocks();
}; 