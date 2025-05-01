import React, { useEffect, useRef, useState } from 'react';
import { MultiModalProcessor } from '../services/MultiModalProcessor';
import { PatternGenerator } from '../services/PatternGenerator';

interface MultiModalPatternViewerProps {
  width?: number;
  height?: number;
}

export const MultiModalPatternViewer: React.FC<MultiModalPatternViewerProps> = ({
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processor] = useState(() => {
    const patternGenerator = new PatternGenerator();
    return new MultiModalProcessor(patternGenerator);
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPattern = () => {
      const output = processor.processPattern();
      ctx.clearRect(0, 0, width, height);

      // Draw visual pattern
      const cellWidth = width / output.visual.pattern.length;
      const cellHeight = height / 4; // Divide height for different modalities

      // Visual section
      output.visual.pattern.forEach((symbol, index) => {
        const x = index * cellWidth;
        const y = 0;

        // Draw symbol with intensity
        ctx.font = '24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = output.visual.color;
        ctx.globalAlpha = output.visual.intensity;
        ctx.fillText(symbol, x + cellWidth / 2, y + cellHeight / 2);
      });

      // Auditory visualization
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#4ECDC4';
      ctx.fillRect(0, cellHeight, width * output.auditory.amplitude, 20);

      // Haptic visualization
      output.haptic.pattern.forEach((intensity, index) => {
        const x = (index * width) / output.haptic.pattern.length;
        ctx.fillStyle = '#45B7D1';
        ctx.globalAlpha = intensity;
        ctx.fillRect(x, cellHeight * 2, width / output.haptic.pattern.length, 20);
      });

      // Olfactory visualization
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#FF6B6B';
      ctx.globalAlpha = output.olfactory.intensity;
      ctx.fillRect(0, cellHeight * 3, width, 20);

      // Draw labels
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.fillText('Visual', 10, 15);
      ctx.fillText('Auditory', 10, cellHeight + 15);
      ctx.fillText('Haptic', 10, cellHeight * 2 + 15);
      ctx.fillText('Olfactory', 10, cellHeight * 3 + 15);
    };

    drawPattern();

    if (isPlaying) {
      const interval = setInterval(() => {
        processor.processPattern();
        processor.playAudio();
        drawPattern();
      }, 1000);

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
        <p>• Visual: Color and intensity patterns</p>
        <p>∘ Auditory: Waveform and frequency visualization</p>
        <p>× Haptic: Vibration patterns (simulated)</p>
        <p>• Olfactory: Scent intensity (conceptual)</p>
      </div>
    </div>
  );
}; 