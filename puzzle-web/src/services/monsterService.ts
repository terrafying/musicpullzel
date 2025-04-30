import { EmergentPattern } from './types';

interface Strategy {
  patternType: string;
  effectiveness: number;
  lastUsed: number;
  successCount: number;
  miniHistory: {
    timestamp: number;
    success: boolean;
    damage: number;
  }[];
}

interface PlayerResponse {
  patternType: string;
  timestamp: number;
  success: boolean;
  damage: number;
}

interface MonsterScore {
  totalDamage: number;
  patternsDefeated: number;
  adaptations: number;
  learningEfficiency: number;
}

export interface Monster {
  id: number;
  type: 'harmonic' | 'rhythmic' | 'chaotic';
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  strength: number;
  pattern: EmergentPattern;
  state: 'idle' | 'attacking' | 'defending' | 'defeated';
  lastAttack: number;
  attackCooldown: number;
  weakness: string[];
  resistance: string[];
  strategies: Strategy[];
  learningRate: number;
  adaptationThreshold: number;
  score: MonsterScore;
  miniHistory: {
    timestamp: number;
    event: 'spawn' | 'adapt' | 'attack' | 'defeat';
    details: any;
  }[];
}

export class MonsterService {
  private monsters: Map<number, Monster> = new Map();
  private nextId: number = 0;
  private spawnInterval: number | null = null;
  private readonly SPAWN_INTERVAL = 10000; // 10 seconds
  private readonly MAX_MONSTERS = 5;
  private playerResponses: PlayerResponse[] = [];
  private readonly MAX_RESPONSE_HISTORY = 50;
  private readonly LEARNING_RATE = 0.1;
  private readonly ADAPTATION_THRESHOLD = 0.7;
  private readonly MINI_HISTORY_SIZE = 10;
  private readonly SCORE_MULTIPLIER = 100;

  constructor() {
    this.startSpawning();
  }

  private startSpawning() {
    this.spawnInterval = window.setInterval(() => {
      if (this.monsters.size < this.MAX_MONSTERS) {
        this.spawnMonster();
      }
    }, this.SPAWN_INTERVAL);
  }

