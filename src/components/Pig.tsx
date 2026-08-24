import { useEffect, useState, useRef } from 'react';
import { useGameStore, Vector2 } from '../store';

interface PigProps {
  cellSize: number;
  mapScale?: number;
}

export default function Pig({ cellSize, mapScale = 1 }: PigProps) {
  const pigPosition = useGameStore(state => state.pigPosition);
  const shootBubble = useGameStore(state => state.shootBubble);
  const gamePhase = useGameStore(state => state.gamePhase);

  const targetLanguage = useGameStore(state => state.targetLanguage);

  // Smooth movement state
  const [visualPos, setVisualPos] = useState<Vector2>(pigPosition);
  
  // Slingshot state
  const [isAiming, setIsAiming] = useState(false);
  const [aimEnd, setAimEnd] = useState<Vector2 | null>(null);

  const pigRef = useRef<HTMLDivElement>(null);

  // Sync visual position slowly to target
  useEffect(() => {
    // For 2D grid logic, the CSS transition takes care of lerping mostly.
    // If we wanted pure JS lerp, we'd use requestAnimationFrame.
    setVisualPos(pigPosition);
  }, [pigPosition]);

  // Slingshot handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gamePhase !== 'playing') return;
    setIsAiming(true);
    // e.target.releasePointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isAiming || !pigRef.current) return;
    
    // Convert screen coordinates to grid logical vector
    const rect = pigRef.current.getBoundingClientRect();
    const pigCenterX = rect.left + rect.width / 2;
    const pigCenterY = rect.top + rect.height / 2;
    
    // Slingshot logic: drag backwards to shoot forwards
    const dx = pigCenterX - e.clientX;
    const dy = pigCenterY - e.clientY;
    
    // Scale the screen pixels back to local grid pixels
    setAimEnd({ x: dx / mapScale, y: dy / mapScale });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isAiming) {
      if (aimEnd) {
        // Calculate target cell based on vector
        // Normalize aiming vector to a certain max distance (e.g., 4 cells)
        const distance = Math.sqrt(aimEnd.x * aimEnd.x + aimEnd.y * aimEnd.y);
        // Distance is now in local grid pixels.
        if (distance > 10) {
          // Normalize and scale (max 6 cells)
          const scaleAmt = Math.min(distance, 300) / 300 * 6; 
          const targetX = Math.round(pigPosition.x + (aimEnd.x / distance) * scaleAmt);
          const targetY = Math.round(pigPosition.y + (aimEnd.y / distance) * scaleAmt);
          
          shootBubble({ x: targetX, y: targetY });
        }
      }
      setIsAiming(false);
      setAimEnd(null);
    }
  };

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove as any);
    window.addEventListener('pointerup', handlePointerUp as any);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove as any);
      window.removeEventListener('pointerup', handlePointerUp as any);
    };
  }, [isAiming, aimEnd, pigPosition, mapScale]);

  const getAvatarEmoji = () => {
    switch (targetLanguage?.toLowerCase()) {
      case 'chinese': return '🐉';
      case 'japanese': return '🐱';
      case 'italian': return '🦊';
      case 'german': return '🐻';
      case 'spanish': return '🐐';
      case 'french': return '🐓';
      case 'english': return '🐂';
      default: return '🐸';
    }
  };

  return (
    <>
      <div 
        ref={pigRef}
        onPointerDown={handlePointerDown}
        className="absolute z-30 transition-all duration-300 ease-linear cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95"
        style={{
          width: cellSize * 1.2,
          height: cellSize * 1.2,
          left: visualPos.x * cellSize - cellSize * 0.1,
          top: visualPos.y * cellSize - cellSize * 0.1,
          touchAction: 'none'
        }}
      >
        {/* Character Emoji */}
        <div className={`w-full h-full rounded-full flex items-center justify-center text-[2.5rem] bg-white border-4 border-emerald-500 shadow-md transition-shadow relative z-10 ${isAiming ? 'shadow-[0_0_20px_rgba(16,185,129,0.8)] border-emerald-400' : ''}`}>
           {getAvatarEmoji()}
        </div>
      </div>

      {/* Aiming Arc Preview */}
      {isAiming && aimEnd && (
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          style={{ overflow: 'visible' }}
        >
          <line 
            x1={visualPos.x * cellSize + cellSize / 2} 
            y1={visualPos.y * cellSize + cellSize / 2} 
            x2={visualPos.x * cellSize + cellSize / 2 + aimEnd.x} 
            y2={visualPos.y * cellSize + cellSize / 2 + aimEnd.y} 
            stroke="rgba(0, 0, 0, 0.4)" 
            strokeWidth="6" 
            strokeDasharray="10 10"
            strokeLinecap="round"
          />
          <circle 
            cx={visualPos.x * cellSize + cellSize / 2 + aimEnd.x} 
            cy={visualPos.y * cellSize + cellSize / 2 + aimEnd.y} 
            r="8"
            fill="#e53935"
            stroke="white"
            strokeWidth="2"
          />
        </svg>
      )}
    </>
  );
}
