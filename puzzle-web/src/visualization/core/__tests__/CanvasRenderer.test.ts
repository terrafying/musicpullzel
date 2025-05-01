import { CanvasRenderer } from '../CanvasRenderer';
import { Vector2D, Color, Gradient } from '../../../types';

describe('CanvasRenderer', () => {
  let renderer: CanvasRenderer;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    renderer = new CanvasRenderer(canvas);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('drawCircle', () => {
    it('should draw a circle with the given parameters', () => {
      const position: Vector2D = { x: 100, y: 100 };
      const radius = 50;
      const color: Color = { r: 255, g: 0, b: 0 };
      const alpha = 1;

      renderer.drawCircle(position, radius, color, alpha);

      const ctx = canvas.getContext('2d');
      expect(ctx?.beginPath).toHaveBeenCalled();
      expect(ctx?.arc).toHaveBeenCalledWith(position.x, position.y, radius, 0, Math.PI * 2);
      expect(ctx?.fillStyle).toBe(`rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      expect(ctx?.fill).toHaveBeenCalled();
    });

    it('should handle zero radius', () => {
      const position: Vector2D = { x: 100, y: 100 };
      const radius = 0;
      const color: Color = { r: 255, g: 0, b: 0 };
      const alpha = 1;

      renderer.drawCircle(position, radius, color, alpha);

      const ctx = canvas.getContext('2d');
      expect(ctx?.arc).toHaveBeenCalledWith(position.x, position.y, 0, 0, Math.PI * 2);
    });
  });

  describe('drawGradientCircle', () => {
    it('should draw a circle with a gradient', () => {
      const position: Vector2D = { x: 100, y: 100 };
      const radius = 50;
      const gradient: Gradient = {
        stops: [
          { position: 0, color: { r: 255, g: 0, b: 0 }, alpha: 1 },
          { position: 1, color: { r: 0, g: 0, b: 255 }, alpha: 1 }
        ]
      };

      renderer.drawGradientCircle(position, radius, gradient);

      const ctx = canvas.getContext('2d');
      expect(ctx?.beginPath).toHaveBeenCalled();
      expect(ctx?.createRadialGradient).toHaveBeenCalledWith(
        position.x, position.y, 0,
        position.x, position.y, radius
      );
      expect(ctx?.arc).toHaveBeenCalledWith(position.x, position.y, radius, 0, Math.PI * 2);
      expect(ctx?.fill).toHaveBeenCalled();
    });
  });

  describe('drawLine', () => {
    it('should draw a line between two points', () => {
      const start: Vector2D = { x: 0, y: 0 };
      const end: Vector2D = { x: 100, y: 100 };
      const color: Color = { r: 0, g: 255, b: 0 };
      const width = 2;
      const alpha = 1;

      renderer.drawLine(start, end, color, width, alpha);

      const ctx = canvas.getContext('2d');
      expect(ctx?.beginPath).toHaveBeenCalled();
      expect(ctx?.moveTo).toHaveBeenCalledWith(start.x, start.y);
      expect(ctx?.lineTo).toHaveBeenCalledWith(end.x, end.y);
      expect(ctx?.strokeStyle).toBe(`rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`);
      expect(ctx?.lineWidth).toBe(width);
      expect(ctx?.stroke).toHaveBeenCalled();
    });
  });

  describe('drawGradientLine', () => {
    it('should draw a line with a gradient', () => {
      const start: Vector2D = { x: 0, y: 0 };
      const end: Vector2D = { x: 100, y: 100 };
      const gradient: Gradient = {
        stops: [
          { position: 0, color: { r: 255, g: 0, b: 0 }, alpha: 1 },
          { position: 1, color: { r: 0, g: 0, b: 255 }, alpha: 1 }
        ]
      };
      const width = 2;

      renderer.drawGradientLine(start, end, gradient, width);

      const ctx = canvas.getContext('2d');
      expect(ctx?.beginPath).toHaveBeenCalled();
      expect(ctx?.createLinearGradient).toHaveBeenCalledWith(start.x, start.y, end.x, end.y);
      expect(ctx?.moveTo).toHaveBeenCalledWith(start.x, start.y);
      expect(ctx?.lineTo).toHaveBeenCalledWith(end.x, end.y);
      expect(ctx?.lineWidth).toBe(width);
      expect(ctx?.stroke).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear the entire canvas', () => {
      renderer.clear();

      const ctx = canvas.getContext('2d');
      expect(ctx?.clearRect).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    });
  });

  describe('animation', () => {
    it('should start and stop animation', () => {
      const renderFn = jest.fn();
      renderer.startAnimation(renderFn);

      expect(requestAnimationFrame).toHaveBeenCalled();
      expect(renderFn).toHaveBeenCalled();

      renderer.stopAnimation();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should not start animation if no render function is provided', () => {
      renderer.startAnimation(() => {});
      expect(requestAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle invalid canvas element', () => {
      expect(() => new CanvasRenderer(null as unknown as HTMLCanvasElement)).toThrow();
    });

    it('should handle invalid context', () => {
      const mockCanvas = document.createElement('canvas');
      jest.spyOn(mockCanvas, 'getContext').mockReturnValue(null);
      expect(() => new CanvasRenderer(mockCanvas)).toThrow();
    });
  });
}); 