  private spawnMonster() {
    const types: Monster['type'][] = ['harmonic', 'rhythmic', 'chaotic'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const monster: Monster = {
      id: this.nextId++,
      type,
      position: {
        x: Math.random() * 800,
        y: Math.random() * 600
      },
      health: 100,
      maxHealth: 100,
      strength: Math.random() * 0.5 + 0.5,
      pattern: this.generateMonsterPattern(type),
      state: 'idle',
      lastAttack: 0,
      attackCooldown: 2000,
      weakness: this.getWeaknesses(type),
      resistance: this.getResistances(type),
      strategies: this.initializeStrategies(),
      learningRate: this.LEARNING_RATE,
      adaptationThreshold: this.ADAPTATION_THRESHOLD,
      score: {
        totalDamage: 0,
        patternsDefeated: 0,
        adaptations: 0,
        learningEfficiency: 0
      },
      miniHistory: [{
        timestamp: Date.now(),
        event: 'spawn',
        details: { type, position: { x: Math.random() * 800, y: Math.random() * 600 } }
      }]
    };

    this.monsters.set(monster.id, monster);
    return monster;
  }

  private initializeStrategies(): Strategy[] {
    return [
      { 
        patternType: 'harmonic', 
        effectiveness: 0.5, 
        lastUsed: 0, 
        successCount: 0,
        miniHistory: []
      },
      { 
        patternType: 'rhythmic', 
        effectiveness: 0.5, 
        lastUsed: 0, 
        successCount: 0,
        miniHistory: []
      },
      { 
        patternType: 'chaotic', 
        effectiveness: 0.5, 
        lastUsed: 0, 
        successCount: 0,
        miniHistory: []
      }
    ];
  }

  public recordPlayerResponse(patternType: string, success: boolean, damage: number = 0) {
    this.playerResponses.push({
      patternType,
      timestamp: Date.now(),
      success,
      damage
    });

    if (this.playerResponses.length > this.MAX_RESPONSE_HISTORY) {
      this.playerResponses.shift();
    }

    this.updateMonsterStrategies();
  }

  private updateMonsterStrategies() {
    this.monsters.forEach(monster => {
      const recentResponses = this.playerResponses.filter(
        r => Date.now() - r.timestamp < 30000
      );

      monster.strategies.forEach(strategy => {
        const relevantResponses = recentResponses.filter(
          r => r.patternType === strategy.patternType
        );

        if (relevantResponses.length > 0) {
          const successRate = relevantResponses.filter(r => r.success).length / relevantResponses.length;
          const avgDamage = relevantResponses.reduce((sum, r) => sum + r.damage, 0) / relevantResponses.length;
          
          strategy.effectiveness = strategy.effectiveness * (1 - monster.learningRate) + 
                                 successRate * monster.learningRate;

          // Update strategy mini-history
          strategy.miniHistory.push({
            timestamp: Date.now(),
            success: successRate > 0.5,
            damage: avgDamage
          });

          if (strategy.miniHistory.length > this.MINI_HISTORY_SIZE) {
            strategy.miniHistory.shift();
          }
        }
      });

      // Calculate learning efficiency
      const recentAdaptations = monster.miniHistory.filter(
        h => h.event === 'adapt' && Date.now() - h.timestamp < 60000
      ).length;

      const strategyImprovements = monster.strategies.reduce((sum, s) => {
        if (s.miniHistory.length < 2) return sum;
        const recent = s.miniHistory[s.miniHistory.length - 1];
        const previous = s.miniHistory[s.miniHistory.length - 2];
        return sum + (recent.effectiveness - previous.effectiveness);
      }, 0);

      monster.score.learningEfficiency = (strategyImprovements / monster.strategies.length) * 
                                       (1 + recentAdaptations * 0.2);

      const averageEffectiveness = monster.strategies.reduce(
        (sum, s) => sum + s.effectiveness, 0
      ) / monster.strategies.length;

      if (averageEffectiveness < monster.adaptationThreshold) {
        this.adaptMonsterType(monster);
      }
    });
  }

  private adaptMonsterType(monster: Monster) {
    const bestStrategy = monster.strategies.reduce(
      (best, current) => current.effectiveness > best.effectiveness ? current : best
    );

    const newType = bestStrategy.patternType as Monster['type'];
    if (newType !== monster.type) {
      monster.type = newType;
      monster.pattern = this.generateMonsterPattern(newType);
      monster.weakness = this.getWeaknesses(newType);
      monster.resistance = this.getResistances(newType);
      
      monster.strategies = this.initializeStrategies();
      monster.strategies.find(s => s.patternType === newType)!.effectiveness = 0.8;

      // Record adaptation in mini-history
      monster.miniHistory.push({
        timestamp: Date.now(),
        event: 'adapt',
        details: { 
          fromType: monster.type,
          toType: newType,
          reason: 'strategy effectiveness'
        }
      });

      if (monster.miniHistory.length > this.MINI_HISTORY_SIZE) {
        monster.miniHistory.shift();
      }

      monster.score.adaptations++;
    }
  }

  private generateMonsterPattern(type: Monster['type']): EmergentPattern {
    const basePattern: EmergentPattern = {
      type: type === 'chaotic' ? 'emergent' : type,
      strength: Math.random() * 0.5 + 0.5,
      position: { x: 0, y: 0 },
      connections: [],
      evolution: 0,
      resonance: 0,
      rotation: Math.random() * Math.PI * 2
    };

    // Add connections based on learned strategies
    const monster = Array.from(this.monsters.values()).find(m => m.type === type);
    if (monster) {
      const effectiveStrategies = monster.strategies.filter(s => s.effectiveness > 0.6);
      const numConnections = Math.min(effectiveStrategies.length + 1, 3);
      
      for (let i = 0; i < numConnections; i++) {
        basePattern.connections.push({
          from: i,
          to: (i + 1) % numConnections,
          strength: 0.5 + Math.random() * 0.5
        });
      }
    } else {
      // Default pattern if no monster of this type exists
      const numConnections = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numConnections; i++) {
        basePattern.connections.push({
          from: i,
          to: (i + 1) % numConnections,
          strength: Math.random() * 0.5 + 0.5
        });
      }
    }

    return basePattern;
  }

