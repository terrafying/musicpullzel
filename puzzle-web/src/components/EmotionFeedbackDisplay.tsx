import React, { useEffect, useRef, useState } from 'react';
import { EmotionService } from '../services/emotionService';
import { GestaltMapper } from '../services/gestaltMapper';
import { Logger } from '../services/logger';

interface EmotionFeedbackDisplayProps {
  emotionService: EmotionService;
  onEmotionalStateChange: (state: any) => void;
}

interface EmotionalState {
  currentEmotion: string;
  emotionalStability: number;
  engagement: number;
  homeostasis: {
    stability: number;
    adaptation: number;
    resonance: number;
    coherence: number;
  };
  resonance: number;
  timestamp: number;
}

const EMOTION_EMOJIS: Record<string, string> = {
  neutral: '😐',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  disgusted: '🤢',
  surprised: '😲'
};

const EMOTION_COLORS: Record<string, string> = {
  neutral: '#808080',
  happy: '#FFD700',
  sad: '#4169E1',
  angry: '#FF4500',
  fearful: '#800080',
  disgusted: '#228B22',
  surprised: '#FFA500'
};

export const EmotionFeedbackDisplay: React.FC<EmotionFeedbackDisplayProps> = ({
  emotionService,
  onEmotionalStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    latency: 0,
    confidence: 0,
    stability: 0
  });
  const [gestaltMapper] = useState(() => new GestaltMapper());
  const [logger] = useState(() => Logger.create('EmotionFeedbackDisplay'));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const render = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setPerformanceMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }

      const emotionalState = emotionService.getEmotionalState() as EmotionalState;
      const { currentEmotion, emotionalStability, engagement, homeostasis, resonance } = emotionalState;

      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        stability: emotionalStability,
        confidence: engagement,
        latency: performance.now() - emotionalState.timestamp
      }));

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw emotion visualization
      const gestaltObject = gestaltMapper.mapEmotionToGestalt(emotionalState);
      drawGestaltObject(ctx, gestaltObject);

      // Draw movie-style effects
      drawMovieEffects(ctx, emotionalState);

      // Draw debug overlay if enabled
      if (debugMode) {
        drawDebugOverlay(ctx, emotionalState, performanceMetrics);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [emotionService, debugMode, gestaltMapper]);

  const drawGestaltObject = (ctx: CanvasRenderingContext2D, gestalt: any) => {
    const { color, shape, motion } = gestalt;
    
    ctx.save();
    ctx.globalAlpha = color.alpha;
    ctx.fillStyle = `hsl(${color.hue}, ${color.saturation}%, ${color.brightness}%)`;
    
    const centerX = ctx.canvas.width / 2;
    const centerY = ctx.canvas.height / 2;
    
    // Apply motion effects
    const time = performance.now() / 1000;
    const x = centerX + Math.sin(time * motion.speed) * motion.amplitude;
    const y = centerY + Math.cos(time * motion.speed) * motion.amplitude;
    
    switch (shape.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, shape.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(x - shape.size/2, y - shape.size/2, shape.size, shape.size);
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(x, y - shape.size);
        ctx.lineTo(x + shape.size, y + shape.size);
        ctx.lineTo(x - shape.size, y + shape.size);
        ctx.closePath();
        ctx.fill();
        break;
      case 'wave':
        drawWave(ctx, x, y, shape.size, time);
        break;
      case 'spiral':
        drawSpiral(ctx, x, y, shape.size, time);
        break;
    }
    
    ctx.restore();
  };

  const drawWave = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number) => {
    ctx.beginPath();
    for (let i = 0; i < size * 2; i++) {
      const waveX = x + i - size;
      const waveY = y + Math.sin(i * 0.1 + time) * 20;
      if (i === 0) ctx.moveTo(waveX, waveY);
      else ctx.lineTo(waveX, waveY);
    }
    ctx.stroke();
  };

  const drawSpiral = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number) => {
    ctx.beginPath();
    for (let i = 0; i < Math.PI * 4; i += 0.1) {
      const radius = i * size / 10;
      const spiralX = x + Math.cos(i + time) * radius;
      const spiralY = y + Math.sin(i + time) * radius;
      if (i === 0) ctx.moveTo(spiralX, spiralY);
      else ctx.lineTo(spiralX, spiralY);
    }
    ctx.stroke();
  };

  const drawMovieEffects = (ctx: CanvasRenderingContext2D, emotionalState: any) => {
    const { currentEmotion, emotionalStability } = emotionalState;
    
    // Draw vignette effect
    const gradient = ctx.createRadialGradient(
      ctx.canvas.width/2, ctx.canvas.height/2, 0,
      ctx.canvas.width/2, ctx.canvas.height/2, ctx.canvas.width/2
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${0.3 + emotionalStability * 0.2})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw emotion-specific effects
    switch (currentEmotion) {
      case 'happy':
        drawSparkles(ctx);
        break;
      case 'sad':
        drawRain(ctx);
        break;
      case 'angry':
        drawFire(ctx);
        break;
      case 'fearful':
        drawShadows(ctx);
        break;
    }
  };

  const drawSparkles = (ctx: CanvasRenderingContext2D) => {
    const time = performance.now() / 1000;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * ctx.canvas.width;
      const y = Math.random() * ctx.canvas.height;
      const size = Math.sin(time + i) * 2 + 2;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(time + i) * 0.5 + 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawRain = (ctx: CanvasRenderingContext2D) => {
    const time = performance.now() / 1000;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 50; i++) {
      const x = (i * ctx.canvas.width / 50) + Math.sin(time + i) * 10;
      const y = ((time * 100 + i * 20) % ctx.canvas.height);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 5, y + 10);
      ctx.stroke();
    }
  };

  const drawFire = (ctx: CanvasRenderingContext2D) => {
    const time = performance.now() / 1000;
    const gradient = ctx.createLinearGradient(0, ctx.canvas.height, 0, 0);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  const drawShadows = (ctx: CanvasRenderingContext2D) => {
    const time = performance.now() / 1000;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 5; i++) {
      const x = Math.sin(time + i) * ctx.canvas.width/2 + ctx.canvas.width/2;
      const y = Math.cos(time + i) * ctx.canvas.height/2 + ctx.canvas.height/2;
      ctx.beginPath();
      ctx.arc(x, y, 50 + Math.sin(time * 2 + i) * 20, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawDebugOverlay = (ctx: CanvasRenderingContext2D, emotionalState: any, metrics: any) => {
    const { currentEmotion, emotionalStability, engagement, homeostasis } = emotionalState;
    
    // Draw debug panel background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 200, 150);
    
    // Draw metrics
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.fillText(`FPS: ${metrics.fps}`, 20, 30);
    ctx.fillText(`Latency: ${metrics.latency.toFixed(1)}ms`, 20, 50);
    ctx.fillText(`Stability: ${(emotionalStability * 100).toFixed(1)}%`, 20, 70);
    ctx.fillText(`Engagement: ${(engagement * 100).toFixed(1)}%`, 20, 90);
    
    // Draw emotion emoji
    ctx.font = '24px Arial';
    ctx.fillText(EMOTION_EMOJIS[currentEmotion], 20, 120);
    
    // Draw homeostasis indicators
    const barWidth = 150;
    const barHeight = 8;
    const barY = 140;
    
    Object.entries(homeostasis).forEach(([key, value], index) => {
      const y = barY + index * 20;
      ctx.fillStyle = '#333333';
      ctx.fillRect(20, y, barWidth, barHeight);
      ctx.fillStyle = EMOTION_COLORS[currentEmotion];
      ctx.fillRect(20, y, barWidth * (value as number), barHeight);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(key, 20 + barWidth + 10, y + barHeight);
    });
  };

  return (
    <div className="emotion-feedback">
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        className="emotion-canvas"
      />
      <div className="emotion-controls">
        <button onClick={() => setDebugMode(!debugMode)}>
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </button>
        <button onClick={() => setShowMetrics(!showMetrics)}>
          {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
        </button>
      </div>
      {showMetrics && (
        <div className="emotion-metrics">
          <div>FPS: {performanceMetrics.fps}</div>
          <div>Latency: {performanceMetrics.latency.toFixed(1)}ms</div>
          <div>Stability: {(performanceMetrics.stability * 100).toFixed(1)}%</div>
          <div>Confidence: {(performanceMetrics.confidence * 100).toFixed(1)}%</div>
        </div>
      )}
    </div>
  );
}; 