import React, { useState, useEffect } from 'react'
import { AudioService } from './services/audio'
import { PuzzleService, ResonancePattern } from './services/puzzle'
import { Logger } from './services/logger'
import { DebugPanel } from './components/DebugPanel'
import ConnectionLines from './components/ConnectionLines'
import AudioVisualizer from './components/AudioVisualizer'
import { SpatialControls } from './components/SpatialControls'
import { ConnectomeService } from './services/connectome'
import PatternVisualizer from './components/PatternVisualizer'
import AnalogicalVisualizer from './components/AnalogicalVisualizer'
import PatternExplorer from './components/PatternExplorer'
import { SharedStateService } from './services/sharedState'
import { WasmService } from './services/wasm'
import { Difficulty } from 'puzzle-core'
import { PatternSynthService } from './services/patternSynth'
import { PatternDialogueService } from './services/patternDialogue'
import { InteractiveCanvas } from './components/InteractiveCanvas'
import { MonsterService } from './services/monsterService'
import { MonsterRenderer } from './components/MonsterRenderer'
import { ProgressVisualizer } from './components/ProgressVisualizer'
import { EmotionService } from './services/emotionService'
import { EmotionFeedback } from './components/EmotionFeedback'
import { RustEmotionService } from './services/rustEmotionService'
import './App.css'

// Type definitions
type NoteVisual = {
  color: string;
  shape: 'circle' | 'square' | 'rectangle' | 'spinner';
  ratio: number;
  name: string;
  x: number;
  y: number;
  waveform: OscillatorType;
  isRhythmic: boolean;
};

// Base frequency (A4 = 440Hz)
const BASE_FREQUENCY = 440;

// Note visuals configuration using just intonation ratios
const noteVisuals: NoteVisual[] = [
  { color: '#FF0000', shape: 'circle', ratio: 1/1, name: '1/1', x: 350, y: 0, waveform: 'sine', isRhythmic: false },          // Unison
  { color: '#FF7F00', shape: 'square', ratio: 16/15, name: '16/15', x: 247.5, y: -247.5, waveform: 'square', isRhythmic: false }, // Minor second
  { color: '#FFFF00', shape: 'rectangle', ratio: 9/8, name: '9/8', x: 0, y: -350, waveform: 'sawtooth', isRhythmic: true },    // Major second
  { color: '#00FF00', shape: 'spinner', ratio: 6/5, name: '6/5', x: -247.5, y: -247.5, waveform: 'triangle', isRhythmic: true }, // Minor third
  { color: '#0000FF', shape: 'circle', ratio: 5/4, name: '5/4', x: -350, y: 0, waveform: 'sine', isRhythmic: false },         // Major third
  { color: '#4B0082', shape: 'square', ratio: 4/3, name: '4/3', x: -247.5, y: 247.5, waveform: 'square', isRhythmic: false },  // Perfect fourth
  { color: '#8F00FF', shape: 'rectangle', ratio: 3/2, name: '3/2', x: 0, y: 350, waveform: 'sawtooth', isRhythmic: true },     // Perfect fifth
  { color: '#FF1493', shape: 'spinner', ratio: 8/5, name: '8/5', x: 247.5, y: 247.5, waveform: 'triangle', isRhythmic: true },  // Minor sixth
  { color: '#00CED1', shape: 'circle', ratio: 5/3, name: '5/3', x: 175, y: -87.5, waveform: 'sine', isRhythmic: false },      // Major sixth
  { color: '#FF69B4', shape: 'square', ratio: 16/9, name: '16/9', x: -175, y: -87.5, waveform: 'square', isRhythmic: false }, // Minor seventh
  { color: '#32CD32', shape: 'rectangle', ratio: 15/8, name: '15/8', x: -175, y: 87.5, waveform: 'sawtooth', isRhythmic: true }, // Major seventh
  { color: '#FFD700', shape: 'spinner', ratio: 2/1, name: '2/1', x: 175, y: 87.5, waveform: 'triangle', isRhythmic: true },    // Octave
];

// Helper functions to convert between note names and indices
const noteToIndex = (note: string): number => {
  const idx = noteVisuals.findIndex(n => n.name === note);
  return idx >= 0 ? idx : 0;
};

const indexToNote = (index: number): string => {
  return noteVisuals[index]?.name || '1/1';
};

// Helper function to calculate frequency from ratio
const ratioToFrequency = (ratio: number): number => {
  return BASE_FREQUENCY * ratio;
};