  private getWeaknesses(type: Monster['type']): string[] {
    switch (type) {
      case 'harmonic':
        return ['rhythmic', 'chaotic'];
      case 'rhythmic':
        return ['harmonic', 'chaotic'];
      case 'chaotic':
        return ['harmonic', 'rhythmic'];
      default:
        return [];
    }
  }

  private getResistances(type: Monster['type']): string[] {
    switch (type) {
      case 'harmonic':
        return ['harmonic'];
      case 'rhythmic':
        return ['rhythmic'];
      case 'chaotic':
        return ['chaotic'];
      default:
        return [];
    }
  }

  public getMonsters(): Monster[] {
    return Array.from(this.monsters.values());
  }

  public updateMonster(monsterId: number, updates: Partial<Monster>) {
    const monster = this.monsters.get(monsterId);
    if (monster) {
      this.monsters.set(monsterId, { ...monster, ...updates });
    }
  }

  public attackMonster(monsterId: number, pattern: EmergentPattern): boolean {
    const monster = this.monsters.get(monsterId);
    if (!monster || monster.state === 'defeated') return false;

    const isWeakness = monster.weakness.includes(pattern.type);
    const isResistant = monster.resistance.includes(pattern.type);
    
    let damage = pattern.strength * 20;
    if (isWeakness) damage *= 2;
    if (isResistant) damage *= 0.5;

    monster.health = Math.max(0, monster.health - damage);
    monster.score.totalDamage += damage;

    // Record attack in mini-history
    monster.miniHistory.push({
      timestamp: Date.now(),
      event: 'attack',
      details: {
        patternType: pattern.type,
        damage,
        isWeakness,
        isResistant
      }
    });

    if (monster.miniHistory.length > this.MINI_HISTORY_SIZE) {
      monster.miniHistory.shift();
    }
    
    if (monster.health <= 0) {
      monster.state = 'defeated';
      monster.score.patternsDefeated++;
      
      // Record defeat in mini-history
      monster.miniHistory.push({
        timestamp: Date.now(),
        event: 'defeat',
        details: {
          finalPattern: pattern.type,
          totalDamage: monster.score.totalDamage,
          adaptations: monster.score.adaptations
        }
      });

      this.monsters.delete(monsterId);
      return true;
    }

    const strategy = monster.strategies.find(s => s.patternType === pattern.type);
    if (strategy) {
      strategy.lastUsed = Date.now();
      strategy.successCount++;
      strategy.effectiveness = Math.min(1, strategy.effectiveness + 0.1);
    }

    return false;
  }

  public updateMonsterPositions(patterns: EmergentPattern[]) {
    this.monsters.forEach(monster => {
      if (monster.state === 'defeated') return;

      // Find the strongest pattern that matches the monster's effective strategies
      const effectiveStrategies = monster.strategies.filter(s => s.effectiveness > 0.6);
      const targetPattern = patterns.reduce((strongest, current) => {
        const isEffectiveStrategy = effectiveStrategies.some(s => s.patternType === current.type);
        return (isEffectiveStrategy && current.strength > strongest.strength) ? current : strongest;
      });

      const dx = targetPattern.position.x - monster.position.x;
      const dy = targetPattern.position.y - monster.position.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 0) {
        const speed = 2;
        monster.position.x += (dx / distance) * speed;
        monster.position.y += (dy / distance) * speed;
      }

      // Update monster pattern based on learned strategies
      monster.pattern = this.generateMonsterPattern(monster.type);
    });
  }

  public cleanup() {
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
    }
    this.monsters.clear();
    this.playerResponses = [];
  }

  public getMonsterScore(monsterId: number): MonsterScore | null {
    const monster = this.monsters.get(monsterId);
    return monster ? monster.score : null;
  }

  public getMonsterHistory(monsterId: number) {
    const monster = this.monsters.get(monsterId);
    return monster ? monster.miniHistory : [];
  }
} 