import { Vector3, EmergentPattern as EmergentPatternType, Transformation } from './types';

interface ConnectomeNode {
  id: number;
  position: Vector3;
  resonance: number;
  connections: {
    target: number;
    strength: number;
    type: ResonanceType;
    semanticWeight: number;
    phase: number;
  }[];
  emergentProperties: {
    harmonicDensity: number;
    rhythmicComplexity: number;
    spatialCoherence: number;
    imaginaryPotential: number;
  };
}

type EmergentPattern = EmergentPatternType;

type ResonanceType = 'harmonic' | 'rhythmic' | 'spatial' | 'imaginary';

export interface AnalogicalMapping {
  source: number[];
  target: number[];
  similarity: number;
  transformation: {
    type: ResonanceType;
    strength: number;
  };
}

export class ConnectomeService {
  private nodes: Map<number, ConnectomeNode> = new Map();
  private patterns: EmergentPattern[] = [];
  private lastUpdate: number = Date.now();
  private imaginaryField: {
    center: Vector3;
    radius: number;
    intensity: number;
  } = {
    center: { x: 0, y: 0, z: 0 },
    radius: 1,
    intensity: 0
  };
  private patternHistory: EmergentPattern[] = [];
  private analogicalMappings: AnalogicalMapping[] = [];

  constructor() {
    this.initializeNodes();
  }

