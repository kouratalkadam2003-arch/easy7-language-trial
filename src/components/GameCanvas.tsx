import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store';
import Level from './Level';
import Pig from './Pig';
import Monster from './Monster';
import WordTrap from './WordTrap';

export default function GameCanvas() {
  const { 
    grid, 
    monsters, 
    traps, 
    starfruits, 
    gamePhase,
    shootBubble,
    pigPosition
  } = useGameStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Cell size for rendering
  const CELL_SIZE = 64; 

  useEffect(() => {
    if (!grid || grid.length === 0 || !wrapperRef.current) return;
    
    const updateScale = () => {
      if (!wrapperRef.current) return;
      const mapCols = Math.max(...grid.map(row => row.length));
      const mapW = mapCols * CELL_SIZE;
      const mapH = grid.length * CELL_SIZE;
      
      const padding = 40; // 20px padding on all sides
      const availableW = wrapperRef.current.clientWidth - padding;
      const availableH = wrapperRef.current.clientHeight - padding;
      
      const scaleX = availableW / mapW;
      const scaleY = availableH / mapH;
      
      setScale(Math.min(scaleX, scaleY, 1)); // don't scale up past 1
    };

    updateScale();
    // initial delay in case of layout shifts
    setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [grid]);

  if (!grid || grid.length === 0) return null;

  const mapCols = Math.max(...grid.map(row => row.length));
  const mapWidth = mapCols * CELL_SIZE;
  const mapHeight = grid.length * CELL_SIZE;

  return (
    <div 
      ref={wrapperRef}
      className="relative w-full h-full bg-[#f4ebd0] overflow-hidden flex items-center justify-center cursor-crosshair touch-none"
      style={{
        backgroundImage: "url('data:image/svg+xml;utf8,<svg width=\"200\" height=\"200\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23noise)\" opacity=\"0.05\"/></svg>')",
      }}
    >
      <div 
        ref={containerRef}
        className="relative origin-center transition-transform"
        style={{ 
          width: mapWidth, 
          height: mapHeight,
          boxShadow: '0 0 40px rgba(0,0,0,0.1)',
          transform: `scale(${scale})`
        }}
      >
        <Level cellSize={CELL_SIZE} />
        
        {starfruits.map((pos, i) => (
          <div 
            key={`starfruit-${i}`}
            className="absolute z-10 w-8 h-8 rounded-full bg-yellow-400 border-2 border-orange-500 flex items-center justify-center animate-bounce shadow-sm"
            style={{ 
              left: pos.x * CELL_SIZE + CELL_SIZE/2 - 16, 
              top: pos.y * CELL_SIZE + CELL_SIZE/2 - 16 
            }}
          >
            ⭐
          </div>
        ))}

        {traps.map((trap) => (
          <WordTrap key={trap.id} trap={trap} cellSize={CELL_SIZE} />
        ))}

        {gamePhase !== 'caught' && <Pig cellSize={CELL_SIZE} mapScale={scale} />}

        {monsters.map((monster) => (
          <Monster key={monster.id} monster={monster} cellSize={CELL_SIZE} />
        ))}
      </div>
    </div>
  );
}
