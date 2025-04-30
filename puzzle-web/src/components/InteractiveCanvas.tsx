import React, { useRef, useEffect, useState } from 'react';
import { EmergentPattern } from '../services/types';

interface InteractiveCanvasProps {
  patterns: EmergentPattern[];
  canvasSize: { width: number; height: number };
  onConnectionDrawn: (from: number, to: number, strength: number) => void;
  onShapeMoved: (index: number, x: number, y: number) => void;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  startIndex: number;
  currentX: number;
  currentY: number;
}

interface MovingState {
  isMoving: boolean;
  index: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  patterns,
  canvasSize,
  onConnectionDrawn,
  onShapeMoved
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawingState, setDrawingState] = useState<DrawingState | null>(null);
  const [movingState, setMovingState] = useState<MovingState | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Initialize canvas
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

    // Draw existing connections
    patterns.forEach((pattern, index) => {
      pattern.connections.forEach(conn => {
        const fromPattern = patterns[conn.from];
        const toPattern = patterns[conn.to];
        
        if (fromPattern && toPattern) {
          drawConnection(ctx, fromPattern, toPattern, conn.strength);
        }
      });
    });

    // Draw current drawing line if active
    if (drawingState) {
      ctx.beginPath();
      ctx.moveTo(drawingState.startX, drawingState.startY);
      ctx.lineTo(drawingState.currentX, drawingState.currentY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [patterns, canvasSize, drawingState]);

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on a pattern
    const clickedIndex = findPatternAtPosition(x, y);
    
    if (clickedIndex !== null) {
      // Start drawing a connection
      setDrawingState({
        isDrawing: true,
        startX: x,
        startY: y,
        startIndex: clickedIndex,
        currentX: x,
        currentY: y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update hover state
    const hovered = findPatternAtPosition(x, y);
    setHoveredIndex(hovered);

    // Update drawing state if active
    if (drawingState) {
      setDrawingState({
        ...drawingState,
        currentX: x,
        currentY: y
      });
    }

    // Update moving state if active
    if (movingState) {
      const newX = x - movingState.offsetX;
      const newY = y - movingState.offsetY;
      onShapeMoved(movingState.index, newX, newY);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawingState) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if released on a pattern
      const endIndex = findPatternAtPosition(x, y);
      
      if (endIndex !== null && endIndex !== drawingState.startIndex) {
        // Calculate connection strength based on distance
        const distance = Math.hypot(
          x - drawingState.startX,
          y - drawingState.startY
        );
        const strength = Math.max(0, 1 - distance / 200); // Normalize to 0-1 range

        onConnectionDrawn(drawingState.startIndex, endIndex, strength);
      }

      setDrawingState(null);
    }

    setMovingState(null);
  };

  // Helper function to find pattern at position
  const findPatternAtPosition = (x: number, y: number): number | null => {
    return patterns.findIndex(pattern => {
      const dx = x - pattern.position.x;
      const dy = y - pattern.position.y;
      return Math.hypot(dx, dy) < 30; // 30px radius for clicking
    });
  };

  // Helper function to draw a connection
  const drawConnection = (
    ctx: CanvasRenderingContext2D,
    from: EmergentPattern,
    to: EmergentPattern,
    strength: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(from.position.x, from.position.y);
    ctx.lineTo(to.position.x, to.position.y);
    
    // Set line style based on strength
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + strength * 0.7})`;
    ctx.lineWidth = 1 + strength * 3;
    ctx.stroke();

    // Draw arrow head
    const angle = Math.atan2(
      to.position.y - from.position.y,
      to.position.x - from.position.x
    );
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(to.position.x, to.position.y);
    ctx.lineTo(
      to.position.x - arrowLength * Math.cos(angle - arrowAngle),
      to.position.y - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      to.position.x - arrowLength * Math.cos(angle + arrowAngle),
      to.position.y - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + strength * 0.7})`;
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      className="interactive-canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'all',
        cursor: drawingState ? 'crosshair' : 'default'
      }}
    />
  );
}; 