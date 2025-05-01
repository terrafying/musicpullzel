import React, { useEffect, useState } from 'react';
import { GameStateManager, GameState } from '../services/gameState';
import HelixVisualizer from './HelixVisualizer';
import { SphericalPatternLayer } from './SphericalPatternLayer';
import './HarmonicPuzzle.css';

export const HarmonicPuzzle: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameManager] = useState(() => new GameStateManager());
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Initialize the game grid
    gameManager.initializeGrid(100, 3);

    // Subscribe to state changes
    const unsubscribe = gameManager.subscribe((state) => {
      setGameState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [gameManager]);

  if (!gameState) return null;

  return (
    <div className="harmonic-puzzle">
      <div className="visualization-container">
        <div className="spherical-layer">
          <SphericalPatternLayer />
        </div>
        <div className="helix-visualizer">
          <HelixVisualizer
            activeNotes={gameState.activeNotes}
            isDarkMode={isDarkMode}
            timeSpread={3}
            rotationSpeed={0.5}
          />
        </div>
      </div>
      
      <div className="hex-grid-container">
        {Array.from(gameState.hexagons.values()).map((hex) => (
          <div
            key={hex.id}
            className={`hexagon ${hex.isActive ? 'active' : ''}`}
            style={{
              '--harmonic-value': hex.harmonicValue,
              '--spherical-phase': gameState.sphericalPhase,
              transform: `
                translate(
                  ${hex.sphericalCoords.radius * Math.cos(hex.sphericalCoords.theta)}px,
                  ${hex.sphericalCoords.radius * Math.sin(hex.sphericalCoords.theta)}px
                )
                rotate(${hex.sphericalCoords.phi}rad)
              `
            } as React.CSSProperties}
            onClick={() => gameManager.toggleHexagon(hex.id)}
          >
            <div className="hex-content">
              <span className="note">{hex.note}</span>
              <div 
                className="harmonic-glow"
                style={{
                  opacity: hex.harmonicValue,
                  transform: `rotate(${gameState.sphericalPhase}rad)`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="controls">
        <button onClick={() => setIsDarkMode(!isDarkMode)}>
          Toggle Theme
        </button>
        <div className="resonance-meter">
          Resonance: {Math.round(gameState.harmonicResonance * 100)}%
        </div>
      </div>
    </div>
  );
}; 