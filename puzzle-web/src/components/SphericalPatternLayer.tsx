import React, { useEffect, useRef, useState } from 'react';
import { RhizomaticPatternProcessor } from '../services/RhizomaticPatternProcessor';
import { PatternGenerator } from '../services/PatternGenerator';

interface OrbitalState {
  angle: number;
  velocity: number;
  radius: number;
  phase: number;
}

interface SphericalPatternLayerProps {
  width?: number;
  height?: number;
}

interface FeedbackData {
  intensity: number;
  improvement: number;
  stochastic: number;
}

export const SphericalPatternLayer: React.FC<SphericalPatternLayerProps> = ({
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processor] = useState(() => {
    const patternGenerator = new PatternGenerator();
    return new RhizomaticPatternProcessor(patternGenerator);
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [orbitalStates, setOrbitalStates] = useState<Map<string, OrbitalState>>(new Map());
  const [feedbackBuffer, setFeedbackBuffer] = useState<FeedbackData[][]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initializeOrbitalState = (nodeId: string): OrbitalState => ({
      angle: Math.random() * Math.PI * 2,
      velocity: 0.01 + Math.random() * 0.02,
      radius: 0.8 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2
    });

    const updateOrbitalState = (state: OrbitalState, interference: number): OrbitalState => {
      const stochasticFactor = 0.001 * (Math.random() - 0.5);
      const feedbackFactor = interference * 0.1;
      
      return {
        ...state,
        angle: (state.angle + state.velocity + stochasticFactor) % (Math.PI * 2),
        velocity: state.velocity * (1 + feedbackFactor),
        radius: state.radius * (1 + Math.sin(state.phase) * 0.05),
        phase: (state.phase + 0.01) % (Math.PI * 2)
      };
    };

    const drawLayer = () => {
      processor.processPattern();
      const state = processor.getPatternState();
      
      // Update feedback buffer
      const newBuffer: FeedbackData[] = Array.from(state.nodes.entries()).map(([_, node]) => ({
        intensity: node.intensity,
        improvement: node.improvement,
        stochastic: Math.random()
      }));
      setFeedbackBuffer(prev => [...prev.slice(-10), newBuffer]);
      
      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = Math.min(width, height) / 3;
      
      // Draw static interference background
      ctx.globalAlpha = 0.05;
      for (let i = 0; i < 20; i++) {
        const radius = baseRadius * (1 + Math.sin(Date.now() * 0.001 + i) * 0.1);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Draw audio waveform layer with feedback
      const nodes = Array.from(state.nodes.entries());
      const audioLayer = ctx.createLinearGradient(0, 0, width, 0);
      
      nodes.forEach(([_, node], index) => {
        const position = index / nodes.length;
        const color = getNodeColor(node.symbol);
        const feedback = feedbackBuffer[feedbackBuffer.length - 1]?.[index]?.intensity || 0;
        audioLayer.addColorStop(position, adjustColor(color, feedback));
      });
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = audioLayer;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      
      // Draw layered interference patterns
      nodes.forEach(([nodeId, node]) => {
        node.connections.forEach(connectedId => {
          const connectedNode = nodes.find(([id]) => id === connectedId);
          if (connectedNode) {
            const interference = state.interference.get(`${nodeId}-${connectedId}`) || 0;
            
            // Draw multiple interference waves with decreasing opacity
            for (let i = 0; i < 3; i++) {
              const waveRadius = baseRadius * (1 + interference * (1 + i * 0.2));
              const opacity = 0.2 / (i + 1);
              
              ctx.beginPath();
              ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
              ctx.strokeStyle = getNodeColor(node.symbol);
              ctx.globalAlpha = opacity;
              ctx.lineWidth = 2;
              ctx.stroke();
            }
          }
        });
      });
      
      // Draw pattern nodes with orbital dynamics
      ctx.globalAlpha = 1;
      nodes.forEach(([nodeId, node], index) => {
        if (!orbitalStates.has(nodeId)) {
          orbitalStates.set(nodeId, initializeOrbitalState(nodeId));
        }
        
        const orbitalState = orbitalStates.get(nodeId)!;
        const interference = Array.from(node.connections)
          .map(id => state.interference.get(`${nodeId}-${id}`) || 0)
          .reduce((a, b) => a + b, 0) / node.connections.size;
        
        const updatedState = updateOrbitalState(orbitalState, interference);
        orbitalStates.set(nodeId, updatedState);
        
        const x = centerX + baseRadius * updatedState.radius * Math.cos(updatedState.angle);
        const y = centerY + baseRadius * updatedState.radius * Math.sin(updatedState.angle);
        
        // Draw node glow with feedback
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 40);
        const baseColor = getNodeColor(node.symbol);
        const feedbackIntensity = feedbackBuffer[feedbackBuffer.length - 1]?.[index]?.improvement || 0;
        
        glow.addColorStop(0, adjustColor(baseColor, feedbackIntensity));
        glow.addColorStop(0.5, adjustColor(baseColor, feedbackIntensity * 0.5));
        glow.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        
        // Draw node with stochastic variation
        const nodeSize = 15 + Math.sin(Date.now() * 0.005 + index) * 2;
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();
        
        // Draw symbol with subtle movement
        const symbolOffset = Math.sin(Date.now() * 0.003 + index) * 2;
        ctx.font = '16px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.symbol, x, y + symbolOffset);
      });
    };

    drawLayer();

    if (isPlaying) {
      const interval = setInterval(drawLayer, 16);
      return () => clearInterval(interval);
    }
  }, [processor, width, height, isPlaying, orbitalStates, feedbackBuffer]);

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
          backgroundColor: '#000'
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
        <p>• Orbital dynamics with stochastic feedback</p>
        <p>∘ Layered interference patterns</p>
        <p>× Glow effects with memory</p>
        <p>• Static and stochastic elements</p>
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

const adjustColor = (color: string, factor: number): string => {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  
  const adjust = (c: number) => Math.min(255, Math.max(0, c + c * factor));
  
  return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`;
}; 