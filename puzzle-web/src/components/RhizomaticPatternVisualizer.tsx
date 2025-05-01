import React, { useEffect, useRef, useState } from 'react';
import { RhizomaticPatternProcessor } from '../services/RhizomaticPatternProcessor';
import { PatternGenerator } from '../services/PatternGenerator';

interface RhizomaticPatternVisualizerProps {
  width?: number;
  height?: number;
}

export const RhizomaticPatternVisualizer: React.FC<RhizomaticPatternVisualizerProps> = ({
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processor] = useState(() => {
    const patternGenerator = new PatternGenerator();
    return new RhizomaticPatternProcessor(patternGenerator);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [metrics, setMetrics] = useState({ cycles: 0, improvement: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPattern = () => {
      processor.processPattern();
      const state = processor.getPatternState();
      setMetrics(processor.getImprovementMetrics());

      ctx.clearRect(0, 0, width, height);

      // Draw nodes
      const nodes = Array.from(state.nodes.entries());
      const nodeRadius = 20;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;

      nodes.forEach(([nodeId, node], index) => {
        const angle = (index * 2 * Math.PI) / nodes.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        // Draw connections
        node.connections.forEach(connectedId => {
          const connectedNode = nodes.find(([id]) => id === connectedId);
          if (connectedNode) {
            const [_, connectedData] = connectedNode;
            const connectedIndex = nodes.findIndex(([id]) => id === connectedId);
            const connectedAngle = (connectedIndex * 2 * Math.PI) / nodes.length;
            const connectedX = centerX + radius * Math.cos(connectedAngle);
            const connectedY = centerY + radius * Math.sin(connectedAngle);

            const interference = state.interference.get(`${nodeId}-${connectedId}`) || 0;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(connectedX, connectedY);
            ctx.strokeStyle = `rgba(70, 183, 209, ${interference})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        ctx.fillStyle = getNodeColor(node.symbol);
        ctx.globalAlpha = node.intensity;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw symbol
        ctx.font = '16px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.symbol, x, y);

        // Draw improvement indicator
        const improvementRadius = nodeRadius * (1 + node.improvement);
        ctx.beginPath();
        ctx.arc(x, y, improvementRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 107, 107, ${node.improvement})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw metrics
      ctx.font = '14px monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.fillText(`Cycles: ${metrics.cycles}`, 10, 20);
      ctx.fillText(`Improvement: ${metrics.improvement.toFixed(4)}`, 10, 40);
    };

    drawPattern();

    if (isPlaying) {
      const interval = setInterval(drawPattern, 1000);
      return () => clearInterval(interval);
    }
  }, [processor, width, height, isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: '#f5f5f5'
        }}
      />
      <button
        onClick={togglePlay}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: isPlaying ? '#FF6B6B' : '#4ECDC4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>
      <div style={{ fontSize: '0.8rem', color: '#666' }}>
        <p>• Node intensity represents pattern strength</p>
        <p>∘ Connection opacity shows interference patterns</p>
        <p>× Outer rings indicate improvement cycles</p>
        <p>• Memory and interference drive pattern evolution</p>
      </div>
    </div>
  );
};

const getNodeColor = (symbol: string): string => {
  switch (symbol) {
    case '•': return '#FF6B6B';
    case '∘': return '#4ECDC4';
    case '×': return '#45B7D1';
    default: return '#000000';
  }
}; 