import { useEffect } from 'react';
import { useGameStore, Vector2 } from '../store';

interface LevelProps {
  cellSize: number;
}

export default function Level({ cellSize }: LevelProps) {
  const grid = useGameStore(state => state.grid);
  const setPigPosition = useGameStore(state => state.setPigPosition);
  const pigPosition = useGameStore(state => state.pigPosition);
  const activeBubble = useGameStore(state => state.activeBubble);
  const gamePhase = useGameStore(state => state.gamePhase);

  const handleMapClick = (x: number, y: number) => {
    // If it's undefined, it's considered a wall
    if (!grid[y] || grid[y][x] === 1 || grid[y][x] === undefined || gamePhase !== 'playing') return; 
    
    // Shoot bubble towards clicked position!
    useGameStore.getState().shootBubble({ x, y });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gamePhase !== 'playing') return;
      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          dy = -1; break;
        case 'ArrowDown':
        case 's':
        case 'S':
          dy = 1; break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          dx = -1; break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          dx = 1; break;
        default: return; // Do nothing if other key is pressed
      }

      const nextX = pigPosition.x + dx;
      const nextY = pigPosition.y + dy;
      handleMapClick(nextX, nextY);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pigPosition, gamePhase, grid]);

  // Handle bubble expiry
  useEffect(() => {
    if (activeBubble) {
      const timer = setTimeout(() => {
        useGameStore.getState().removeBubble();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeBubble]);

  const mapCols = Math.max(...grid.map(r => r.length));

  return (
    <div className="absolute inset-0 z-0">
      {grid.map((row, y) => (
        <div key={y} className="flex h-full" style={{ height: cellSize }}>
          {Array.from({ length: mapCols }).map((_, x) => {
            const cell = row[x] !== undefined ? row[x] : 1; // treat empty space as wall
            return (
              <div
                key={`${x}-${y}`}
                onClick={() => handleMapClick(x, y)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: cell === 1 ? '#ba8852' : 'transparent',
                  border: cell === 1 ? '3px solid #5a3d1b' : '1px dashed rgba(160, 140, 110, 0.2)',
                  boxSizing: 'border-box',
                  borderRadius: cell === 1 ? '8px' : '0'
                }}
                className={`flex-shrink-0 relative ${cell === 0 ? 'hover:bg-green-900/10 cursor-pointer' : ''} transition-colors`}
              >
                {cell === 1 && (
                  <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)" }} />
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Bubble Render */}
      {activeBubble && (
        <Bubble activeBubble={activeBubble} cellSize={cellSize} />
      )}
    </div>
  );
}

// Simple floating bubble visual
function Bubble({ activeBubble, cellSize }: { activeBubble: any, cellSize: number }) {
  // Linear interpolation for simple animation, CSS handles it nicely with transition
  return (
    <div 
      className="absolute z-20 w-8 h-8 bg-green-300 rounded-full border-2 border-green-600 shadow-[0_0_15px_rgba(74,222,128,0.8)] opacity-90 transition-all duration-300 ease-out"
      style={{
        left: activeBubble.target.x * cellSize + cellSize/2 - 16,
        top: activeBubble.target.y * cellSize + cellSize/2 - 16,
      }}
    >
      <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full opacity-60" />
    </div>
  );
}
