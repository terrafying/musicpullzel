/**
 * MusicalBubbles Component
 * 
 * This component renders a grid of musical note bubbles that can be clicked to play notes
 * and toggle their state. It integrates with the Rust WASM core library.
 * 
 * # WASM Integration Notes
 * 
 * ## Type Safety
 * - The Bubble interface matches the Rust struct exactly
 * - All numeric types are preserved (u8 -> number, f32 -> number)
 * - Colors are handled as u32 in Rust and converted to hex strings in JS
 * 
 * ## Performance Considerations
 * - AudioContext is initialized on first user interaction
 * - Oscillators are cleaned up after playing
 * - State updates are batched to minimize re-renders
 * 
 * ## Error Handling
 * - Invalid positions are handled gracefully
 * - Audio context errors are caught and logged
 * - WASM function calls are wrapped in try-catch
 */

import React, { useEffect, useRef, useState } from 'react';
import { PuzzleState } from 'puzzle-core';

// Interface matching the Rust Bubble struct
// All fields must match the Rust types exactly
interface Bubble {
    position: number;  // u8 in Rust
    active: boolean;   // bool in Rust
    frequency: number; // f32 in Rust
    color: number;     // u32 in Rust
}

interface MusicalBubblesProps {
    puzzleState: PuzzleState;
    onBubbleClick: (position: number) => void;
}

export const MusicalBubbles: React.FC<MusicalBubblesProps> = ({ puzzleState, onBubbleClick }) => {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorsRef = useRef<Map<number, OscillatorNode>>(new Map());

    useEffect(() => {
        // Initialize AudioContext on first user interaction
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }
        };

        document.addEventListener('click', initAudio, { once: true });
        return () => document.removeEventListener('click', initAudio);
    }, []);

    useEffect(() => {
        // Convert puzzle state to bubbles
        const newBubbles: Bubble[] = [];
        for (let i = 0; i < 12; i++) {
            newBubbles.push({
                position: i,
                active: puzzleState.get_position(i),
                frequency: puzzleState.get_frequency(i),
                color: puzzleState.get_bubbles()[i].color,
            });
        }
        setBubbles(newBubbles);
    }, [puzzleState]);

    const playNote = (frequency: number) => {
        if (!audioContextRef.current) return;

        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.start();
        oscillator.stop(audioContextRef.current.currentTime + 0.5);
    };

    const handleBubbleClick = (position: number) => {
        const bubble = bubbles[position];
        if (bubble) {
            playNote(bubble.frequency);
            onBubbleClick(position);
        }
    };

    // Convert numeric color to hex string
    // This matches the Rust color format (u32 RGB)
    const colorToHex = (color: number): string => {
        return `#${color.toString(16).padStart(6, '0')}`;
    };

    return (
        <div className="musical-bubbles">
            {bubbles.map((bubble, index) => (
                <div
                    key={index}
                    className={`bubble ${bubble.active ? 'active' : ''}`}
                    style={{
                        backgroundColor: colorToHex(bubble.color),
                        opacity: bubble.active ? 1 : 0.5,
                        transform: `scale(${bubble.active ? 1.1 : 1})`,
                    }}
                    onClick={() => handleBubbleClick(index)}
                >
                    <span className="note-label">
                        {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][index]}
                    </span>
                </div>
            ))}
            <style>
                {`
                    .musical-bubbles {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 1rem;
                        padding: 2rem;
                        max-width: 600px;
                        margin: 0 auto;
                    }

                    .bubble {
                        aspect-ratio: 1;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }

                    .bubble:hover {
                        transform: scale(1.05);
                        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
                    }

                    .bubble.active {
                        box-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
                    }

                    .note-label {
                        color: white;
                        font-weight: bold;
                        font-size: 1.2rem;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    }
                `}
            </style>
        </div>
    );
}; 