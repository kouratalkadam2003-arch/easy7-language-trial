import {
  BuildingInstance,
  BuildingPlot,
  ChestInstance,
  EnemyInstance,
  HeroState,
  ProjectileInstance,
  ResourceNodeInstance,
  VillagerInstance,
  WarriorInstance,
  WorkerInstance,
} from '../types/game';
import { Camera } from './camera';
import { World, WorldTile } from './world';
import { globalSpacedRepetition } from './spacedRepetition';

/**
 * SpriteRenderer: Renders full-body stylized 2D characters, animations,
 * buildings, monsters, environments, and projectiles using canvas vector graphics.
 */
export class SpriteRenderer {
  private waterTime: number = 0;

  public updateTime(dt: number) {
    this.waterTime += dt;
  }

  // ==========================================
  // TERRAIN & ENVIRONMENT RENDERING
  // ==========================================
  public renderWorld(ctx: CanvasRenderingContext2D, world: World, camera: Camera) {
    const startCol = Math.max(0, Math.floor((camera.x - 40) / world.tileSize));
    const endCol = Math.min(world.cols - 1, Math.ceil((camera.x + camera.viewportWidth + 40) / world.tileSize));
    const startRow = Math.max(0, Math.floor((camera.y - 40) / world.tileSize));
    const endRow = Math.min(world.rows - 1, Math.ceil((camera.y + camera.viewportHeight + 40) / world.tileSize));

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = world.tiles[r]?.[c];
        if (!tile) continue;

        const wx = c * world.tileSize;
        const wy = r * world.tileSize;
        const { sx, sy } = camera.worldToScreen(wx, wy);

        this.renderTile(ctx, tile, sx, sy, world.tileSize);
      }
    }

    // Fog of Oblivion (ضباب النسيان) when vitality drops below 0.75
    const kingdomState = globalSpacedRepetition.getKingdomState();
    const vitality = kingdomState.vitalityScore ?? 1.0;
    if (vitality < 0.75) {
      const decaySeverity = Math.min(1.0, (0.75 - vitality) / 0.45);
      ctx.save();
      const grad = ctx.createRadialGradient(
        camera.viewportWidth / 2,
        camera.viewportHeight / 2,
        Math.min(camera.viewportWidth, camera.viewportHeight) * (0.55 - decaySeverity * 0.2),
        camera.viewportWidth / 2,
        camera.viewportHeight / 2,
        Math.max(camera.viewportWidth, camera.viewportHeight) * 0.78
      );
      const alpha = Math.min(0.68, decaySeverity * 0.68);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
      grad.addColorStop(0.45, `rgba(30, 41, 59, ${alpha * 0.45})`);
      grad.addColorStop(1, `rgba(10, 15, 30, ${alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, camera.viewportWidth, camera.viewportHeight);
      ctx.restore();
    }
  }

  private renderTile(ctx: CanvasRenderingContext2D, tile: WorldTile, sx: number, sy: number, size: number) {
    switch (tile.type) {
      case 'grass':
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(sx, sy, size, size);
        // Subtle grass shade pattern
        ctx.fillStyle = '#43A047';
        ctx.fillRect(sx + 2, sy + 2, size - 4, size - 4);
        break;

      case 'dark_grass':
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(sx, sy, size, size);
        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(sx + 3, sy + 3, size - 6, size - 6);
        break;

      case 'dirt_path':
        ctx.fillStyle = '#8D6E63';
        ctx.fillRect(sx, sy, size, size);
        ctx.fillStyle = '#795548';
        ctx.fillRect(sx + 2, sy + 2, size - 4, size - 4);
        break;

      case 'stone_pavement':
        ctx.fillStyle = '#78909C';
        ctx.fillRect(sx, sy, size, size);
        // Flagstone lines
        ctx.strokeStyle = '#546E7A';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx + 2, sy + 2, size / 2 - 2, size / 2 - 2);
        ctx.strokeRect(sx + size / 2 + 1, sy + size / 2 + 1, size / 2 - 2, size / 2 - 2);
        break;

      case 'sand':
        ctx.fillStyle = '#D7CCC8';
        ctx.fillRect(sx, sy, size, size);
        break;

      case 'water':
        ctx.fillStyle = '#0288D1';
        ctx.fillRect(sx, sy, size, size);
        // Water ripples
        ctx.fillStyle = '#29B6F6';
        const waveOffset = Math.sin(this.waterTime * 2.5 + (sx + sy) * 0.05) * 4;
        ctx.fillRect(sx + 4, sy + 14 + waveOffset, size - 8, 3);
        ctx.fillRect(sx + 10, sy + 28 - waveOffset, size - 20, 2);
        break;

      case 'bridge':
        // Wooden planks across water
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(sx, sy, size, size);
        ctx.fillStyle = '#5D4037';
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(sx + 2, sy + i * 10 + 1, size - 4, 8);
        }
        // Planks border
        ctx.strokeStyle = '#27170E';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, size, size);
        break;

      case 'ruins':
        ctx.fillStyle = '#37474F';
        ctx.fillRect(sx, sy, size, size);
        ctx.fillStyle = '#263238';
        ctx.fillRect(sx + 4, sy + 4, size - 8, size - 8);
        break;
    }

    // Tile Decorations
    if (tile.decorType) {
      if (tile.decorType === 'flower_red') {
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.arc(sx + size * 0.4, sy + size * 0.5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(sx + size * 0.4, sy + size * 0.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile.decorType === 'flower_yellow') {
        ctx.fillStyle = '#FDD835';
        ctx.beginPath();
        ctx.arc(sx + size * 0.6, sy + size * 0.4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FB8C00';
        ctx.beginPath();
        ctx.arc(sx + size * 0.6, sy + size * 0.4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile.decorType === 'pebble') {
        ctx.fillStyle = '#90A4AE';
        ctx.beginPath();
        ctx.ellipse(sx + size * 0.5, sy + size * 0.7, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (tile.decorType === 'mushroom') {
        ctx.fillStyle = '#E53935';
        ctx.beginPath();
        ctx.arc(sx + size * 0.5, sy + size * 0.4, 4, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(sx + size * 0.5 - 1, sy + size * 0.4, 2, 4);
      } else if (tile.decorType === 'grass_tuft') {
        ctx.strokeStyle = '#81C784';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx + size * 0.4, sy + size * 0.6);
        ctx.lineTo(sx + size * 0.35, sy + size * 0.4);
        ctx.moveTo(sx + size * 0.45, sy + size * 0.6);
        ctx.lineTo(sx + size * 0.45, sy + size * 0.35);
        ctx.moveTo(sx + size * 0.5, sy + size * 0.6);
        ctx.lineTo(sx + size * 0.55, sy + size * 0.4);
        ctx.stroke();
      }
    }
  }

  // ==========================================
  // BUILDING PLOT RENDERING
  // ==========================================
  public renderPlot(
    ctx: CanvasRenderingContext2D,
    plot: BuildingPlot,
    camera: Camera,
    isHovered: boolean = false,
    selectedPlotId: string | null = null
  ) {
    const kingdomState = globalSpacedRepetition.getKingdomState();
    const currentStage = kingdomState.developmentStage ?? 0;
    const requiredStage = plot.unlockStage ?? 0;

    // In earlier stages, undiscovered plots remain natural wilderness until earned
    if (currentStage < requiredStage) {
      return;
    }

    const { sx, sy } = camera.worldToScreen(plot.x, plot.y);
    const isSelected = selectedPlotId === plot.id;

    if (!plot.building) {
      // Empty plot indicator
      ctx.save();
      ctx.fillStyle = isSelected
        ? 'rgba(59, 130, 246, 0.4)'
        : isHovered
          ? 'rgba(255, 255, 255, 0.3)'
          : 'rgba(0, 0, 0, 0.15)';
      ctx.strokeStyle = isSelected ? '#3B82F6' : isHovered ? '#FFFFFF' : '#CBD5E1';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash([6, 4]);

      ctx.beginPath();
      ctx.roundRect(sx, sy, plot.width, plot.height, 8);
      ctx.fill();
      ctx.stroke();

      // Plot Corner Stakes
      ctx.fillStyle = '#78350F';
      ctx.fillRect(sx - 2, sy - 2, 6, 6);
      ctx.fillRect(sx + plot.width - 4, sy - 2, 6, 6);
      ctx.fillRect(sx - 2, sy + plot.height - 4, 6, 6);
      ctx.fillRect(sx + plot.width - 4, sy + plot.height - 4, 6, 6);

      // Plus Icon
      ctx.fillStyle = isSelected ? '#3B82F6' : '#64748B';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(plot.allowedCategories?.includes('defense') ? '🛡️' : '🔨', sx + plot.width / 2, sy + plot.height / 2 - 8);

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 2.5;
      ctx.strokeText(plot.name || 'Build Plot', sx + plot.width / 2, sy + plot.height / 2 + 12);
      ctx.fillText(plot.name || 'Build Plot', sx + plot.width / 2, sy + plot.height / 2 + 12);

      ctx.restore();
    }
  }

  // ==========================================
  // BUILDINGS RENDERING
  // ==========================================
  public renderBuilding(
    ctx: CanvasRenderingContext2D,
    building: BuildingInstance,
    camera: Camera,
    isSelected: boolean = false
  ) {
    const { sx, sy } = camera.worldToScreen(building.x, building.y);
    const w = building.width;
    const h = building.height;

    ctx.save();

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + w / 2, sy + h - 6, w * 0.48, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.roundRect(sx - 6, sy - 6, w + 12, h + 12, 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Construction state scaffold
    if (building.isConstructing) {
      this.renderScaffold(ctx, sx, sy, w, h, building.constructionProgress);
      ctx.restore();
      return;
    }

    // Render Specific Building Type
    switch (building.type) {
      case 'town_hall':
        this.renderTownHall(ctx, sx, sy, w, h, building.level);
        break;
      case 'house':
        this.renderHouse(ctx, sx, sy, w, h, building.level);
        break;
      case 'warehouse':
        this.renderWarehouse(ctx, sx, sy, w, h, building.level);
        break;
      case 'lumber_camp':
        this.renderLumberCamp(ctx, sx, sy, w, h, building.level);
        break;
      case 'mine':
        this.renderMine(ctx, sx, sy, w, h, building.level);
        break;
      case 'farm':
        this.renderFarm(ctx, sx, sy, w, h, building.level);
        break;
      case 'market':
        this.renderMarket(ctx, sx, sy, w, h, building.level);
        break;
      case 'archer_tower':
        this.renderArcherTower(ctx, sx, sy, w, h, building.level, building.targetAngle);
        break;
      case 'cannon_tower':
        this.renderCannonTower(ctx, sx, sy, w, h, building.level, building.targetAngle);
        break;
      case 'magic_tower':
        this.renderMagicTower(ctx, sx, sy, w, h, building.level);
        break;
      case 'wall':
        this.renderWall(ctx, sx, sy, w, h, building.level);
        break;
    }

    // Decay Effects: Cracks & Moss if vitality < 0.65 and not constructing
    const kingdomState = globalSpacedRepetition.getKingdomState();
    const vitality = kingdomState.vitalityScore ?? 1.0;
    if (vitality < 0.65) {
      this.renderDecayEffects(ctx, sx, sy, w, h, vitality);
    }

    // Health Bar (if damaged)
    if (building.health < building.maxHealth) {
      this.renderHealthBar(ctx, sx + w / 2, sy - 8, building.health, building.maxHealth, 50, 6);
    }

    // Level Badge
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx + w - 10, sy + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${building.level}`, sx + w - 10, sy + 10);

    // Render Bound Knowledge Phrases & Due Beacon above Building
    if (building.type !== 'wall') {
      this.renderBuildingPhraseBadge(ctx, building, sx, sy, w, h);
    }

    ctx.restore();
  }

  private renderBuildingPhraseBadge(
    ctx: CanvasRenderingContext2D,
    building: BuildingInstance,
    sx: number,
    sy: number,
    w: number,
    h: number
  ) {
    const isTownHall = building.type === 'town_hall';
    const items = isTownHall
      ? globalSpacedRepetition.getDueReviewQueue()
      : globalSpacedRepetition.getItemsForPlot(building.plotId);

    if (items.length === 0) return;

    const dueItems = isTownHall ? items : globalSpacedRepetition.getDueItemsForPlot(building.plotId);
    const masteredCount = items.filter((it) => it.state === 'mastered' || it.intervalDays >= 21).length;
    const totalCount = items.length;

    // 1. Capacity Badge below building or near wall
    if (!isTownHall) {
      const badgeY = sy + h - 8;
      const badgeW = 46;
      const badgeH = 14;
      const badgeX = sx + w / 2 - badgeW / 2;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = masteredCount === totalCount ? '#22C55E' : '#64748B';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = masteredCount === totalCount ? '#86EFAC' : '#E2E8F0';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`📚 ${masteredCount}/${totalCount}`, sx + w / 2, badgeY + badgeH / 2);
      ctx.restore();
    }

    // 2. Permanently Pinned Due Phrase Speech Bubble (White bubble, black text)
    // Only renders when review time has arrived and stays pinned until reviewed
    if (building.duePhrase) {
      this.renderSpeechBubble(
        ctx,
        sx + w / 2,
        sy - 6,
        building.duePhrase.native,
        building.duePhrase.translation
      );
    }
  }

  private renderDecayEffects(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    w: number,
    h: number,
    vitality: number
  ) {
    ctx.save();
    // Jagged stone crack line across wall
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx + w * 0.28, sy + h * 0.42);
    ctx.lineTo(sx + w * 0.35, sy + h * 0.54);
    ctx.lineTo(sx + w * 0.31, sy + h * 0.64);
    ctx.lineTo(sx + w * 0.38, sy + h * 0.78);
    ctx.stroke();

    // Additional deep cracks & withered moss if severely neglected (< 0.50)
    if (vitality < 0.50) {
      ctx.beginPath();
      ctx.moveTo(sx + w * 0.72, sy + h * 0.38);
      ctx.lineTo(sx + w * 0.66, sy + h * 0.52);
      ctx.lineTo(sx + w * 0.74, sy + h * 0.68);
      ctx.stroke();

      // Withered overgrown moss
      ctx.fillStyle = 'rgba(71, 85, 105, 0.55)';
      ctx.fillRect(sx + 10, sy + h - 14, 12, 5);
      ctx.fillRect(sx + w - 24, sy + h - 16, 14, 6);
    }
    ctx.restore();
  }

  private renderScaffold(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    w: number,
    h: number,
    progress: number
  ) {
    // Wooden beams & scaffolding
    ctx.fillStyle = '#78350F';
    ctx.fillRect(sx + 10, sy + 10, 6, h - 20);
    ctx.fillRect(sx + w - 16, sy + 10, 6, h - 20);
    ctx.fillRect(sx + 10, sy + 25, w - 20, 5);
    ctx.fillRect(sx + 10, sy + h - 25, w - 20, 5);

    // Cross braces
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy + 25);
    ctx.lineTo(sx + w - 16, sy + h - 25);
    ctx.moveTo(sx + w - 16, sy + 25);
    ctx.lineTo(sx + 10, sy + h - 25);
    ctx.stroke();

    // Progress bar
    const barW = w * 0.8;
    const barH = 8;
    const barX = sx + (w - barW) / 2;
    const barY = sy + h / 2 - 4;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);
    ctx.fill();

    ctx.fillStyle = '#3B82F6';
    ctx.roundRect(barX, barY, barW * progress, barH, 3);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Building... ${Math.round(progress * 100)}%`, sx + w / 2, barY - 6);
  }

  // --- Town Hall / Central Spire ---
  private renderTownHall(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    const kingdomState = globalSpacedRepetition.getKingdomState();
    const stage = kingdomState.developmentStage ?? 0;

    if (stage === 0) {
      // Stage 0: Lone Starter Stone Spire / Watchtower
      // Single tall stone watchtower with character battlement
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx + 35, sy + 30, w - 70, h - 35);

      // Stone lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + 35, sy + 45 + i * 14);
        ctx.lineTo(sx + w - 35, sy + 45 + i * 14);
        ctx.stroke();
      }

      // Wooden Upper Watch platform
      ctx.fillStyle = '#78350F';
      ctx.fillRect(sx + 28, sy + 20, w - 56, 12);

      // Spiked Wooden parapets
      ctx.fillStyle = '#92400E';
      ctx.fillRect(sx + 28, sy + 12, 10, 10);
      ctx.fillRect(sx + w - 38, sy + 12, 10, 10);
      ctx.fillRect(sx + w / 2 - 5, sy + 12, 10, 10);

      // Small Iron Grate Door
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(sx + w / 2 - 10, sy + h - 22, 20, 18);
      // Door Wood / Arch
      ctx.fillStyle = '#3E2723';
      ctx.fillRect(sx + w / 2 - 8, sy + h - 20, 16, 16);
    } else if (stage === 1) {
      // Stage 1: Reinforced Outpost Keep
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx + 20, sy + 28, w - 40, h - 33);

      ctx.fillStyle = '#64748B';
      ctx.fillRect(sx + 15, sy + 14, 20, h - 19);
      ctx.fillRect(sx + w - 35, sy + 14, 20, h - 19);

      // Timber roof
      ctx.fillStyle = '#B45309';
      ctx.beginPath();
      ctx.moveTo(sx + w / 2, sy + 10);
      ctx.lineTo(sx + w - 30, sy + 28);
      ctx.lineTo(sx + 30, sy + 28);
      ctx.closePath();
      ctx.fill();

      // Banner
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(sx + w / 2 - 8, sy + 32, 16, 22);

      // Reinforced Double Gate
      ctx.fillStyle = '#1C1917';
      ctx.fillRect(sx + w / 2 - 14, sy + h - 22, 28, 18);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(sx + w / 2 - 12, sy + h - 20, 24, 16);
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx + w / 2 - 12, sy + h - 20, 24, 16);
    } else {
      // Stage 2+: Grand Fortified Castle / Citadel
      // Castle Base
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx + 10, sy + 30, w - 20, h - 35);

      // Stone block lines
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(sx + 10, sy + 45 + i * 15);
        ctx.lineTo(sx + w - 10, sy + 45 + i * 15);
        ctx.stroke();
      }

      // Side Towers
      ctx.fillStyle = '#64748B';
      ctx.fillRect(sx + 6, sy + 15, 26, h - 20);
      ctx.fillRect(sx + w - 32, sy + 15, 26, h - 20);

      // Battlements on Towers
      ctx.fillStyle = '#475569';
      ctx.fillRect(sx + 6, sy + 8, 8, 8);
      ctx.fillRect(sx + 24, sy + 8, 8, 8);
      ctx.fillRect(sx + w - 32, sy + 8, 8, 8);
      ctx.fillRect(sx + w - 14, sy + 8, 8, 8);

      // Center Grand Slate Roof
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.moveTo(sx + w / 2, sy + 4);
      ctx.lineTo(sx + w - 25, sy + 32);
      ctx.lineTo(sx + 25, sy + 32);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Red Royal Banner in Middle
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(sx + w / 2 - 12, sy + 34, 24, 30);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + 48, 5, 0, Math.PI * 2);
      ctx.fill();

      // Castle Arch Gateway Outer Frame
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + h - 18, 16, Math.PI, 0);
      ctx.lineTo(sx + w / 2 + 16, sy + h - 5);
      ctx.lineTo(sx + w / 2 - 16, sy + h - 5);
      ctx.closePath();
      ctx.fill();

      // Interior Castle Torchlight Glow
      const torchGrad = ctx.createRadialGradient(sx + w / 2, sy + h - 12, 2, sx + w / 2, sy + h - 12, 14);
      torchGrad.addColorStop(0, '#F59E0B');
      torchGrad.addColorStop(0.7, '#78350F');
      torchGrad.addColorStop(1, '#1C1917');
      ctx.fillStyle = torchGrad;
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + h - 18, 14, Math.PI, 0);
      ctx.lineTo(sx + w / 2 + 14, sy + h - 5);
      ctx.lineTo(sx + w / 2 - 14, sy + h - 5);
      ctx.closePath();
      ctx.fill();

      // Iron Portcullis Grill
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      for (let gx = -10; gx <= 10; gx += 5) {
        ctx.beginPath();
        ctx.moveTo(sx + w / 2 + gx, sy + h - 26);
        ctx.lineTo(sx + w / 2 + gx, sy + h - 5);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(sx + w / 2 - 12, sy + h - 16);
      ctx.lineTo(sx + w / 2 + 12, sy + h - 16);
      ctx.moveTo(sx + w / 2 - 12, sy + h - 10);
      ctx.lineTo(sx + w / 2 + 12, sy + h - 10);
      ctx.stroke();
    }

    // ==========================================
    // IN-WORLD REVIEW INDICATOR & MEMORY SPIRE
    // ==========================================
    const dueCount = kingdomState.dueItemsCount;
    const crystalX = sx + w / 2;
    const floatOffset = Math.sin(this.waterTime * 3.5) * 4;
    const crystalY = sy - 16 + floatOffset;

    if (dueCount > 0) {
      // Warm Pulsing Review Beacon
      const pulseAlpha = 0.35 + Math.sin(this.waterTime * 5) * 0.2;
      ctx.save();

      // Outer Aura Glow
      const glowGrad = ctx.createRadialGradient(crystalX, crystalY, 4, crystalX, crystalY, 28);
      glowGrad.addColorStop(0, `rgba(245, 158, 11, ${pulseAlpha})`);
      glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(crystalX, crystalY, 28, 0, Math.PI * 2);
      ctx.fill();

      // Memory Diamond Crystal
      ctx.fillStyle = '#F59E0B';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(crystalX, crystalY - 12);
      ctx.lineTo(crystalX + 9, crystalY);
      ctx.lineTo(crystalX, crystalY + 12);
      ctx.lineTo(crystalX - 9, crystalY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crystal Highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(crystalX, crystalY - 10);
      ctx.lineTo(crystalX + 4, crystalY);
      ctx.lineTo(crystalX, crystalY + 2);
      ctx.lineTo(crystalX - 4, crystalY);
      ctx.closePath();
      ctx.fill();

      // Floating Badge Above Castle
      const badgeW = 90;
      const badgeH = 22;
      const badgeX = crystalX - badgeW / 2;
      const badgeY = crystalY - 26;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 11);
      ctx.fill();
      ctx.stroke();

      // Badge Text
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`✨ ${dueCount} Review${dueCount > 1 ? 's' : ''}`, crystalX, badgeY + badgeH / 2);

      ctx.restore();
    } else {
      // Serene Harmony Spire Crystal (No urgent reviews)
      ctx.save();
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(crystalX, crystalY - 8);
      ctx.lineTo(crystalX + 6, crystalY);
      ctx.lineTo(crystalX, crystalY + 8);
      ctx.lineTo(crystalX - 6, crystalY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // --- House Cottage ---
  private renderHouse(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    // Timber Walls
    ctx.fillStyle = '#D7CCC8';
    ctx.fillRect(sx + 12, sy + 30, w - 24, h - 36);

    // Wood Beams
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(sx + 12, sy + 30, 5, h - 36);
    ctx.fillRect(sx + w - 17, sy + 30, 5, h - 36);
    ctx.fillRect(sx + 12, sy + 30, w - 24, 4);

    // Red Brick Chimney with Smoke
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(sx + w - 24, sy + 8, 10, 20);

    // Chimney smoke (extinguished if village vitality < 0.65)
    const kingdomState = globalSpacedRepetition.getKingdomState();
    if ((kingdomState.vitalityScore ?? 1.0) >= 0.65) {
      ctx.fillStyle = 'rgba(209, 213, 219, 0.7)';
      const smokeY = (this.waterTime * 15) % 20;
      ctx.beginPath();
      ctx.arc(sx + w - 19, sy + 5 - smokeY, 4 + smokeY * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Slanted Orange Clay Tile Roof
    ctx.fillStyle = '#EA580C';
    ctx.beginPath();
    ctx.moveTo(sx + w / 2, sy + 10);
    ctx.lineTo(sx + w - 6, sy + 34);
    ctx.lineTo(sx + 6, sy + 34);
    ctx.closePath();
    ctx.fill();

    // Wooden Door & Glowing Window
    ctx.fillStyle = '#4E342E';
    ctx.fillRect(sx + 22, sy + h - 24, 14, 18);

    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(sx + w - 34, sy + 44, 14, 14);
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx + w - 34, sy + 44, 14, 14);
  }

  // --- Warehouse ---
  private renderWarehouse(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    // Sturdy Wooden Barn
    ctx.fillStyle = '#854D0E';
    ctx.fillRect(sx + 10, sy + 26, w - 20, h - 32);

    // Darker Timber Planks
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(sx + 10, sy + 35 + i * 10);
      ctx.lineTo(sx + w - 10, sy + 35 + i * 10);
      ctx.stroke();
    }

    // Barn Roof
    ctx.fillStyle = '#713F12';
    ctx.beginPath();
    ctx.moveTo(sx + w / 2, sy + 8);
    ctx.lineTo(sx + w - 4, sy + 28);
    ctx.lineTo(sx + 4, sy + 28);
    ctx.closePath();
    ctx.fill();

    // Double Sliding Door
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(sx + w / 2 - 16, sy + h - 28, 32, 22);

    // Crates and Barrels outside
    ctx.fillStyle = '#A16207';
    ctx.fillRect(sx + 14, sy + h - 18, 12, 12);
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(sx + w - 18, sy + h - 12, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Lumber Camp ---
  private renderLumberCamp(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    // Open Wood Cutting Shelter
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(sx + 10, sy + 24, 6, h - 30);
    ctx.fillRect(sx + w - 16, sy + 24, 6, h - 30);

    // Leafy / Canvas Awning
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.moveTo(sx + w / 2, sy + 8);
    ctx.lineTo(sx + w - 4, sy + 26);
    ctx.lineTo(sx + 4, sy + 26);
    ctx.closePath();
    ctx.fill();

    // Big Log Pile
    ctx.fillStyle = '#92400E';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + 24 + i * 12, sy + h - 14, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Top logs
    ctx.beginPath();
    ctx.arc(sx + 30, sy + h - 24, 7, 0, Math.PI * 2);
    ctx.arc(sx + 42, sy + h - 24, 7, 0, Math.PI * 2);
    ctx.fill();

    // Sawblade
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.arc(sx + w - 24, sy + h - 18, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Mine / Quarry ---
  private renderMine(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    // Stone Hill Mound
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(sx + w / 2, sy + h - 10, w * 0.44, Math.PI, 0);
    ctx.fill();

    // Mine Shaft Entrance
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(sx + w / 2, sy + h - 14, 18, Math.PI, 0);
    ctx.lineTo(sx + w / 2 + 18, sy + h - 5);
    ctx.lineTo(sx + w / 2 - 18, sy + h - 5);
    ctx.closePath();
    ctx.fill();

    // Wooden Support Frame
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Minecart on Rails
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(sx + w / 2 - 10, sy + h - 12, 20, 10);
    // Gold/Iron ore chunks inside cart
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sx + w / 2 - 4, sy + h - 14, 4, 0, Math.PI * 2);
    ctx.arc(sx + w / 2 + 4, sy + h - 14, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Farm / Mill ---
  private renderFarm(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    // Farm Barn / Mill Base
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(sx + 12, sy + 25, 30, h - 32);

    // Mill Roof
    ctx.fillStyle = '#B91C1C';
    ctx.beginPath();
    ctx.moveTo(sx + 27, sy + 8);
    ctx.lineTo(sx + 45, sy + 25);
    ctx.lineTo(sx + 9, sy + 25);
    ctx.closePath();
    ctx.fill();

    // Rotating Windmill Blades
    const bladeAngle = this.waterTime * 1.5;
    ctx.save();
    ctx.translate(sx + 27, sy + 24);
    ctx.rotate(bladeAngle);

    ctx.fillStyle = '#78350F';
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.fillRect(-2, 0, 4, 22);
      // Canvas cloth sail on blade
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(2, 6, 8, 14);
      ctx.fillStyle = '#78350F';
    }
    ctx.restore();

    // Fenced Wheat Field on right side
    const kingdomState = globalSpacedRepetition.getKingdomState();
    const vitality = kingdomState.vitalityScore ?? 1.0;
    const isWilted = vitality < 0.65;

    ctx.fillStyle = isWilted ? '#854D0E' : '#FDE047';
    ctx.fillRect(sx + 48, sy + 25, w - 54, h - 32);

    // Wheat Stalks
    ctx.strokeStyle = isWilted ? '#522E09' : '#CA8A04';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const stalkX = sx + 52 + i * 7;
      ctx.moveTo(stalkX, sy + h - 8);
      if (isWilted) {
        // Wilted drooping stalks
        ctx.lineTo(stalkX + 4, sy + h - 18);
        ctx.lineTo(stalkX + 8, sy + h - 14);
      } else {
        ctx.lineTo(stalkX, sy + 32);
      }
      ctx.stroke();
    }
  }

  // --- Market ---
  private renderMarket(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    // Stall Counter
    ctx.fillStyle = '#854D0E';
    ctx.fillRect(sx + 10, sy + 38, w - 20, h - 44);

    // Striped Red & White Canopy
    const canopyStripeW = (w - 12) / 6;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#DC2626' : '#FFFFFF';
      ctx.fillRect(sx + 6 + i * canopyStripeW, sy + 14, canopyStripeW, 24);
    }

    // Canopy Scalloped Edge
    ctx.fillStyle = '#DC2626';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(sx + 6 + i * canopyStripeW + canopyStripeW / 2, sy + 38, canopyStripeW / 2, 0, Math.PI);
      ctx.fill();
    }

    // Goods & Coin Bags on Counter
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(sx + 24, sy + 44, 6, 0, Math.PI * 2);
    ctx.arc(sx + w / 2, sy + 44, 7, 0, Math.PI * 2);
    ctx.arc(sx + w - 24, sy + 44, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Defense: Archer Tower ---
  private renderArcherTower(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    w: number,
    h: number,
    _level: number,
    aimAngle: number
  ) {
    // Stone Tower Base
    ctx.fillStyle = '#475569';
    ctx.fillRect(sx + 12, sy + 25, w - 24, h - 30);

    // Wooden Top Battlement Platform
    ctx.fillStyle = '#78350F';
    ctx.fillRect(sx + 6, sy + 14, w - 12, 14);

    // Battlement crenels
    ctx.fillRect(sx + 6, sy + 8, 8, 8);
    ctx.fillRect(sx + w - 14, sy + 8, 8, 8);
    ctx.fillRect(sx + w / 2 - 4, sy + 8, 8, 8);

    // Archer on Tower (Animated aim)
    const archerX = sx + w / 2;
    const archerY = sy + 12;

    // Archer Head with Green Cap & Feather
    ctx.fillStyle = '#15803D';
    ctx.beginPath();
    ctx.arc(archerX, archerY - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Bow pointing in aim direction
    ctx.save();
    ctx.translate(archerX, archerY);
    ctx.rotate(aimAngle);

    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(10, 0, 10, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    // Bowstring
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, -8);
    ctx.lineTo(15, 8);
    ctx.stroke();

    ctx.restore();
  }

  // --- Defense: Cannon Tower ---
  private renderCannonTower(
    ctx: CanvasRenderingContext2D,
    sx: number,
    sy: number,
    w: number,
    h: number,
    _level: number,
    aimAngle: number
  ) {
    // Heavy Stone Tower Base
    ctx.fillStyle = '#334155';
    ctx.fillRect(sx + 10, sy + 22, w - 20, h - 28);

    // Rotating Cannon Platform
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(sx + w / 2, sy + 22, 18, 0, Math.PI * 2);
    ctx.fill();

    // Iron Cannon Barrel
    ctx.save();
    ctx.translate(sx + w / 2, sy + 22);
    ctx.rotate(aimAngle);

    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, -6, 26, 12);
    // Barrel Muzzle Rim
    ctx.fillStyle = '#475569';
    ctx.fillRect(24, -8, 4, 16);

    ctx.restore();
  }

  // --- Defense: Magic Crystal Tower ---
  private renderMagicTower(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    // Mystic Obsidian Spire
    ctx.fillStyle = '#1E1B4B';
    ctx.beginPath();
    ctx.moveTo(sx + w / 2, sy + 25);
    ctx.lineTo(sx + w - 10, sy + h - 8);
    ctx.lineTo(sx + 10, sy + h - 8);
    ctx.closePath();
    ctx.fill();

    // Floating Levitation Crystal
    const hoverY = Math.sin(this.waterTime * 3) * 5;
    const crystalX = sx + w / 2;
    const crystalY = sy + 14 + hoverY;

    // Glowing Aura
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.arc(crystalX, crystalY, 18, 0, Math.PI * 2);
    ctx.fill();

    // Crystal Diamond
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.moveTo(crystalX, crystalY - 14);
    ctx.lineTo(crystalX + 9, crystalY);
    ctx.lineTo(crystalX, crystalY + 14);
    ctx.lineTo(crystalX - 9, crystalY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#E0F2FE';
    ctx.beginPath();
    ctx.moveTo(crystalX, crystalY - 14);
    ctx.lineTo(crystalX + 9, crystalY);
    ctx.lineTo(crystalX, crystalY + 14);
    ctx.closePath();
    ctx.fill();
  }

  // --- Wall ---
  private renderWall(ctx: CanvasRenderingContext2D, sx: number, sy: number, w: number, h: number, _level: number) {
    // Spiked Wooden Palisade
    ctx.fillStyle = '#78350F';
    for (let i = 0; i < 4; i++) {
      const stakeX = sx + 8 + i * 16;
      ctx.fillRect(stakeX, sy + 18, 12, h - 24);
      // Spiked tip
      ctx.beginPath();
      ctx.moveTo(stakeX, sy + 18);
      ctx.lineTo(stakeX + 6, sy + 6);
      ctx.lineTo(stakeX + 12, sy + 18);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ==========================================
  // RESOURCE NODES RENDERING
  // ==========================================
  public renderResourceNode(ctx: CanvasRenderingContext2D, node: ResourceNodeInstance, camera: Camera) {
    const { sx, sy } = camera.worldToScreen(node.x, node.y);
    const w = node.width;
    const h = node.height;

    ctx.save();

    // Shake effect during chopping / mining
    let shakeX = 0;
    if (node.shakeTimer > 0) {
      shakeX = Math.sin(node.shakeTimer * 40) * 4;
    }

    if (node.isDepleted) {
      // Depleted stump or rubble
      if (node.type.startsWith('tree')) {
        // Tree stump
        ctx.fillStyle = '#78350F';
        ctx.fillRect(sx + w / 2 - 8, sy + h - 14, 16, 12);
        ctx.fillStyle = '#FEF3C7';
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h - 14, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (node.type.startsWith('rock')) {
        // Flat rock pebbles
        ctx.fillStyle = '#64748B';
        ctx.beginPath();
        ctx.ellipse(sx + w / 2, sy + h - 8, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(sx + w / 2, sy + h - 4, w * 0.45, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render node types
    if (node.type === 'tree_oak') {
      // Trunk
      ctx.fillStyle = '#78350F';
      ctx.fillRect(sx + w / 2 - 7 + shakeX, sy + h - 22, 14, 20);

      // Lush layered Green Foliage
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(sx + w / 2 + shakeX, sy + 24, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.arc(sx + w / 2 - 6 + shakeX, sy + 18, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(sx + w / 2 + 6 + shakeX, sy + 16, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (node.type === 'tree_pine') {
      // Trunk
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(sx + w / 2 - 5 + shakeX, sy + h - 18, 10, 16);

      // Tiered Evergreen Needles
      ctx.fillStyle = '#064E3B';
      // Bottom tier
      ctx.beginPath();
      ctx.moveTo(sx + w / 2 + shakeX, sy + 28);
      ctx.lineTo(sx + w - 4 + shakeX, sy + h - 16);
      ctx.lineTo(sx + 4 + shakeX, sy + h - 16);
      ctx.closePath();
      ctx.fill();

      // Middle tier
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.moveTo(sx + w / 2 + shakeX, sy + 14);
      ctx.lineTo(sx + w - 8 + shakeX, sy + 38);
      ctx.lineTo(sx + 8 + shakeX, sy + 38);
      ctx.closePath();
      ctx.fill();

      // Top tier
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.moveTo(sx + w / 2 + shakeX, sy + 2);
      ctx.lineTo(sx + w - 12 + shakeX, sy + 22);
      ctx.lineTo(sx + 12 + shakeX, sy + 22);
      ctx.closePath();
      ctx.fill();
    } else if (node.type === 'rock_stone' || node.type === 'rock_gold') {
      // Stone Boulder
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.ellipse(sx + w / 2 + shakeX, sy + h / 2, w * 0.44, h * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Highlight facet
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.ellipse(sx + w / 2 - 6 + shakeX, sy + h / 2 - 6, w * 0.28, h * 0.22, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Gold / Iron ore veins
      if (node.type === 'rock_gold') {
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(sx + w / 2 + 4 + shakeX, sy + h / 2 - 2, 4, 0, Math.PI * 2);
        ctx.arc(sx + w / 2 - 8 + shakeX, sy + h / 2 + 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (node.type === 'bush_berry') {
      // Berry Bush
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(sx + w / 2 + shakeX, sy + h / 2, 16, 0, Math.PI * 2);
      ctx.fill();

      // Red Berries
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(sx + w / 2 - 5 + shakeX, sy + h / 2 - 4, 3, 0, Math.PI * 2);
      ctx.arc(sx + w / 2 + 6 + shakeX, sy + h / 2 - 2, 3, 0, Math.PI * 2);
      ctx.arc(sx + w / 2 + 1 + shakeX, sy + h / 2 + 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Health / Yield Bar when hit
    if (node.health < node.maxHealth) {
      this.renderHealthBar(ctx, sx + w / 2, sy - 4, node.health, node.maxHealth, 32, 4);
    }

    ctx.restore();
  }

  // ==========================================
  // EXPLORATION CHESTS RENDERING
  // ==========================================
  public renderChest(ctx: CanvasRenderingContext2D, chest: ChestInstance, camera: Camera) {
    const { sx, sy } = camera.worldToScreen(chest.x, chest.y);
    const w = chest.width;
    const h = chest.height;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + w / 2, sy + h - 2, w * 0.45, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (chest.isOpened) {
      // Opened Wooden Chest
      ctx.fillStyle = '#78350F';
      ctx.fillRect(sx + 4, sy + 12, w - 8, h - 14);

      // Open Lid tilted back
      ctx.fillStyle = '#92400E';
      ctx.fillRect(sx + 2, sy + 2, w - 4, 10);
    } else {
      // Closed Ornate Golden Chest
      ctx.fillStyle = '#B45309';
      ctx.fillRect(sx + 4, sy + 10, w - 8, h - 12);

      // Lid
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.roundRect(sx + 2, sy + 4, w - 4, 10, 4);
      ctx.fill();

      // Gold Trim Bands
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(sx + 8, sy + 4, 3, h - 6);
      ctx.fillRect(sx + w - 11, sy + 4, 3, h - 6);

      // Keyhole Lock
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(sx + w / 2, sy + 14, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle Effect
      const sparkle = Math.sin(this.waterTime * 4) > 0.7;
      if (sparkle) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(sx + 6, sy + 4, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ==========================================
  // FULL-BODY HERO KNIGHT RENDERING
  // ==========================================
  public renderHero(ctx: CanvasRenderingContext2D, hero: HeroState, camera: Camera) {
    const { sx, sy } = camera.worldToScreen(hero.x, hero.y);
    const isMoving = hero.animFrame % 2 !== 0 || hero.isGathering;

    ctx.save();

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(sx + hero.width / 2, sy + hero.height - 2, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hurt red tint flash
    if (hero.isHurt) {
      ctx.globalAlpha = 0.8;
    }

    // Hero Center Origin
    const hx = sx + hero.width / 2;
    const hy = sy + hero.height / 2;

    // Direction flip
    const isFacingLeft = hero.direction === 'left';
    const isFacingUp = hero.direction === 'up';

    ctx.save();
    ctx.translate(hx, hy);
    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    // 1. Red Royal Cloak (behind body)
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.lineTo(9 + (isMoving ? 3 : 0), 16);
    ctx.lineTo(-9 - (isMoving ? 3 : 0), 16);
    ctx.closePath();
    ctx.fill();

    // 2. Animated Legs / Iron Boots
    const legOffset = isMoving ? Math.sin(hero.animTimer * 12) * 5 : 0;
    ctx.fillStyle = '#334155'; // Iron Boots
    // Left Leg
    ctx.fillRect(-6, 8 - legOffset, 5, 9 + legOffset);
    // Right Leg
    ctx.fillRect(1, 8 + legOffset, 5, 9 - legOffset);

    // 3. Steel Plate Torso Armor with Gold Trim
    ctx.fillStyle = '#64748B'; // Steel
    ctx.fillRect(-7, -6, 14, 15);
    ctx.fillStyle = '#F59E0B'; // Gold Trim
    ctx.fillRect(-7, 7, 14, 2);
    ctx.fillRect(-1, -6, 2, 15);

    // 4. Knight Helmet / Head
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, -12, 8, 0, Math.PI * 2);
    ctx.fill();

    // Helmet Visor T-slit or eye slit
    if (!isFacingUp) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-4, -14, 8, 3);
    }

    // Royal Blue Plume on Helmet
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(0, -19, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Shield (Left hand)
    if (!isFacingUp) {
      ctx.fillStyle = '#1D4ED8';
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-8, 10);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 6. Sword / Tool (Right hand & Attack Animation)
    const attackAngle = hero.isAttacking
      ? -Math.PI / 4 + hero.attackAnimProgress * Math.PI
      : hero.isGathering
        ? Math.sin(hero.gatherTimer * 12) * 0.8
        : 0;

    ctx.save();
    ctx.translate(8, 2);
    ctx.rotate(attackAngle);

    if (hero.isGathering && hero.gatherType === 'chop') {
      // Woodcutter Axe
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-2, -18, 4, 20);
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(4, -14, 7, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
    } else if (hero.isGathering && hero.gatherType === 'mine') {
      // Miner Pickaxe
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-2, -18, 4, 20);
      ctx.fillStyle = '#94A3B8';
      ctx.beginPath();
      ctx.arc(0, -16, 10, -Math.PI * 0.8, -Math.PI * 0.2);
      ctx.stroke();
    } else {
      // Knight Broadsword
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(-2, -22, 4, 20); // Blade
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-6, -4, 12, 3); // Crossguard
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-1.5, -1, 3, 6); // Hilt
    }

    ctx.restore();

    ctx.restore(); // Restore hero scale

    // Slash Swing Arc Trail Effect
    if (hero.isAttacking) {
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const slashAngleStart = isFacingLeft ? Math.PI * 0.8 : -Math.PI * 0.2;
      const slashAngleEnd = isFacingLeft ? Math.PI * 1.5 : Math.PI * 0.5;
      ctx.arc(hx, hy, 28, slashAngleStart, slashAngleEnd);
      ctx.stroke();
    }

    // Attached Due Phrase Speech Bubble (moves with hero/leader)
    if (hero.duePhrase) {
      this.renderSpeechBubble(
        ctx,
        hx,
        sy - 14,
        hero.duePhrase.native,
        hero.duePhrase.translation
      );
    }

    ctx.restore();
  }

  // ==========================================
  // AUTONOMOUS CASTLE WARRIORS RENDERING
  // ==========================================
  public renderWarrior(ctx: CanvasRenderingContext2D, warrior: WarriorInstance, camera: Camera) {
    if (warrior.state === 'inside_castle') {
      return; // Sheltered inside the castle garrison
    }

    const { sx, sy } = camera.worldToScreen(warrior.x, warrior.y);
    const isMoving = warrior.state === 'charging' || warrior.state === 'returning' || warrior.animFrame % 2 !== 0;

    ctx.save();

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(sx + warrior.width / 2, sy + warrior.height - 2, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hurt red tint flash
    if (warrior.hurtTimer > 0) {
      ctx.globalAlpha = 0.75;
    }

    const wx = sx + warrior.width / 2;
    const wy = sy + warrior.height / 2;
    const isFacingLeft = warrior.direction === 'left';
    const isFacingUp = warrior.direction === 'up';

    ctx.save();
    ctx.translate(wx, wy);
    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    // 1. Cloak / Cape (Color-coded based on warrior's color)
    ctx.fillStyle = warrior.color || '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.lineTo(9 + (isMoving ? 3 : 0), 16);
    ctx.lineTo(-9 - (isMoving ? 3 : 0), 16);
    ctx.closePath();
    ctx.fill();

    // 2. Animated Legs / Iron Greaves
    const legOffset = isMoving ? Math.sin(warrior.animTimer * 14) * 5 : 0;
    ctx.fillStyle = '#334155'; // Iron Boots
    ctx.fillRect(-6, 8 - legOffset, 5, 9 + legOffset);
    ctx.fillRect(1, 8 + legOffset, 5, 9 - legOffset);

    // 3. Steel Plate Torso Armor with Rank Gold Trim
    ctx.fillStyle = '#64748B'; // Steel armor
    ctx.fillRect(-7, -6, 14, 15);
    ctx.fillStyle = '#F59E0B'; // Gold trim
    ctx.fillRect(-7, 7, 14, 2);
    ctx.fillRect(-1, -6, 2, 15);

    // 4. Knight Helmet & Plume
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, -12, 8, 0, Math.PI * 2);
    ctx.fill();

    // Visor eye-slit
    if (!isFacingUp) {
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-4, -14, 8, 3);
    }

    // Colored Feather Plume on Helmet
    ctx.fillStyle = warrior.color || '#3B82F6';
    ctx.beginPath();
    ctx.arc(0, -19, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Shield (Left hand)
    if (!isFacingUp) {
      ctx.fillStyle = warrior.color || '#1D4ED8';
      ctx.beginPath();
      ctx.moveTo(-12, -4);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-4, 6);
      ctx.lineTo(-8, 10);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shield Crest icon
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(-8, 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Broadsword (Right hand with Attack Swing)
    const attackAngle = warrior.isAttacking
      ? -Math.PI / 4 + warrior.attackAnimProgress * Math.PI
      : isMoving
        ? Math.sin(warrior.animTimer * 10) * 0.3
        : 0;

    ctx.save();
    ctx.translate(8, 2);
    ctx.rotate(attackAngle);

    // Blade
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(-2, -22, 4, 20);
    // Gold Crossguard
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-6, -4, 12, 3);
    // Hilt
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-1.5, -1, 3, 6);

    ctx.restore();

    ctx.restore(); // Restore warrior transform

    // Slash Arc Trail Effect when swinging
    if (warrior.isAttacking) {
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const slashAngleStart = isFacingLeft ? Math.PI * 0.8 : -Math.PI * 0.2;
      const slashAngleEnd = isFacingLeft ? Math.PI * 1.5 : Math.PI * 0.5;
      ctx.arc(wx, wy, 28, slashAngleStart, slashAngleEnd);
      ctx.stroke();
    }

    // Health Bar & Name Tag above Warrior
    const isDamaged = warrior.health < warrior.maxHealth;
    const isEngaged = warrior.state === 'charging' || warrior.state === 'attacking';

    if (isDamaged || isEngaged) {
      this.renderHealthBar(ctx, wx, sy - 8, warrior.health, warrior.maxHealth, 32, 4);

      // Mini Name / Action Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(wx - 26, sy - 22, 52, 12, 4);
      ctx.fill();

      ctx.fillStyle = warrior.state === 'charging' || warrior.state === 'attacking' ? '#F87171' : '#38BDF8';
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = warrior.state === 'attacking' ? '⚔️ ATTACK' : warrior.state === 'charging' ? '⚡ CHARGE' : '🛡️ GUARD';
      ctx.fillText(label, wx, sy - 16);
    }

    // Attached Due Phrase Speech Bubble (moves with warrior above head)
    if (warrior.duePhrase) {
      const bubbleAnchorY = isDamaged || isEngaged ? sy - 26 : sy - 14;
      this.renderSpeechBubble(
        ctx,
        wx,
        bubbleAnchorY,
        warrior.duePhrase.native,
        warrior.duePhrase.translation
      );
    }

    ctx.restore();
  }

  // ==========================================
  // FULL-BODY WORKERS / VILLAGERS RENDERING
  // ==========================================
  public renderWorker(ctx: CanvasRenderingContext2D, worker: WorkerInstance, camera: Camera) {
    const { sx, sy } = camera.worldToScreen(worker.x, worker.y);
    const isMoving = worker.state === 'walking_to_node' || worker.state === 'returning_to_warehouse';
    const isWorking = worker.state === 'working';

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + 14, sy + 28, 10, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const wx = sx + 14;
    const wy = sy + 14;
    const isFacingLeft = worker.direction === 'left';

    ctx.save();
    ctx.translate(wx, wy);
    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    // Carried Resource Sack on Back when returning
    if (worker.carriedResource.amount > 0) {
      ctx.fillStyle = worker.carriedResource.type === 'wood' ? '#92400E' : worker.carriedResource.type === 'stone' ? '#64748B' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(-8, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Legs animation
    const legOffset = isMoving ? Math.sin(worker.animTimer * 10) * 4 : 0;
    ctx.fillStyle = '#1E293B'; // Pants
    ctx.fillRect(-5, 6 - legOffset, 4, 8 + legOffset);
    ctx.fillRect(1, 6 + legOffset, 4, 8 - legOffset);

    // Job-Specific Clothing
    if (worker.job === 'lumberjack') {
      // Red Plaid Shirt
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-6, -4, 12, 11);
      // Suspenders
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-4, -4, 2, 11);
      ctx.fillRect(2, -4, 2, 11);

      // Head & Brown Beard
      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.arc(0, -9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-4, -8, 8, 5); // Beard
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(-5, -14, 10, 4); // Beanie
    } else if (worker.job === 'miner') {
      // Blue Overalls
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(-6, -4, 12, 11);

      // Head & Yellow Hardhat with Light
      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.arc(0, -9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-6, -14, 12, 5); // Hardhat
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-2, -12, 4, 3); // Headlamp
    } else if (worker.job === 'farmer') {
      // Green Shirt & Overalls
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(-6, -4, 12, 11);

      // Head & Straw Hat
      ctx.fillStyle = '#FBCFE8';
      ctx.beginPath();
      ctx.arc(0, -9, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FDE047';
      ctx.fillRect(-9, -12, 18, 3); // Hat brim
      ctx.fillRect(-5, -16, 10, 4); // Hat top
    }

    // Tool & Working Animation
    const toolSwing = isWorking ? Math.sin(worker.animTimer * 12) * 0.8 : 0;
    ctx.save();
    ctx.translate(6, 2);
    ctx.rotate(toolSwing);

    ctx.fillStyle = '#78350F';
    ctx.fillRect(-1.5, -12, 3, 14);
    ctx.fillStyle = '#94A3B8';
    if (worker.job === 'lumberjack') {
      ctx.beginPath();
      ctx.arc(3, -10, 4, -Math.PI / 2, Math.PI / 2);
      ctx.fill();
    } else if (worker.job === 'miner') {
      ctx.fillRect(-4, -12, 8, 3);
    } else {
      ctx.fillRect(-3, -12, 6, 2);
    }
    ctx.restore();

    ctx.restore();

    // Floating Job Icon / Status
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 2;
    const jobIcon = worker.job === 'lumberjack' ? '🪓' : worker.job === 'miner' ? '⛏️' : '🌾';
    ctx.strokeText(jobIcon, wx, wy - 18);
    ctx.fillText(jobIcon, wx, wy - 18);

    // Attached Due Phrase Speech Bubble (moves with worker / farmer above head)
    if (worker.duePhrase) {
      this.renderSpeechBubble(
        ctx,
        wx,
        wy - 20,
        worker.duePhrase.native,
        worker.duePhrase.translation
      );
    } else {
      const workerDue = globalSpacedRepetition.getDueItemsForRole(worker.job);
      if (workerDue.length > 0) {
        this.renderSpeechBubble(
          ctx,
          wx,
          wy - 20,
          workerDue[0].primaryText,
          workerDue[0].secondaryText
        );
      }
    }

    ctx.restore();
  }

  // ==========================================
  // AMBIENT ROAMING VILLAGERS RENDERING
  // ==========================================
  public renderVillager(ctx: CanvasRenderingContext2D, villager: VillagerInstance, camera: Camera) {
    const { sx, sy } = camera.worldToScreen(villager.x, villager.y);
    const isMoving = villager.idleTimer <= 0;

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 26, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const vx = sx + 12;
    const vy = sy + 13;
    const isFacingLeft = villager.direction === 'left';

    ctx.save();
    ctx.translate(vx, vy);
    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    // Walking legs animation
    const legOffset = isMoving ? Math.sin(villager.animTimer * 12) * 3.5 : 0;
    ctx.fillStyle = '#334155'; // Pants / shoes
    ctx.fillRect(-4, 5 - legOffset, 3, 7 + legOffset);
    ctx.fillRect(1, 5 + legOffset, 3, 7 - legOffset);

    // Tunic / Dress
    ctx.fillStyle = villager.color || '#3B82F6';
    ctx.fillRect(-5, -4, 10, 10);

    // Belt / Apron
    ctx.fillStyle = '#78350F';
    ctx.fillRect(-5, 0, 10, 2);

    // Head
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(0, -9, 5.5, 0, Math.PI * 2);
    ctx.fill();

    // Hair or Hat based on role
    if (villager.role === 'farmer') {
      // Straw hat
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.ellipse(0, -13, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3, -16, 6, 4);
    } else if (villager.role === 'scholar') {
      // Scholar blue cap
      ctx.fillStyle = '#1E3A8A';
      ctx.fillRect(-5, -14, 10, 4);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(4, -13, 2, 4); // tassel
    } else if (villager.role === 'merchant') {
      // Feather cap
      ctx.fillStyle = '#991B1B';
      ctx.fillRect(-5, -14, 10, 4);
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(-2, -18, 2, 5); // feather
    } else {
      // Natural hair
      ctx.fillStyle = '#713F12';
      ctx.beginPath();
      ctx.arc(0, -11, 5.5, Math.PI, 0);
      ctx.fill();
    }

    ctx.restore();

    // Distress sweat drop if kingdom is severely decaying
    const kingdomState = globalSpacedRepetition.getKingdomState();
    if ((kingdomState.vitalityScore ?? 1.0) < 0.60) {
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(vx + (isFacingLeft ? -6 : 6), vy - 16, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Attached Due Phrase Speech Bubble (moves with villager above head)
    if (villager.duePhrase) {
      this.renderSpeechBubble(
        ctx,
        sx + 12,
        sy - 14,
        villager.duePhrase.native,
        villager.duePhrase.translation
      );
    } else if (villager.speechText) {
      this.renderSpeechBubble(
        ctx,
        sx + 12,
        sy - 14,
        villager.speechText
      );
    }

    ctx.restore();
  }

  // ==========================================
  // FULL-BODY MONSTERS / ENEMIES RENDERING
  // ==========================================
  public renderEnemy(ctx: CanvasRenderingContext2D, enemy: EnemyInstance, camera: Camera) {
    const { sx, sy } = camera.worldToScreen(enemy.x, enemy.y);
    const isMoving = enemy.state === 'moving';
    const isAttacking = enemy.state === 'attacking';

    ctx.save();

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(sx + enemy.width / 2, sy + enemy.height - 2, enemy.width * 0.4, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hurt flash
    if (enemy.hurtTimer > 0) {
      ctx.globalAlpha = 0.75;
    }

    const ex = sx + enemy.width / 2;
    const ey = sy + enemy.height / 2;
    const isFacingLeft = enemy.direction === 'left';

    ctx.save();
    ctx.translate(ex, ey);
    if (isFacingLeft) {
      ctx.scale(-1, 1);
    }

    const legOffset = isMoving ? Math.sin(enemy.animTimer * 10) * 4 : 0;

    if (enemy.type === 'goblin' || enemy.type === 'fast_goblin') {
      // --- GOBLIN ---
      // Small fast green goblin with pointy ears & dagger
      ctx.fillStyle = '#15803D'; // Green Skin
      // Legs
      ctx.fillRect(-5, 6 - legOffset, 3, 7 + legOffset);
      ctx.fillRect(2, 6 + legOffset, 3, 7 - legOffset);

      // Brown Rags Torso
      ctx.fillStyle = enemy.type === 'fast_goblin' ? '#EA580C' : '#78350F';
      ctx.fillRect(-5, -4, 10, 10);

      // Green Head
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(0, -8, 6, 0, Math.PI * 2);
      ctx.fill();

      // Pointy Goblin Ears
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-6, -5);
      ctx.moveTo(6, -8);
      ctx.lineTo(12, -10);
      ctx.lineTo(6, -5);
      ctx.fill();

      // Red Glowing Eyes
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(1, -9, 2, 2);
      ctx.fillRect(-3, -9, 2, 2);

      // Dagger Weapon
      const daggerSwing = isAttacking ? Math.sin(enemy.animTimer * 14) * 0.8 : 0;
      ctx.save();
      ctx.translate(6, 2);
      ctx.rotate(daggerSwing);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(-1, -10, 2, 10);
      ctx.restore();
    } else if (enemy.type === 'orc' || enemy.type === 'heavy_orc') {
      // --- ORC BRUTE ---
      // Muscular brown/green orc with spiked armor & battleaxe
      const isHeavy = enemy.type === 'heavy_orc';
      ctx.fillStyle = isHeavy ? '#334155' : '#14532D'; // Heavy plate or green skin

      // Legs
      ctx.fillRect(-7, 8 - legOffset, 6, 9 + legOffset);
      ctx.fillRect(1, 8 + legOffset, 6, 9 - legOffset);

      // Torso
      ctx.fillRect(-9, -6, 18, 15);
      if (isHeavy) {
        ctx.fillStyle = '#94A3B8';
        ctx.fillRect(-7, -4, 14, 10); // Steel Chestplate
      }

      // Spiked Shoulder Pads
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-12, -8, 5, 5);
      ctx.fillRect(7, -8, 5, 5);

      // Orc Head with Horns & Underbite Tusks
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(0, -11, 8, 0, Math.PI * 2);
      ctx.fill();

      // White Tusks
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-4, -6, 2, 4);
      ctx.fillRect(2, -6, 2, 4);

      // Battleaxe / Mace
      const axeSwing = isAttacking ? Math.sin(enemy.animTimer * 12) * 1.1 : 0;
      ctx.save();
      ctx.translate(10, 2);
      ctx.rotate(axeSwing);
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-2, -18, 4, 22);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(-8, -18, 16, 6);
      ctx.restore();
    } else if (enemy.type === 'boss_gargoyle') {
      // --- BOSS OGRE / FIEND ---
      // Huge imposing boss monster with horns and fiery eyes
      ctx.fillStyle = '#4C0519'; // Deep Blood Crimson
      // Legs
      ctx.fillRect(-12, 12 - legOffset, 9, 14 + legOffset);
      ctx.fillRect(3, 12 + legOffset, 9, 14 - legOffset);

      // Giant Torso
      ctx.fillRect(-16, -10, 32, 24);

      // Head
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.arc(0, -16, 14, 0, Math.PI * 2);
      ctx.fill();

      // Giant Horns
      ctx.fillStyle = '#1E1B4B';
      ctx.beginPath();
      ctx.moveTo(-10, -20);
      ctx.lineTo(-20, -32);
      ctx.lineTo(-6, -24);
      ctx.moveTo(10, -20);
      ctx.lineTo(20, -32);
      ctx.lineTo(6, -24);
      ctx.fill();

      // Fiery Eyes
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(2, -18, 4, 4);
      ctx.fillRect(-6, -18, 4, 4);

      // War Hammer
      const slamSwing = isAttacking ? Math.sin(enemy.animTimer * 10) * 1.3 : 0;
      ctx.save();
      ctx.translate(16, 4);
      ctx.rotate(slamSwing);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-3, -26, 6, 32);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-12, -28, 24, 12);
      ctx.restore();
    }

    ctx.restore();

    // Health Bar
    this.renderHealthBar(ctx, ex, sy - 6, enemy.health, enemy.maxHealth, enemy.width * 1.1, 5);

    ctx.restore();
  }

  // ==========================================
  // PROJECTILES RENDERING
  // ==========================================
  public renderProjectile(ctx: CanvasRenderingContext2D, proj: ProjectileInstance, camera: Camera) {
    const { sx, sy } = camera.worldToScreen(proj.x, proj.y);

    ctx.save();
    if (proj.type === 'arrow') {
      const angle = Math.atan2(proj.targetY - proj.startY, proj.targetX - proj.startX);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);

      ctx.strokeStyle = '#78350F';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();

      // Steel Tip
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(8, -3);
      ctx.lineTo(13, 0);
      ctx.lineTo(8, 3);
      ctx.closePath();
      ctx.fill();

      // Fletching Feathers
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-10, -2, 3, 4);

      ctx.restore();
    } else if (proj.type === 'cannonball') {
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();

      // Smoke trail
      ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.beginPath();
      ctx.arc(sx - 4, sy + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.type === 'magic') {
      // Glowing arcane orb
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ==========================================
  // HEALTH BAR HELPER
  // ==========================================
  private renderHealthBar(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    topY: number,
    hp: number,
    maxHp: number,
    width: number,
    height: number
  ) {
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    const barX = centerX - width / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX - 1, topY - 1, width + 2, height + 2);

    ctx.fillStyle = ratio > 0.5 ? '#22C55E' : ratio > 0.25 ? '#EAB308' : '#EF4444';
    ctx.fillRect(barX, topY, width * ratio, height);
  }

  /**
   * Renders a comic/game speech bubble directly above an in-game entity:
   * White bubble, crisp black border, downward tail, and black text.
   * Stays pinned and follows the entity smoothly.
   */
  public renderSpeechBubble(
    ctx: CanvasRenderingContext2D,
    anchorX: number,
    anchorY: number,
    phrase: string,
    translation?: string
  ) {
    if (!phrase) return;

    ctx.save();

    // Clean & truncate text if excessively long
    const cleanPhrase = phrase.length > 36 ? phrase.slice(0, 34) + '..' : phrase;
    const cleanTrans = translation && translation.length > 36 ? translation.slice(0, 34) + '..' : translation;

    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    const phraseWidth = ctx.measureText(cleanPhrase).width;

    ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif';
    const transWidth = cleanTrans ? ctx.measureText(cleanTrans).width : 0;

    const maxTextWidth = Math.max(phraseWidth, transWidth);
    const bubbleW = Math.max(64, Math.min(220, maxTextWidth + 24));
    const bubbleH = cleanTrans ? 32 : 22;
    const tailH = 6;
    const tailHalfW = 5;

    const bx = Math.round(anchorX - bubbleW / 2);
    const by = Math.round(anchorY - bubbleH - tailH);

    // 1. Soft drop shadow for clean contrast
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    // 2. White bubble body
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 6);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // 3. Crisp comic border
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 4. Downward pointer tail
    ctx.beginPath();
    ctx.moveTo(anchorX - tailHalfW, by + bubbleH - 1);
    ctx.lineTo(anchorX, anchorY);
    ctx.lineTo(anchorX + tailHalfW, by + bubbleH - 1);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 5. Seamless join between tail and body
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(anchorX - tailHalfW + 1, by + bubbleH - 2, (tailHalfW - 1) * 2, 3);

    // 6. Text rendering
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (cleanTrans) {
      // Primary phrase in sharp black
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(cleanPhrase, anchorX, by + 10);

      // Translation in slate charcoal
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif';
      ctx.fillText(cleanTrans, anchorX, by + 23);
    } else {
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(cleanPhrase, anchorX, by + bubbleH / 2);
    }

    ctx.restore();
  }
}

