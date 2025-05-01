import React from 'react';
import { render, screen } from '@testing-library/react';
import PatternVisualizer from '../PatternVisualizer';
import { EmergentPattern, ResonanceField } from '../../types';

// Extend global type to include getNotePosition
declare global {
  var getNotePosition: (noteId: number) => { x: number; y: number } | undefined;
}

describe('PatternVisualizer', () => {
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

  it('should render canvas with correct dimensions', () => {
    render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[pattern]}
      />
    );

    const canvas = screen.getByTestId('pattern-visualizer-canvas');
    expect(canvas).toHaveAttribute('width', canvasSize.width.toString());
    expect(canvas).toHaveAttribute('height', canvasSize.height.toString());
  });

  it('should render canvas with correct styles', () => {
    render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[pattern]}
      />
    );

    const canvas = screen.getByTestId('pattern-visualizer-canvas');
    expect(canvas).toHaveStyle({
      position: 'absolute',
      top: 0,
      left: 0,
      pointerEvents: 'none'
    });
  });

  it('should handle empty patterns array', () => {
    render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[]}
      />
    );

    const canvas = screen.getByTestId('pattern-visualizer-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should handle zero intensity imaginary field', () => {
    const zeroIntensityField = { ...imaginaryField, intensity: 0 };
    render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={zeroIntensityField}
        patterns={[pattern]}
      />
    );

    const canvas = screen.getByTestId('pattern-visualizer-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should handle pattern with no transformations', () => {
    const patternWithoutTransformations = {
      ...pattern,
      evolution: {
        transformations: []
      }
    };

    render(
      <PatternVisualizer
        canvasSize={canvasSize}
        imaginaryField={imaginaryField}
        patterns={[patternWithoutTransformations]}
      />
    );

    const canvas = screen.getByTestId('pattern-visualizer-canvas');
    expect(canvas).toBeInTheDocument();
  });
}); 