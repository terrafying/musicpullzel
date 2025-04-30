# Music Puzzle Game - Web Frontend

This is the React web frontend for the Music Puzzle Game project, providing an advanced audiovisual interface and WebAssembly integration.

## Web Frontend Overview

This React application provides an immersive interface for exploring musical resonance:

- Built with **React**, **TypeScript**, and **Vite**
- Advanced **Web Audio API** implementation for complex sound synthesis
- Dynamic visual feedback synchronized with audio
- Integrates with the Rust core via **WebAssembly**

## Audio Engine

The game features a sophisticated audio engine built on Web Audio API:

### Synthesis Architecture
- Multiple oscillator types (sine, square, sawtooth, triangle)
- Dynamic modulation system with four modes
- Spinor-based motion effects
- Soft limiting and dynamic processing

### Audio Components
```typescript
interface AudioComponents {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  modOscillator: OscillatorNode;
  modGain: GainNode;
  limiter: DynamicsCompressorNode;
  spinorOscillator?: OscillatorNode;
  rhythmOscillator?: OscillatorNode;
}
```

### Modulation System
- Frequency modulation for tension
- Amplitude modulation for resolution
- Ring modulation for transitions
- Phase modulation for stable states

### Audio Processing
- Soft limiter (-6dB threshold, 4:1 ratio)
- Dynamic envelope generation
- Tempo-synchronized rhythmic effects
- State-responsive parameter mapping

## Visual System

The visual interface provides real-time feedback of the audio and game state:

### Components
- Interactive note buttons with shape variations
- Dynamic connection lines showing resonance
- State indicators for harmony and rhythm
- Real-time audio visualization

### Animation System
- Spinor-based rotations
- Tempo-synchronized pulsing
- Resonance pattern visualization
- State-responsive color mapping

### Visual Feedback
```typescript
interface VisualState {
  activeNotes: number[];
  resonatingPairs: [number, number, number][];
  harmonicState: string;
  rhythmicState: string;
  spinorMotion: {
    rate: number;
    phase: number;
  };
}
```

## WASM Integration

The web frontend connects to the Rust core via WebAssembly:

### Loading Process

- The `wasm/index.ts` module handles lazy-loading of the WASM code
- Type definitions ensure proper TypeScript integration with Rust types
- Error handling manages cases where WASM fails to load

### Integration Points

- **PuzzleState** - Core game state loaded from WASM
- **Game Actions** - Toggle positions, reset puzzle, check solved state
- **State Management** - React hooks manage WASM state changes

## Component Structure

```
src/
├── App.tsx             # Main game component
├── App.css             # Game styling
├── wasm/               # WASM integration
│   └── index.ts        # WASM loader and types
├── test/               # Test utilities
│   └── setup.ts        # Testing configuration
└── App.test.tsx        # Component and WASM tests
```

## Development Commands

Run these commands from the `puzzle-web` directory:

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage
- `npm run typecheck` - Validate TypeScript

## Testing

Tests are written using **Vitest** and **React Testing Library**:

- Component rendering tests
- WASM integration tests with mocking
- User interaction simulations
- State management verification

Example test run:
```bash
npm test
```

## Building for Production

To build the web frontend:

1. Ensure the WASM module is built first:
   ```bash
   cd ..
   npm run build:wasm
   ```

2. Build the web app:
   ```bash
   npm run build
   ```

The output will be in the `dist/` directory, ready for deployment.

## Implementation Notes

- The app uses a lazy-loading strategy for the WASM module to improve initial load time
- The circle of fifths visualization uses CSS flexbox for responsive layout
- Error states handle potential WASM loading or execution failures
- Application state is managed with React hooks for simplicity

