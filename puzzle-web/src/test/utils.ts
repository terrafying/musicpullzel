import { Vector2D, Color, Gradient, EmergentPattern, ResonanceField } from '../visualization/types';

export const createMockVector2D = (x: number = 0, y: number = 0): Vector2D => ({
  x,
  y
});

export const createMockColor = (r: number = 0, g: number = 0, b: number = 0): Color => ({
  r,
  g,
  b
});

export const createMockGradient = (
  startColor: Color = { r: 255, g: 0, b: 0 },
  endColor: Color = { r: 0, g: 0, b: 255 }
): Gradient => ({
  stops: [
    { position: 0, color: startColor, alpha: 1 },
    { position: 1, color: endColor, alpha: 0 }
  ]
});

export const createMockResonanceField = (
  center: Vector2D = { x: 0, y: 0 },
  radius: number = 1,
  intensity: number = 0.5
): ResonanceField => ({
  center,
  radius,
  intensity
});

export const createMockPattern = (
  type: EmergentPattern['patternType'] = 'harmonic',
  nodes: number[] = [0, 1, 2],
  strength: number = 0.8,
  stability: number = 0.9
): EmergentPattern => ({
  patternType: type,
  nodes,
  strength,
  stability,
  resonanceField: createMockResonanceField(),
  evolution: {
    transformations: [
      { timestamp: Date.now() - 1000, type: 'merge' }
    ]
  }
});

export const createMockCanvas = (width: number = 800, height: number = 600): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

export const createMockNoteElements = (count: number = 3): HTMLElement[] => {
  const elements: HTMLElement[] = [];
  
  for (let i = 0; i < count; i++) {
    const div = document.createElement('div');
    div.setAttribute('data-note-index', i.toString());
    Object.defineProperty(div, 'getBoundingClientRect', {
      value: () => ({
        left: 100 * (i + 1),
        top: 100 * (i + 1),
        width: 50,
        height: 50
      })
    });
    document.body.appendChild(div);
    elements.push(div);
  }
  
  return elements;
};

export const cleanupMockNoteElements = (): void => {
  document.querySelectorAll('[data-note-index]').forEach(el => el.remove());
}; 