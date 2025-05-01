import { EmotionFeedback } from './emotionService';
import { EmergentPattern } from './patternDialogue';

interface GestaltObject {
  color: {
    hue: number;
    saturation: number;
    brightness: number;
    alpha: number;
  };
  shape: {
    type: 'circle' | 'square' | 'triangle' | 'wave' | 'spiral';
    size: number;
    rotation: number;
    complexity: number;
  };
  audio: {
    frequency: number;
    waveform: OscillatorType;
    modulation: number;
    resonance: number;
  };
  motion: {
    type: 'oscillate' | 'pulse' | 'spiral' | 'wave' | 'chaos';
    speed: number;
    amplitude: number;
    phase: number;
  };
  resonance: {
    emotional: number;
    musical: number;
    gestalt: number;
  };
}

interface GestaltMapping {
  emotional: Map<string, GestaltObject>;
  musical: Map<string, GestaltObject>;
  emergent: Map<string, GestaltObject>;
}

interface GestaltCache {
  key: string;
  timestamp: number;
  gestalt: GestaltObject;
}

export class GestaltMapper {
  private mappings: GestaltMapping;
  private context: AudioContext;
  private readonly BASE_FREQUENCY = 220; // A3
  private readonly GOLDEN_RATIO = 1.618033988749895;
  private readonly CACHE_TTL = 1000; // 1 second cache TTL
  private readonly MAX_CACHE_SIZE = 100;
  private cache: Map<string, GestaltCache> = new Map();
  private lastCacheCleanup = Date.now();
  
  constructor(audioContext: AudioContext) {
    this.context = audioContext;
    this.mappings = this.initializeMappings();
  }

  private initializeMappings(): GestaltMapping {
    return {
      emotional: this.createEmotionalMappings(),
      musical: this.createMusicalMappings(),
      emergent: this.createEmergentMappings()
    };
  }

  private createEmotionalMappings(): Map<string, GestaltObject> {
    const mappings = new Map<string, GestaltObject>();
    
    // Happy - Bright, circular, ascending
    mappings.set('happy', {
      color: { hue: 60, saturation: 0.8, brightness: 0.9, alpha: 0.8 },
      shape: { type: 'circle', size: 1.2, rotation: 0, complexity: 0.3 },
      audio: {
        frequency: this.BASE_FREQUENCY * 1.5,
        waveform: 'sine',
        modulation: 0.2,
        resonance: 0.7
      },
      motion: {
        type: 'oscillate',
        speed: 1.2,
        amplitude: 0.3,
        phase: 0
      },
      resonance: {
        emotional: 0.8,
        musical: 0.6,
        gestalt: 0.7
      }
    });

    // Sad - Blue, wave, descending
    mappings.set('sad', {
      color: { hue: 240, saturation: 0.7, brightness: 0.6, alpha: 0.7 },
      shape: { type: 'wave', size: 1.0, rotation: 0, complexity: 0.4 },
      audio: {
        frequency: this.BASE_FREQUENCY * 0.75,
        waveform: 'triangle',
        modulation: 0.1,
        resonance: 0.5
      },
      motion: {
        type: 'wave',
        speed: 0.8,
        amplitude: 0.4,
        phase: Math.PI
      },
      resonance: {
        emotional: 0.7,
        musical: 0.5,
        gestalt: 0.6
      }
    });

    // Angry - Red, sharp, pulsing
    mappings.set('angry', {
      color: { hue: 0, saturation: 0.9, brightness: 0.8, alpha: 0.9 },
      shape: { type: 'triangle', size: 1.1, rotation: 45, complexity: 0.6 },
      audio: {
        frequency: this.BASE_FREQUENCY * 2,
        waveform: 'square',
        modulation: 0.4,
        resonance: 0.8
      },
      motion: {
        type: 'pulse',
        speed: 1.5,
        amplitude: 0.5,
        phase: 0
      },
      resonance: {
        emotional: 0.9,
        musical: 0.7,
        gestalt: 0.8
      }
    });

    // Fearful - Purple, spiral, chaotic
    mappings.set('fearful', {
      color: { hue: 300, saturation: 0.8, brightness: 0.7, alpha: 0.8 },
      shape: { type: 'spiral', size: 1.3, rotation: 0, complexity: 0.8 },
      audio: {
        frequency: this.BASE_FREQUENCY * 1.25,
        waveform: 'sawtooth',
        modulation: 0.6,
        resonance: 0.6
      },
      motion: {
        type: 'chaos',
        speed: 1.8,
        amplitude: 0.6,
        phase: Math.PI / 2
      },
      resonance: {
        emotional: 0.8,
        musical: 0.6,
        gestalt: 0.7
      }
    });

    return mappings;
  }

