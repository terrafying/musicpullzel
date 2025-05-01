import { CanvasRenderer } from '../CanvasRenderer';
import { Vector2D, Color, Gradient } from '../../types';

describe('CanvasRenderer', () => {
  let canvas: HTMLCanvasElement;
  let renderer: CanvasRenderer;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    renderer = new CanvasRenderer(canvas);
  });

  describe('drawCircle', () => {
    it('should draw a circle with the correct parameters', () => {
      const position: Vector2D = { x: 100, y: 100 };
      const radius = 50;
      const color: Color = { r: 255, g: 0, b: 0 };
      const alpha = 0.5;

      renderer.drawCircle(position, radius, color, alpha);

      expect(canvas.getContext('2d')?.beginPath).toHaveBeenCalled();
      expect(canvas.getContext('2d')?.arc).toHaveBeenCalledWith(
        position.x,
        position.y,
        radius,
        0,
        Math.PI * 2
      );
      expect(canvas.getContext('2d')?.fill).toHaveBeenCalled();
    });

    it('should use default alpha value of 1 when not specified', () => {
      const position: Vector2D = { x: 100, y: 100 };
      const radius = 50;
      const color: Color = { r: 255, g: 0, b: 0 };

      renderer.drawCircle(position, radius, color);

      const ctx = canvas.getContext('2d');
      expect(ctx?.fillStyle).toBe('#ff0000ff');
    });
  });

  describe('drawGradientCircle', () => {
    it('should draw a gradient circle with the correct parameters', () => {
      const position: Vector2D = { x: 100, y: 100 };
      const radius = 50;
      const gradient: Gradient = {
        stops: [
          { position: 0, color: { r: 255, g: 0, b: 0 }, alpha: 1 },
          { position: 1, color: { r: 0, g: 0, b: 255 }, alpha: 0 }
        ]
      };
      const alpha = 0.5;

      renderer.drawGradientCircle(position, radius, gradient, alpha);

      const ctx = canvas.getContext('2d');
      expect(ctx?.createRadialGradient).toHaveBeenCalledWith(
        position.x,
        position.y,
        0,
        position.x,
        position.y,
        radius
      );
      expect(ctx?.beginPath).toHaveBeenCalled();
      expect(ctx?.arc).toHaveBeenCalledWith(
        position.x,
        position.y,
        radius,
        0,
        Math.PI * 2
      );
      expect(ctx?.fill).toHaveBeenCalled();
    });
  });

  describe('drawLine', () => {
    it('should draw a line with the correct parameters', () => {
      const start: Vector2D = { x: 0, y: 0 };
      const end: Vector2D = { x: 100, y: 100 };
      const color: Color = { r: 0, g: 255, b: 0 };
      const width = 2;
      const alpha = 0.8;

      renderer.drawLine(start, end, color, width, alpha);

      const ctx = canvas.getContext('2d');
      expect(ctx?.beginPath).toHaveBeenCalled();
      expect(ctx?.moveTo).toHaveBeenCalledWith(start.x, start.y);
      expect(ctx?.lineTo).toHaveBeenCalledWith(end.x, end.y);
      expect(ctx?.lineWidth).toBe(width);
      expect(ctx?.stroke).toHaveBeenCalled();
    });
  });

  describe('drawGradientLine', () => {
    it('should draw a gradient line with the correct parameters', () => {
      const start: Vector2D = { x: 0, y: 0 };
      const end: Vector2D = { x: 100, y: 100 };
      const gradient: Gradient = {
        stops: [
          { position: 0, color: { r: 255, g: 0, b: 0 }, alpha: 1 },
          { position: 1, color: { r: 0, g: 0, b: 255 }, alpha: 0 }
        ]
      };
      const width = 2;
      const alpha = 0.8;

      renderer.drawGradientLine(start, end, gradient, width, alpha);

      const ctx = canvas.getContext('2d');
      expect(ctx?.createLinearGradient).toHaveBeenCalledWith(
        start.x,
        start.y,
        end.x,
        end.y
      );
      expect(ctx?.beginPath).toHaveBeenCalled();
      expect(ctx?.moveTo).toHaveBeenCalledWith(start.x, start.y);
      expect(ctx?.lineTo).toHaveBeenCalledWith(end.x, end.y);
      expect(ctx?.lineWidth).toBe(width);
      expect(ctx?.stroke).toHaveBeenCalled();
    });
  });

  describe('animation', () => {
    it('should start and stop animation correctly', () => {
      const render = jest.fn();
      
      renderer.startAnimation(render);
      expect(requestAnimationFrame).toHaveBeenCalled();

      // Simulate animation frame
      const rafCallback = (requestAnimationFrame as jest.Mock).mock.calls[0][0];
      rafCallback();
      expect(render).toHaveBeenCalled();

      renderer.stopAnimation();
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error when canvas context is not available', () => {
      const mockCanvas = {
        getContext: jest.fn(() => null)
      } as unknown as HTMLCanvasElement;

      expect(() => new CanvasRenderer(mockCanvas)).toThrow('Failed to get canvas context');
    });
  });
}); 