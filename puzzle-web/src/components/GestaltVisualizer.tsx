import React, { useEffect, useRef, useMemo, useState } from 'react';
import { GestaltObject } from '../services/gestaltMapper';

interface GestaltVisualizerProps {
  gestalt: GestaltObject;
  width?: number;
  height?: number;
  onAnimationFrame?: (time: number) => void;
  debug?: boolean;
}

interface DebugStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  shaderCompileTime: number;
  lastError?: string;
  performance: '🎬' | '🎥' | '📽️' | '🎭' | '🎪';
  status: '✨' | '⚡' | '🔥' | '💫' | '🌟';
}

export const GestaltVisualizer: React.FC<GestaltVisualizerProps> = ({
  gestalt,
  width = 400,
  height = 400,
  onAnimationFrame,
  debug = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const [debugStats, setDebugStats] = useState<DebugStats>({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    shaderCompileTime: 0,
    performance: '🎬',
    status: '✨'
  });
  const [error, setError] = useState<string | null>(null);

  const getPerformanceEmoji = (fps: number): '🎬' | '🎥' | '📽️' | '🎭' | '🎪' => {
    if (fps >= 60) return '🎬';  // Perfect performance
    if (fps >= 45) return '🎥';  // Good performance
    if (fps >= 30) return '📽️';  // Acceptable performance
    if (fps >= 15) return '🎭';  // Poor performance
    return '🎪';                 // Critical performance
  };

  const getStatusEmoji = (frameTime: number): '✨' | '⚡' | '🔥' | '💫' | '🌟' => {
    if (frameTime < 16) return '✨';  // Super smooth
    if (frameTime < 32) return '⚡';  // Smooth
    if (frameTime < 48) return '🔥';  // Normal
    if (frameTime < 64) return '💫';  // Choppy
    return '🌟';                      // Very choppy
  };

  // Update debug stats
  const updateDebugStats = (currentTime: number) => {
    const frameTime = currentTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = currentTime;
    
    frameCountRef.current++;
    if (currentTime - timeRef.current >= 1000) {
      setDebugStats(prev => ({
        ...prev,
        fps: frameCountRef.current,
        frameTime: frameTime,
        drawCalls: prev.drawCalls,
        performance: getPerformanceEmoji(frameCountRef.current),
        status: getStatusEmoji(frameTime)
      }));
      frameCountRef.current = 0;
      timeRef.current = currentTime;
    }
  };

  // Initialize WebGL context and shaders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const startTime = performance.now();
      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: true,
        depth: false,
        stencil: false,
        premultipliedAlpha: true
      });
      if (!gl) {
        throw new Error('WebGL not supported');
      }

      glRef.current = gl;

      // Create shader program
      const program = createShaderProgram(gl);
      if (!program) {
        throw new Error('Failed to create shader program');
      }

      programRef.current = program;
      gl.useProgram(program);

      // Set up viewport
      gl.viewport(0, 0, width, height);

      const compileTime = performance.now() - startTime;
      setDebugStats(prev => ({
        ...prev,
        shaderCompileTime: compileTime
      }));

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        gl.deleteProgram(program);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('WebGL initialization error:', err);
    }
  }, [width, height]);

  // Update shader uniforms when gestalt changes
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    try {
      // Update color uniform
      const colorLocation = gl.getUniformLocation(program, 'u_color');
      if (colorLocation) {
        const { hue, saturation, brightness, alpha } = gestalt.color;
        const rgb = hslToRgb(hue / 360, saturation, brightness);
        gl.uniform4f(colorLocation, rgb[0], rgb[1], rgb[2], alpha);
      }

      // Update shape uniform
      const shapeLocation = gl.getUniformLocation(program, 'u_shape');
      if (shapeLocation) {
        const { type, size, rotation, complexity } = gestalt.shape;
        gl.uniform4f(
          shapeLocation,
          getShapeTypeValue(type),
          size,
          rotation,
          complexity
        );
      }

      // Update motion uniform
      const motionLocation = gl.getUniformLocation(program, 'u_motion');
      if (motionLocation) {
        const { type, speed, amplitude, phase } = gestalt.motion;
        gl.uniform4f(
          motionLocation,
          getMotionTypeValue(type),
          speed,
          amplitude,
          phase
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Shader uniform update error:', err);
    }
  }, [gestalt]);

  // Animation loop
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const animate = (time: number) => {
      try {
        timeRef.current = time * 0.001; // Convert to seconds

        // Update time uniform
        const timeLocation = gl.getUniformLocation(program, 'u_time');
        if (timeLocation) {
          gl.uniform1f(timeLocation, timeRef.current);
        }

        // Clear and draw
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Update debug stats
        if (debug) {
          updateDebugStats(time);
          setDebugStats(prev => ({
            ...prev,
            drawCalls: prev.drawCalls + 1
          }));
        }

        // Call animation frame callback
        onAnimationFrame?.(timeRef.current);

        animationFrameRef.current = requestAnimationFrame(animate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Animation frame error:', err);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onAnimationFrame, debug]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'block',
          border: error ? '2px solid red' : 'none',
          boxShadow: error ? '0 0 20px rgba(255, 0, 0, 0.5)' : 'none',
          transition: 'all 0.3s ease'
        }}
      />
      {debug && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '14px',
            pointerEvents: 'none',
            borderRadius: '4px',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            paddingBottom: '8px'
          }}>
            <span style={{ fontSize: '24px' }}>{debugStats.performance}</span>
            <span style={{ fontSize: '24px' }}>{debugStats.status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', alignItems: 'center' }}>
            <span>🎯 FPS:</span>
            <span>{debugStats.fps}</span>
            <span>⏱️ Frame:</span>
            <span>{debugStats.frameTime.toFixed(2)}ms</span>
            <span>🎨 Draws:</span>
            <span>{debugStats.drawCalls}</span>
            <span>⚡ Shader:</span>
            <span>{debugStats.shaderCompileTime.toFixed(2)}ms</span>
          </div>
          {error && (
            <div style={{ 
              color: '#ff6b6b',
              marginTop: '8px',
              padding: '8px',
              background: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              animation: 'shake 0.5s ease'
            }}>
              <span style={{ marginRight: '8px' }}>⚠️</span>
              {error}
            </div>
          )}
        </div>
      )}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}
      </style>
    </div>
  );
};

