import init, { GameState, Difficulty } from 'puzzle-core';

export class WasmService {
  private gameState: GameState | null = null;
  private initialized = false;

  async initialize() {
    if (!this.initialized) {
      await init();
      this.initialized = true;
    }
  }

  async createGame(difficulty: Difficulty) {
    await this.initialize();
    this.gameState = GameState.new(difficulty);
    return this.gameState;
  }

  getGameState(): GameState | null {
    return this.gameState;
  }

  async makeGuess(guess: number): Promise<boolean> {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }
    return this.gameState.make_guess(guess);
  }

  getStats() {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }
    return this.gameState.get_stats();
  }

  getPattern() {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }
    return this.gameState.get_pattern();
  }

  getDifficulty() {
    if (!this.gameState) {
      throw new Error('Game not initialized');
    }
    return this.gameState.get_difficulty();
  }
} 