import { useEffect, useRef } from 'react';
import { useGameStore, TrapState } from '../store';

interface WordTrapProps {
  trap: TrapState;
  cellSize: number;
}

export default function WordTrap({ trap, cellSize }: WordTrapProps) {
  const monsters = useGameStore(state => state.monsters);
  const captureMonsterInTrap = useGameStore(state => state.captureMonsterInTrap);

  // Check collision with monsters
  useEffect(() => {
    if (trap.isFilled) return;

    for (const monster of monsters) {
      if (monster.position.x === trap.position.x && monster.position.y === trap.position.y) {
        captureMonsterInTrap(monster.id, trap.id);
      }
    }
  }, [monsters, trap, captureMonsterInTrap]);

  return (
    <div 
      className="absolute z-10 flex items-center justify-center transition-all duration-300"
      style={{
        width: cellSize,
        height: cellSize,
        left: trap.position.x * cellSize,
        top: trap.position.y * cellSize,
      }}
    >
      {!trap.isFilled ? (
        <div className="w-[80%] h-[80%] rounded-full border-4 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] flex items-center justify-center animate-pulse relative bg-purple-900/20">
           <span className="text-2xl font-bold text-purple-700 opacity-50">{trap.orderIndex + 1}</span>
           
           <svg className="absolute inset-0 w-full h-full animate-spin-slow opacity-30" viewBox="0 0 100 100">
             <polygon points="50,5 61,35 95,35 68,55 78,85 50,70 22,85 32,55 5,35 39,35" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600"/>
           </svg>
        </div>
      ) : (
        <div className="w-full h-full bg-slate-800 rounded-lg border-2 border-purple-400 flex flex-col items-center justify-center overflow-hidden z-20 shadow-xl transform scale-110">
          {trap.capturedItem && (
            <>
              {trap.capturedItem.imageUrl ? (
                 <img src={trap.capturedItem.imageUrl} alt={trap.capturedItem.arabicObject} className="w-10 h-10 object-cover rounded mb-1" />
              ) : (
                 <span className="text-xl mb-1">🎮</span>
              )}
              <span className="text-xs text-white font-bold max-w-full overflow-hidden text-ellipsis px-1">{trap.capturedItem.sound}</span>
              <span className="text-[10px] text-yellow-300">{trap.capturedItem.arabicObject}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
