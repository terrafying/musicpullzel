import { useState } from 'react';
import './HexGrid.css';

interface HexCell {
  id: number;
  x: number;
  y: number;
  value: number;
}

export function HexGrid() {
  const [cells, setCells] = useState<HexCell[]>(() => {
    const grid: HexCell[] = [];
    const size = 5; // 5x5 grid
    let id = 0;
    
    for (let q = -size; q <= size; q++) {
      for (let r = -size; r <= size; r++) {
        if (Math.abs(q + r) <= size) {
          grid.push({
            id: id++,
            x: q,
            y: r,
            value: Math.floor(Math.random() * 6) + 1 // Random value 1-6
          });
        }
      }
    }
    return grid;
  });

  const handleCellClick = (cell: HexCell) => {
    setCells(cells.map(c => 
      c.id === cell.id 
        ? { ...c, value: (c.value % 6) + 1 }
        : c
    ));
  };

  return (
    <div className="hex-grid">
      {cells.map(cell => (
        <div
          key={cell.id}
          className="hex-cell"
          style={{
            '--x': cell.x,
            '--y': cell.y,
          } as React.CSSProperties}
          onClick={() => handleCellClick(cell)}
        >
          {cell.value}
        </div>
      ))}
    </div>
  );
} 