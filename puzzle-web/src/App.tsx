import React, { useEffect, useState } from 'react';
import init, { PuzzleState } from './wasm/puzzle_core';
import { MusicalBubbles } from './components/MusicalBubbles';
import './App.css';

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong.</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.toString()}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null);
  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initWasm = async () => {
      try {
        // Initialize WASM module with proper import object
        const wasmModule = await init({
          env: {
            abort: (msg: string, file: string, line: number, column: number) => {
              console.error(`Abort called at ${file}:${line}:${column}`);
              console.error(msg);
              throw new Error(`WASM abort: ${msg}`);
            }
          }
        });

        // Verify the module was loaded correctly
        if (!wasmModule || typeof wasmModule !== 'object') {
          throw new Error('WASM module failed to initialize properly');
        }
        
        setIsWasmLoaded(true);
        
        // Create new puzzle state after WASM is loaded
        const newState = new PuzzleState();
        if (!(newState instanceof PuzzleState)) {
          throw new Error('Failed to create PuzzleState instance');
        }
        setPuzzleState(newState);
      } catch (err) {
        console.error('Failed to initialize WASM:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize WASM');
      }
    };

    initWasm();
  }, []);

  const handleBubbleClick = (position: number) => {
    if (!puzzleState) return;
    
    try {
      puzzleState.toggle(position);
      // Create a new instance to trigger re-render
      setPuzzleState(Object.assign(Object.create(Object.getPrototypeOf(puzzleState)), puzzleState));
    } catch (err) {
      console.error('Error toggling bubble:', err);
      setError(err instanceof Error ? err.message : 'Error toggling bubble');
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!isWasmLoaded || !puzzleState) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <ErrorBoundary>
      <div className="App">
        <header>
          <h1>Musical Puzzle</h1>
          <div className="stats">
            <p>Moves: {puzzleState.get_moves()}</p>
            <p>Score: {puzzleState.get_score()}</p>
          </div>
        </header>
        <main>
          <MusicalBubbles
            puzzleState={puzzleState}
            onBubbleClick={handleBubbleClick}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
