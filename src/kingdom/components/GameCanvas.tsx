import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../engine/gameEngine';
import { globalSpacedRepetition } from '../engine/spacedRepetition';

interface GameCanvasProps {
  engine: GameEngine;
  onPlotSelect?: (plotId: string) => void;
  onOpenReview?: (itemId?: string) => void;
  onOpenCurriculum?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  onPlotSelect,
  onOpenReview,
  onOpenCurriculum,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize Canvas to Match Window Viewport
    const handleResize = () => {
      if (!canvas) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      engine.camera.resize(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Keyboard Event Handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      engine.keys[e.code] = true;

      // Space -> Attack
      if (e.code === 'Space') {
        engine.heroAttack();
      }
      // E or F -> Interact
      if (e.code === 'KeyE' || e.code === 'KeyF') {
        engine.interact();
      }
      // Shift -> Dash
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        engine.heroDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engine.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Click / Pointer Handling for Direct Interaction
    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { wx, wy } = engine.camera.screenToWorld(screenX, screenY);

      // 1. Direct Click on Speech Bubble above Hero Leader
      if (engine.hero.duePhrase) {
        const { sx, sy } = engine.camera.worldToScreen(engine.hero.x + engine.hero.width / 2, engine.hero.y);
        if (
          (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 30) ||
          Math.hypot(wx - (engine.hero.x + engine.hero.width / 2), wy - engine.hero.y) <= 45
        ) {
          if (onOpenReview) {
            onOpenReview(engine.hero.duePhrase.id);
            return;
          }
        }
      }

      // 2. Direct Click on Speech Bubble above Castle Warriors
      for (const warrior of engine.warriors) {
        if (warrior.duePhrase && warrior.state !== 'inside_castle') {
          const { sx, sy } = engine.camera.worldToScreen(warrior.x + 14, warrior.y);
          if (
            (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 30) ||
            Math.hypot(wx - (warrior.x + 14), wy - warrior.y) <= 45
          ) {
            if (onOpenReview) {
              onOpenReview(warrior.duePhrase.id);
              return;
            }
          }
        }
      }

      // 3. Direct Click on Speech Bubble above Workers / Farmers
      for (const worker of engine.workers) {
        if (worker.duePhrase) {
          const { sx, sy } = engine.camera.worldToScreen(worker.x + 14, worker.y);
          if (
            (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 30) ||
            Math.hypot(wx - (worker.x + 14), wy - (worker.y + 14)) <= 45
          ) {
            if (onOpenReview) {
              onOpenReview(worker.duePhrase.id);
              return;
            }
          }
        }
      }

      // 4. Direct Click on Speech Bubble above Villagers
      for (const villager of engine.villagers) {
        if (villager.duePhrase) {
          const { sx, sy } = engine.camera.worldToScreen(villager.x + 12, villager.y);
          if (
            (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 30) ||
            Math.hypot(wx - (villager.x + 12), wy - (villager.y + 12)) <= 45
          ) {
            if (onOpenReview) {
              onOpenReview(villager.duePhrase.id);
              return;
            }
          }
        }
      }

      // 5. Direct Click on Speech Bubble above Buildings
      for (const plot of engine.world.buildingPlots) {
        if (plot.building?.duePhrase) {
          const { sx, sy } = engine.camera.worldToScreen(plot.x + plot.width / 2, plot.y);
          if (
            (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 25) ||
            (wx >= plot.x && wx <= plot.x + plot.width && wy >= plot.y - 45 && wy <= plot.y + plot.height)
          ) {
            if (onOpenReview) {
              onOpenReview(plot.building.duePhrase.id);
              return;
            }
          }
        }
      }

      // Check click on building plots / Castle
      for (const plot of engine.world.buildingPlots) {
        // Generous hit box including floating beacon above town hall
        const isTownHall = plot.id === 'plot_town_hall';
        const dueItems = globalSpacedRepetition.getDueItemsForPlot(plot.id);
        const hitMarginTop = dueItems.length > 0 || isTownHall ? 45 : 0;

        if (
          wx >= plot.x &&
          wx <= plot.x + plot.width &&
          wy >= plot.y - hitMarginTop &&
          wy <= plot.y + plot.height
        ) {
          engine.selectedPlotId = plot.id;
          engine.selectedBuilding = plot.building;

          // If this building has phrases due for review, launch review session immediately!
          if (dueItems.length > 0 && onOpenReview) {
            onOpenReview(dueItems[0].id);
            return;
          }

          if (isTownHall) {
            const dueCount = globalSpacedRepetition.getKingdomState().dueItemsCount;
            if (dueCount > 0 && onOpenReview) {
              onOpenReview();
              return;
            } else if (onOpenCurriculum) {
              onOpenCurriculum();
              return;
            }
          }

          if (onPlotSelect) onPlotSelect(plot.id);
          return;
        }
      }

      // Check click on workers with floating due phrase beacons
      for (const worker of engine.workers) {
        const due = globalSpacedRepetition.getDueItemsForRole(worker.job);
        if (due.length > 0 && Math.hypot(wx - (worker.x + 14), wy - (worker.y + 14)) <= 35) {
          if (onOpenReview) {
            onOpenReview(due[0].id);
            return;
          }
        }
      }

      // Check click on chests
      for (const chest of engine.world.chests) {
        if (
          !chest.isOpened &&
          wx >= chest.x &&
          wx <= chest.x + chest.width &&
          wy >= chest.y &&
          wy <= chest.y + chest.height
        ) {
          engine.openChest(chest);
          return;
        }
      }

      // Check click on resource node
      for (const node of engine.world.resourceNodes) {
        if (
          !node.isDepleted &&
          wx >= node.x &&
          wx <= node.x + node.width &&
          wy >= node.y &&
          wy <= node.y + node.height
        ) {
          engine.startGathering(node);
          return;
        }
      }

      // If clicked empty ground or enemy -> Hero Attack
      engine.heroAttack();
    };

    // Hover detection for interactive speech bubbles
    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      let isHoveringBubble = false;

      if (engine.hero.duePhrase) {
        const { sx, sy } = engine.camera.worldToScreen(engine.hero.x + engine.hero.width / 2, engine.hero.y);
        if (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 25) {
          isHoveringBubble = true;
        }
      }

      if (!isHoveringBubble) {
        for (const w of engine.warriors) {
          if (w.duePhrase && w.state !== 'inside_castle') {
            const { sx, sy } = engine.camera.worldToScreen(w.x + 14, w.y);
            if (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 25) {
              isHoveringBubble = true;
              break;
            }
          }
        }
      }

      if (!isHoveringBubble) {
        for (const wk of engine.workers) {
          if (wk.duePhrase) {
            const { sx, sy } = engine.camera.worldToScreen(wk.x + 14, wk.y);
            if (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 25) {
              isHoveringBubble = true;
              break;
            }
          }
        }
      }

      if (!isHoveringBubble) {
        for (const p of engine.world.buildingPlots) {
          if (p.building?.duePhrase) {
            const { sx, sy } = engine.camera.worldToScreen(p.x + p.width / 2, p.y);
            if (screenX >= sx - 110 && screenX <= sx + 110 && screenY >= sy - 52 && screenY <= sy + 25) {
              isHoveringBubble = true;
              break;
            }
          }
        }
      }

      canvas.style.cursor = isHoveringBubble ? 'pointer' : 'default';
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);

