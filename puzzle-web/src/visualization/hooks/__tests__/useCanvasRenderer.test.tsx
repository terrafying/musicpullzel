import { renderHook, act } from '@testing-library/react';
import { useCanvasRenderer } from '../useCanvasRenderer';
import { CanvasRenderer } from '../../core/CanvasRenderer';

// Mock CanvasRenderer
jest.mock('../../core/CanvasRenderer', () => {
  return {
    CanvasRenderer: jest.fn().mockImplementation(() => ({
      startAnimation: jest.fn(),
      stopAnimation: jest.fn(),
      clear: jest.fn()
    }))
  };
});

describe('useCanvasRenderer', () => {
  let renderFn: jest.Mock;

  beforeEach(() => {
    renderFn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize CanvasRenderer with canvas element', () => {
    const { result } = renderHook(() => useCanvasRenderer(renderFn));

    expect(result.current).toBeInstanceOf(Object);
    expect(result.current.current).toBeInstanceOf(HTMLCanvasElement);
  });

  it('should start animation when render function is provided', () => {
    const { result } = renderHook(() => useCanvasRenderer(renderFn));

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    expect(renderer.startAnimation).toHaveBeenCalled();
  });

  it('should stop animation on cleanup', () => {
    const { unmount } = renderHook(() => useCanvasRenderer(renderFn));

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    unmount();

    expect(renderer.stopAnimation).toHaveBeenCalled();
  });

  it('should call render function with renderer instance', () => {
    const { result } = renderHook(() => useCanvasRenderer(renderFn));

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    const animationCallback = (renderer.startAnimation as jest.Mock).mock.calls[0][0];

    act(() => {
      animationCallback();
    });

    expect(renderFn).toHaveBeenCalledWith(renderer);
  });

  it('should handle changes in dependencies', () => {
    const dependencies = [1];
    const { rerender } = renderHook(
      ({ deps }) => useCanvasRenderer(renderFn, deps),
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
    const { result } = renderHook(() => useCanvasRenderer(renderFn, []));

    expect(CanvasRenderer).not.toHaveBeenCalled();
  });

  it('should handle render function changes', () => {
    const { rerender } = renderHook(
      ({ renderFn }) => useCanvasRenderer(renderFn),
      { initialProps: { renderFn } }
    );

    const newRenderFn = jest.fn();
    rerender({ renderFn: newRenderFn });

    const renderer = (CanvasRenderer as jest.Mock).mock.results[0].value;
    const animationCallback = (renderer.startAnimation as jest.Mock).mock.calls[0][0];

    act(() => {
      animationCallback();
    });

    expect(newRenderFn).toHaveBeenCalledWith(renderer);
  });
}); 