// Helper functions
function createShaderProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) return null;

  // Vertex shader source
  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader source
  const fragmentSource = `
    precision mediump float;
    
    uniform vec4 u_color;
    uniform vec4 u_shape;
    uniform vec4 u_motion;
    uniform float u_time;
    
    varying vec2 v_uv;
    
    float shape(vec2 p, float type) {
      // Circle
      if (type < 0.2) {
        return length(p) - 0.5;
      }
      // Square
      else if (type < 0.4) {
        return max(abs(p.x), abs(p.y)) - 0.5;
      }
      // Triangle
      else if (type < 0.6) {
        vec2 q = abs(p);
        return max(q.x * 0.866025 + p.y * 0.5, -p.y * 0.5) - 0.5;
      }
      // Wave
      else if (type < 0.8) {
        return abs(p.y - sin(p.x * 3.14159 * 2.0) * 0.25) - 0.25;
      }
      // Spiral
      else {
        float r = length(p);
        float theta = atan(p.y, p.x);
        return abs(r - theta * 0.1) - 0.1;
      }
    }
    
    float motion(vec2 p, float type, float speed, float amplitude, float phase) {
      float t = u_time * speed + phase;
      
      // Oscillate
      if (type < 0.2) {
        return sin(t) * amplitude;
      }
      // Pulse
      else if (type < 0.4) {
        return (sin(t) * 0.5 + 0.5) * amplitude;
      }
      // Spiral
      else if (type < 0.6) {
        float r = length(p);
        return sin(t + r * 3.14159 * 2.0) * amplitude;
      }
      // Wave
      else if (type < 0.8) {
        return sin(t + p.x * 3.14159 * 2.0) * amplitude;
      }
      // Chaos
      else {
        return sin(t * 1.618033988749895) * cos(t * 0.618033988749895) * amplitude;
      }
    }
    
    void main() {
      vec2 p = v_uv * 2.0 - 1.0;
      
      // Apply motion
      p += motion(p, u_motion.x, u_motion.y, u_motion.z, u_motion.w);
      
      // Draw shape
      float d = shape(p, u_shape.x);
      float alpha = smoothstep(0.01, 0.0, abs(d));
      
      // Apply complexity
      float complexity = u_shape.w;
      alpha *= 1.0 + sin(d * 10.0 * complexity) * 0.1;
      
      gl_FragColor = vec4(u_color.rgb, u_color.a * alpha);
    }
  `;

  // Compile shaders
  gl.shaderSource(vertexShader, vertexSource);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);

  // Check for compilation errors
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
    return null;
  }
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
    return null;
  }

  // Create and link program
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    return null;
  }

  // Set up vertex buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  return program;
}

function getShapeTypeValue(type: string): number {
  switch (type) {
    case 'circle': return 0.1;
    case 'square': return 0.3;
    case 'triangle': return 0.5;
    case 'wave': return 0.7;
    case 'spiral': return 0.9;
    default: return 0.1;
  }
}

function getMotionTypeValue(type: string): number {
  switch (type) {
    case 'oscillate': return 0.1;
    case 'pulse': return 0.3;
    case 'spiral': return 0.5;
    case 'wave': return 0.7;
    case 'chaos': return 0.9;
    default: return 0.1;
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r, g, b];
}