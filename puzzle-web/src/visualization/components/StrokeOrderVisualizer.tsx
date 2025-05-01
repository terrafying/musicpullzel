import React, { useEffect, useRef } from 'react';
import { StrokeOrderConfig, LanguageMode, MusicalPattern, StrokeData } from '../types/strokeOrder';
import { useStrokeOrderState } from '../hooks/useStrokeOrderState';
import { TelemetryService } from '../../../services/telemetry';

interface Props {
    config: StrokeOrderConfig;
    onStrokeComplete?: (strokeIndex: number) => void;
    onComplete?: () => void;
}

export const StrokeOrderVisualizer: React.FC<Props> = ({
    config,
    onStrokeComplete,
    onComplete
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const telemetry = TelemetryService.getInstance();
    const {
        state,
        updateConfig,
        updateCurrentStroke,
        addStrokeToHistory,
        getMusicalPattern,
        getEnglishFeedback
    } = useStrokeOrderState();

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Initialize audio context
        audioContextRef.current = new AudioContext();

        // Set up canvas
        canvas.width = config.canvasSize;
        canvas.height = config.canvasSize;

        // Update state with initial config
        updateConfig(config);

        // Draw initial state
        drawHanzi(ctx);

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [config.canvasSize]);

    const drawHanzi = (ctx: CanvasRenderingContext2D) => {
        // Clear canvas
        ctx.clearRect(0, 0, state.config.canvasSize, state.config.canvasSize);

        // Draw completed strokes
        ctx.strokeStyle = state.config.colors.completed;
        ctx.lineWidth = state.config.strokeWidth;
        state.strokeHistory.forEach((stroke, index) => {
            if (index < state.currentStroke) {
                drawStroke(ctx, stroke);
            }
        });

        // Draw current stroke
        if (state.currentStroke < state.strokeHistory.length) {
            ctx.strokeStyle = state.config.colors.current;
            drawStroke(ctx, state.strokeHistory[state.currentStroke]);
        }

        // Draw pending strokes
        ctx.strokeStyle = state.config.colors.pending;
        // TODO: Implement pending strokes drawing
    };

    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: StrokeData) => {
        ctx.beginPath();
        ctx.moveTo(stroke.x, stroke.y);
        // TODO: Implement actual stroke drawing logic
        ctx.stroke();
    };

    const playStroke = async (strokeIndex: number, velocity: number) => {
        if (!audioContextRef.current) return;

        const strokeType = getStrokeType(strokeIndex);
        const pattern = getMusicalPattern(strokeType);
        
        await playNoteWithPattern(
            getStrokeNote(strokeIndex),
            velocity,
            getStrokeDuration(strokeIndex),
            pattern
        );

        if (state.config.language.mode === 'en') {
            const feedback = getEnglishFeedback(strokeType);
            if (state.config.language.audio) {
                speakHint(feedback);
            }
            if (state.config.language.visual) {
                showHint(feedback);
            }
        }

        updateCurrentStroke(strokeIndex);
        onStrokeComplete?.(strokeIndex);
    };

    const playNoteWithPattern = async (
        note: number,
        velocity: number,
        duration: number,
        pattern: MusicalPattern
    ) => {
        if (!audioContextRef.current) return;

        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();
        const filter = audioContextRef.current.createBiquadFilter();
        
        oscillator.type = pattern.waveform;
        oscillator.frequency.setValueAtTime(
            midiNoteToFrequency(note),
            audioContextRef.current.currentTime
        );
        
        filter.type = pattern.filterType;
        filter.frequency.setValueAtTime(pattern.filterFreq, audioContextRef.current.currentTime);
        filter.Q.setValueAtTime(pattern.filterQ, audioContextRef.current.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            velocity / 127,
            audioContextRef.current.currentTime + pattern.attack
        );
        gainNode.gain.linearRampToValueAtTime(
            velocity / 127 * pattern.sustain,
            audioContextRef.current.currentTime + pattern.attack + pattern.decay
        );
        gainNode.gain.linearRampToValueAtTime(
            0,
            audioContextRef.current.currentTime + duration
        );
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        
        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + duration);
    };

    const getStrokeType = (strokeIndex: number): string => {
        // TODO: Implement actual stroke type detection
        return 'horizontal';
    };

    const getStrokeNote = (strokeIndex: number): number => {
        // TODO: Implement actual note mapping
        return 60 + strokeIndex;
    };

    const getStrokeDuration = (strokeIndex: number): number => {
        // TODO: Implement actual duration calculation
        return 0.5;
    };

    const midiNoteToFrequency = (note: number): number => {
        return 440 * Math.pow(2, (note - 69) / 12);
    };

    const speakHint = (hint: string): void => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(hint);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
            telemetry.debug('Spoke hint', { hint });
        }
    };

    const showHint = (hint: string): void => {
        const hintElement = document.createElement('div');
        hintElement.className = 'stroke-hint';
        hintElement.textContent = hint;
        document.body.appendChild(hintElement);
        
        setTimeout(() => {
            hintElement.remove();
        }, 2000);
        
        telemetry.debug('Showed hint', { hint });
    };

    return (
        <div className="stroke-order-visualizer">
            <canvas
                ref={canvasRef}
                className="stroke-canvas"
                style={{
                    width: config.canvasSize,
                    height: config.canvasSize,
                    border: '1px solid #ccc'
                }}
            />
        </div>
    );
}; 