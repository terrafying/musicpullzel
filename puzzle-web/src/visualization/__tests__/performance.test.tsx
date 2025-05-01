import React from 'react';
import { render, act } from '@testing-library/react';
import PatternVisualizer from '../components/PatternVisualizer';
import { createMockPattern } from '../../test/utils';

describe('Visualization Performance', () => {
  const baseProps = {
    canvasSize: { width: 800, height: 600 },
    imaginaryField: { center: { x: 0, y: 0 }, radius: 1, intensity: 0.5 }
  };

  describe('Rendering Performance', () => {
    it('should render single pattern within performance budget', () => {
      const startTime = performance.now();
      
      render(
        <PatternVisualizer
          {...baseProps}
          patterns={[createMockPattern()]}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Initial render should complete within 50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('should handle multiple patterns efficiently', () => {
      const patterns = Array.from({ length: 20 }, (_, i) =>
        createMockPattern('harmonic', [i, (i + 1) % 20])
      );

      const startTime = performance.now();
      
      render(
        <PatternVisualizer
          {...baseProps}
          patterns={patterns}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Multiple patterns should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });

  describe('Animation Performance', () => {
    it('should maintain 60fps during animation', () => {
      const { rerender } = render(
        <PatternVisualizer
          {...baseProps}
          patterns={[createMockPattern()]}
        />
      );

      const frameTimes: number[] = [];
      let lastFrameTime = performance.now();

      // Simulate 60 frames
      for (let i = 0; i < 60; i++) {
        act(() => {
          rerender(
            <PatternVisualizer
              {...baseProps}
              patterns={[createMockPattern('harmonic', [i % 5, (i + 1) % 5])]}
            />
          );
        });

        const currentTime = performance.now();
        const frameTime = currentTime - lastFrameTime;
        frameTimes.push(frameTime);
        lastFrameTime = currentTime;
      }

      // Calculate average frame time
      const avgFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      
      // Average frame time should be less than 16.67ms (60fps)
      expect(avgFrameTime).toBeLessThan(16.67);
    });

    it('should handle rapid pattern changes efficiently', () => {
      const { rerender } = render(
        <PatternVisualizer
          {...baseProps}
          patterns={[createMockPattern()]}
        />
      );

      const startTime = performance.now();

      // Simulate rapid pattern changes
      for (let i = 0; i < 10; i++) {
        act(() => {
          rerender(
            <PatternVisualizer
              {...baseProps}
              patterns={[
                createMockPattern('harmonic', [i % 5, (i + 1) % 5]),
                createMockPattern('rhythmic', [(i + 2) % 5, (i + 3) % 5])
              ]}
            />
          );
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // 10 rapid changes should complete within 200ms
      expect(totalTime).toBeLessThan(200);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory during pattern updates', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      const { rerender, unmount } = render(
        <PatternVisualizer
          {...baseProps}
          patterns={[createMockPattern()]}
        />
      );

      // Perform multiple updates
      for (let i = 0; i < 50; i++) {
        act(() => {
          rerender(
            <PatternVisualizer
              {...baseProps}
              patterns={[createMockPattern('harmonic', [i % 5, (i + 1) % 5])]}
            />
          );
        });
      }

      unmount();

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = finalMemory - initialMemory;
      
      // Memory usage should not increase significantly
      expect(memoryDiff).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    });
  });
}); 