// Sacred geometry patterns
const SACRED_PATTERNS = {
  vesica: {
    points: 2,
    radius: 1.0,
    rotation: Math.PI / 2
  },
  triquetra: {
    points: 3,
    radius: 1.2,
    rotation: 0
  },
  tetrahedron: {
    points: 4,
    radius: 1.4,
    rotation: Math.PI / 4
  },
  pentagram: {
    points: 5,
    radius: 1.6,
    rotation: -Math.PI / 2
  },
  hexagram: {
    points: 6,
    radius: 1.8,
    rotation: 0
  },
  heptagram: {
    points: 7,
    radius: 2.0,
    rotation: Math.PI / 7
  }
} as const;

function App() {
  const [audioService] = useState(() => new AudioService());
  const [puzzleService] = useState(() => new PuzzleService());
  const [connectomeService] = useState(() => new ConnectomeService());
  const [sharedStateService] = useState(() => new SharedStateService());
  const [activeNotes, setActiveNotes] = useState<number[]>([]);
  const [resonancePattern, setResonancePattern] = useState<ResonancePattern | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const [tempo] = useState(120);
  const logger = Logger.getInstance();
  const [totalResonance, setTotalResonance] = useState(0);
  const [resonatingPairs, setResonatingPairs] = useState<[number, number, number][]>([]);
  const [pathways, setPathways] = useState<Array<{
    notes: number[];
    strength: number;
    type: 'harmonic' | 'subharmonic' | 'overtone' | 'interference';
  }>>([]);
  const [semanticState, setSemanticState] = useState<{
    harmonic: string;
    rhythmic: string;
    types: string[];
  }>({
    harmonic: 'stasis',
    rhythmic: 'pulse',
    types: []
  });
  const [spinorStates, setSpinorStates] = useState<Map<number, {
    rate: number,
    phase: number,
    startTime: number
  }>>(new Map());
  const [delayEchoes, setDelayEchoes] = useState<Map<number, {
    positions: { x: number; y: number }[];
    opacity: number;
  }>>(new Map());
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [wasmService] = useState(() => new WasmService());
  const [gameStarted, setGameStarted] = useState(false);
  const [patternSynth] = useState(() => new PatternSynthService(audioService));
  const [feedbackLevel, setFeedbackLevel] = useState(0.3);
  const [patternMixLevel, setPatternMixLevel] = useState(0.5);
  const [patternDialogue] = useState(() => new PatternDialogueService(patternSynth));
  const [dialogueMode, setDialogueMode] = useState<'user' | 'system' | 'balanced'>('balanced');
  const [patterns, setPatterns] = useState<ResonancePattern[]>([]);
  const [monsterService] = useState(() => new MonsterService());
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [selectedMonster, setSelectedMonster] = useState<number | null>(null);
  const [totalPatterns] = useState(100); // Total patterns to defeat
  const [defeatedPatterns, setDefeatedPatterns] = useState(0);
  const [learningEfficiency, setLearningEfficiency] = useState(0);
  const [emotionService] = useState(() => new RustEmotionService('http://localhost:8000/analyze'));
  const [emotionalState, setEmotionalState] = useState({
    emotion: 'neutral',
    stability: 0,
    engagement: 0
  });

  useEffect(() => {
    const initializeAudio = async () => {
      try {
        await audioService.initialize();
        setIsAudioInitialized(true);
        logger.info('App', 'Audio initialized successfully');
      } catch (error) {
        logger.error('App', 'Failed to initialize audio', { error });
      }
    };

    initializeAudio();
    updateGameState();

    return () => {
      audioService.cleanup();
    };
  }, [audioService]);

  const updateGameState = () => {
    const pattern = puzzleService.toggleNote(0);
    setActiveNotes(pattern.activeNotes);
    setResonatingPairs(pattern.resonatingPairs);
    setSemanticState({
      harmonic: pattern.harmonicState,
      rhythmic: pattern.rhythmicState,
      types: pattern.resonanceTypes
    });
    setPathways(pattern.pathways);
    setPatterns(prevPatterns => [...prevPatterns, pattern]);
  };

  // Calculate resonating pairs based on active notes
  const calculateResonatingPairs = (): { pairs: [number, number, number][], resonanceSum: number } => {
    const pairs: [number, number, number][] = [];
    let resonanceSum = 0;

    if (resonancePattern) {
      resonancePattern.resonatingPairs.forEach(pair => {
        pairs.push(pair);
        resonanceSum += pair[2];
      });
    }

    return { pairs, resonanceSum };
  };

  // Update resonance whenever active notes change
  useEffect(() => {
    const { resonanceSum } = calculateResonatingPairs();
    setTotalResonance(resonanceSum);
  }, [activeNotes]);

  // Update spinor animation frames
  useEffect(() => {
    let animationFrame: number;
    const updateSpinors = () => {
      setSpinorStates(prevStates => {
        const newStates = new Map(prevStates);
        activeNotes.forEach(noteIndex => {
          const state = newStates.get(noteIndex);
          if (state) {
            const elapsed = (Date.now() - state.startTime) / 1000;
            const rotation = (elapsed * state.rate * 360 + state.phase * 180 / Math.PI) % 360;
            const note = document.querySelector(`[data-note-index="${noteIndex}"]`);
            if (note) {
              note.setAttribute('style', `${note.getAttribute('style')}; transform: translate(-50%, -50%) rotate(${rotation}deg)`);
            }
          }
        });
        return newStates;
      });
      animationFrame = requestAnimationFrame(updateSpinors);
    };
    
    animationFrame = requestAnimationFrame(updateSpinors);
    return () => cancelAnimationFrame(animationFrame);
  }, [activeNotes, spinorStates]);

  // Update delay visualization
  useEffect(() => {
    const updateEchoes = () => {
      setDelayEchoes(prevEchoes => {
        const newEchoes = new Map(prevEchoes);
        activeNotes.forEach(noteIndex => {
          const note = noteVisuals[noteIndex];
          const pattern = Object.values(SACRED_PATTERNS)[noteIndex % Object.keys(SACRED_PATTERNS).length];
          const positions = [];
          
          // Generate sacred geometry echo positions
          for (let i = 0; i < pattern.points; i++) {
            const angle = (i * 2 * Math.PI / pattern.points) + pattern.rotation;
            const radius = pattern.radius * 50; // Scale for pixels
            positions.push({
              x: note.x + Math.cos(angle) * radius,
              y: note.y + Math.sin(angle) * radius
            });
          }
          
          newEchoes.set(noteIndex, {
            positions,
            opacity: 0.7
          });
        });
        return newEchoes;
      });
    };

    const interval = setInterval(updateEchoes, 60 / tempo * 750); // 3/4 of beat duration
    return () => clearInterval(interval);
  }, [activeNotes, tempo]);

  // Add resize handler
  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startGame = async (difficulty: Difficulty) => {
    await wasmService.createGame(difficulty);
    setGameStarted(true);
  };

  const toggleNote = async (note: number) => {
    const newActiveNotes = activeNotes.includes(note)
      ? activeNotes.filter(n => n !== note)
      : [...activeNotes, note];
    
    setActiveNotes(newActiveNotes);
    
    if (newActiveNotes.length > 0) {
      const guess = parseInt(newActiveNotes.join(''), 2);
      const correct = await wasmService.makeGuess(guess);
      
      if (correct) {
        // Update connectome resonance based on the correct pattern
        connectomeService.updateResonance(newActiveNotes);
      }
    }
  };

  const getPattern = () => {
    return wasmService.getPattern();
  };

  const getStats = () => {
    return wasmService.getStats();
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    audioService.setVolume(newVolume);
  };

  // Update pattern synthesis when patterns change
  useEffect(() => {
    const activePatterns = connectomeService.getActivePatterns();
    activePatterns.forEach((pattern, index) => {
      if (pattern.strength > 0) {
        patternSynth.updatePatternSynth(index, pattern);
      } else {
        patternSynth.cleanupPatternSynth(index);
      }
    });
  }, [connectomeService.getActivePatterns()]);

  // Handle feedback level changes
  const handleFeedbackChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const level = parseFloat(event.target.value);
    setFeedbackLevel(level);
    patternSynth.setFeedbackLevel(level);
  };

  // Handle pattern mix level changes
  const handlePatternMixChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const level = parseFloat(event.target.value);
    setPatternMixLevel(level);
    patternSynth.setPatternMixLevel(level);
  };

  // Update pattern dialogue when patterns change
  useEffect(() => {
    const activePatterns = connectomeService.getActivePatterns();
    activePatterns.forEach((pattern, index) => {
      if (pattern.strength > 0) {
        if (!patternDialogue.hasDialogue(index)) {
          patternDialogue.initializeDialogue(index, pattern);
        }
        patternDialogue.handleUserInteraction(index, pattern);
      } else {
        patternDialogue.cleanupDialogue(index);
      }
    });
  }, [connectomeService.getActivePatterns()]);

  // Handle dialogue mode changes
  const handleDialogueModeChange = (mode: 'user' | 'system' | 'balanced') => {
    setDialogueMode(mode);
    patternDialogue.setDialogueMode(mode);
  };

  const { pairs: calculatedPairs } = calculateResonatingPairs();
  const resonancePercentage = Math.min(100, (totalResonance / 3) * 100);

  // Helper function to get semantic state colors
  const getSemanticStateColors = () => {
    const colors = {
      tension: '#FF4136',
      resolution: '#2ECC40',
      transition: '#FF851B',
      stasis: '#7FDBFF',
      pulse: '#B10DC9',
      flow: '#01FF70',
      counterpoint: '#FFDC00',
      chaos: '#85144b'
    };
    
    return {
      harmonic: colors[semanticState.harmonic as keyof typeof colors],
      rhythmic: colors[semanticState.rhythmic as keyof typeof colors]
    };
  };

  // Get semantic state colors
  const stateColors = getSemanticStateColors();

  const handleConnectionDrawn = (from: number, to: number, strength: number) => {
    // Update pattern connections
    const updatedPatterns = [...patterns];
    const fromPattern = updatedPatterns[from];
    const toPattern = updatedPatterns[to];

    if (fromPattern && toPattern) {
      // Add connection if it doesn't exist
      const existingConnection = fromPattern.connections.find(
        conn => conn.to === to
      );

      if (!existingConnection) {
        fromPattern.connections.push({
          from,
          to,
          strength
        });
      } else {
        // Update existing connection strength
        existingConnection.strength = strength;
      }

      setPatterns(updatedPatterns);
    }
  };

  const handleShapeMoved = (index: number, x: number, y: number) => {
    const updatedPatterns = [...patterns];
    const pattern = updatedPatterns[index];

    if (pattern) {
      pattern.position = { x, y };
      setPatterns(updatedPatterns);
    }
  };

  // Update monsters
  useEffect(() => {
    const updateMonsters = () => {
      monsterService.updateMonsterPositions(patterns);
      setMonsters(monsterService.getMonsters());
    };

    const interval = setInterval(updateMonsters, 1000 / 60); // 60 FPS
    return () => clearInterval(interval);
  }, [patterns]);

  // Handle pattern attacks on monsters with learning
  const handlePatternAttack = (pattern: EmergentPattern) => {
    monsters.forEach(monster => {
      const distance = Math.hypot(
        pattern.position.x - monster.position.x,
        pattern.position.y - monster.position.y
      );

      if (distance < 100) { // Attack range
        const defeated = monsterService.attackMonster(monster.id, pattern);
        if (defeated) {
          // Play defeat sound
          audioService.playNote(440 + monster.id * 100, 0.5, 'sine');
          
          // Record successful attack for learning
          monsterService.recordPlayerResponse(pattern.type, true, pattern.strength * 20);
        } else {
          // Record unsuccessful attack for learning
          monsterService.recordPlayerResponse(pattern.type, false, pattern.strength * 10);
        }
      }
    });
  };

  // Update pattern synthesis to include monster interactions and learning
  useEffect(() => {
    const activePatterns = connectomeService.getActivePatterns();
    activePatterns.forEach((pattern, index) => {
      if (pattern.strength > 0) {
        patternSynth.updatePatternSynth(index, pattern);
        handlePatternAttack(pattern);
      } else {
        patternSynth.cleanupPatternSynth(index);
      }
    });
  }, [connectomeService.getActivePatterns()]);

  // Update learning efficiency based on monster scores
  useEffect(() => {
    const efficiency = monsters.reduce((sum, monster) => {
      const score = monsterService.getMonsterScore(monster.id);
      return sum + (score?.learningEfficiency || 0);
    }, 0) / Math.max(1, monsters.length);

    setLearningEfficiency(efficiency);
  }, [monsters]);

  // Update defeated patterns count
  useEffect(() => {
    const defeated = monsters.reduce((sum, monster) => {
      const score = monsterService.getMonsterScore(monster.id);
      return sum + (score?.patternsDefeated || 0);
    }, 0);

    setDefeatedPatterns(defeated);
  }, [monsters]);

  useEffect(() => {
    const videoElement = document.createElement('video');
    videoElement.setAttribute('playsinline', '');
    videoElement.setAttribute('autoplay', '');
    
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        videoElement.srcObject = stream;
        emotionService.startDetection(videoElement, (state) => {
          setEmotionalState({
            emotion: state.dominant_emotion,
            stability: 1 - state.intensity,
            engagement: state.confidence
          });
        });
      })
      .catch(error => {
        console.error('Error accessing webcam:', error);
      });

    return () => {
      emotionService.stopDetection();
      const stream = videoElement.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [emotionService]);

  // Update monster behavior based on emotional state
  useEffect(() => {
    if (!monsterService) return;

    const { emotion, stability, engagement } = emotionalState;
    
    // Adjust monster behavior based on emotional state
    monsters.forEach(monster => {
      // Increase monster aggression when player is fearful
      if (emotion === 'fearful') {
        monster.attackRange *= 1.2;
      }
      
      // Increase monster speed when player is surprised
      if (emotion === 'surprised') {
        monster.speed *= 1.3;
      }
      
      // Decrease monster health when player is angry
      if (emotion === 'angry') {
        monster.health *= 0.9;
      }
      
      // Increase pattern effectiveness when player is happy
      if (emotion === 'happy') {
        monster.learningRate *= 1.2;
      }
    });
  }, [emotionalState, monsters, monsterService]);

  return (
    <div className="app-container">
      <h1 className="title">Music Puzzle Game</h1>
      
      <div className="game-board" style={{ width: canvasSize.width, height: canvasSize.height }}>
        <ProgressVisualizer
          monsters={monsters}
          totalPatterns={totalPatterns}
          defeatedPatterns={defeatedPatterns}
          learningEfficiency={learningEfficiency}
          canvasSize={canvasSize}
        />
        
        <MonsterRenderer
          monsters={monsters}
          canvasSize={canvasSize}
          onMonsterClick={(monsterId) => setSelectedMonster(monsterId)}
        />
        
        <InteractiveCanvas
          patterns={patterns}
          canvasSize={canvasSize}
          onConnectionDrawn={handleConnectionDrawn}
          onShapeMoved={handleShapeMoved}
        />
        
        {!gameStarted ? (
          <div className="difficulty-selector">
            <h2>Select Difficulty</h2>
            <button onClick={() => startGame(Difficulty.Easy)}>Easy</button>
            <button onClick={() => startGame(Difficulty.Medium)}>Medium</button>
            <button onClick={() => startGame(Difficulty.Hard)}>Hard</button>
          </div>
        ) : (
          <>
            <PatternExplorer
              connectomeService={connectomeService}
              canvasSize={canvasSize}
              sharedStateService={sharedStateService}
            />
            
            <PatternVisualizer
              patterns={connectomeService.getActivePatterns()}
              canvasSize={canvasSize}
              imaginaryField={connectomeService.getImaginaryField()}
            />
            
            <AnalogicalVisualizer
              patterns={connectomeService.getActivePatterns()}
              mappings={connectomeService.getAnalogicalMappings()}
              canvasSize={canvasSize}
              imaginaryField={connectomeService.getImaginaryField()}
              patternHistory={connectomeService.getPatternHistory()}
            />
            
            <ConnectionLines 
              activeNotes={activeNotes}
              resonatingPairs={resonatingPairs}
              pathways={pathways}
              noteVisuals={noteVisuals}
              connectomeService={connectomeService}
            />
            
            {/* Render delay echoes */}
            {Array.from(delayEchoes.entries()).map(([noteIndex, echo]) => (
              <div key={`echo-${noteIndex}`} className="echo-container">
                {echo.positions.map((pos, i) => {
                  const note = noteVisuals[noteIndex];
                  return (
                    <div
                      key={`echo-${noteIndex}-${i}`}
                      className={`note-echo ${note.shape}`}
                      style={{
                        position: 'absolute',
                        left: `${pos.x}px`,
                        top: `${pos.y}px`,
                        backgroundColor: note.color,
                        opacity: echo.opacity * (1 - i / echo.positions.length),
                        transform: `translate(-50%, -50%) scale(${0.8 - i * 0.1})`,
                        transition: 'all 0.3s ease-out'
                      }}
                    />
                  );
                })}
              </div>
            ))}

            {/* Existing note buttons with sacred geometry patterns */}
            {noteVisuals.map((note, index) => {
              const spinorState = spinorStates.get(index);
              const isActive = activeNotes.includes(index);
              const pattern = Object.values(SACRED_PATTERNS)[index % Object.keys(SACRED_PATTERNS).length];
              
              return (
                <button
                  key={note.name}
                  data-note-index={index}
                  className={`note-button ${note.shape} ${isActive ? 'active' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${note.x}px`,
                    top: `${note.y}px`,
                    backgroundColor: note.color,
                    transform: `translate(-50%, -50%) rotate(${pattern.rotation}rad)`,
                    transition: isActive ? 'none' : 'transform 0.3s ease-out'
                  }}
                  onClick={() => toggleNote(index)}
                >
                  <div 
                    className={`resonator ${isActive ? 'active' : ''}`}
                    style={{
                      animation: isActive ? `pulse ${60 / tempo}s infinite` : 'none',
                      clipPath: generateSacredGeometryPath(pattern)
                    }}
                  />
                  <span className="ratio-label">{note.name}</span>
                  <span className="key-hint">{index + 1}</span>
                </button>
              );
            })}
          </>
        )}

        {selectedMonster !== null && (
          <div className="monster-info">
            <h3>Monster Details</h3>
            {(() => {
              const monster = monsters.find(m => m.id === selectedMonster);
              const score = monsterService.getMonsterScore(selectedMonster);
              const history = monsterService.getMonsterHistory(selectedMonster);
              
              if (!monster || !score) return null;
              
              return (
                <>
                  <div className="monster-stats">
                    <div className="stat">
                      <label>Type:</label>
                      <span>{monster.type}</span>
                    </div>
                    <div className="stat">
                      <label>Health:</label>
                      <span>{monster.health}/{monster.maxHealth}</span>
                    </div>
                    <div className="stat">
                      <label>Total Damage:</label>
                      <span>{score.totalDamage}</span>
                    </div>
                    <div className="stat">
                      <label>Patterns Defeated:</label>
                      <span>{score.patternsDefeated}</span>
                    </div>
                    <div className="stat">
                      <label>Adaptations:</label>
                      <span>{score.adaptations}</span>
                    </div>
                    <div className="stat">
                      <label>Learning Efficiency:</label>
                      <span>{(score.learningEfficiency * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="monster-history">
                    <h4>Recent Events</h4>
                    {history.map((event, index) => (
                      <div key={index} className="history-event">
                        <span className="event-time">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="event-type">{event.event}</span>
                        <span className="event-details">
                          {JSON.stringify(event.details)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
            <button 
              className="close-button"
              onClick={() => setSelectedMonster(null)}
            >
              Close
            </button>
          </div>
        )}
      </div>

      <div className="visualizer-container">
        <AudioVisualizer 
          audioContext={audioService.getAudioContext()}
          analyser={audioService.getAnalyser()}
        />
      </div>

      <div className="controls">
        <div className="volume-control">
          <label>Volume</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
          />
        </div>
        
        <div className="feedback-control">
          <label>Feedback</label>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.01"
            value={feedbackLevel}
            onChange={handleFeedbackChange}
          />
        </div>
        
        <div className="pattern-mix-control">
          <label>Pattern Mix</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={patternMixLevel}
            onChange={handlePatternMixChange}
          />
        </div>

        <div className="dialogue-controls">
          <label>Dialogue Mode</label>
          <div className="dialogue-buttons">
            <button
              className={dialogueMode === 'user' ? 'active' : ''}
              onClick={() => handleDialogueModeChange('user')}
            >
              User
            </button>
            <button
              className={dialogueMode === 'balanced' ? 'active' : ''}
              onClick={() => handleDialogueModeChange('balanced')}
            >
              Balanced
            </button>
            <button
              className={dialogueMode === 'system' ? 'active' : ''}
              onClick={() => handleDialogueModeChange('system')}
            >
              System
            </button>
          </div>
        </div>
      </div>

      <SpatialControls audioService={audioService} />

      {debugMode && <DebugPanel />}

      <button 
        className="debug-toggle"
        onClick={() => setDebugMode(!debugMode)}
      >
        {debugMode ? 'Hide Debug' : 'Show Debug'}
      </button>

      <EmotionFeedback
        emotionService={emotionService}
        onEmotionalStateChange={setEmotionalState}
      />
    </div>
  );
}

// Helper function to generate SVG-style path for sacred geometry
function generateSacredGeometryPath(pattern: typeof SACRED_PATTERNS[keyof typeof SACRED_PATTERNS]): string {
  const points: string[] = [];
  const radius = 20; // Base size for the clip path

  for (let i = 0; i < pattern.points; i++) {
    const angle = (i * 2 * Math.PI / pattern.points) + pattern.rotation;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    points.push(`${x}% ${y}%`);
  }

  return `polygon(${points.join(', ')})`;
}

export default App
