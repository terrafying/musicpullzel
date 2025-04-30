import React, { useEffect, useRef } from 'react';
import { ConnectomeService } from '../services/connectome';
import { EmergentPattern, ResonanceField } from '../services/types';

interface ConnectionLinesProps {
  activeNotes: number[];
  resonatingPairs: Array<[number, number, number]>;
  pathways: Array<{
    notes: number[];
    strength: number;
    type: 'harmonic' | 'subharmonic' | 'overtone' | 'interference';
  }>;
  noteVisuals: {
    color: string;
    shape: string;
    ratio: number;
    name: string;
  }[];
  connectomeService: ConnectomeService;
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  activeNotes,
  resonatingPairs,
  pathways,
  noteVisuals,
  connectomeService
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get button positions
    const buttons = Array.from(document.querySelectorAll('.note-button')) as HTMLElement[];
    const buttonPositions = buttons.map(button => {
      const rect = button.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      return {
        x: rect.left - canvasRect.left + rect.width / 2,
        y: rect.top - canvasRect.top + rect.height / 2
      };
    });

    // Draw imaginary field
    const imaginaryField = connectomeService.getImaginaryField();
    if (imaginaryField.intensity > 0) {
      const center = {
        x: canvas.width / 2,
        y: canvas.height / 2
      };
      
      const gradient = ctx.createRadialGradient(
        center.x, center.y, 0,
        center.x, center.y, imaginaryField.radius * 200
      );
      
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, imaginaryField.radius * 200, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // Draw emergent patterns
    const patterns = connectomeService.getActivePatterns();
    patterns.forEach(pattern => {
      const center = {
        x: canvas.width / 2 + pattern.resonanceField.center.x * 200,
        y: canvas.height / 2 + pattern.resonanceField.center.y * 200
      };

      // Draw pattern field
      const fieldGradient = ctx.createRadialGradient(
        center.x, center.y, 0,
        center.x, center.y, pattern.resonanceField.radius * 200
      );

      const patternColor = getPatternColor(pattern.patternType);
      fieldGradient.addColorStop(0, `${patternColor}33`);
      fieldGradient.addColorStop(1, `${patternColor}00`);

      ctx.beginPath();
      ctx.arc(center.x, center.y, pattern.resonanceField.radius * 200, 0, Math.PI * 2);
      ctx.fillStyle = fieldGradient;
      ctx.fill();

      // Draw pattern connections
      pattern.nodes.forEach((nodeId, i) => {
        const posA = buttonPositions[nodeId];
        if (!posA) return;

        pattern.nodes.slice(i + 1).forEach(targetId => {
          const posB = buttonPositions[targetId];
          if (!posB) return;

          const gradient = ctx.createLinearGradient(posA.x, posA.y, posB.x, posB.y);
          gradient.addColorStop(0, patternColor);
          gradient.addColorStop(1, patternColor);

          ctx.beginPath();
          ctx.moveTo(posA.x, posA.y);
          ctx.lineTo(posB.x, posB.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = Math.max(1, pattern.strength * 10);
          ctx.globalAlpha = Math.min(0.2 + pattern.strength * 0.8, 1);
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      });
    });

    // Draw resonance lines
    resonatingPairs.forEach(([noteA, noteB, strength]) => {
      if (!activeNotes.includes(noteA) || !activeNotes.includes(noteB)) return;

      const posA = buttonPositions[noteA];
      const posB = buttonPositions[noteB];
      if (!posA || !posB) return;

      // Create gradient based on resonance strength
      const gradient = ctx.createLinearGradient(posA.x, posA.y, posB.x, posB.y);
      const colorA = noteVisuals[noteA].color;
      const colorB = noteVisuals[noteB].color;
      
      gradient.addColorStop(0, colorA);
      gradient.addColorStop(1, colorB);

      // Draw line with resonance strength
      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(1, strength * 10);
      ctx.globalAlpha = Math.min(0.2 + strength * 0.8, 1);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw resonance nodes at intersection points
      const drawResonanceNode = (x: number, y: number) => {
        const radius = 5 + strength * 10;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      // Draw nodes at both ends
      drawResonanceNode(posA.x, posA.y);
      drawResonanceNode(posB.x, posB.y);
    });
  }, [activeNotes, resonatingPairs, noteVisuals, connectomeService]);

  return (
    <canvas
      ref={canvasRef}
      className="connection-lines"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

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

export default ConnectionLines; 