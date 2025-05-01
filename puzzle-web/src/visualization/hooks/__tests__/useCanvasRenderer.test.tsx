import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useCanvasRenderer } from '../useCanvasRenderer';
import { CanvasRenderer } from '../../core/CanvasRenderer';

// Mock CanvasRenderer
jest.mock('../../core/CanvasRenderer', () => ({
  CanvasRenderer: jest.fn().mockImplementation(() => ({
    startAnimation: jest.fn(),
    stopAnimation: jest.fn(),
    clear: jest.fn()
  }))
}));

describe('useCanvasRenderer', () => {
  let mockRender: jest.Mock;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockRender = jest.fn();
    mockCanvas = document.createElement('canvas');
    document.body.appendChild(mockCanvas);
  });

  afterEach(() => {
    document.body.removeChild(mockCanvas);
    jest.clearAllMocks();
  });

  it('should initialize CanvasRenderer with canvas element', () => {
    const { result } = renderHook(() => useCanvasRenderer(mockRender));

    expect(CanvasRenderer).toHaveBeenCalledWith(expect.any(HTMLCanvasElement));
  });

  it('should start animation when render function is provided', () => {
    const { result } = renderHook(() => useCanvasRenderer(mockRender));
    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;

    expect(renderer.startAnimation).toHaveBeenCalled();
  });

  it('should stop animation on cleanup', () => {
    const { unmount } = renderHook(() => useCanvasRenderer(mockRender));
    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;

    unmount();

    expect(renderer.stopAnimation).toHaveBeenCalled();
  });

  it('should call render function with renderer instance', () => {
    const { result } = renderHook(() => useCanvasRenderer(mockRender));
    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;

    // Get the animation callback
    const animationCallback = (renderer.startAnimation as jest.Mock).mock.calls[0][0];
    
    // Simulate animation frame
    act(() => {
      animationCallback();
    });

    expect(mockRender).toHaveBeenCalledWith(renderer);
  });

  it('should handle dependencies changes', () => {
    const dependencies = [1];
    const { rerender } = renderHook(
      ({ deps }) => useCanvasRenderer(mockRender, deps),
      { initialProps: { deps: dependencies } }
    );

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    const initialAnimationCallback = (renderer.startAnimation as jest.Mock).mock.calls[0][0];

    // Change dependencies
    rerender({ deps: [2] });

    // Should have stopped previous animation and started new one
    expect(renderer.stopAnimation).toHaveBeenCalled();
    expect(renderer.startAnimation).toHaveBeenCalledTimes(2);
  });

  it('should not initialize renderer if canvas is not available', () => {
    const { result } = renderHook(() => useCanvasRenderer(mockRender, [], null));

    expect(CanvasRenderer).not.toHaveBeenCalled();
  });
}); 