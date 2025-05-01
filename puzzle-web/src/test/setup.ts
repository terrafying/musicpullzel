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
  }))
};

// Mock canvas element
const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  width: 800,
  height: 600
};

// Mock requestAnimationFrame
const mockRAF = jest.fn();
const mockCAF = jest.fn();

global.requestAnimationFrame = mockRAF;
global.cancelAnimationFrame = mockCAF;

// Mock canvas element creation
HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockContext.beginPath.mockClear();
  mockContext.arc.mockClear();
  mockContext.moveTo.mockClear();
  mockContext.lineTo.mockClear();
  mockContext.fill.mockClear();
  mockContext.stroke.mockClear();
  mockContext.createRadialGradient.mockClear();
  mockContext.createLinearGradient.mockClear();
  mockRAF.mockClear();
  mockCAF.mockClear();
});
