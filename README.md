# Music Puzzle Game 🎵🧩

An innovative musical puzzle game that combines emotion detection, pattern recognition, and adaptive learning to create a unique gaming experience. Built with Rust and WebAssembly for optimal performance.

## Features

### Implemented Features ✅

- Real-time emotion detection using webcam input
  - Dual implementation in JavaScript and Rust
  - Emotion history tracking and confidence scoring
  - Adaptive response based on emotional stability

- Adaptive difficulty based on player emotional state
  - Dynamic monster behavior adjustments
  - Emotional state affects monster aggression, speed, and health
  - Learning rate adaptation based on player engagement

- Pattern-based puzzle mechanics with musical resonance
  - Harmonic, rhythmic, and spatial pattern generation
  - Resonance relationships between notes
  - Dynamic pattern evolution and transformation

- Monster AI with learning capabilities
  - Strategy learning from player interactions
  - Pattern adaptation and evolution
  - Mini-history tracking for behavior analysis

- Sacred geometry visualizations
  - Vesica, triquetra, tetrahedron patterns
  - Pentagram, hexagram, and heptagram
  - Dynamic pattern visualization with resonance fields

### Planned Features 🚧

- GPU-accelerated emotion detection
- Multiplayer support
- Advanced pattern generation using LLMs
- Mobile support
- VR/AR integration

## Technical Stack

- **Frontend**: React, TypeScript, WebAssembly
- **Core Logic**: Rust
- **Package Manager**: Bun (for faster development and builds)
- **Audio Processing**: Web Audio API
- **Machine Learning**: ONNX Runtime, Custom Neural Networks
- **Emotion Detection**: Face-API.js (Rust port in progress)

## Development Setup

### Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [Bun](https://bun.sh/) (latest version)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/music-puzzle.git
   cd music-puzzle
   ```

2. Install dependencies:
   ```bash
   # Install root dependencies
   bun install
   
   # Install web dependencies
   cd puzzle-web
   bun install
   ```

3. Build the WASM module:
   ```bash
   wasm-pack build puzzle-core --target web --out-dir ../puzzle-web/src/wasm
   ```

### Development Commands

```bash
# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Type checking
bun run typecheck

# Linting
bun run lint

# Build the web app
bun run build
```

## Development Status

The project is currently in active development, with several exciting features planned:

### High Priority
- [ ] GPU-accelerated emotion detection
- [ ] Multiplayer support
- [ ] Advanced pattern generation using LLMs

### Medium Priority
- [ ] Mobile support
- [ ] VR/AR integration
- [ ] Distributed LLM integration

## Support the Project

Your support can help us accelerate development and unlock the full potential of this innovative game. Here's what we could achieve with additional resources:

### Hardware Scaling (10x)

- Real-time emotion detection for multiple players
- Advanced pattern generation using larger models
- Reduced latency for multiplayer interactions
- Enhanced visual effects and animations

### Collaboration Opportunities

- Partner with music education institutions
- Integrate with existing music learning platforms
- Develop specialized versions for different learning styles
- Create a community-driven pattern library

### Marketing & Growth

- Professional game trailer production
- Steam/Epic Games Store release
- Mobile app store optimization
- Community building and events

### Development Roadmap

- Enhanced AI for more dynamic gameplay
- Additional puzzle mechanics and game modes
- Cross-platform support
- Professional sound design and music composition

## Donation Options

### Cryptocurrency

- **Bitcoin (BTC)**: `bc1q...`
- **Ethereum (ETH)**: `0x...`
- **Solana (SOL)**: `...`

### Traditional Payment

- [PayPal](https://paypal.me/...)
- [GitHub Sponsors](https://github.com/sponsors/...)

### Corporate Sponsorship
For corporate sponsorships or partnerships, please contact us at [email protected]

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Face-API.js](https://github.com/justadudewhohacks/face-api.js) for emotion detection
- [ONNX Runtime](https://github.com/microsoft/onnxruntime) for model inference
- [Rust WebAssembly](https://rustwasm.github.io/) for performance optimization
- [Bun](https://bun.sh/) for fast JavaScript runtime and package management

---

*Your support helps us push the boundaries of what's possible in educational gaming. Together, we can create something truly extraordinary.*
