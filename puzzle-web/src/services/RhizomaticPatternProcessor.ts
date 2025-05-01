import { MultiModalProcessor } from './MultiModalProcessor';
import { PatternGenerator } from './PatternGenerator';

type PatternNode = {
  symbol: string;
  intensity: number;
  connections: Set<string>;
  memory: Map<string, number>;
  improvement: number;
};

type RhizomeState = {
  nodes: Map<string, PatternNode>;
  interference: Map<string, number>;
  memory: Map<string, number>;
  improvement: number;
};

export class RhizomaticPatternProcessor {
  private multiModalProcessor: MultiModalProcessor;
  private patternGenerator: PatternGenerator;
  private state: RhizomeState;
  private improvementCycles: number = 0;
  private readonly MAX_IMPROVEMENT_CYCLES = 1000;

  constructor(patternGenerator: PatternGenerator) {
    this.patternGenerator = patternGenerator;
    this.multiModalProcessor = new MultiModalProcessor(patternGenerator);
    this.state = this.initializeState();
  }

  private initializeState(): RhizomeState {
    return {
      nodes: new Map(),
      interference: new Map(),
      memory: new Map(),
      improvement: 0
    };
  }

  private createNode(symbol: string): PatternNode {
    return {
      symbol,
      intensity: 0,
      connections: new Set(),
      memory: new Map(),
      improvement: 0
    };
  }

  public processPattern(): void {
    const notes = this.patternGenerator.generateNotes();
    
    // Update nodes and create connections
    notes.forEach(note => {
      const nodeId = `${note.symbol}-${note.frequency}`;
      if (!this.state.nodes.has(nodeId)) {
        this.state.nodes.set(nodeId, this.createNode(note.symbol));
      }
      
      const node = this.state.nodes.get(nodeId)!;
      node.intensity = note.amplitude;
      
      // Create rhizomatic connections
      notes.forEach(otherNote => {
        if (note !== otherNote) {
          const otherId = `${otherNote.symbol}-${otherNote.frequency}`;
          node.connections.add(otherId);
          
          // Calculate interference
          const interference = this.calculateInterference(note, otherNote);
          this.state.interference.set(`${nodeId}-${otherId}`, interference);
        }
      });
    });

    // Update memory and improvement
    this.updateMemory();
    this.improvePattern();
  }

  private calculateInterference(note1: any, note2: any): number {
    const freqDiff = Math.abs(note1.frequency - note2.frequency);
    const ampDiff = Math.abs(note1.amplitude - note2.amplitude);
    return (freqDiff + ampDiff) / 2;
  }

  private updateMemory(): void {
    this.state.nodes.forEach((node, nodeId) => {
      // Update node memory based on connections
      node.connections.forEach(connectedId => {
        const interference = this.state.interference.get(`${nodeId}-${connectedId}`) || 0;
        const currentMemory = node.memory.get(connectedId) || 0;
        node.memory.set(connectedId, (currentMemory + interference) / 2);
      });

      // Update global memory
      const nodeMemory = Array.from(node.memory.values()).reduce((a, b) => a + b, 0) / node.memory.size;
      this.state.memory.set(nodeId, nodeMemory);
    });
  }

  private improvePattern(): void {
    if (this.improvementCycles >= this.MAX_IMPROVEMENT_CYCLES) {
      return;
    }

    let totalImprovement = 0;
    this.state.nodes.forEach((node, nodeId) => {
      // Calculate improvement based on memory and interference
      const memoryValue = this.state.memory.get(nodeId) || 0;
      const interferenceSum = Array.from(node.connections)
        .map(connectedId => this.state.interference.get(`${nodeId}-${connectedId}`) || 0)
        .reduce((a, b) => a + b, 0);
      
      const improvement = (memoryValue + interferenceSum) / 2;
      node.improvement = improvement;
      totalImprovement += improvement;
    });

    this.state.improvement = totalImprovement / this.state.nodes.size;
    this.improvementCycles++;
  }

  public getPatternState(): RhizomeState {
    return this.state;
  }

  public getImprovementMetrics(): { cycles: number; improvement: number } {
    return {
      cycles: this.improvementCycles,
      improvement: this.state.improvement
    };
  }

  public reset(): void {
    this.state = this.initializeState();
    this.improvementCycles = 0;
  }
} 