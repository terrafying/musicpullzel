import React, { useEffect, useRef } from 'react';
import { EmergentPattern, ResonanceField } from '../services/types';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw imaginary field with dynamic effects
      if (imaginaryField.intensity > 0) {
        const center = {
          x: canvas.width / 2,
          y: canvas.height / 2
        };

        // Create multiple layers for the imaginary field
        for (let i = 0; i < 3; i++) {
          const phase = (Date.now() / 1000 + i * Math.PI / 3) % (Math.PI * 2);
          const radius = imaginaryField.radius * 200 * (1 + Math.sin(phase) * 0.1);
          
          const gradient = ctx.createRadialGradient(
            center.x, center.y, 0,
            center.x, center.y, radius
          );
          
          const alpha = (0.1 - i * 0.02) * imaginaryField.intensity;
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }

      // Draw patterns with enhanced visual effects
      patterns.forEach(pattern => {
        const center = {
          x: canvas.width / 2 + pattern.resonanceField.center.x * 200,
          y: canvas.height / 2 + pattern.resonanceField.center.y * 200
        };

        // Draw pattern field with dynamic effects
        const time = Date.now() / 1000;
        const patternColor = getPatternColor(pattern.patternType);
        
        // Create multiple layers for each pattern
        for (let i = 0; i < 3; i++) {
          const phase = (time + i * Math.PI / 3) % (Math.PI * 2);
          const radius = pattern.resonanceField.radius * 200 * (1 + Math.sin(phase) * 0.1);
          
          const fieldGradient = ctx.createRadialGradient(
            center.x, center.y, 0,
            center.x, center.y, radius
          );

          const alpha = (0.2 - i * 0.05) * pattern.strength * pattern.stability;
          fieldGradient.addColorStop(0, `${patternColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
          fieldGradient.addColorStop(1, `${patternColor}00`);

          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = fieldGradient;
          ctx.fill();

          // Draw pattern evolution traces
          if (pattern.evolution.transformations.length > 0) {
            const lastTransform = pattern.evolution.transformations[pattern.evolution.transformations.length - 1];
            const transformAge = (Date.now() - lastTransform.timestamp) / 1000;
            
            if (transformAge < 2) {
              const transformRadius = radius * (1 + transformAge * 0.2);
              const transformAlpha = (1 - transformAge / 2) * 0.3;
              
              ctx.beginPath();
              ctx.arc(center.x, center.y, transformRadius, 0, Math.PI * 2);
              ctx.strokeStyle = `${patternColor}${Math.floor(transformAlpha * 255).toString(16).padStart(2, '0')}`;
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        }

        // Draw pattern connections with dynamic effects
        pattern.nodes.forEach((nodeId, i) => {
          const node = document.querySelector(`[data-note-index="${nodeId}"]`) as HTMLElement;
          if (!node) return;

          const rect = node.getBoundingClientRect();
          const posA = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };

          pattern.nodes.slice(i + 1).forEach(targetId => {
            const targetNode = document.querySelector(`[data-note-index="${targetId}"]`) as HTMLElement;
            if (!targetNode) return;

            const targetRect = targetNode.getBoundingClientRect();
            const posB = {
              x: targetRect.left + targetRect.width / 2,
              y: targetRect.top + targetRect.height / 2
            };

            // Create dynamic connection effect
            const phase = (time + i * 0.5) % (Math.PI * 2);
            const strength = pattern.strength * (0.8 + Math.sin(phase) * 0.2);

            const gradient = ctx.createLinearGradient(posA.x, posA.y, posB.x, posB.y);
            gradient.addColorStop(0, patternColor);
            gradient.addColorStop(1, patternColor);

            ctx.beginPath();
            ctx.moveTo(posA.x, posA.y);
            ctx.lineTo(posB.x, posB.y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = Math.max(1, strength * 10);
            ctx.globalAlpha = Math.min(0.2 + strength * 0.8, 1);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // Draw connection nodes
            const drawNode = (x: number, y: number) => {
              const nodeRadius = 5 + strength * 10;
              ctx.beginPath();
              ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
              ctx.fillStyle = `${patternColor}80`;
              ctx.fill();
              ctx.strokeStyle = patternColor;
              ctx.lineWidth = 2;
              ctx.stroke();
            };

            drawNode(posA.x, posA.y);
            drawNode(posB.x, posB.y);
          });
        });
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
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

export default PatternVisualizer; 