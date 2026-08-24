import React, { useEffect, useRef, useState } from 'react';
import { useStore, Vector2 } from '../store';
import { motion } from 'motion/react';
import { LogOut } from 'lucide-react';

interface GameCanvasProps {
  onExit: () => void;
  onWin: () => void;
}

export default function GameCanvas({ onExit, onWin }: GameCanvasProps) {
  const { 
    grid, pigPosition, monsters, traps, starfruits, starsCollected, 
    activeBubble, gamePhase, isMocking, mockeryMessage, currentQuest,
    movePig, moveToPixel, updatePigPath, shootBubble, updateBubble, moveMonsters, catchPig, captureMonsterInTrap, startGame
  } = useStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<Vector2 | null>(null);
  const [dragCurrent, setDragCurrent] = useState<Vector2 | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    let lastMonsterMove = 0;
    let lastPigMove = 0;

    const gameLoop = (time: number) => {
      updateBubble();
      
      if (time - lastMonsterMove > 1000) { // monsters move every 1s
        moveMonsters();
        lastMonsterMove = time;
      }

      if (time - lastPigMove > 200) { // pig moves every 200ms along path
        updatePigPath();
        lastPigMove = time;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    if (gamePhase === 'playing') {
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [gamePhase, updateBubble, moveMonsters, updatePigPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gamePhase !== 'playing') return;
      switch(e.key) {
        case 'ArrowUp': case 'w': movePig(0, -1); break;
        case 'ArrowDown': case 's': movePig(0, 1); break;
        case 'ArrowLeft': case 'a': movePig(-1, 0); break;
        case 'ArrowRight': case 'd': movePig(1, 0); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gamePhase, movePig]);

  useEffect(() => {
    if (gamePhase === 'won') {
      const u = new SpeechSynthesisUtterance("You did it! The monsters are trapped!");
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    } else if (gamePhase === 'caught') {
      const u = new SpeechSynthesisUtterance("Ouch! The monster got you!");
      u.lang = 'en-US';
      window.speechSynthesis.speak(u);
    }
  }, [gamePhase]);

  // Handle trap collisions
  useEffect(() => {
      if (gamePhase !== 'playing') return;
      
      // Check if monster on trap
      monsters.forEach(m => {
          traps.forEach(t => {
              if (!t.filled && m.pos.x === t.pos.x && m.pos.y === t.pos.y) {
                  captureMonsterInTrap(m.id, t.id);
              }
          });
      });
  }, [monsters, traps, gamePhase, captureMonsterInTrap]);


  const CELL_SIZE = 40;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gamePhase !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicked near pig
    const pigPxX = pigPosition.x * CELL_SIZE + CELL_SIZE/2;
    const pigPxY = pigPosition.y * CELL_SIZE + CELL_SIZE/2;
    const dist = Math.sqrt(Math.pow(x - pigPxX, 2) + Math.pow(y - pigPxY, 2));

    if (dist < CELL_SIZE * 1.5) {
        setDragStart({ x, y });
        setDragCurrent({ x, y });
    } else {
        moveToPixel(x, y, CELL_SIZE);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handlePointerUp = () => {
    if (dragStart && dragCurrent) {
        const dx = dragStart.x - dragCurrent.x;
        const dy = dragStart.y - dragCurrent.y;
        
        // Shoot in opposite direction of drag
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
           const targetX = pigPosition.x + dx/CELL_SIZE;
           const targetY = pigPosition.y + dy/CELL_SIZE;
           shootBubble({ x: targetX, y: targetY });
        }
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  if (!grid || grid.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#E3F2FD] relative overflow-hidden font-pixel">
      
      <div className="absolute top-4 left-4 z-10 flex gap-2">
         <button onClick={onExit} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg">
            <LogOut size={20} />
         </button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
         <div className="bg-yellow-400 text-yellow-900 font-bold py-2 px-4 rounded-full shadow-lg">
            ⭐ {starsCollected} / 3
         </div>
      </div>

      {currentQuest && (
          <div className="absolute top-4 mx-auto w-10/12 md:w-1/2 bg-black/50 text-white p-4 rounded-xl shadow-xl backdrop-blur-sm z-10 text-center border border-purple-500/30">
              <h2 className="text-xl md:text-2xl font-bold text-amber-300">{currentQuest.targetSentence}</h2>
              <p className="text-purple-200">{currentQuest.arabicTranslation}</p>
          </div>
      )}

      <div 
         ref={canvasRef}
         className="relative bg-white shadow-2xl rounded-lg overflow-hidden touch-none mt-16 border-4 border-[#37474F] bg-[linear-gradient(transparent_39px,#e5e5f7_39px)] bg-[length:100%_40px]"
         style={{ width: (grid[0]?.length || 10) * CELL_SIZE, height: grid.length * CELL_SIZE }}
         onPointerDown={handlePointerDown}
         onPointerMove={handlePointerMove}
         onPointerUp={handlePointerUp}
         onPointerLeave={handlePointerUp}
      >
        {/* Draw Grid */}
        {grid.map((row, y) => (
          row?.map((cell, x) => (
            <div 
              key={`${x}-${y}`} 
              className={`absolute ${cell === 1 ? 'z-10' : 'z-0'}`}
              style={{
                width: CELL_SIZE, height: CELL_SIZE,
                left: x * CELL_SIZE, top: y * CELL_SIZE,
                backgroundColor: cell === 1 ? '#CFD8DC' : '#FFFFFF',
                border: cell === 1 ? '3px solid #78909C' : '1px dashed #ECEFF1',
                borderRadius: cell === 1 ? '4px' : '0px',
                backgroundImage: cell === 1 ? 'radial-gradient(#90A4AE 1px, transparent 1px)' : 'none',
                backgroundSize: cell === 1 ? '8px 8px' : 'none'
              }}
            />
          ))
        ))}

        {/* Draw Starfruits */}
        {starfruits.map((sf, i) => (
            <motion.div
              key={`sf-${i}`}
              className="absolute z-20 flex items-center justify-center"
              style={{ width: CELL_SIZE, height: CELL_SIZE, left: sf.x * CELL_SIZE, top: sf.y * CELL_SIZE }}
              animate={{ y: [0, -5, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            >
                <div style={{
                  width: '24px', height: '24px',
                  backgroundColor: '#ffd54f',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  border: '2px solid #e65100' // Stroke via drop shadow is hard with clipPath, but this is a simple approximation
                }} />
            </motion.div>
        ))}

        {/* Draw Traps */}
        {traps.map(trap => (
            <div
              key={trap.id}
              className={`absolute z-10 flex flex-col items-center justify-center rounded-full shadow-inner ${trap.filled ? 'bg-[#81c784] border-[#2e7d32]' : 'bg-[#e57373] border-[#c62828]'} font-brand text-xs`}
              style={{ 
                width: CELL_SIZE * 0.8, height: CELL_SIZE * 0.8, 
                left: trap.pos.x * CELL_SIZE + CELL_SIZE * 0.1, top: trap.pos.y * CELL_SIZE + CELL_SIZE * 0.1,
                borderWidth: '3px',
                borderStyle: 'solid',
                boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.3)'
              }}
            >
               <span className="text-white drop-shadow-md">{trap.filled ? '✓' : trap.index + 1}</span>
            </div>
        ))}

        {/* Draw Monsters */}
        {monsters.map(monster => (
            <motion.div
              key={monster.id}
              className="absolute z-30 rounded-full flex flex-col items-center justify-start overflow-hidden"
              style={{ 
                width: CELL_SIZE * 0.8, height: CELL_SIZE * 0.8,
                backgroundColor: '#29B6F6', // Blue monster
                border: '3px solid #01579B',
                boxShadow: '0 4px 0 #01579B'
              }}
              animate={{ 
                left: monster.pos.x * CELL_SIZE + CELL_SIZE * 0.1, 
                top: monster.pos.y * CELL_SIZE + CELL_SIZE * 0.1,
                scaleY: [1, 0.9, 1], // Breathing animation
              }}
              transition={{ 
                left: { type: 'spring', stiffness: 300, damping: 20 },
                top: { type: 'spring', stiffness: 300, damping: 20 },
                scaleY: { repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }
              }}
            >
               {/* Monster Eyes */}
               <div className="flex gap-1 mt-1">
                 <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center border border-black"><div className="w-1 h-1 bg-black rounded-full" /></div>
                 <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center border border-black"><div className="w-1 h-1 bg-black rounded-full" /></div>
               </div>
               {/* Monster Mouth */}
               <div className="w-4 h-2 bg-black rounded-b-full mt-1 flex items-start overflow-hidden relative border border-[#7f0000]">
                 <div className="w-[2px] h-full bg-white ml-[2px]" />
                 <div className="w-[2px] h-full bg-white ml-[2px]" />
                 <div className="w-[2px] h-full bg-white ml-[2px]" />
               </div>
            </motion.div>
        ))}

        {/* Draw Fox */}
        <motion.div
            className="absolute z-40 flex flex-col items-center justify-start cursor-grab active:cursor-grabbing"
            style={{ 
              width: CELL_SIZE * 0.8, height: CELL_SIZE * 0.8,
              backgroundColor: '#EA580C', // Orange Fox
              borderRadius: '50% 50% 10% 10%',
              border: '3px solid #9A3412',
              boxShadow: '0 4px 0 #9A3412'
            }}
            animate={{ left: pigPosition.x * CELL_SIZE + CELL_SIZE * 0.1, top: pigPosition.y * CELL_SIZE + CELL_SIZE * 0.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
            {/* Ears */}
            <div className="absolute -top-1.5 -left-1 w-2.5 h-3 bg-[#EA580C] border-2 border-[#9A3412] transform -rotate-12 rounded-t-full">
              <div className="w-0.5 h-1.5 bg-white mx-auto mt-0.5 rounded-t-full" />
            </div>
            <div className="absolute -top-1.5 -right-1 w-2.5 h-3 bg-[#EA580C] border-2 border-[#9A3412] transform rotate-12 rounded-t-full">
              <div className="w-0.5 h-1.5 bg-white mx-auto mt-0.5 rounded-t-full" />
            </div>

            <div className="flex gap-2 mt-2 z-10 relative">
                 <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center border border-black"><div className="w-1 h-1 bg-black rounded-full" /></div>
                 <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center border border-black"><div className="w-1 h-1 bg-black rounded-full" /></div>
            </div>
            <div className="w-5 h-2.5 bg-white rounded-b-full mt-0.5 border-t border-[#9A3412] flex justify-center items-start z-10 relative">
              <div className="w-1.5 h-1 bg-black rounded-b-full mt-[1px]" />
            </div>
        </motion.div>

        {/* Draw active bubble */}
        {activeBubble && (
            <motion.div
              className="absolute z-20 bg-[#aed581] rounded-full border-[2px] border-[#33691e] shadow-sm transform-gpu opacity-90 blur-[1px]"
              style={{ 
                width: CELL_SIZE * 0.4, height: CELL_SIZE * 0.4, 
                left: activeBubble.pos.x * CELL_SIZE + CELL_SIZE*0.3, 
                top: activeBubble.pos.y * CELL_SIZE + CELL_SIZE*0.3 
              }}
            />
        )}

        {/* Drag Line (Slingshot) */}
        {dragStart && dragCurrent && (
            <svg className="absolute inset-0 pointer-events-none w-full h-full z-20">
                <line 
                  x1={dragStart.x} y1={dragStart.y} 
                  x2={dragCurrent.x} y2={dragCurrent.y} 
                  stroke="rgba(255,255,255,0.8)" strokeWidth="4" strokeDasharray="6,4" 
                />
            </svg>
        )}
      </div>

      {gamePhase === 'won' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50 p-4">
             <motion.h1 initial={{scale: 0}} animate={{scale: 1}} className="text-5xl md:text-7xl font-black text-amber-400 tracking-tighter mb-6 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                 أحسنت!
             </motion.h1>
             <p className="text-2xl text-purple-200 mb-8 max-w-2xl text-center px-4">
                 لقد تعلمت الجملة: "{currentQuest?.targetSentence}"
             </p>
             {currentQuest?.absurdScene && (
                 <div className="bg-[#2d1b4e] p-6 rounded-2xl max-w-xl mx-4 mb-8 border border-purple-500/30">
                     <p className="text-lg italic text-amber-200">"{currentQuest.absurdScene}"</p>
                 </div>
             )}
             <button onClick={onWin} className="px-8 py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-yellow-900 font-bold rounded-full text-xl hover:scale-105 transition-transform shadow-lg">
                 التالي
             </button>
          </div>
      )}

      {gamePhase === 'caught' && (
          <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center text-white z-50 p-4">
             <motion.h1 initial={{scale: 0}} animate={{scale: 1}} className="text-5xl md:text-7xl font-black mb-6">
                 لقد أُمسك بك! 😈
             </motion.h1>
             <button onClick={() => startGame(currentQuest?.targetSentence)} className="px-8 py-3 bg-white text-red-900 font-bold rounded-full text-xl hover:scale-105 transition-transform shadow-lg">
                 إعادة المحاولة
             </button>
          </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 mx-auto bg-[#1e0a3c]/90 text-white p-3 rounded-xl text-sm text-center border border-purple-500/50 backdrop-blur-md z-10 w-11/12 md:w-auto shadow-lg hover:bg-[#2d1b4e]/90 transition-colors cursor-default">
         انقر على المتاهة للتحرك ببطلك. اسحب شخصيتك بالماوس للخلف لتطلق فقاعة مخاط لجذب الوحوش 😈 للفخاخ الزرقاء لتعلم المقطع.
      </div>
    </div>
  );
}