  private createMusicalMappings(): Map<string, GestaltObject> {
    const mappings = new Map<string, GestaltObject>();
    
    // Harmonic - Golden ratio based
    mappings.set('harmonic', {
      color: { hue: 120, saturation: 0.7, brightness: 0.8, alpha: 0.8 },
      shape: { type: 'circle', size: this.GOLDEN_RATIO, rotation: 0, complexity: 0.4 },
      audio: {
        frequency: this.BASE_FREQUENCY * this.GOLDEN_RATIO,
        waveform: 'sine',
        modulation: 0.3,
        resonance: 0.7
      },
      motion: {
        type: 'spiral',
        speed: 1.0,
        amplitude: 0.3,
        phase: 0
      },
      resonance: {
        emotional: 0.6,
        musical: 0.9,
        gestalt: 0.7
      }
    });

    // Rhythmic - Square based
    mappings.set('rhythmic', {
      color: { hue: 180, saturation: 0.8, brightness: 0.7, alpha: 0.8 },
      shape: { type: 'square', size: 1.0, rotation: 0, complexity: 0.5 },
      audio: {
        frequency: this.BASE_FREQUENCY * 2,
        waveform: 'square',
        modulation: 0.5,
        resonance: 0.6
      },
      motion: {
        type: 'pulse',
        speed: 1.2,
        amplitude: 0.4,
        phase: 0
      },
      resonance: {
        emotional: 0.5,
        musical: 0.8,
        gestalt: 0.6
      }
    });

    return mappings;
  }

  private createEmergentMappings(): Map<string, GestaltObject> {
    const mappings = new Map<string, GestaltObject>();
    
    // Emergent - Complex, evolving
    mappings.set('emergent', {
      color: { hue: 280, saturation: 0.9, brightness: 0.8, alpha: 0.9 },
      shape: { type: 'spiral', size: 1.5, rotation: 0, complexity: 0.9 },
      audio: {
        frequency: this.BASE_FREQUENCY * 1.25,
        waveform: 'sawtooth',
        modulation: 0.7,
        resonance: 0.8
      },
      motion: {
        type: 'chaos',
        speed: 1.5,
        amplitude: 0.7,
        phase: Math.PI / 4
      },
      resonance: {
        emotional: 0.8,
        musical: 0.8,
        gestalt: 0.9
      }
    });

    return mappings;
  }

  private generateCacheKey(
    emotion: EmotionFeedback,
    pattern: EmergentPattern,
    resonance: number
  ): string {
    // Create a deterministic key based on the input parameters
    const emotionKey = `${emotion.dominantEmotion}-${emotion.intensity.toFixed(2)}-${emotion.confidence.toFixed(2)}`;
    const patternKey = `${pattern.type}-${pattern.strength.toFixed(2)}`;
    const resonanceKey = resonance.toFixed(2);
    
    return `${emotionKey}|${patternKey}|${resonanceKey}`;
  }

  private cleanupCache() {
    const now = Date.now();
    if (now - this.lastCacheCleanup < 5000) return; // Only cleanup every 5 seconds
    
    // Remove expired entries
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
    
    // If still too many entries, remove oldest
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
    
    this.lastCacheCleanup = now;
  }

  public mapToGestalt(
    emotion: EmotionFeedback,
    pattern: EmergentPattern,
    resonance: number
  ): GestaltObject {
    // Generate cache key
    const cacheKey = this.generateCacheKey(emotion, pattern, resonance);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.gestalt;
    }
    
    // Get base mappings
    const emotionalGestalt = this.mappings.emotional.get(emotion.dominantEmotion);
    const musicalGestalt = this.mappings.musical.get(pattern.type);
    const emergentGestalt = this.mappings.emergent.get('emergent');

    if (!emotionalGestalt || !musicalGestalt || !emergentGestalt) {
      throw new Error('Missing gestalt mapping');
    }

    // Calculate resonance weights
    const emotionalWeight = emotion.intensity * emotion.confidence;
    const musicalWeight = pattern.strength;
    const emergentWeight = resonance;

    // Normalize weights
    const totalWeight = emotionalWeight + musicalWeight + emergentWeight;
    const normalizedEmotional = emotionalWeight / totalWeight;
    const normalizedMusical = musicalWeight / totalWeight;
    const normalizedEmergent = emergentWeight / totalWeight;

    // Blend gestalt objects
    const gestalt = {
      color: this.blendColors(
        emotionalGestalt.color,
        musicalGestalt.color,
        emergentGestalt.color,
        normalizedEmotional,
        normalizedMusical,
        normalizedEmergent
      ),
      shape: this.blendShapes(
        emotionalGestalt.shape,
        musicalGestalt.shape,
        emergentGestalt.shape,
        normalizedEmotional,
        normalizedMusical,
        normalizedEmergent
      ),
      audio: this.blendAudio(
        emotionalGestalt.audio,
        musicalGestalt.audio,
        emergentGestalt.audio,
        normalizedEmotional,
        normalizedMusical,
        normalizedEmergent
      ),
      motion: this.blendMotion(
        emotionalGestalt.motion,
        musicalGestalt.motion,
        emergentGestalt.motion,
        normalizedEmotional,
        normalizedMusical,
        normalizedEmergent
      ),
      resonance: {
        emotional: emotionalWeight,
        musical: musicalWeight,
        gestalt: resonance
      }
    };

