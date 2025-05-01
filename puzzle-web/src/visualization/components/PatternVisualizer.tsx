import React from 'react';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { EmergentPattern, ResonanceField, Vector2D, Color } from '../types';

interface PatternVisualizerProps {
  patterns: EmergentPattern[];
  canvasSize: { width: number; height: number };
  imaginaryField: ResonanceField;
}

const PatternVisualizer: React.FC<PatternVisualizerProps> = ({
  patterns,
  canvasSize,
  imaginaryField
}) => {
  const canvasRef = useCanvasRenderer((renderer) => {
    // Draw imaginary field
    if (imaginaryField.intensity > 0) {
      const center: Vector2D = {
        x: canvasSize.width / 2,
        y: canvasSize.height / 2
      };

      // Create multiple layers for the imaginary field
      for (let i = 0; i < 3; i++) {
        const phase = (Date.now() / 1000 + i * Math.PI / 3) % (Math.PI * 2);
        const radius = imaginaryField.radius * 200 * (1 + Math.sin(phase) * 0.1);
        
        renderer.drawGradientCircle(
          center,
          radius,
          {
            stops: [
              { position: 0, color: { r: 255, g: 255, b: 255 }, alpha: 0.1 - i * 0.02 },
              { position: 1, color: { r: 255, g: 255, b: 255 }, alpha: 0 }
            ]
          },
          imaginaryField.intensity
        );
      }
    }

    // Draw patterns
    patterns.forEach(pattern => {
      const center: Vector2D = {
        x: canvasSize.width / 2 + pattern.resonanceField.center.x * 200,
        y: canvasSize.height / 2 + pattern.resonanceField.center.y * 200
      };

      // Draw pattern field with dynamic effects
      const time = Date.now() / 1000;
      const patternColor = getPatternColor(pattern.patternType);
      
      // Create multiple layers for each pattern
      for (let i = 0; i < 3; i++) {
        const phase = (time + i * Math.PI / 3) % (Math.PI * 2);
        const radius = pattern.resonanceField.radius * 200 * (1 + Math.sin(phase) * 0.1);
        
        renderer.drawGradientCircle(
          center,
          radius,
          {
            stops: [
              { position: 0, color: patternColor, alpha: 0.2 - i * 0.05 },
              { position: 1, color: patternColor, alpha: 0 }
            ]
          },
          pattern.strength * pattern.stability
        );

        // Draw pattern evolution traces
        if (pattern.evolution.transformations.length > 0) {
          const lastTransform = pattern.evolution.transformations[pattern.evolution.transformations.length - 1];
          const transformAge = (Date.now() - lastTransform.timestamp) / 1000;
          
          if (transformAge < 2) {
            const transformRadius = radius * (1 + transformAge * 0.2);
            const transformAlpha = (1 - transformAge / 2) * 0.3;
            
            renderer.drawCircle(
              center,
              transformRadius,
              patternColor,
              transformAlpha
            );
          }
        }
      }

      // Draw pattern connections
      pattern.nodes.forEach((nodeId, i) => {
        const node = document.querySelector(`[data-note-index="${nodeId}"]`) as HTMLElement;
        if (!node) return;

        const rect = node.getBoundingClientRect();
        const posA: Vector2D = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };

        pattern.nodes.slice(i + 1).forEach(targetId => {
          const targetNode = document.querySelector(`[data-note-index="${targetId}"]`) as HTMLElement;
          if (!targetNode) return;

          const targetRect = targetNode.getBoundingClientRect();
          const posB: Vector2D = {
            x: targetRect.left + targetRect.width / 2,
            y: targetRect.top + targetRect.height / 2
          };

          // Create dynamic connection effect
          const phase = (time + i * 0.5) % (Math.PI * 2);
          const strength = pattern.strength * (0.8 + Math.sin(phase) * 0.2);

          renderer.drawLine(
            posA,
            posB,
            patternColor,
            Math.max(1, strength * 10),
            Math.min(0.2 + strength * 0.8, 1)
          );

          // Draw connection nodes
          const drawNode = (pos: Vector2D) => {
            const nodeRadius = 5 + strength * 10;
            renderer.drawCircle(pos, nodeRadius, patternColor, 0.5);
            renderer.drawCircle(pos, nodeRadius, patternColor, 1);
          };

          drawNode(posA);
          drawNode(posB);
        });
      });
    });
  }, [patterns, imaginaryField, canvasSize]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width}
      height={canvasSize.height}
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

function getPatternColor(type: EmergentPattern['patternType']): Color {
  switch (type) {
    case 'harmonic':
      return { r: 74, g: 144, b: 226 }; // #4a90e2
    case 'rhythmic':
      return { r: 226, g: 74, b: 144 }; // #e24a90
    case 'spatial':
      return { r: 144, g: 226, b: 74 }; // #90e24a
    case 'imaginary':
      return { r: 226, g: 226, b: 74 }; // #e2e24a
    default:
      return { r: 255, g: 255, b: 255 }; // #ffffff
  }
}

export default PatternVisualizer; 