    // Render Frame Loop
    let animId: number;
    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Render World & Terrain Tiles
      engine.spriteRenderer.renderWorld(ctx, engine.world, engine.camera);

      // 2. Render Building Plots (Empty or Under Construction)
      for (const plot of engine.world.buildingPlots) {
        engine.spriteRenderer.renderPlot(ctx, plot, engine.camera, false, engine.selectedPlotId);
      }

      // 3. Render Completed Buildings
      for (const plot of engine.world.buildingPlots) {
        if (plot.building) {
          const isSelected = engine.selectedPlotId === plot.id;
          engine.spriteRenderer.renderBuilding(ctx, plot.building, engine.camera, isSelected);
        }
      }

      // 4. Render Resource Nodes
      for (const node of engine.world.resourceNodes) {
        if (engine.camera.isVisible(node.x, node.y, node.width, node.height)) {
          engine.spriteRenderer.renderResourceNode(ctx, node, engine.camera);
        }
      }

      // 5. Render Exploration Chests
      for (const chest of engine.world.chests) {
        if (engine.camera.isVisible(chest.x, chest.y, chest.width, chest.height)) {
          engine.spriteRenderer.renderChest(ctx, chest, engine.camera);
        }
      }

      // 6. Render Autonomous Workers
      for (const worker of engine.workers) {
        if (engine.camera.isVisible(worker.x, worker.y, 28, 28)) {
          engine.spriteRenderer.renderWorker(ctx, worker, engine.camera);
        }
      }

      // 6.5 Render Ambient Roaming Villagers
      for (const villager of engine.villagers) {
        if (engine.camera.isVisible(villager.x, villager.y, 24, 28)) {
          engine.spriteRenderer.renderVillager(ctx, villager, engine.camera);
        }
      }

      // 7. Render Autonomous Castle Warriors
      for (const warrior of engine.warriors) {
        if (engine.camera.isVisible(warrior.x, warrior.y, warrior.width, warrior.height)) {
          engine.spriteRenderer.renderWarrior(ctx, warrior, engine.camera);
        }
      }

      // 8. Render Invading Monsters
      for (const enemy of engine.enemies) {
        if (engine.camera.isVisible(enemy.x, enemy.y, enemy.width, enemy.height)) {
          engine.spriteRenderer.renderEnemy(ctx, enemy, engine.camera);
        }
      }

      // 8. Render Hero Knight
      engine.spriteRenderer.renderHero(ctx, engine.hero, engine.camera);

      // 9. Render Tower Projectiles
      for (const proj of engine.projectiles) {
        engine.spriteRenderer.renderProjectile(ctx, proj, engine.camera);
      }

      // 10. Render Particles & Floating Combat Text
      engine.particles.render(ctx, engine.camera);

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, [engine, onPlotSelect]);

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      className="fixed inset-0 w-full h-full block bg-slate-900 touch-none cursor-crosshair select-none"
    />
  );
};