    // Cache the result
    this.cache.set(cacheKey, {
      key: cacheKey,
      timestamp: Date.now(),
      gestalt
    });

    // Cleanup cache if needed
    this.cleanupCache();

    return gestalt;
  }

  private blendColors(
    emotional: GestaltObject['color'],
    musical: GestaltObject['color'],
    emergent: GestaltObject['color'],
    emotionalWeight: number,
    musicalWeight: number,
    emergentWeight: number
  ): GestaltObject['color'] {
    return {
      hue: this.blendAngles(
        emotional.hue,
        musical.hue,
        emergent.hue,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      saturation: this.blendValues(
        emotional.saturation,
        musical.saturation,
        emergent.saturation,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      brightness: this.blendValues(
        emotional.brightness,
        musical.brightness,
        emergent.brightness,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      alpha: this.blendValues(
        emotional.alpha,
        musical.alpha,
        emergent.alpha,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      )
    };
  }

  private blendShapes(
    emotional: GestaltObject['shape'],
    musical: GestaltObject['shape'],
    emergent: GestaltObject['shape'],
    emotionalWeight: number,
    musicalWeight: number,
    emergentWeight: number
  ): GestaltObject['shape'] {
    // For shape type, we'll use the one with highest weight
    const weights = [emotionalWeight, musicalWeight, emergentWeight];
    const shapes = [emotional, musical, emergent];
    const maxIndex = weights.indexOf(Math.max(...weights));
    
    return {
      type: shapes[maxIndex].type,
      size: this.blendValues(
        emotional.size,
        musical.size,
        emergent.size,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      rotation: this.blendAngles(
        emotional.rotation,
        musical.rotation,
        emergent.rotation,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      complexity: this.blendValues(
        emotional.complexity,
        musical.complexity,
        emergent.complexity,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      )
    };
  }

  private blendAudio(
    emotional: GestaltObject['audio'],
    musical: GestaltObject['audio'],
    emergent: GestaltObject['audio'],
    emotionalWeight: number,
    musicalWeight: number,
    emergentWeight: number
  ): GestaltObject['audio'] {
    // For waveform, we'll use the one with highest weight
    const weights = [emotionalWeight, musicalWeight, emergentWeight];
    const audios = [emotional, musical, emergent];
    const maxIndex = weights.indexOf(Math.max(...weights));
    
    return {
      waveform: audios[maxIndex].waveform,
      frequency: this.blendValues(
        emotional.frequency,
        musical.frequency,
        emergent.frequency,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      modulation: this.blendValues(
        emotional.modulation,
        musical.modulation,
        emergent.modulation,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      resonance: this.blendValues(
        emotional.resonance,
        musical.resonance,
        emergent.resonance,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      )
    };
  }

  private blendMotion(
    emotional: GestaltObject['motion'],
    musical: GestaltObject['motion'],
    emergent: GestaltObject['motion'],
    emotionalWeight: number,
    musicalWeight: number,
    emergentWeight: number
  ): GestaltObject['motion'] {
    // For motion type, we'll use the one with highest weight
    const weights = [emotionalWeight, musicalWeight, emergentWeight];
    const motions = [emotional, musical, emergent];
    const maxIndex = weights.indexOf(Math.max(...weights));
    
    return {
      type: motions[maxIndex].type,
      speed: this.blendValues(
        emotional.speed,
        musical.speed,
        emergent.speed,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      amplitude: this.blendValues(
        emotional.amplitude,
        musical.amplitude,
        emergent.amplitude,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      phase: this.blendAngles(
        emotional.phase,
        musical.phase,
        emergent.phase,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      )
    };
  }

  private blendValues(
    emotional: number,
    musical: number,
    emergent: number,
    emotionalWeight: number,
    musicalWeight: number,
    emergentWeight: number
  ): number {
    return (
      emotional * emotionalWeight +
      musical * musicalWeight +
      emergent * emergentWeight
    );
  }

  private blendAngles(
    emotional: number,
    musical: number,
    emergent: number,
    emotionalWeight: number,
    musicalWeight: number,
    emergentWeight: number
  ): number {
    // Convert angles to complex numbers for proper blending
    const emotionalComplex = {
      real: Math.cos(emotional),
      imag: Math.sin(emotional)
    };
    const musicalComplex = {
      real: Math.cos(musical),
      imag: Math.sin(musical)
    };
    const emergentComplex = {
      real: Math.cos(emergent),
      imag: Math.sin(emergent)
    };

    // Blend complex numbers
    const blendedComplex = {
      real: this.blendValues(
        emotionalComplex.real,
        musicalComplex.real,
        emergentComplex.real,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      ),
      imag: this.blendValues(
        emotionalComplex.imag,
        musicalComplex.imag,
        emergentComplex.imag,
        emotionalWeight,
        musicalWeight,
        emergentWeight
      )
    };

    // Convert back to angle
    return Math.atan2(blendedComplex.imag, blendedComplex.real);
  }

  public clearCache(): void {
    this.cache.clear();
    this.lastCacheCleanup = Date.now();
  }

  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: this.cache.size / this.MAX_CACHE_SIZE
    };
  }
} 