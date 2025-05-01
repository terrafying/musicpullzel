import { useState } from 'react';
import { AudioTest } from './components/AudioTest';
import { HexGrid } from './components/HexGrid';
import './App.css';

function App() {
  return (
    <div className="app">
      <header>
        <h1>Music Puzzle</h1>
      </header>
      <main>
        <div className="puzzle-container">
          <AudioTest />
          <div className="grid-container">
            <HexGrid />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
