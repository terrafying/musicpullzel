import React, { useEffect, useState } from 'react';
import { AudioService } from '../services/audio';

interface SpatialControlsProps {
  audioService: AudioService;
}

interface SpatialState {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: number;
  isSpatialMode: boolean;
}

export const SpatialControls: React.FC<SpatialControlsProps> = ({ audioService }) => {
  const [spatialState, setSpatialState] = useState<SpatialState>({
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    isSpatialMode: false
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!spatialState.isSpatialMode) return;

      switch (event.key.toLowerCase()) {
        case 'w':
          audioService.moveListener('forward');
          break;
        case 's':
          audioService.moveListener('backward');
          break;
        case 'a':
          audioService.moveListener('left');
          break;
        case 'd':
          audioService.moveListener('right');
          break;
        case 'q':
          audioService.moveListener('up');
          break;
        case 'e':
          audioService.moveListener('down');
          break;
        case 'arrowleft':
          audioService.rotateListener('left');
          break;
        case 'arrowright':
          audioService.rotateListener('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [audioService, spatialState.isSpatialMode]);

  const toggleSpatialMode = () => {
    const newMode = !spatialState.isSpatialMode;
    audioService.setSpatialMode(newMode);
    setSpatialState(prev => ({ ...prev, isSpatialMode: newMode }));
  };

  return (
    <div className="spatial-controls">
      <button 
        className={`spatial-toggle ${spatialState.isSpatialMode ? 'active' : ''}`}
        onClick={toggleSpatialMode}
      >
        {spatialState.isSpatialMode ? 'Disable Spatial Audio' : 'Enable Spatial Audio'}
      </button>
      
      {spatialState.isSpatialMode && (
        <div className="spatial-hints">
          <div className="hint-group">
            <div className="hint-row">
              <span>W</span>
              <span>Move Forward</span>
            </div>
            <div className="hint-row">
              <span>S</span>
              <span>Move Backward</span>
            </div>
            <div className="hint-row">
              <span>A</span>
              <span>Move Left</span>
            </div>
            <div className="hint-row">
              <span>D</span>
              <span>Move Right</span>
            </div>
            <div className="hint-row">
              <span>Q</span>
              <span>Move Up</span>
            </div>
            <div className="hint-row">
              <span>E</span>
              <span>Move Down</span>
            </div>
          </div>
          <div className="hint-group">
            <div className="hint-row">
              <span>←</span>
              <span>Rotate Left</span>
            </div>
            <div className="hint-row">
              <span>→</span>
              <span>Rotate Right</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 