import React, { useEffect, useRef } from 'react';
import { EmergentPattern, ResonanceField } from '../services/types';
import { AnalogicalMapping } from '../services/connectome';

interface AnalogicalVisualizerProps {
  patterns: EmergentPattern[];
  mappings: AnalogicalMapping[];
  canvasSize: { width: number; height: number };
  imaginaryField: ResonanceField;
  patternHistory: EmergentPattern[];
}

const AnalogicalVisualizer: React.FC<AnalogicalVisualizerProps> = ({
  patterns,
  mappings,
  canvasSize,
  imaginaryField,
  patternHistory
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

      // Draw historical pattern evolution
      drawPatternEvolution(ctx);
      
      // Draw analogical mappings
      drawAnalogicalMappings(ctx);
      
      // Draw pattern predictions
      drawPatternPredictions(ctx);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    const drawPatternEvolution = (ctx: CanvasRenderingContext2D) => {
      const time = Date.now() / 1000;
      
      // Draw historical pattern traces
      patternHistory.forEach((pattern, index) => {
        const center = {
          x: canvas.width / 2 + pattern.resonanceField.center.x * 200,
          y: canvas.height / 2 + pattern.resonanceField.center.y * 200
        };

        // Create evolution trace
        const age = (Date.now() - pattern.evolution.birth) / 1000;
        const alpha = Math.max(0, 0.3 - age * 0.1);
        
        ctx.beginPath();
        ctx.arc(center.x, center.y, pattern.resonanceField.radius * 200, 0, Math.PI * 2);
        ctx.strokeStyle = `${getPatternColor(pattern.patternType)}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw transformation points
        pattern.evolution.transformations.forEach(transform => {
          const transformAge = (Date.now() - transform.timestamp) / 1000;
          if (transformAge < 2) {
            const transformAlpha = (1 - transformAge / 2) * 0.5;
            ctx.beginPath();
            ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = `${getPatternColor(transform.type)}${Math.floor(transformAlpha * 255).toString(16).padStart(2, '0')}`;
            ctx.fill();
          }
        });
      });
    };

    const drawAnalogicalMappings = (ctx: CanvasRenderingContext2D) => {
      mappings.forEach(mapping => {
        // Get source and target pattern centers
        const sourcePattern = patterns.find(p => p.nodes.some(n => mapping.source.includes(n)));
        const targetPattern = patterns.find(p => p.nodes.some(n => mapping.target.includes(n)));
        
        if (!sourcePattern || !targetPattern) return;

        const sourceCenter = {
          x: canvas.width / 2 + sourcePattern.resonanceField.center.x * 200,
          y: canvas.height / 2 + sourcePattern.resonanceField.center.y * 200
        };

        const targetCenter = {
          x: canvas.width / 2 + targetPattern.resonanceField.center.x * 200,
          y: canvas.height / 2 + targetPattern.resonanceField.center.y * 200
        };

        // Draw mapping connection
        const gradient = ctx.createLinearGradient(
          sourceCenter.x, sourceCenter.y,
          targetCenter.x, targetCenter.y
        );

        const color = getPatternColor(mapping.transformation.type);
        gradient.addColorStop(0, `${color}80`);
        gradient.addColorStop(1, `${color}80`);

        ctx.beginPath();
        ctx.moveTo(sourceCenter.x, sourceCenter.y);
        ctx.lineTo(targetCenter.x, targetCenter.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = Math.max(1, mapping.similarity * 5);
        ctx.stroke();

        // Draw mapping strength indicator
        const midPoint = {
          x: (sourceCenter.x + targetCenter.x) / 2,
          y: (sourceCenter.y + targetCenter.y) / 2
        };

        ctx.beginPath();
        ctx.arc(midPoint.x, midPoint.y, mapping.similarity * 10, 0, Math.PI * 2);
        ctx.fillStyle = `${color}40`;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    const drawPatternPredictions = (ctx: CanvasRenderingContext2D) => {
      // Use last N patterns to predict future states
      const recentPatterns = patternHistory.slice(-5);
      if (recentPatterns.length < 2) return;

      // Calculate pattern evolution trend
      const trend = calculatePatternTrend(recentPatterns);
      
      // Draw predicted future states
      trend.forEach((prediction, index) => {
        const center = {
          x: canvas.width / 2 + prediction.center.x * 200,
          y: canvas.height / 2 + prediction.center.y * 200
        };

        const alpha = 0.2 * (1 - index / trend.length);
        ctx.beginPath();
        ctx.arc(center.x, center.y, prediction.radius * 200, 0, Math.PI * 2);
        ctx.strokeStyle = `${getPatternColor(prediction.type)}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    const calculatePatternTrend = (patterns: EmergentPattern[]) => {
      const predictions: Array<{
        center: ResonanceField['center'];
        radius: number;
        type: EmergentPattern['patternType'];
      }> = [];

      // Calculate velocity and acceleration of pattern movement
      const velocities = patterns.slice(1).map((p, i) => ({
        x: p.resonanceField.center.x - patterns[i].resonanceField.center.x,
        y: p.resonanceField.center.y - patterns[i].resonanceField.center.y
      }));

      const accelerations = velocities.slice(1).map((v, i) => ({
        x: v.x - velocities[i].x,
        y: v.y - velocities[i].y
      }));

      // Predict future positions
      const lastPattern = patterns[patterns.length - 1];
      const lastVelocity = velocities[velocities.length - 1];
      const lastAcceleration = accelerations[accelerations.length - 1];

      for (let i = 0; i < 3; i++) {
        const timeStep = i + 1;
        predictions.push({
          center: {
            x: lastPattern.resonanceField.center.x + lastVelocity.x * timeStep + 0.5 * lastAcceleration.x * timeStep * timeStep,
            y: lastPattern.resonanceField.center.y + lastVelocity.y * timeStep + 0.5 * lastAcceleration.y * timeStep * timeStep,
            z: lastPattern.resonanceField.center.z
          },
          radius: lastPattern.resonanceField.radius * (1 + i * 0.1),
          type: lastPattern.patternType
        });
      }

      return predictions;
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [patterns, mappings, imaginaryField, patternHistory, canvasSize]);

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
        zIndex: 2
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

export default AnalogicalVisualizer; 