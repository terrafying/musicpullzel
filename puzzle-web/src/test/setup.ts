import '@testing-library/jest-dom';

// Mock canvas context
const mockContext = {
  beginPath: jest.fn(),
  arc: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  // Add required CanvasRenderingContext2D properties
  canvas: document.createElement('canvas'),
  getContextAttributes: jest.fn(),
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'medium',
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  textAlign: 'start',
  textBaseline: 'alphabetic',
  font: '10px sans-serif',
  direction: 'inherit',
  filter: 'none',
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  setTransform: jest.fn(),
  resetTransform: jest.fn(),
  createImageData: jest.fn(),
  getImageData: jest.fn(),
  putImageData: jest.fn(),
  createPattern: jest.fn(),
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(),
  drawImage: jest.fn(),
  addHitRegion: jest.fn(),
  removeHitRegion: jest.fn(),
  clearHitRegions: jest.fn(),
  isPointInPath: jest.fn(),
  isPointInStroke: jest.fn(),
  clip: jest.fn(),
  closePath: jest.fn(),
  bezierCurveTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  rect: jest.fn(),
  roundRect: jest.fn(),
  ellipse: jest.fn(),
  arcTo: jest.fn(),
  getLineDash: jest.fn(),
  setLineDash: jest.fn(),
  getTransform: jest.fn(),
  createConicGradient: jest.fn(),
  drawFocusIfNeeded: jest.fn(),
  scrollPathIntoView: jest.fn(),
  isContextLost: jest.fn(),
  reset: jest.fn()
} as unknown as CanvasRenderingContext2D;

// Mock canvas element
const mockCanvas = {
  getContext: jest.fn().mockImplementation((contextId: string) => {
    if (contextId === '2d') {
      return mockContext;
    }
    return null;
  }),
  width: 800,
  height: 600
};

// Mock requestAnimationFrame
const mockRAF = jest.fn();
const mockCAF = jest.fn();

global.requestAnimationFrame = mockRAF;
global.cancelAnimationFrame = mockCAF;

// Mock canvas element creation
HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextId: string) => {
  if (contextId === '2d') {
    return mockContext;
  }
  return null;
});

// Mock fetch
const mockFetchImpl = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mock response' })
  })
);

const mockFetch = Object.assign(mockFetchImpl, {
  preconnect: jest.fn(),
  preload: jest.fn(),
  prefetch: jest.fn()
}) as unknown as typeof fetch;

global.fetch = mockFetch;

// Mock media devices
const mockMediaDevices = {
  getUserMedia: jest.fn().mockResolvedValue({
    getVideoTracks: () => [{
      getSettings: () => ({ width: 640, height: 480 })
    }]
  })
};

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: mockMediaDevices,
  writable: true
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  (mockContext.beginPath as jest.Mock).mockClear();
  (mockContext.arc as jest.Mock).mockClear();
  (mockContext.moveTo as jest.Mock).mockClear();
  (mockContext.lineTo as jest.Mock).mockClear();
  (mockContext.fill as jest.Mock).mockClear();
  (mockContext.stroke as jest.Mock).mockClear();
  (mockContext.createRadialGradient as jest.Mock).mockClear();
  (mockContext.createLinearGradient as jest.Mock).mockClear();
  mockRAF.mockClear();
  mockCAF.mockClear();
  mockFetchImpl.mockClear();
  mockMediaDevices.getUserMedia.mockClear();
});
