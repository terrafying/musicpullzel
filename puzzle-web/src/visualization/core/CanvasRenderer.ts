import { Vector2D, Color, Gradient } from '../types';

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private animationFrameId?: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = context;
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawCircle(position: Vector2D, radius: number, color: Color, alpha: number = 1): void {
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.createColorString(color, alpha);
    this.ctx.fill();
  }

  public drawGradientCircle(
    position: Vector2D,
    radius: number,
    gradient: Gradient,
    alpha: number = 1
  ): void {
    const radialGradient = this.ctx.createRadialGradient(
      position.x, position.y, 0,
      position.x, position.y, radius
    );

    gradient.stops.forEach(stop => {
      radialGradient.addColorStop(
        stop.position,
        this.createColorString(stop.color, stop.alpha * alpha)
      );
    });

    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = radialGradient;
    this.ctx.fill();
  }

  public drawLine(
    start: Vector2D,
    end: Vector2D,
    color: Color,
    width: number = 1,
    alpha: number = 1
  ): void {
    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.strokeStyle = this.createColorString(color, alpha);
    this.ctx.lineWidth = width;
    this.ctx.stroke();
  }

  public drawGradientLine(
    start: Vector2D,
    end: Vector2D,
    gradient: Gradient,
    width: number = 1,
    alpha: number = 1
  ): void {
    const linearGradient = this.ctx.createLinearGradient(
      start.x, start.y,
      end.x, end.y
    );

    gradient.stops.forEach(stop => {
      linearGradient.addColorStop(
        stop.position,
        this.createColorString(stop.color, stop.alpha * alpha)
      );
    });

    this.ctx.beginPath();
    this.ctx.moveTo(start.x, start.y);
    this.ctx.lineTo(end.x, end.y);
    this.ctx.strokeStyle = linearGradient;
    this.ctx.lineWidth = width;
    this.ctx.stroke();
  }

  public startAnimation(render: () => void): void {
    const animate = () => {
      render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    this.animationFrameId = requestAnimationFrame(animate);
  }

  public stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private createColorString(color: Color, alpha: number): string {
    const { r, g, b } = color;
    const alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alphaHex}`;
  }
} 