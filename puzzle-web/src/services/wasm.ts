import init, { PuzzleState, Game, Difficulty } from 'puzzle-core';

export class WasmService {
  private gameState: Game | null = null;
  private puzzleState: PuzzleState | null = null;
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      await init();
      this.initialized = true;
    }
  }

  async createGame(difficulty: Difficulty) {
    await this.initialize();
    this.gameState = new Game();
    this.gameState.set_difficulty(difficulty);
    this.puzzleState = new PuzzleState();
    this.puzzleState.set_difficulty(difficulty);
    return this.gameState;
  }

  getGameState(): Game | null {
    return this.gameState;
  }

  getPuzzleState(): PuzzleState | null {
    return this.puzzleState;
  }

  async makeMove(position: number): Promise<boolean> {
    if (!this.puzzleState) {
      throw new Error('Game not initialized');
    }
    const result = this.puzzleState.toggle(position);
    if (this.gameState) {
      this.gameState.make_move();
    }
    return result;
  }

  getStats() {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }
    return this.gameState.get_stats();
  }

  getPattern() {
    if (!this.puzzleState) {
      throw new Error('Game not initialized');
    }
    return {
      current: this.puzzleState.get_bits(),
      target: this.puzzleState.get_target()
    };
  }

  getDifficulty() {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }
    return this.gameState.get_difficulty();
  }
} 