import React, { useEffect, useRef } from 'react';
import { Logger } from '../services/logger';

interface TestCase {
  id: string;
  name: string;
  status: 'passing' | 'pending' | 'failed';
  timestamp: number;
}

interface TestVisualizerProps {
  testCases: TestCase[];
  width?: number;
  height?: number;
  onTestCaseClick?: (testCase: TestCase) => void;
}

const SUCCESS_COLORS = {
  passing: '#4CAF50', // Material Design Green
  pending: '#FFC107', // Material Design Amber
  failed: '#F44336'   // Material Design Red
} as const;

export const TestVisualizer: React.FC<TestVisualizerProps> = ({
  testCases,
  width = 800,
  height = 400,
  onTestCaseClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logger = Logger.create('TestVisualizer');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawTestCase = (
      ctx: CanvasRenderingContext2D,
      testCase: TestCase,
      x: number,
      y: number,
      size: number
    ) => {
      // Draw circle
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = SUCCESS_COLORS[testCase.status];
      ctx.fill();

      // Draw checkmark for passing tests
      if (testCase.status === 'passing') {
        ctx.beginPath();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.moveTo(x - size / 4, y);
        ctx.lineTo(x - size / 8, y + size / 4);
        ctx.lineTo(x + size / 4, y - size / 4);
        ctx.stroke();
      }

      // Draw test case name
      ctx.fillStyle = '#000000';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(testCase.name, x, y + size / 2 + 5);

      // Draw timestamp
      const time = new Date(testCase.timestamp).toLocaleTimeString();
      ctx.font = '10px monospace';
      ctx.fillText(time, x, y + size / 2 + 20);
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Calculate grid layout
      const itemsPerRow = Math.floor(width / 120);
      const rows = Math.ceil(testCases.length / itemsPerRow);
      const cellWidth = width / itemsPerRow;
      const cellHeight = height / rows;

      testCases.forEach((testCase, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = col * cellWidth + cellWidth / 2;
        const y = row * cellHeight + cellHeight / 2;
        const size = Math.min(cellWidth, cellHeight) * 0.6;

        drawTestCase(ctx, testCase, x, y, size);
      });

      // Draw success rate
      const passingCount = testCases.filter(t => t.status === 'passing').length;
      const successRate = (passingCount / testCases.length) * 100;
      
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${successRate.toFixed(1)}%`, width - 20, height - 20);
    };

    draw();

    // Add click handler
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const itemsPerRow = Math.floor(width / 120);
      const cellWidth = width / itemsPerRow;
      const cellHeight = height / Math.ceil(testCases.length / itemsPerRow);

      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);
      const index = row * itemsPerRow + col;

      if (index >= 0 && index < testCases.length && onTestCaseClick) {
        onTestCaseClick(testCases[index]);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [testCases, width, height, onTestCaseClick]);

  return (
    <div className="test-visualizer">
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
    </div>
  );
}; 