import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioContext, analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!canvasRef.current || !audioContext || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Create data array for frequency analysis
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Animation function
    const draw = () => {
      if (!ctx || !analyser) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Draw frequency bars
      const barWidth = width / dataArray.length * 2;
      const heightScale = height / 256;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = 'rgba(74, 144, 226, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let i = 0; i < dataArray.length; i++) {
        const x = i * barWidth;
        const barHeight = dataArray[i] * heightScale;
        
        // Create smooth curve
        if (i === 0) {
          ctx.moveTo(x, height - barHeight);
        } else {
          const xc = (x + (x - barWidth)) / 2;
          const yc = height - ((dataArray[i] + dataArray[i - 1]) / 2 * heightScale);
          ctx.quadraticCurveTo(x - barWidth, height - (dataArray[i - 1] * heightScale), xc, yc);
        }
      }

      // Complete the path
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      // Fill and stroke
      ctx.fill();
      ctx.stroke();

      // Add glow effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(74, 144, 226, 0.5)';

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Start animation
    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resize);
    };
  }, [audioContext, analyser]);

  return (
    <div className="audio-visualizer">
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '1rem',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      />
    </div>
  );
};

export default AudioVisualizer; 