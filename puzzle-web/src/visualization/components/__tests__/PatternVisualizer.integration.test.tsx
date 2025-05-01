import React from 'react';
import { render, screen, act } from '@testing-library/react';
import PatternVisualizer from '../PatternVisualizer';
import { EmergentPattern, ResonanceField } from '../../types';
import { CanvasRenderer } from '../../core/CanvasRenderer';

// Mock CanvasRenderer
jest.mock('../../core/CanvasRenderer', () => {
  return {
    CanvasRenderer: jest.fn().mockImplementation(() => ({
      startAnimation: jest.fn(),
      stopAnimation: jest.fn(),
      clear: jest.fn(),
      drawCircle: jest.fn(),
      drawGradientCircle: jest.fn(),
      drawLine: jest.fn(),
      drawGradientLine: jest.fn()
    }))
  };
});

// Mock getNotePosition
declare global {
  var getNotePosition: (noteId: number) => { x: number; y: number } | undefined;
}

describe('PatternVisualizer Integration', () => {
  const canvasSize = { width: 800, height: 600 };
  const imaginaryField: ResonanceField = {
    center: { x: 400, y: 300 },
    radius: 200,
    intensity: 1
  };
  const pattern: EmergentPattern = {
    patternType: 'harmonic',
    nodes: [1, 2, 3],
    strength: 0.8,
    stability: 0.9,
    resonanceField: {
      center: { x: 400, y: 300 },
      radius: 100,
      intensity: 0.7
    },
    evolution: {
      transformations: [
        {
          timestamp: 0,
          type: 'merge'
        }
      ]
    }
  };

  beforeEach(() => {
    // Mock note positions
    const mockNotePositions = new Map<number, { x: number; y: number }>();
    mockNotePositions.set(1, { x: 100, y: 100 });
    mockNotePositions.set(2, { x: 200, y: 200 });
    mockNotePositions.set(3, { x: 300, y: 300 });

    // Mock getNotePosition function
    global.getNotePosition = jest.fn((noteId: number) => mockNotePositions.get(noteId));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize CanvasRenderer and start animation', () => {
    render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[pattern]}
      />
    );

    expect(CanvasRenderer).toHaveBeenCalled();
    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    expect(renderer.startAnimation).toHaveBeenCalled();
  });

  it('should draw pattern elements on canvas', () => {
    render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[pattern]}
      />
    );

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    const animationCallback = (renderer.startAnimation as jest.Mock).mock.calls[0][0];

    act(() => {
      animationCallback();
    });

    expect(renderer.clear).toHaveBeenCalled();
    expect(renderer.drawCircle).toHaveBeenCalled();
    expect(renderer.drawGradientCircle).toHaveBeenCalled();
    expect(renderer.drawLine).toHaveBeenCalled();
  });

  it('should handle multiple patterns', () => {
    const patterns = [
      pattern,
      {
        ...pattern,
        patternType: 'rhythmic' as const,
        nodes: [4, 5, 6]
      }
    ];

    render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={patterns}
      />
    );

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    const animationCallback = (renderer.startAnimation as jest.Mock).mock.calls[0][0];

    act(() => {
      animationCallback();
    });

    expect(renderer.drawCircle).toHaveBeenCalledTimes(patterns.length);
  });

  it('should handle pattern updates', () => {
    const { rerender } = render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[pattern]}
      />
    );

    const updatedPattern = {
      ...pattern,
      strength: 0.9,
      stability: 1.0
    };

    rerender(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[updatedPattern]}
      />
    );

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    const animationCallback = (renderer.startAnimation as jest.Mock).mock.calls[0][0];

    act(() => {
      animationCallback();
    });

    expect(renderer.clear).toHaveBeenCalled();
    expect(renderer.drawCircle).toHaveBeenCalled();
  });

  it('should handle imaginary field updates', () => {
    const { rerender } = render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[pattern]}
      />
    );

    const updatedField = {
      ...imaginaryField,
      intensity: 0.5
    };

    rerender(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={updatedField}
        patterns={[pattern]}
      />
    );

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    const animationCallback = (renderer.startAnimation as jest.Mock).mock.calls[0][0];

    act(() => {
      animationCallback();
    });

    expect(renderer.clear).toHaveBeenCalled();
    expect(renderer.drawGradientCircle).toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const { unmount } = render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[pattern]}
      />
    );

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    unmount();

    expect(renderer.stopAnimation).toHaveBeenCalled();
  });
}); 