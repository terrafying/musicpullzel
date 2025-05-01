# Harmonic Music Puzzle 🎵

Interactive musical puzzle combining spherical harmonics, real-time audio, and visual patterns.

## Quick Start

```bash
# Install dependencies
cargo install wasm-pack
rustup target add wasm32-unknown-unknown

# Build and run
cd puzzle-core && cargo build
cd ../puzzle-web && bun install && bun run dev
```

## Core Features

- **Spherical Grid**: Hexagonal grid mapped to spherical coordinates
- **Real-time Audio**: Web Audio API synthesis with harmonic relationships
- **Visual Feedback**: Dynamic patterns and helix visualization
- **Interactive**: Click hexagons to create harmonic patterns

## Project Structure

```
.
├── puzzle-core/     # Rust core
└── puzzle-web/      # React frontend
```

## Development

```bash
# Run tests
bun test

# Type check
bun run typecheck

# Build
bun run build
```

## License

MIT
