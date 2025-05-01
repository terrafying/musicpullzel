import React, { useEffect, useRef } from 'react';
import { NoteState } from '../services/audio/types';
import { Logger } from '../services/logger';

interface HelixVisualizerProps {
  activeNotes: Map<number, NoteState>;
  isDarkMode: boolean;
  timeSpread: number; // Controls how far in time patterns spread (in seconds)
  rotationSpeed: number; // Controls helix rotation speed
}

interface HelixPoint {
  x: number;
  y: number;
  z: number;
  frequency: number;
  timestamp: number;
  strand: 'forward' | 'backward';
}

const HelixVisualizer: React.FC<HelixVisualizerProps> = ({ 
  activeNotes, 
  isDarkMode,
  timeSpread = 3,
  rotationSpeed = 0.5
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const helixPointsRef = useRef<HelixPoint[]>([]);
  const logger = Logger.create('HelixVisualizer');

  // Constants for helix geometry
  const HELIX_RADIUS = 100;
  const HELIX_PITCH = 50; // Vertical distance between loops
  const POINTS_PER_LOOP = 32;
  const MAX_POINTS = 1000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = Date.now();

    // Update helix points
    const updateHelixPoints = () => {
      // Add new points for active notes
      activeNotes.forEach((note, frequency) => {
        // Create forward strand point
        helixPointsRef.current.push({
          x: 0, // Will be calculated during animation
          y: 0,
          z: 0,
          frequency,
          timestamp: now,
          strand: 'forward'
        });

        // Create backward strand point (mirrored)
        helixPointsRef.current.push({
          x: 0,
          y: 0,
          z: 0,
          frequency,
          timestamp: now,
          strand: 'backward'
        });
      });

      // Remove old points
      helixPointsRef.current = helixPointsRef.current
        .filter(point => (now - point.timestamp) / 1000 <= timeSpread)
        .slice(-MAX_POINTS);
    };

    const calculateHelixPosition = (point: HelixPoint, time: number) => {
      const age = (time - point.timestamp) / 1000;
      const phase = (age * rotationSpeed * Math.PI * 2) + (point.strand === 'backward' ? Math.PI : 0);
      const progress = age / timeSpread;

      return {
        x: canvas.width / 2 + Math.cos(phase) * HELIX_RADIUS,
        y: canvas.height / 2 + progress * canvas.height - canvas.height / 2,
        z: Math.sin(phase) * HELIX_RADIUS
      };
    };

    const drawHelix = (time: number) => {
      // Clear canvas
      ctx.fillStyle = isDarkMode ? '#1a1a1a' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sort points by Z for proper depth rendering
      const sortedPoints = [...helixPointsRef.current]
        .map(point => ({
          ...point,
          ...calculateHelixPosition(point, time)
        }))
        .sort((a, b) => b.z - a.z);

      // Draw connections between adjacent points on each strand
      ctx.lineWidth = 2;
      ['forward', 'backward'].forEach(strand => {
        const strandPoints = sortedPoints.filter(p => p.strand === strand);
        
        ctx.beginPath();
        ctx.strokeStyle = isDarkMode 
          ? `rgba(255, 255, 255, 0.3)`
          : `rgba(0, 0, 0, 0.3)`;

        strandPoints.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      });

      // Draw points
      sortedPoints.forEach(point => {
        const scale = (point.z + HELIX_RADIUS) / (HELIX_RADIUS * 2); // 0 to 1 based on z position
        const size = 5 + scale * 5;
        
        // Create gradient based on frequency and strand
        const hue = (point.frequency % 360) + (isDarkMode ? 180 : 0);
        const saturation = point.strand === 'forward' ? '100%' : '80%';
        const lightness = isDarkMode ? '60%' : '40%';
        const alpha = 0.3 + scale * 0.7;

        ctx.beginPath();
        ctx.fillStyle = `hsla(${hue}, ${saturation}, ${lightness}, ${alpha})`;
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines between strands (base pairs)
        const pairedPoint = sortedPoints.find(p => 
          p.strand !== point.strand && 
          Math.abs(p.y - point.y) < 5
        );

        if (pairedPoint) {
          ctx.beginPath();
          ctx.strokeStyle = `hsla(${hue}, 60%, ${isDarkMode ? '70%' : '30%'}, 0.2)`;
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(pairedPoint.x, pairedPoint.y);
          ctx.stroke();
        }
      });
    };

    const animate = (time: number) => {
      updateHelixPoints();
      drawHelix(time);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate(now);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeNotes, isDarkMode, timeSpread, rotationSpeed]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        boxShadow: isDarkMode 
          ? '0 0 20px rgba(0, 0, 0, 0.5)' 
          : '0 0 20px rgba(0, 0, 0, 0.2)'
      }}
    />
  );
};

export default HelixVisualizer; 