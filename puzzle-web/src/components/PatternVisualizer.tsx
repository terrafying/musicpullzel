import React, { useEffect, useRef } from 'react';
import { PatternGenerator } from '../services/PatternGenerator';
import { Note } from '../types/Note';

interface PatternVisualizerProps {
  patternGenerator: PatternGenerator;
  width?: number;
  height?: number;
}

export const PatternVisualizer: React.FC<PatternVisualizerProps> = ({
  patternGenerator,
  width = 800,
  height = 400
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !patternGenerator) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPattern = () => {
      const pattern = patternGenerator.getCurrentPattern();
      if (!pattern) return;
      
      ctx.clearRect(0, 0, width, height);
      
      const cellWidth = width / pattern.length;
      const cellHeight = height / 5; // 5 rows for the pattern

      pattern.forEach((node, index) => {
        if (!node) return;
        
        const x = index * cellWidth;
        const y = (height - cellHeight) / 2;

        // Draw symbol
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = getSymbolColor(node.symbol);
        ctx.fillText(node.symbol, x + cellWidth / 2, y + cellHeight / 2);

        // Draw frequency line
        ctx.beginPath();
        ctx.moveTo(x, y + cellHeight);
        ctx.lineTo(x + cellWidth, y + cellHeight);
        ctx.strokeStyle = getSymbolColor(node.symbol);
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    };

    drawPattern();

    // Update pattern every second
    const interval = setInterval(() => {
      if (patternGenerator) {
        patternGenerator.evolvePattern();
        drawPattern();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [patternGenerator, width, height]);

  return (
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
  );
};

const getSymbolColor = (symbol: string): string => {
  switch (symbol) {
    case '•': return '#FF6B6B'; // Quantum red
    case '∘': return '#4ECDC4'; // Pattern teal
    case '×': return '#45B7D1'; // Feedback blue
    default: return '#000000';
  }
}; 