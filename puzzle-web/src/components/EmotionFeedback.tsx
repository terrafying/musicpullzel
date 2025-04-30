import React, { useEffect, useRef } from 'react';
import { EmotionService, EmotionFeedback } from '../services/emotionService';

interface EmotionFeedbackProps {
  emotionService: EmotionService;
  onEmotionalStateChange?: (state: {
    currentEmotion: string;
    emotionalStability: number;
    engagement: number;
  }) => void;
}

export const EmotionFeedback: React.FC<EmotionFeedbackProps> = ({
  emotionService,
  onEmotionalStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emotionHistoryRef = useRef<EmotionFeedback[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawEmotionFeedback = () => {
      const emotions = emotionService.getRecentEmotions();
      emotionHistoryRef.current = emotions;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw emotion history
      const barWidth = canvas.width / emotions.length;
      emotions.forEach((emotion, index) => {
        const x = index * barWidth;
        const height = emotion.intensity * canvas.height;
        
        // Set color based on emotion
        ctx.fillStyle = getEmotionColor(emotion.dominantEmotion);
        ctx.globalAlpha = emotion.confidence;
        
        ctx.fillRect(x, canvas.height - height, barWidth - 1, height);
      });

      // Draw emotional state
      const state = emotionService.getEmotionalState();
      if (onEmotionalStateChange) {
        onEmotionalStateChange(state);
      }

      // Draw current emotion label
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${state.currentEmotion} (${Math.round(state.engagement * 100)}%)`,
        canvas.width / 2,
        20
      );

      requestAnimationFrame(drawEmotionFeedback);
    };

    drawEmotionFeedback();
  }, [emotionService, onEmotionalStateChange]);

  return (
    <div className="emotion-feedback">
      <canvas
        ref={canvasRef}
        width={200}
        height={100}
        className="emotion-canvas"
      />
    </div>
  );
};

function getEmotionColor(emotion: string): string {
  const colors: { [key: string]: string } = {
    neutral: '#808080',
    happy: '#FFD700',
    sad: '#4169E1',
    angry: '#FF4500',
    fearful: '#800080',
    disgusted: '#228B22',
    surprised: '#FFA500'
  };
  return colors[emotion] || colors.neutral;
} 