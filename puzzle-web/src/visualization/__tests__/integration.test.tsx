import React from 'react';
import { render, screen, act } from '@testing-library/react';
import PatternVisualizer from '../components/PatternVisualizer';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { CanvasRenderer } from '../core/CanvasRenderer';
import { createMockPattern, createMockCanvas, createMockNoteElements, cleanupMockNoteElements } from '../../test/utils';

describe('Visualization Integration', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockNoteElements: HTMLElement[];

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    mockNoteElements = createMockNoteElements(3);
    document.body.appendChild(mockCanvas);
  });

  afterEach(() => {
    document.body.removeChild(mockCanvas);
    cleanupMockNoteElements();
    jest.clearAllMocks();
  });

  describe('PatternVisualizer with useCanvasRenderer', () => {
    it('should render and animate patterns correctly', () => {
      const patterns = [
        createMockPattern('harmonic', [0, 1]),
        createMockPattern('rhythmic', [1, 2])
      ];

      render(
        <PatternVisualizer
          patterns={patterns}
          canvasSize={{ width: 800, height: 600 }}
          imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
        />
      );

      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toBeInTheDocument();

      // Verify canvas context was created
      const ctx = canvas.getContext('2d');
      expect(ctx).toBeTruthy();

      // Verify animation frame was requested
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should handle pattern evolution and transformations', () => {
      const initialPattern = createMockPattern('harmonic', [0, 1]);
      const { rerender } = render(
        <PatternVisualizer
          patterns={[initialPattern]}
          canvasSize={{ width: 800, height: 600 }}
          imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
        />
      );

      // Simulate pattern evolution
      const evolvedPattern = {
        ...initialPattern,
        evolution: {
          transformations: [
            { timestamp: Date.now() - 1000, type: 'merge' },
            { timestamp: Date.now(), type: 'split' }
          ]
        }
      };

      act(() => {
        rerender(
          <PatternVisualizer
            patterns={[evolvedPattern]}
            canvasSize={{ width: 800, height: 600 }}
            imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
          />
        );
      });

      // Verify animation was restarted
      expect(cancelAnimationFrame).toHaveBeenCalled();
      expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Tests', () => {
    it('should maintain performance with multiple patterns', () => {
      const patterns = Array.from({ length: 10 }, (_, i) =>
        createMockPattern('harmonic', [i, (i + 1) % 10])
      );

      const startTime = performance.now();

      render(
        <PatternVisualizer
          patterns={patterns}
          canvasSize={{ width: 800, height: 600 }}
          imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Initial render should complete within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid pattern updates efficiently', () => {
      const { rerender } = render(
        <PatternVisualizer
          patterns={[createMockPattern()]}
          canvasSize={{ width: 800, height: 600 }}
          imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
        />
      );

      const startTime = performance.now();

      // Simulate rapid pattern updates
      for (let i = 0; i < 5; i++) {
        act(() => {
          rerender(
            <PatternVisualizer
              patterns={[createMockPattern('harmonic', [i, (i + 1) % 5])]}
              canvasSize={{ width: 800, height: 600 }}
              imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
            />
          );
        });
      }

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // All updates should complete within 500ms
      expect(updateTime).toBeLessThan(500);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty patterns array', () => {
      render(
        <PatternVisualizer
          patterns={[]}
          canvasSize={{ width: 800, height: 600 }}
          imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
        />
      );

      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toBeInTheDocument();
    });

    it('should handle zero intensity imaginary field', () => {
      render(
        <PatternVisualizer
          patterns={[createMockPattern()]}
          canvasSize={{ width: 800, height: 600 }}
          imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0 }}
        />
      );

      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toBeInTheDocument();
    });

    it('should handle missing note elements', () => {
      cleanupMockNoteElements(); // Remove all note elements

      render(
        <PatternVisualizer
          patterns={[createMockPattern('harmonic', [0, 1, 2])]}
          canvasSize={{ width: 800, height: 600 }}
          imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
        />
      );

      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toBeInTheDocument();
    });

    it('should handle invalid pattern data', () => {
      const invalidPattern = {
        ...createMockPattern(),
        nodes: [-1, 999] // Invalid node indices
      };

      render(
        <PatternVisualizer
          patterns={[invalidPattern]}
          canvasSize={{ width: 800, height: 600 }}
          imaginaryField={{ center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }}
        />
      );

      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toBeInTheDocument();
    });
  });
}); 