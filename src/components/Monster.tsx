import { useEffect, useState } from 'react';
import { useGameStore, MonsterState } from '../store';

interface MonsterProps {
  monster: MonsterState;
  cellSize: number;
}

export default function Monster({ monster, cellSize }: MonsterProps) {
  const { grid, updateMonsters, monsters, pigPosition, activeBubble, catchPig, gamePhase } = useGameStore();

  // Simple game loop for this monster
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const interval = setInterval(() => {
      // Always get latest state to prevent stale closures and infinite loop updates
      const state = useGameStore.getState();
      const currentGrid = state.grid;
      const currentPigPos = state.pigPosition;
      const currentBubble = state.activeBubble;
      const currentMonsters = state.monsters;
      const currentMonster = currentMonsters.find(m => m.id === monster.id);
      
      if (!currentMonster || state.gamePhase !== 'playing') return;

      const sightRadius = 4;
      let nextPos = { ...currentMonster.position };
      let newState = currentMonster.state;

      // 1. Is there a bubble nearby? (Highest priority)
      if (currentBubble) {
        const distToBubble = Math.abs(currentBubble.position.x - currentMonster.position.x) + Math.abs(currentBubble.position.y - currentMonster.position.y);
        if (distToBubble <= sightRadius + 2) { 
          newState = 'eating';
          if (currentBubble.position.x > currentMonster.position.x && currentGrid[currentMonster.position.y][currentMonster.position.x + 1] === 0) nextPos.x++;
          else if (currentBubble.position.x < currentMonster.position.x && currentGrid[currentMonster.position.y][currentMonster.position.x - 1] === 0) nextPos.x--;
          else if (currentBubble.position.y > currentMonster.position.y && currentGrid[currentMonster.position.y + 1]?.[currentMonster.position.x] === 0) nextPos.y++;
          else if (currentBubble.position.y < currentMonster.position.y && currentGrid[currentMonster.position.y - 1]?.[currentMonster.position.x] === 0) nextPos.y--;
        }
      }

      // 2. Determine if pig is in sight
      const distToPig = Math.abs(currentPigPos.x - currentMonster.position.x) + Math.abs(currentPigPos.y - currentMonster.position.y);
      if (newState !== 'eating' && distToPig <= sightRadius) {
        newState = 'chase';
        if (currentPigPos.x > currentMonster.position.x && currentGrid[currentMonster.position.y][currentMonster.position.x + 1] === 0) nextPos.x++;
        else if (currentPigPos.x < currentMonster.position.x && currentGrid[currentMonster.position.y][currentMonster.position.x - 1] === 0) nextPos.x--;
        else if (currentPigPos.y > currentMonster.position.y && currentGrid[currentMonster.position.y + 1]?.[currentMonster.position.x] === 0) nextPos.y++;
        else if (currentPigPos.y < currentMonster.position.y && currentGrid[currentMonster.position.y - 1]?.[currentMonster.position.x] === 0) nextPos.y--;
        
        if (nextPos.x === currentPigPos.x && nextPos.y === currentPigPos.y) {
          state.catchPig();
          clearInterval(interval);
          return;
        }
      }

      // 3. Patrol randomly
      if (newState === 'patrol') {
        const moves = [ {x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0} ];
        if (Math.random() > 0.5) {
          const move = moves[Math.floor(Math.random() * moves.length)];
          const testX = currentMonster.position.x + move.x;
          const testY = currentMonster.position.y + move.y;
          if (currentGrid[testY] && currentGrid[testY][testX] === 0) {
            nextPos = {x: testX, y: testY};
          }
        }
      }

      if (newState === 'chase' && distToPig > sightRadius) {
        newState = 'patrol';
      }

      const fruitIndex = state.starfruits.findIndex(f => f.x === nextPos.x && f.y === nextPos.y);
      if (fruitIndex !== -1) {
        state.removeStarfruit(fruitIndex);
      }

      if (nextPos.x !== currentMonster.position.x || nextPos.y !== currentMonster.position.y || newState !== currentMonster.state) {
        state.updateMonsters(currentMonsters.map(m => m.id === currentMonster.id ? { ...m, position: nextPos, state: newState } : m));
      }

    }, 800);

    return () => clearInterval(interval);
  }, [monster.id, gamePhase]);

  return (
    <div 
      className="absolute z-20 transition-all duration-700 ease-linear"
      style={{
        width: cellSize * 0.9,
        height: cellSize * 1,
        left: monster.position.x * cellSize + cellSize * 0.05,
        top: monster.position.y * cellSize,
      }}
    >
      <div className={`w-full h-full bg-[#e53935] rounded-t-[50%] rounded-b-[20%] border-4 border-[#b71c1c] relative shadow-lg ${monster.state === 'chase' ? 'animate-pulse' : ''}`}>
        {/* Angry Eyes */}
        <div className="absolute top-[20%] left-[10%] w-[80%] flex justify-between px-1">
          <div className="w-[35%] h-[35px] bg-white rounded-full relative border-t-4 border-black/50 transform rotate-12">
            <div className="absolute top-[30%] right-[30%] w-[30%] h-[30%] bg-black rounded-full" />
          </div>
          <div className="w-[35%] h-[35px] bg-white rounded-full relative border-t-4 border-black/50 transform -rotate-12">
             <div className="absolute top-[30%] left-[30%] w-[30%] h-[30%] bg-black rounded-full" />
          </div>
        </div>
        
        {/* Green Teeth/Mouth */}
        <div className="absolute bottom-[10%] left-[15%] w-[70%] h-[35%] bg-green-400 border-2 border-black rounded-lg overflow-hidden flex flex-col">
          <div className="w-full h-1/2 border-b-2 border-black flex">
             <div className="w-1/3 border-r-2 border-black"></div>
             <div className="w-1/3 border-r-2 border-black"></div>
          </div>
          <div className="w-full h-1/2 flex">
             <div className="w-1/3 border-r-2 border-black"></div>
             <div className="w-1/3 border-r-2 border-black"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
