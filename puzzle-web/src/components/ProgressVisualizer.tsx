import React, { useEffect, useRef } from 'react';
import { Monster } from '../services/monsterService';

interface ProgressVisualizerProps {
  monsters: Monster[];
  totalPatterns: number;
  defeatedPatterns: number;
  learningEfficiency: number;
  canvasSize: { width: number; height: number };
}

export const ProgressVisualizer: React.FC<ProgressVisualizerProps> = ({
  monsters,
  totalPatterns,
  defeatedPatterns,
  learningEfficiency,
  canvasSize
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw progress rings
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;

    // Draw background rings
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 20;
    ctx.stroke();

    // Draw pattern progress
    const patternProgress = defeatedPatterns / totalPatterns;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * patternProgress);
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 20;
    ctx.stroke();

    // Draw learning efficiency
    const efficiencyRadius = maxRadius * 0.8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, efficiencyRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * learningEfficiency);
    ctx.strokeStyle = '#63f5aa';
    ctx.lineWidth = 15;
    ctx.stroke();

    // Draw monster indicators
    const monsterRadius = maxRadius * 0.6;
    monsters.forEach((monster, index) => {
      const angle = (index / monsters.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * monsterRadius;
      const y = centerY + Math.sin(angle) * monsterRadius;

      // Draw monster type indicator
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = monster.type === 'harmonic' ? '#ff6b6b' :
                     monster.type === 'rhythmic' ? '#4dabf7' : '#845ef7';
      ctx.fill();

      // Draw health indicator
      const healthRadius = 15;
      ctx.beginPath();
      ctx.arc(x, y, healthRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw health fill
      ctx.beginPath();
      ctx.arc(x, y, healthRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (monster.health / monster.maxHealth));
      ctx.strokeStyle = '#51cf66';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw semantic indicators
    const semanticRadius = maxRadius * 0.4;
    const semanticPoints = [
      { label: 'Pattern Mastery', value: patternProgress },
      { label: 'Learning', value: learningEfficiency },
      { label: 'Adaptation', value: monsters.reduce((sum, m) => sum + m.score.adaptations, 0) / 10 }
    ];

    semanticPoints.forEach((point, index) => {
      const angle = (index / semanticPoints.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * semanticRadius;
      const y = centerY + Math.sin(angle) * semanticRadius;

      // Draw semantic point
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${point.value})`;
      ctx.fill();

      // Draw label
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, x, y + 20);
    });

  }, [monsters, totalPatterns, defeatedPatterns, learningEfficiency, canvasSize]);

  return (
    <canvas
      ref={canvasRef}
      className="progress-visualizer"
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