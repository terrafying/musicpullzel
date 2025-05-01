import React, { useEffect, useRef } from 'react';
import { PuzzleState } from 'puzzle-core';

interface MusicalWebGLVisualizerProps {
  puzzleState: PuzzleState;
  onBubbleClick: (position: number) => void;
}

const vertexShaderSource = `
  attribute vec4 position;
  attribute vec4 color;
  attribute float frequency;
  attribute float active;
  
  uniform mat4 projection;
  uniform mat4 modelView;
  uniform float time;
  
  varying vec4 vColor;
  varying float vFrequency;
  varying float vActive;
  
  void main() {
    // Calculate wave motion based on frequency
    float wave = sin(frequency * time * 0.001) * 0.1;
    vec4 pos = position;
    pos.y += wave * active;
    
    // Add spiral motion
    float angle = time * 0.001;
    float radius = length(pos.xy);
    float newAngle = atan(pos.y, pos.x) + angle * 0.2;
    pos.x = radius * cos(newAngle);
    pos.y = radius * sin(newAngle);
    
    gl_Position = projection * modelView * pos;
    vColor = color;
    vFrequency = frequency;
    vActive = active;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  
  varying vec4 vColor;
  varying float vFrequency;
  varying float vActive;
  
  uniform float time;
  
  void main() {
    // Add pulsing glow effect
    float pulse = sin(time * 0.002 + vFrequency * 0.1) * 0.5 + 0.5;
    vec4 glowColor = vColor * (0.5 + pulse * 0.5);
    
    // Add frequency-based color modulation
    float hue = mod(vFrequency * 0.1, 1.0);
    vec3 rgb = vec3(
      sin(hue * 6.28318 + 0.0) * 0.5 + 0.5,
      sin(hue * 6.28318 + 2.094) * 0.5 + 0.5,
      sin(hue * 6.28318 + 4.189) * 0.5 + 0.5
    );
    
    // Mix colors based on active state
    vec4 finalColor = mix(glowColor, vec4(rgb, 1.0), vActive * 0.5);
    
    gl_FragColor = finalColor;
  }
`;

export const MusicalWebGLVisualizer: React.FC<MusicalWebGLVisualizerProps> = ({
  puzzleState,
  onBubbleClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const timeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    glRef.current = gl;

    // Create shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    programRef.current = program;

    // Set up attributes and uniforms
    const positionLocation = gl.getAttribLocation(program, 'position');
    const colorLocation = gl.getAttribLocation(program, 'color');
    const frequencyLocation = gl.getAttribLocation(program, 'frequency');
    const activeLocation = gl.getAttribLocation(program, 'active');
    const projectionLocation = gl.getUniformLocation(program, 'projection');
    const modelViewLocation = gl.getUniformLocation(program, 'modelView');
    const timeLocation = gl.getUniformLocation(program, 'time');

    // Create buffers
    const positionBuffer = gl.createBuffer();
    const colorBuffer = gl.createBuffer();
    const frequencyBuffer = gl.createBuffer();
    const activeBuffer = gl.createBuffer();

    // Set up projection matrix
    const projectionMatrix = new Float32Array([
      2 / canvas.width, 0, 0, 0,
      0, -2 / canvas.height, 0, 0,
      0, 0, 1, 0,
      -1, 1, 0, 1
    ]);

    // Animation loop
    const animate = (time: number) => {
      timeRef.current = time;
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Update bubble data
      const bubbles = puzzleState.get_bubbles();
      const positions: number[] = [];
      const colors: number[] = [];
      const frequencies: number[] = [];
      const activeStates: number[] = [];

      bubbles.forEach((bubble, i) => {
        const angle = (i / bubbles.length) * Math.PI * 2;
        const radius = 0.5;
        positions.push(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          0,
          1
        );

        // Convert color from u32 to RGBA
        const r = ((bubble.color >> 16) & 0xFF) / 255;
        const g = ((bubble.color >> 8) & 0xFF) / 255;
        const b = (bubble.color & 0xFF) / 255;
        colors.push(r, g, b, 1.0);

        frequencies.push(bubble.frequency);
        activeStates.push(bubble.active ? 1.0 : 0.0);
      });

      // Update buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 4, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(colorLocation);
      gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, frequencyBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(frequencies), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(frequencyLocation);
      gl.vertexAttribPointer(frequencyLocation, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, activeBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(activeStates), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(activeLocation);
      gl.vertexAttribPointer(activeLocation, 1, gl.FLOAT, false, 0, 0);

      // Set uniforms
      gl.useProgram(program);
      gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
      gl.uniformMatrix4fv(modelViewLocation, false, new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
      ]));
      gl.uniform1f(timeLocation, time);

      // Draw
      gl.drawArrays(gl.POINTS, 0, bubbles.length);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [puzzleState]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert click coordinates to normalized device coordinates
    const nx = (x / canvas.width) * 2 - 1;
    const ny = -((y / canvas.height) * 2 - 1);

    // Find closest bubble
    const bubbles = puzzleState.get_bubbles();
    let closestIndex = -1;
    let minDistance = Infinity;

    bubbles.forEach((bubble, i) => {
      const angle = (i / bubbles.length) * Math.PI * 2;
      const bx = Math.cos(angle) * 0.5;
      const by = Math.sin(angle) * 0.5;
      const distance = Math.sqrt((nx - bx) ** 2 + (ny - by) ** 2);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    });

    if (closestIndex !== -1 && minDistance < 0.2) {
      onBubbleClick(closestIndex);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onClick={handleCanvasClick}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        background: 'linear-gradient(to bottom, #1a1a1a, #000000)'
      }}
    />
  );
}; 