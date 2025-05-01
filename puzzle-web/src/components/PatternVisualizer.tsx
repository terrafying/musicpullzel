import React, { useEffect, useRef } from 'react';
import { PatternGenerator } from '../services/PatternGenerator';
import { Note } from '../types/Note';

interface PatternVisualizerProps {
  patternGenerator: PatternGenerator;
  width?: number;
  height?: number;
}

// Cessation kernel visualization constants
const CESSATION_COLORS = {
  collapse: '#FF6B6B', // Quantum red
  decay: '#4ECDC4',    // Pattern teal
  resonance: '#45B7D1', // Feedback blue
  quantum: '#96CEB4'   // Quantum green
} as const;

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

        // Draw cessation kernel visualization
        drawCessationKernel(ctx, x, y, cellWidth, cellHeight, node);
      });
    };

    const drawCessationKernel = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      node: any
    ) => {
      const kernelType = getCessationKernelType(node);
      const color = CESSATION_COLORS[kernelType];
      
      // Draw pre-nullification wave
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      
      const points = 20;
      const amplitude = height * 0.2;
      const frequency = 2;
      
      for (let i = 0; i <= points; i++) {
        const t = i / points;
        const waveX = x + t * width;
        const waveY = y + height * 0.7 + 
          Math.sin(t * Math.PI * frequency) * amplitude * 
          (1 - t); // Decay factor
        
        if (i === 0) {
          ctx.moveTo(waveX, waveY);
        } else {
          ctx.lineTo(waveX, waveY);
        }
      }
      
      ctx.stroke();
      
      // Draw quantum collapse point
      const collapseX = x + width * 0.8;
      const collapseY = y + height * 0.7;
      
      ctx.beginPath();
      ctx.arc(collapseX, collapseY, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Draw collapse trajectory
      ctx.beginPath();
      ctx.moveTo(collapseX, collapseY);
      ctx.lineTo(collapseX + 10, collapseY + 10);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();
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

const getCessationKernelType = (node: any): keyof typeof CESSATION_COLORS => {
  // Determine kernel type based on node properties
  if (node.strength > 0.8) return 'collapse';
  if (node.strength > 0.6) return 'decay';
  if (node.strength > 0.4) return 'resonance';
  return 'quantum';
}; 