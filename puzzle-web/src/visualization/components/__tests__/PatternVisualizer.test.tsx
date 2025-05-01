import React from 'react';
import { render, screen } from '@testing-library/react';
import PatternVisualizer from '../PatternVisualizer';
import { EmergentPattern, ResonanceField } from '../../types';

describe('PatternVisualizer', () => {
  const mockCanvasSize = { width: 800, height: 600 };
  const mockImaginaryField: ResonanceField = {
    center: { x: 0, y: 0 },
    radius: 1,
    intensity: 0.5
  };

  const mockPattern: EmergentPattern = {
    patternType: 'harmonic',
    nodes: [0, 1, 2],
    strength: 0.8,
    stability: 0.9,
    resonanceField: {
      center: { x: 0.5, y: 0.5 },
      radius: 0.3,
      intensity: 0.7
    },
    evolution: {
      transformations: [
        { timestamp: Date.now() - 1000, type: 'merge' }
      ]
    }
  };

  beforeEach(() => {
    // Mock DOM elements for note positions
    const mockNoteElements = [
      { getBoundingClientRect: () => ({ left: 100, top: 100, width: 50, height: 50 }) },
      { getBoundingClientRect: () => ({ left: 200, top: 200, width: 50, height: 50 }) },
      { getBoundingClientRect: () => ({ left: 300, top: 300, width: 50, height: 50 }) }
    ];

    mockNoteElements.forEach((el, index) => {
      const div = document.createElement('div');
      div.setAttribute('data-note-index', index.toString());
      Object.defineProperty(div, 'getBoundingClientRect', {
        value: el.getBoundingClientRect
      });
      document.body.appendChild(div);
    });
  });

  afterEach(() => {
    // Clean up mock elements
    document.querySelectorAll('[data-note-index]').forEach(el => el.remove());
  });

  it('should render canvas with correct dimensions', () => {
    render(
      <PatternVisualizer
        patterns={[mockPattern]}
        canvasSize={mockCanvasSize}
        imaginaryField={mockImaginaryField}
      />
    );

    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toHaveAttribute('width', mockCanvasSize.width.toString());
    expect(canvas).toHaveAttribute('height', mockCanvasSize.height.toString());
  });

  it('should render canvas with correct styles', () => {
    render(
      <PatternVisualizer
        patterns={[mockPattern]}
        canvasSize={mockCanvasSize}
        imaginaryField={mockImaginaryField}
      />
    );

    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toHaveStyle({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1
    });
  });

  it('should handle empty patterns array', () => {
    render(
      <PatternVisualizer
        patterns={[]}
        canvasSize={mockCanvasSize}
        imaginaryField={mockImaginaryField}
      />
    );

    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
  });

  it('should handle zero intensity imaginary field', () => {
    const zeroIntensityField: ResonanceField = {
      ...mockImaginaryField,
      intensity: 0
    };

    render(
      <PatternVisualizer
        patterns={[mockPattern]}
        canvasSize={mockCanvasSize}
        imaginaryField={zeroIntensityField}
      />
    );

    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
  });

  it('should handle pattern with no transformations', () => {
    const patternWithoutTransformations: EmergentPattern = {
      ...mockPattern,
      evolution: {
        transformations: []
      }
    };

    render(
      <PatternVisualizer
        patterns={[patternWithoutTransformations]}
        canvasSize={mockCanvasSize}
        imaginaryField={mockImaginaryField}
      />
    );

    const canvas = screen.getByRole('img', { hidden: true });
    expect(canvas).toBeInTheDocument();
  });
}); 