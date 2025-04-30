import React, { useEffect, useRef } from 'react';
import { Monster } from '../services/monsterService';

interface MonsterRendererProps {
  monsters: Monster[];
  canvasSize: { width: number; height: number };
}

export const MonsterRenderer: React.FC<MonsterRendererProps> = ({
  monsters,
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

    // Draw monsters
    monsters.forEach(monster => {
      if (monster.state === 'defeated') return;

      // Draw monster body
      ctx.save();
      ctx.translate(monster.position.x, monster.position.y);
      ctx.rotate(monster.pattern.rotation);

      // Draw monster shape based on type
      ctx.beginPath();
      switch (monster.type) {
        case 'harmonic':
          // Draw harmonic monster (circular)
          ctx.arc(0, 0, 30, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(74, 144, 226, ${0.7 + monster.strength * 0.3})`;
          break;
        case 'rhythmic':
          // Draw rhythmic monster (square)
          ctx.rect(-25, -25, 50, 50);
          ctx.fillStyle = `rgba(99, 245, 170, ${0.7 + monster.strength * 0.3})`;
          break;
        case 'chaotic':
          // Draw chaotic monster (star)
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 30;
            const y = Math.sin(angle) * 30;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fillStyle = `rgba(255, 99, 132, ${0.7 + monster.strength * 0.3})`;
          break;
      }
      ctx.fill();

      // Draw health bar
      const healthBarWidth = 50;
      const healthBarHeight = 5;
      const healthPercentage = monster.health / monster.maxHealth;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-healthBarWidth / 2, -40, healthBarWidth, healthBarHeight);

      // Health
      ctx.fillStyle = healthPercentage > 0.5 ? '#4CAF50' : healthPercentage > 0.25 ? '#FFC107' : '#F44336';
      ctx.fillRect(-healthBarWidth / 2, -40, healthBarWidth * healthPercentage, healthBarHeight);

      // Draw pattern connections
      monster.pattern.connections.forEach(conn => {
        const startAngle = (conn.from * 2 * Math.PI) / monster.pattern.connections.length;
        const endAngle = (conn.to * 2 * Math.PI) / monster.pattern.connections.length;

        const startX = Math.cos(startAngle) * 20;
        const startY = Math.sin(startAngle) * 20;
        const endX = Math.cos(endAngle) * 20;
        const endY = Math.sin(endAngle) * 20;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + conn.strength * 0.7})`;
        ctx.lineWidth = 1 + conn.strength * 2;
        ctx.stroke();
      });

      // Draw state indicator
      if (monster.state !== 'idle') {
        ctx.beginPath();
        ctx.arc(0, 0, 35, 0, Math.PI * 2);
        ctx.strokeStyle = monster.state === 'attacking' ? '#F44336' : '#4CAF50';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    });
  }, [monsters, canvasSize]);

  return (
    <canvas
      ref={canvasRef}
      className="monster-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    />
  );
}; 