# Music Puzzle Game 🎵🧩

An interactive music-themed puzzle game based on just intonation and resonance patterns, built with Rust, WebAssembly, and React.

## Overview

This game challenges players to explore musical resonance by toggling notes in a just intonation system. Each move creates complex harmonic relationships and visual patterns, offering an engaging audiovisual experience that teaches both music theory and psychoacoustics.

- **Core Game Logic**: Written in Rust and compiled to WebAssembly
- **Frontend**: React TypeScript application with dynamic visualizations
- **Audio Engine**: Web Audio API with advanced modulation and resonance
- **Architecture**: WASM for performance-critical game logic, React for UI and audio processing

## Game Mechanics

The game combines musical theory, psychoacoustics, and visual feedback:

### Musical System
- Based on just intonation ratios (1/1, 16/15, 9/8, etc.)
- Notes create resonance patterns when activated together
- Harmonic relationships influence the game's state and audio

### Audio Features
- **Dynamic Modulation**: Four modulation types that respond to game state:
  - Frequency modulation during tension
  - Amplitude modulation during resolution
  - Ring modulation during transitions
  - Phase modulation for other states
- **Spinor Motion**: Creates rotating timbral effects based on:
  - Number of resonating pairs
  - Active note count
  - Current harmonic state
- **Rhythmic Elements**: Automatic gating synchronized with:
  - Game tempo
  - Resonance patterns
  - Visual animations
- **Audio Processing**:
  - Soft limiter for clean output (-6dB threshold, 4:1 ratio)
  - Dynamic envelope shaping
  - State-responsive release times

### Visual Elements
- **Interactive Note Buttons**: 
  - Unique shapes (circles, squares, rectangles, spinners)
  - Color-coded for easy identification
  - Position based on harmonic relationships
- **Dynamic Animations**:
  - Spinor-based rotation matching audio modulation
  - Pulsing effects synchronized with tempo
  - Connection lines showing resonance patterns
- **State Indicators**:
  - Harmonic state colors
  - Rhythmic pattern visualization
  - Resonance strength feedback

### Gameplay States
- **Harmonic States**:
  - Tension: Increased modulation, quick releases
  - Resolution: Smooth transitions, longer releases
  - Transition: Complex modulation, medium releases
  - Stasis: Stable patterns with standard timing
- **Rhythmic States**:
  - Pulse: Short, rhythmic gates (0.2s)
  - Flow: Medium gates with smooth transitions (0.4s)
  - Counterpoint: Extended gates for complexity (0.6s)
  - Chaos: Long gates with intricate patterns (0.8s)

## Prerequisites

- **Rust** 1.70+ with `wasm32-unknown-unknown` target
- **wasm-pack** for compiling Rust to WebAssembly
- **Node.js** 18+
- **npm** 7+

## Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/music-puzzle-game.git
   cd music-puzzle-game
   ```

2. Install root dependencies:

   ```bash
   npm install
   ```

3. Install web dependencies:

   ```bash
   cd puzzle-web
   npm install
   ```

4. Build the WASM module:

   ```bash
   npm run build:wasm
   ```

## Development Workflow

The project is split into two main parts:

### Rust Core (`puzzle-core/`)

Contains the game logic, implemented in Rust and compiled to WebAssembly:

1. Make changes to Rust code in `puzzle-core/src/`
2. Test your changes with `cargo test`
3. Build WASM with `npm run build:wasm` (from project root)

### Web Frontend (`puzzle-web/`)

React application that consumes the WASM module:

1. Make changes to TypeScript/React code in `puzzle-web/src/`
2. Test your changes with `npm test` (from `puzzle-web/` directory)
3. Run the development server with `npm run dev`

### Combined Development

For the best development experience, use:

```bash
npm run dev
```

This starts the Vite dev server and watches for Rust code changes, rebuilding the WASM module automatically.

## Project Structure

```
music-puzzle-game/
├── package.json         # Root package.json with scripts for the whole project
├── puzzle-core/         # Rust core library
│   ├── Cargo.toml       # Rust dependencies and configuration
│   ├── src/             # Rust source code
│   │   └── lib.rs       # Core game logic
│   └── tests/           # Integration tests
├── puzzle-web/          # Web frontend
│   ├── package.json     # Web dependencies and scripts
│   ├── src/             # React application source
│   │   ├── wasm/        # WASM bindings and interface
│   │   ├── App.tsx      # Main application component
│   │   └── ...          # Other React components
│   └── vite.config.ts   # Vite configuration
└── README.md            # This file
```

## Available Commands

All commands are run from the project root unless otherwise specified.

### Root Commands

- `npm run dev` - Start development server with WASM watch mode
- `npm run build` - Build both WASM and web app for production
- `npm run build:wasm` - Build only the WASM module
- `npm run build:wasm:watch` - Build WASM and watch for changes
- `npm run test` - Run all tests (Rust and React)
- `npm run test:rust` - Run only Rust tests
- `npm run lint` - Lint the web codebase
- `npm run fmt` - Format all code

### Web Commands (run from `puzzle-web/`)

- `npm run dev` - Start Vite development server
- `npm run build` - Build the web app for production
- `npm run test` - Run web tests
- `npm run test:watch` - Run web tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run typecheck` - Type-check TypeScript code

## License

MIT
