import React, { useEffect, useRef, useState } from 'react';
import { SpaceMapService } from '../services/spaceMapService';
import './SpaceMapVisualizer.css';

interface SpaceMapVisualizerProps {
    width?: number;
    height?: number;
    onPointClick?: (point: any) => void;
}

export const SpaceMapVisualizer: React.FC<SpaceMapVisualizerProps> = ({
    width = 800,
    height = 600,
    onPointClick
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const spaceMapService = SpaceMapService.getInstance();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !spaceMapService) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(width / 2 + offset.x, height / 2 + offset.y);
            ctx.scale(scale, scale);

            // Draw grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            for (let x = -width; x < width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, -height);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            for (let y = -height; y < height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(-width, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }

            // Draw points
            const points = spaceMapService.getReducedPoints();
            if (!points) return;

            points.forEach((point, index) => {
                if (!point) return;
                
                const x = point.x - 50; // Center the points
                const y = point.y - 50;

                // Draw point
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(74, 144, 226, 0.8)';
                ctx.fill();

                // Draw connections
                points.slice(index + 1).forEach(otherPoint => {
                    if (!otherPoint) return;
                    
                    const ox = otherPoint.x - 50;
                    const oy = otherPoint.y - 50;
                    const distance = Math.sqrt(
                        Math.pow(x - ox, 2) + Math.pow(y - oy, 2)
                    );

                    if (distance < 30) {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(ox, oy);
                        ctx.strokeStyle = `rgba(74, 144, 226, ${0.3 * (1 - distance / 30)})`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    }
                });

                // Draw metadata if available
                if (point.metadata) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.font = '12px monospace';
                    ctx.fillText(
                        JSON.stringify(point.metadata).slice(0, 20) + '...',
                        x + 10,
                        y - 10
                    );
                }
            });

            ctx.restore();
        };

        render();
    }, [width, height, scale, offset, spaceMapService]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            setOffset({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prevScale => {
            const newScale = prevScale * delta;
            return Math.min(Math.max(newScale, 0.1), 10);
        });
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas || !spaceMapService) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - width / 2 - offset.x) / scale;
        const y = (e.clientY - rect.top - height / 2 - offset.y) / scale;

        const points = spaceMapService.getReducedPoints();
        if (!points) return;

        const clickedPoint = points.find(point => {
            if (!point) return false;
            const dx = point.x - 50 - x;
            const dy = point.y - 50 - y;
            return Math.sqrt(dx * dx + dy * dy) < 10;
        });

        if (clickedPoint && onPointClick) {
            onPointClick(clickedPoint);
        }
    };

    return (
        <div className="space-map-visualizer">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onClick={handleClick}
            />
            <div className="space-map-controls">
                <button onClick={() => setScale(1)}>Reset Zoom</button>
                <button onClick={() => setOffset({ x: 0, y: 0 })}>Reset Position</button>
            </div>
        </div>
    );
}; 