  private initializeNodes() {
    // Initialize nodes with positions based on sacred geometry
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const radius = 1;
      this.nodes.set(i, {
        id: i,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: 0
        },
        resonance: 0,
        connections: [],
        emergentProperties: {
          harmonicDensity: 0,
          rhythmicComplexity: 0,
          spatialCoherence: 0,
          imaginaryPotential: 0
        }
      });
    }
  }

  public updateResonance(activeNotes: number[]): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    // Update node resonances
    activeNotes.forEach(noteId => {
      const node = this.nodes.get(noteId);
      if (node) {
        node.resonance = Math.min(1, node.resonance + deltaTime * 0.5);
        this.updateConnections(node, activeNotes);
      }
    });

    // Decay inactive nodes
    this.nodes.forEach(node => {
      if (!activeNotes.includes(node.id)) {
        node.resonance = Math.max(0, node.resonance - deltaTime * 0.3);
      }
    });

    // Update emergent patterns
    this.updatePatterns(activeNotes);
    
    // Update imaginary field
    this.updateImaginaryField(activeNotes);
  }

  private updateConnections(node: ConnectomeNode, activeNotes: number[]): void {
    activeNotes.forEach(targetId => {
      if (targetId === node.id) return;

      const targetNode = this.nodes.get(targetId);
      if (!targetNode) return;

      const distance = this.calculateDistance(node.position, targetNode.position);
      const strength = this.calculateConnectionStrength(node, targetNode, distance);
      
      const existingConnection = node.connections.find(c => c.target === targetId);
      if (existingConnection) {
        existingConnection.strength = strength;
        existingConnection.phase += 0.1;
      } else {
        node.connections.push({
          target: targetId,
          strength,
          type: this.determineResonanceType(distance, 0),
          semanticWeight: 1,
          phase: 0
        });
      }
    });
  }

  private calculateDistance(pos1: Vector3, pos2: Vector3): number {
    return Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) +
      Math.pow(pos2.y - pos1.y, 2) +
      Math.pow(pos2.z - pos1.z, 2)
    );
  }

  private calculateConnectionStrength(node1: ConnectomeNode, node2: ConnectomeNode, distance: number): number {
    const baseStrength = (node1.resonance + node2.resonance) / 2;
    const distanceFactor = Math.max(0, 1 - distance / 2);
    return baseStrength * distanceFactor;
  }

  private determineResonanceType(distance: number, phaseDiff: number): ResonanceType {
    if (distance < 0.5) return 'harmonic';
    if (distance < 1.0) return 'rhythmic';
    if (phaseDiff > 0.7) return 'imaginary';
    return 'spatial';
  }

  private updatePatterns(activeNotes: number[]): void {
    // Detect new patterns
    const newPatterns = this.detectPatterns(activeNotes);
    
    // Update existing patterns
    this.patterns = this.patterns.filter(pattern => {
      if (pattern.evolution.death !== null) return false;
      
      const isStillActive = this.validatePattern(pattern, activeNotes);
      if (!isStillActive) {
        pattern.evolution.death = Date.now();
        return true;
      }
      
      this.evolvePattern(pattern, activeNotes);
      return true;
    });

    // Add new patterns
    this.patterns.push(...newPatterns);
  }

  private detectPatterns(activeNotes: number[]): EmergentPattern[] {
    const patterns: EmergentPattern[] = [];
    
    // Group notes into potential patterns
    const groups = this.findNoteGroups(activeNotes);
    
    // Find analogical mappings between groups
    this.findAnalogicalMappings(groups);
    
    groups.forEach(group => {
      if (group.length < 2) return;
      
      const pattern = this.createPattern(group);
      
      // Enhance pattern with analogical mappings
      const enhancedPattern = this.enhancePatternWithAnalogies(pattern);
      
      if (enhancedPattern.strength > 0.3) {
        patterns.push(enhancedPattern);
      }
    });
    
    // Update pattern history
    this.patternHistory = [...this.patternHistory, ...patterns].slice(-50);
    
    return patterns;
  }

  private findNoteGroups(activeNotes: number[]): number[][] {
    const groups: number[][] = [];
    const visited = new Set<number>();
    
    activeNotes.forEach(noteId => {
      if (visited.has(noteId)) return;
      
      const group: number[] = [noteId];
      visited.add(noteId);
      
      const node = this.nodes.get(noteId);
      if (!node) return;
      
      node.connections.forEach(conn => {
        if (activeNotes.includes(conn.target) && !visited.has(conn.target)) {
          group.push(conn.target);
          visited.add(conn.target);
        }
      });
      
      if (group.length > 1) {
        groups.push(group);
      }
    });
    
    return groups;
  }

  private createPattern(nodes: number[]): EmergentPattern {
    const now = Date.now();
    return {
      id: `pattern_${now}_${Math.random().toString(36).substr(2, 9)}`,
      nodes: nodes.map(String),
      patternType: this.determinePatternType(nodes),
      strength: this.calculatePatternStrength(nodes),
      stability: 1,
      rotation: 0,
      evolution: {
        birth: now,
        death: undefined,
        transitions: []
      },
      resonanceField: {
        center: this.calculatePatternCenter(nodes),
        radius: this.calculatePatternRadius(nodes),
        intensity: 1
      }
    };
  }

  private calculatePatternCenter(nodes: number[]): Vector3 {
    const positions = nodes.map(id => this.nodes.get(Number(id))?.position).filter(Boolean) as Vector3[];
    return {
      x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
      y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length,
      z: positions.reduce((sum, pos) => sum + pos.z, 0) / positions.length
    };
  }

  private calculatePatternStrength(nodes: number[]): number {
    return nodes.reduce((sum, id) => {
      const node = this.nodes.get(Number(id));
      return sum + (node?.resonance || 0);
    }, 0) / nodes.length;
  }

  private determinePatternType(nodes: number[]): EmergentPattern['patternType'] {
    const imaginaryCount = nodes.filter(id => {
      const node = this.nodes.get(Number(id));
      return node?.connections.some(c => c.type === 'imaginary');
    }).length;
    
    if (imaginaryCount > nodes.length / 2) return 'imaginary';
    
    const harmonicCount = nodes.filter(id => {
      const node = this.nodes.get(Number(id));
      return node?.connections.some(c => c.type === 'harmonic');
    }).length;
    
    if (harmonicCount > nodes.length / 2) return 'harmonic';
    
    return Math.random() < 0.5 ? 'rhythmic' : 'spatial';
  }

  private calculatePatternRadius(nodes: number[]): number {
    const center = this.calculatePatternCenter(nodes);
    return Math.max(...nodes.map(id => {
      const node = this.nodes.get(Number(id));
      return node ? this.calculateDistance(center, node.position) : 0;
    }));
  }

  private validatePattern(pattern: EmergentPattern, activeNotes: number[]): boolean {
    return pattern.nodes.every(nodeId => activeNotes.includes(Number(nodeId)));
  }

  private evolvePattern(pattern: EmergentPattern, activeNotes: number[]): void {
    const now = Date.now();
    const age = (now - pattern.evolution.birth) / 1000;
    
    // Add transformation based on pattern evolution
    if (Math.random() < 0.1) {
      pattern.evolution.transitions.push({
        type: pattern.patternType,
        strength: pattern.strength,
        timestamp: now
      });
    }
    
    // Update pattern properties
    pattern.strength = this.calculatePatternStrength(pattern.nodes.map(Number));
    pattern.stability = Math.max(0, pattern.stability - age * 0.001);
    
    // Update resonance field
    pattern.resonanceField.intensity = pattern.strength * pattern.stability;
  }

  private updateImaginaryField(activeNotes: number[]): void {
    const imaginaryNodes = activeNotes.filter(id => {
      const node = this.nodes.get(Number(id));
      return node?.connections.some(c => c.type === 'imaginary');
    });
    
    if (imaginaryNodes.length > 0) {
      const center = this.calculatePatternCenter(imaginaryNodes);
      this.imaginaryField = {
        center,
        radius: this.calculatePatternRadius(imaginaryNodes) * 1.5,
        intensity: imaginaryNodes.length / 12
      };
    } else {
      this.imaginaryField.intensity = Math.max(0, this.imaginaryField.intensity - 0.01);
    }
  }

  public getActivePatterns(): EmergentPattern[] {
    return this.patterns.filter(p => !p.evolution.death);
  }

  public getImaginaryField(): typeof this.imaginaryField {
    return { ...this.imaginaryField };
  }

  private getNodeConnections(nodeId: number): ConnectomeNode['connections'] {
    return this.nodes.get(nodeId)?.connections || [];
  }

  private findAnalogicalMappings(groups: number[][]): void {
    this.analogicalMappings = [];
    
    for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        const source = groups[i];
        const target = groups[j];
        
        const mapping = this.createAnalogicalMapping(source, target);
        if (mapping.similarity > 0.6) {
          this.analogicalMappings.push(mapping);
        }
      }
    }
  }

  private createAnalogicalMapping(source: number[], target: number[]): AnalogicalMapping {
    // Calculate structural similarity
    const sourceStructure = this.calculateGroupStructure(source);
    const targetStructure = this.calculateGroupStructure(target);
    const structuralSimilarity = this.calculateStructuralSimilarity(sourceStructure, targetStructure);
    
    // Calculate resonance similarity
    const sourceResonance = this.calculateGroupResonance(source);
    const targetResonance = this.calculateGroupResonance(target);
    const resonanceSimilarity = this.calculateResonanceSimilarity(sourceResonance, targetResonance);
    
    // Calculate spatial similarity
    const sourceSpatial = this.calculateGroupSpatial(source);
    const targetSpatial = this.calculateGroupSpatial(target);
    const spatialSimilarity = this.calculateSpatialSimilarity(sourceSpatial, targetSpatial);
    
    // Combine similarities
    const similarity = (structuralSimilarity + resonanceSimilarity + spatialSimilarity) / 3;
    
    // Determine transformation type based on dominant similarity
    const transformation = this.determineTransformationType(
      structuralSimilarity,
      resonanceSimilarity,
      spatialSimilarity
    );
    
    return {
      source,
      target,
      similarity,
      transformation
    };
  }

  private calculateGroupStructure(group: number[]): number[] {
    return group.map(id => {
      const node = this.nodes.get(Number(id));
      return node ? node.connections.length : 0;
    });
  }

  private calculateGroupResonance(group: number[]): number[] {
    return group.map(id => {
      const node = this.nodes.get(Number(id));
      return node ? node.resonance : 0;
    });
  }

  private calculateGroupSpatial(group: number[]): Vector3[] {
    return group.map(id => {
      const node = this.nodes.get(Number(id));
      return node ? node.position : { x: 0, y: 0, z: 0 };
    });
  }

  private calculateStructuralSimilarity(source: number[], target: number[]): number {
    if (source.length !== target.length) return 0;
    
    const sourceSum = source.reduce((a, b) => a + b, 0);
    const targetSum = target.reduce((a, b) => a + b, 0);
    
    if (sourceSum === 0 || targetSum === 0) return 0;
    
    const normalizedSource = source.map(v => v / sourceSum);
    const normalizedTarget = target.map(v => v / targetSum);
    
    return 1 - normalizedSource.reduce((sum, v, i) => sum + Math.abs(v - normalizedTarget[i]), 0) / 2;
  }

  private calculateResonanceSimilarity(source: number[], target: number[]): number {
    if (source.length !== target.length) return 0;
    
    const maxResonance = Math.max(...source, ...target);
    if (maxResonance === 0) return 0;
    
    const normalizedSource = source.map(v => v / maxResonance);
    const normalizedTarget = target.map(v => v / maxResonance);
    
    return 1 - normalizedSource.reduce((sum, v, i) => sum + Math.abs(v - normalizedTarget[i]), 0) / 2;
  }

  private calculateSpatialSimilarity(source: Vector3[], target: Vector3[]): number {
    if (source.length !== target.length) return 0;
    
    const maxDistance = Math.max(...source.map((s, i) => 
      this.calculateDistance(s, target[i])
    ));
    
    if (maxDistance === 0) return 1;
    
    const distances = source.map((s, i) => 
      this.calculateDistance(s, target[i]) / maxDistance
    );
    
    return 1 - distances.reduce((sum, d) => sum + d, 0) / distances.length;
  }

  private determineTransformationType(
    structural: number,
    resonance: number,
    spatial: number
  ): AnalogicalMapping['transformation'] {
    const maxSimilarity = Math.max(structural, resonance, spatial);
    
    if (maxSimilarity === structural) {
      return { type: 'harmonic', strength: structural };
    } else if (maxSimilarity === resonance) {
      return { type: 'rhythmic', strength: resonance };
    } else {
      return { type: 'spatial', strength: spatial };
    }
  }

  private enhancePatternWithAnalogies(pattern: EmergentPattern): EmergentPattern {
    const relevantMappings = this.analogicalMappings.filter(mapping =>
      mapping.source.some(id => pattern.nodes.includes(String(id))) ||
      mapping.target.some(id => pattern.nodes.includes(String(id)))
    );
    
    if (relevantMappings.length === 0) return pattern;
    
    // Calculate enhanced strength based on analogical mappings
    const mappingStrength = relevantMappings.reduce((sum, mapping) => 
      sum + mapping.similarity * mapping.transformation.strength, 0
    ) / relevantMappings.length;
    
    // Enhance pattern properties
    return {
      ...pattern,
      strength: Math.min(1, pattern.strength * (1 + mappingStrength)),
      stability: Math.min(1, pattern.stability * (1 + mappingStrength * 0.5)),
      resonanceField: {
        ...pattern.resonanceField,
        intensity: pattern.resonanceField.intensity * (1 + mappingStrength)
      }
    };
  }

  public getAnalogicalMappings(): AnalogicalMapping[] {
    return [...this.analogicalMappings];
  }

  public getPatternHistory(): EmergentPattern[] {
    return [...this.patternHistory];
  }

  public predictPatternEvolution(steps: number = 3): Array<{
    center: Vector3;
    radius: number;
    type: EmergentPattern['patternType'];
    probability: number;
  }> {
    const recentPatterns = this.patternHistory.slice(-5);
    if (recentPatterns.length < 2) return [];

    // Calculate pattern movement dynamics
    const velocities = this.calculatePatternVelocities(recentPatterns);
    const accelerations = this.calculatePatternAccelerations(velocities);
    
    // Calculate pattern type transitions
    const typeTransitions = this.calculateTypeTransitions(recentPatterns);
    
    // Generate predictions
    const predictions: Array<{
      center: Vector3;
      radius: number;
      type: EmergentPattern['patternType'];
      probability: number;
    }> = [];

    const lastPattern = recentPatterns[recentPatterns.length - 1];
    const lastVelocity = velocities[velocities.length - 1];
    const lastAcceleration = accelerations[accelerations.length - 1];

    for (let i = 0; i < steps; i++) {
      const timeStep = i + 1;
      const predictedCenter = {
        x: lastPattern.resonanceField.center.x + lastVelocity.x * timeStep + 0.5 * lastAcceleration.x * timeStep * timeStep,
        y: lastPattern.resonanceField.center.y + lastVelocity.y * timeStep + 0.5 * lastAcceleration.y * timeStep * timeStep,
        z: lastPattern.resonanceField.center.z
      };

      // Calculate probability based on historical transitions
      const typeProbability = this.calculateTypeProbability(lastPattern.patternType, typeTransitions);
      
      predictions.push({
        center: predictedCenter,
        radius: lastPattern.resonanceField.radius * (1 + i * 0.1),
        type: lastPattern.patternType,
        probability: typeProbability
      });
    }

    return predictions;
  }

  private calculatePatternVelocities(patterns: EmergentPattern[]): Array<{ x: number; y: number }> {
    return patterns.slice(1).map((p, i) => ({
      x: p.resonanceField.center.x - patterns[i].resonanceField.center.x,
      y: p.resonanceField.center.y - patterns[i].resonanceField.center.y
    }));
  }

  private calculatePatternAccelerations(velocities: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
    return velocities.slice(1).map((v, i) => ({
      x: v.x - velocities[i].x,
      y: v.y - velocities[i].y
    }));
  }

  private calculateTypeTransitions(patterns: EmergentPattern[]): Map<string, number> {
    const transitions = new Map<string, number>();
    
    patterns.slice(1).forEach((pattern, i) => {
      const prevType = patterns[i].patternType;
      const currentType = pattern.patternType;
      const key = `${prevType}->${currentType}`;
      transitions.set(key, (transitions.get(key) || 0) + 1);
    });

    return transitions;
  }

  private calculateTypeProbability(currentType: EmergentPattern['patternType'], transitions: Map<string, number>): number {
    let totalTransitions = 0;
    let typeTransitions = 0;

    transitions.forEach((count, key) => {
      const [fromType] = key.split('->');
      if (fromType === currentType) {
        typeTransitions += count;
      }
      totalTransitions += count;
    });

    return totalTransitions > 0 ? typeTransitions / totalTransitions : 0.5;
  }
} 