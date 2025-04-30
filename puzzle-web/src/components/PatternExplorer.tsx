import React, { useEffect, useRef, useState } from 'react';
import { EmergentPattern } from '../services/types';
import { ConnectomeService } from '../services/connectome';
import { SharedStateService } from '../services/sharedState';

interface PatternExplorerProps {
  connectomeService: ConnectomeService;
  canvasSize: { width: number; height: number };
  sharedStateService?: SharedStateService;
}

interface InteractionState {
  isDragging: boolean;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  selectedPattern: EmergentPattern | null;
  zoom: number;
  rotation: number;
  manipulationMode: 'move' | 'scale' | 'rotate' | 'merge' | 'split' | null;
  manipulationStart: { x: number; y: number } | null;
}

const PatternExplorer: React.FC<PatternExplorerProps> = ({
  connectomeService,
  canvasSize,
  sharedStateService
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [interactionState, setInteractionState] = useState<InteractionState>({
    isDragging: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    selectedPattern: null,
    zoom: 1,
    rotation: 0,
    manipulationMode: null,
    manipulationStart: null
  });

  // Handle mouse/touch interactions
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleStart = (e: MouseEvent | TouchEvent) => {
      const pos = getEventPosition(e);
      setInteractionState(prev => ({
        ...prev,
        isDragging: true,
        startPos: pos,
        currentPos: pos
      }));
    };

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!interactionState.isDragging) return;
      
      const pos = getEventPosition(e);
      const deltaX = pos.x - interactionState.currentPos.x;
      const deltaY = pos.y - interactionState.currentPos.y;
      
      if (interactionState.manipulationMode && interactionState.selectedPattern) {
        handlePatternManipulation(pos);
      } else {
        setInteractionState(prev => ({
          ...prev,
          currentPos: pos,
          rotation: prev.rotation + deltaX * 0.5,
          zoom: Math.max(0.5, Math.min(2, prev.zoom - deltaY * 0.01))
        }));
      }
    };

    const handleEnd = () => {
      if (interactionState.manipulationMode && interactionState.selectedPattern) {
        finalizePatternManipulation();
      }
      
      setInteractionState(prev => ({
        ...prev,
        isDragging: false,
        manipulationMode: null,
        manipulationStart: null
      }));
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * 0.001;
      setInteractionState(prev => ({
        ...prev,
        zoom: Math.max(0.5, Math.min(2, prev.zoom - delta))
      }));
    };

    // Add event listeners
    container.addEventListener('mousedown', handleStart);
    container.addEventListener('touchstart', handleStart);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);
    container.addEventListener('wheel', handleWheel);

    return () => {
      // Clean up event listeners
      container.removeEventListener('mousedown', handleStart);
      container.removeEventListener('touchstart', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [interactionState.isDragging, interactionState.manipulationMode]);

  const handlePatternManipulation = (pos: { x: number; y: number }) => {
    if (!interactionState.selectedPattern || !interactionState.manipulationStart) return;

    const deltaX = pos.x - interactionState.manipulationStart.x;
    const deltaY = pos.y - interactionState.manipulationStart.y;

    switch (interactionState.manipulationMode) {
      case 'move':
        movePattern(deltaX, deltaY);
        break;
      case 'scale':
        scalePattern(deltaX);
        break;
      case 'rotate':
        rotatePattern(deltaX);
        break;
    }
  };

  const finalizePatternManipulation = () => {
    if (!interactionState.selectedPattern || !interactionState.manipulationMode) return;

    sharedStateService?.transformPattern(
      interactionState.selectedPattern.id,
      interactionState.manipulationMode,
      {
        position: interactionState.selectedPattern.resonanceField.center,
        scale: interactionState.selectedPattern.resonanceField.radius,
        rotation: interactionState.selectedPattern.rotation
      }
    );
  };

  const movePattern = (deltaX: number, deltaY: number) => {
    if (!interactionState.selectedPattern) return;

    const newPattern = {
      ...interactionState.selectedPattern,
      resonanceField: {
        ...interactionState.selectedPattern.resonanceField,
        center: {
          x: interactionState.selectedPattern.resonanceField.center.x + deltaX / 200,
          y: interactionState.selectedPattern.resonanceField.center.y + deltaY / 200,
          z: interactionState.selectedPattern.resonanceField.center.z
        }
      }
    };

    setInteractionState(prev => ({
      ...prev,
      selectedPattern: newPattern
    }));
  };

  const scalePattern = (delta: number) => {
    if (!interactionState.selectedPattern) return;

    const newPattern = {
      ...interactionState.selectedPattern,
      resonanceField: {
        ...interactionState.selectedPattern.resonanceField,
        radius: Math.max(0.1, interactionState.selectedPattern.resonanceField.radius + delta / 200)
      }
    };

    setInteractionState(prev => ({
      ...prev,
      selectedPattern: newPattern
    }));
  };

  const rotatePattern = (delta: number) => {
    if (!interactionState.selectedPattern) return;

    const newPattern = {
      ...interactionState.selectedPattern,
      rotation: interactionState.selectedPattern.rotation + delta * 0.01
    };

    setInteractionState(prev => ({
      ...prev,
      selectedPattern: newPattern
    }));
  };

  // Handle pattern selection and interaction
  const handlePatternClick = (pattern: EmergentPattern) => {
    setInteractionState(prev => ({
      ...prev,
      selectedPattern: prev.selectedPattern?.nodes === pattern.nodes ? null : pattern
    }));

    sharedStateService?.updateSelectedPattern(pattern.id);
  };

  // Render interactive pattern controls
  return (
    <div 
      ref={containerRef}
      className="pattern-explorer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        cursor: interactionState.isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      }}
    >
      <div
        className="pattern-space"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `
            translate(-50%, -50%)
            rotate(${interactionState.rotation}deg)
            scale(${interactionState.zoom})
          `,
          transition: interactionState.isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {connectomeService.getActivePatterns().map((pattern, index) => (
          <div
            key={index}
            className={`pattern-node ${interactionState.selectedPattern?.nodes === pattern.nodes ? 'selected' : ''}`}
            onClick={() => handlePatternClick(pattern)}
            style={{
              position: 'absolute',
              left: `${50 + pattern.resonanceField.center.x * 100}%`,
              top: `${50 + pattern.resonanceField.center.y * 100}%`,
              width: `${pattern.resonanceField.radius * 200}px`,
              height: `${pattern.resonanceField.radius * 200}px`,
              transform: `translate(-50%, -50%) rotate(${pattern.rotation}rad)`,
              borderRadius: '50%',
              backgroundColor: getPatternColor(pattern.patternType),
              opacity: pattern.strength,
              cursor: 'pointer',
              transition: 'all 0.3s ease-out',
              boxShadow: interactionState.selectedPattern?.nodes === pattern.nodes
                ? `0 0 20px ${getPatternColor(pattern.patternType)}`
                : 'none'
            }}
          >
            <div className="pattern-info">
              <div className="pattern-type">{pattern.patternType}</div>
              <div className="pattern-strength">
                Strength: {(pattern.strength * 100).toFixed(0)}%
              </div>
              <div className="pattern-stability">
                Stability: {(pattern.stability * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pattern manipulation controls */}
      {interactionState.selectedPattern && (
        <div
          className="manipulation-controls"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            gap: '10px'
          }}
        >
          <button
            onClick={() => setInteractionState(prev => ({ ...prev, manipulationMode: 'move' }))}
            className={interactionState.manipulationMode === 'move' ? 'active' : ''}
          >
            Move
          </button>
          <button
            onClick={() => setInteractionState(prev => ({ ...prev, manipulationMode: 'scale' }))}
            className={interactionState.manipulationMode === 'scale' ? 'active' : ''}
          >
            Scale
          </button>
          <button
            onClick={() => setInteractionState(prev => ({ ...prev, manipulationMode: 'rotate' }))}
            className={interactionState.manipulationMode === 'rotate' ? 'active' : ''}
          >
            Rotate
          </button>
          <button
            onClick={() => setInteractionState(prev => ({ ...prev, manipulationMode: 'merge' }))}
            className={interactionState.manipulationMode === 'merge' ? 'active' : ''}
          >
            Merge
          </button>
          <button
            onClick={() => setInteractionState(prev => ({ ...prev, manipulationMode: 'split' }))}
            className={interactionState.manipulationMode === 'split' ? 'active' : ''}
          >
            Split
          </button>
        </div>
      )}

      {/* Pattern details panel */}
      {interactionState.selectedPattern && (
        <div
          className="pattern-details"
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '10px',
            color: 'white',
            maxWidth: '300px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h3>Pattern Details</h3>
          <div>Type: {interactionState.selectedPattern.patternType}</div>
          <div>Strength: {(interactionState.selectedPattern.strength * 100).toFixed(0)}%</div>
          <div>Stability: {(interactionState.selectedPattern.stability * 100).toFixed(0)}%</div>
          <div>Nodes: {interactionState.selectedPattern.nodes.length}</div>
          <div>Age: {((Date.now() - interactionState.selectedPattern.evolution.birth) / 1000).toFixed(1)}s</div>
        </div>
      )}

      {/* Interaction hints */}
      <div
        className="interaction-hints"
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: 'white',
          opacity: 0.7,
          fontSize: '14px'
        }}
      >
        <div>Drag to rotate</div>
        <div>Scroll to zoom</div>
        <div>Click pattern to select</div>
        {interactionState.manipulationMode && (
          <div>Manipulation mode: {interactionState.manipulationMode}</div>
        )}
      </div>
    </div>
  );
};

function getEventPosition(e: MouseEvent | TouchEvent): { x: number; y: number } {
  if ('touches' in e) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }
  return {
    x: e.clientX,
    y: e.clientY
  };
}

function getPatternColor(type: EmergentPattern['patternType']): string {
  switch (type) {
    case 'harmonic':
      return '#4a90e2';
    case 'rhythmic':
      return '#e24a90';
    case 'spatial':
      return '#90e24a';
    case 'imaginary':
      return '#e2e24a';
    default:
      return '#ffffff';
  }
}

export default PatternExplorer; 