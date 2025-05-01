import { useEffect, useRef } from 'react';
import { CanvasRenderer } from '../core/CanvasRenderer';

export function useCanvasRenderer(
  render: (renderer: CanvasRenderer) => void,
  dependencies: any[] = []
) {
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize renderer if not already created
    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }

    const renderer = rendererRef.current;

    // Start animation loop
    renderer.startAnimation(() => {
      renderer.clear();
      render(renderer);
    });

    // Cleanup
    return () => {
      renderer.stopAnimation();
    };
  }, dependencies);

  return canvasRef;
} 