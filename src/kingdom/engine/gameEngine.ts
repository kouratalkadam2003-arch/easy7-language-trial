import { soundManager } from '../audio/soundManager';
import {
  BuildingInstance,
  BuildingPlot,
  BuildingType,
  ChestInstance,
  EnemyInstance,
  EnemyType,
  HeroState,
  ProjectileInstance,
  Quest,
  ResourceNodeInstance,
  Resources,
  ResourceType,
  SavedGameState,
  UpgradeItem,
  VillagerInstance,
  WarriorInstance,
  WaveConfig,
  WorkerInstance,
  WorkerJob,
} from '../types/game';
import { BUILDING_BLUEPRINTS, INITIAL_QUESTS, UPGRADE_ITEMS, WAVE_CONFIGURATIONS } from './blueprints';
import { Camera } from './camera';
import { ParticleSystem } from './particles';
import { SpriteRenderer } from './sprites';
import { World } from './world';
import { globalSpacedRepetition } from './spacedRepetition';

export class GameEngine {
  public world: World;
  public camera: Camera;
  public particles: ParticleSystem;
  public spriteRenderer: SpriteRenderer;

  // Economy & Kingdom State
  public resources: Resources = {
    wood: 80,
    stone: 50,
    food: 40,
    coins: 60,
    gems: 5,
  };

  public storageCapacity = {
    wood: 150,
    stone: 150,
    food: 100,
  };

  public population = {
    current: 0,
    max: 2,
  };

  // Hero Knight / Sovereign
  public hero: HeroState;

  // Castle Gate & Autonomous Threat State
  public castleGateOpenProgress: number = 0; // 0 (closed) to 1 (fully open)
  public isThreatDetected: boolean = false;
  private threatAlarmTriggered: boolean = false;

  // Entities
  public isRaidReviewMode: boolean = false;
  public warriors: WarriorInstance[] = [];
  public workers: WorkerInstance[] = [];
  public villagers: VillagerInstance[] = [];
  public enemies: EnemyInstance[] = [];
  public projectiles: ProjectileInstance[] = [];
  public lastCelebratedStage: number = -1;
  public showPromotionModal: boolean = false;
  private chimneySmokeTimer: number = 0;
  private villagerSpeechTimer: number = 0;

  // Wave / Invasion System
  public isWaveActive: boolean = false;
  public currentWave: number = 1;
  public waveSpawnQueue: Array<{ type: EnemyType; delay: number }> = [];
  public waveSpawnTimer: number = 0;
  public waveEnemiesRemaining: number = 0;
  public waveTotalEnemies: number = 0;
  public waveRewardPending: Partial<Resources> | null = null;
  public showVictoryModal: boolean = false;
  private ambientSpawnTimer: number = 3.0;
  public targetLanguage: string = 'en';
  private zombieInvasionSpawnTimer: any = null;

  // Upgrades & Quests
  public upgrades: UpgradeItem[] = [];
  public quests: Quest[] = [];
  public activeQuestIndex: number = 0;

  // Selection & Interactivity
  public selectedPlotId: string | null = null;
  public selectedBuilding: BuildingInstance | null = null;
  public nearbyNode: ResourceNodeInstance | null = null;
  public nearbyPlot: BuildingPlot | null = null;
  public nearbyChest: ChestInstance | null = null;

  // Controls & Inputs
  public keys: Record<string, boolean> = {};
  public joystickVector = { x: 0, y: 0 };
  public isTouchDevice: boolean = false;

  // Loop & Callbacks
  private lastTime: number = 0;
  private animFrameId: number | null = null;
  private listeners: Array<() => void> = [];
  private autoSaveTimer: number = 0;

  constructor(viewportWidth: number = 800, viewportHeight: number = 600) {
    this.world = new World();
    this.camera = new Camera(viewportWidth, viewportHeight, this.world.width, this.world.height);
    this.particles = new ParticleSystem();
    this.spriteRenderer = new SpriteRenderer();

    // Initialize Hero at Village Center
    const startX = this.world.width / 2;
    const startY = this.world.height / 2 + 50;

    this.hero = {
      x: startX,
      y: startY,
      width: 28,
      height: 32,
      direction: 'down',
      speed: 3.2,
      health: 120,
      maxHealth: 120,
      stamina: 100,
      maxStamina: 100,
      damage: 22,
      attackRange: 46,
      attackCooldown: 0.35,
      attackTimer: 0,
      isAttacking: false,
      attackAnimProgress: 0,
      isGathering: false,
      gatherType: null,
      gatherTimer: 0,
      gatherTargetId: null,
      isDashing: false,
      dashTimer: 0,
      dashCooldown: 1.5,
      dashCooldownTimer: 0,
      isHurt: false,
      hurtTimer: 0,
      isDead: false,
      animFrame: 0,
      animTimer: 0,
      level: 1,
      exp: 0,
      expToNextLevel: 100,
      rangedDamage: 25,
      rangedAttackRange: 260,
      rangedAttackSpeed: 1.5,
      projectileSpeed: 500,
      targetPriority: 'nearest',
      manualTargetEnemyId: null,
      currentTargetEnemyId: null,
      aimAngle: 0,
      bowDrawProgress: 0,
      abilityCooldown: 0,
      abilityMaxCooldown: 12,
      isTargetingAbility: false,
      abilityRadius: 90,
    };

    this.upgrades = JSON.parse(JSON.stringify(UPGRADE_ITEMS));
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));

    // Place Initial Town Hall at central plot
    this.initTownHall();

    // Recalculate Initial Kingdom Capacity
    this.recalculateKingdomStats();

    // Focus camera immediately on Hero
    this.camera.follow(this.hero.x, this.hero.y, true);

    // Try loading saved game
    this.loadGame();
  }

  private initTownHall() {
    const townPlot = this.world.buildingPlots.find((p) => p.id === 'plot_town_hall');
    if (townPlot && !townPlot.building) {
      townPlot.building = {
        id: 'b_town_hall_1',
        plotId: 'plot_town_hall',
        type: 'town_hall',
        level: 1,
        health: 1000,
        maxHealth: 1000,
        x: townPlot.x,
        y: townPlot.y,
        width: townPlot.width,
        height: townPlot.height,
        isConstructing: false,
        constructionProgress: 1,
        constructionTimeTotal: 5,
        productionTimer: 0,
        lastAttackTime: 0,
        targetEnemyId: null,
        targetAngle: 0,
      };
    }
  }

  // ==========================================
  // SUBSCRIBERS FOR REACT UI
  // ==========================================
  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    for (const cb of this.listeners) {
      cb();
    }
  }

  // ==========================================
  // GAME LOOP
  // ==========================================
  public start() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - this.lastTime) / 1000);
      this.lastTime = time;

      this.update(dt);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public syncKingdomProgressionWithLearning() {
    const kingdomState = globalSpacedRepetition.getKingdomState();
    const currentStage = kingdomState.developmentStage ?? 0;

    // Detect level up promotion
    if (this.lastCelebratedStage !== -1 && currentStage > this.lastCelebratedStage) {
      this.showPromotionModal = true;
      soundManager.playWaveStart();
      this.particles.emitSparks(this.world.width / 2, this.world.height / 2, 40, '#F59E0B');
      this.particles.addFloatingText(
        `👑 ${kingdomState.stageNameAr || kingdomState.stageName}!`,
        this.world.width / 2,
        this.world.height / 2 - 50,
        '#FDE047',
        22,
        undefined,
        true
      );
      this.camera.triggerShake(5, 0.4);
    }
    this.lastCelebratedStage = currentStage;

    // Apply Hero Combat buffs from learning retention
    if (kingdomState.heroStats) {
      this.hero.damage = Math.max(22, kingdomState.heroStats.power);
      this.hero.attackCooldown = Math.max(0.25, 1 / (kingdomState.heroStats.fireRate || 1.5));
      this.hero.attackRange = kingdomState.heroStats.range || 260;
    }

    // Auto-Construct / Unlock Building Plots based on Earned Stage
    for (const plot of this.world.buildingPlots) {
      const requiredStage = plot.unlockStage ?? 0;
      if (currentStage >= requiredStage) {
        if (!plot.building && plot.autoUnlockBuilding) {
          const bp = BUILDING_BLUEPRINTS[plot.autoUnlockBuilding];
          if (bp) {
            plot.building = {
              id: `b_${plot.autoUnlockBuilding}_${plot.id}`,
              plotId: plot.id,
              type: plot.autoUnlockBuilding,
              level: 1,
              health: bp.baseHealth,
              maxHealth: bp.baseHealth,
              x: plot.x,
              y: plot.y,
              width: plot.width,
              height: plot.height,
              isConstructing: false,
              constructionProgress: 1,
              constructionTimeTotal: bp.constructionTime,
              productionTimer: 0,
              lastAttackTime: 0,
              targetEnemyId: null,
              targetAngle: 0,
            };
            this.particles.emitSparks(plot.x + plot.width / 2, plot.y + plot.height / 2, 20, '#38BDF8');
          }
        }
      }
    }

    // Ensure Workers spawn automatically for production buildings in stage >= 3
    if (currentStage >= 3 && this.workers.length === 0) {
      this.recruitWorker('lumberjack');
      this.recruitWorker('miner');
      this.recruitWorker('farmer');
    }

    // Maintain and Scale Autonomous Castle Warriors based on Progression
    // Stage 0: 1 Warrior (Apprentice Knight)
    // Stage 1: 2 Warriors
    // Stage 2: 3 Warriors
    // Stage 3: 4 Warriors
    // Stage 4: 5 Warriors
    // Stage 5+: 6 Warriors
    const targetWarriorCount = Math.min(6, Math.max(1, currentStage + 1));
    const cx = this.world.width / 2;
    const cy = this.world.height / 2;
    const castleGateX = cx;
    const castleGateY = cy + 24;

    const warriorTitles = [
      'Royal Champion',
      'Silver Knight',
      'Aegis Guard',
      'Citadel Blade',
      'Dragon Sentry',
      'Arcane Paladin',
    ];
    const warriorColors = ['#DC2626', '#2563EB', '#059669', '#7C3AED', '#D97706', '#0891B2'];

    const warriorBaseDamage = Math.round(24 + currentStage * 4 + (kingdomState.heroStats?.power || 0) * 0.25);
    const warriorMaxHp = Math.round(150 + currentStage * 40 + (kingdomState.vitalityScore || 1) * 35);
    const warriorSpeed = 1.6 + currentStage * 0.08;
    const warriorVisionRange = 300 + currentStage * 25;
    const warriorMaxPatrolRadius = 400 + currentStage * 30;

    if (!this.isRaidReviewMode) {
      while (this.warriors.length < targetWarriorCount) {
        const slotIndex = this.warriors.length;
        const newWarrior: WarriorInstance = {
          id: `warrior_${Date.now()}_${slotIndex}`,
          name: warriorTitles[slotIndex] || `Knight Defender ${slotIndex + 1}`,
          slotIndex,
          x: castleGateX + (slotIndex % 2 === 0 ? -1 : 1) * 8,
          y: castleGateY - 12,
          width: 28,
          height: 32,
          direction: 'down',
          speed: warriorSpeed,
          health: warriorMaxHp,
          maxHealth: warriorMaxHp,
          damage: warriorBaseDamage,
          attackRange: 44,
          visionRange: warriorVisionRange,
          maxPatrolRadius: warriorMaxPatrolRadius,
          attackCooldown: 0.75,
          attackTimer: 0,
          isAttacking: false,
          attackAnimProgress: 0,
          state: 'inside_castle',
          targetEnemyId: null,
          exitDelay: slotIndex * 0.28,
          animFrame: 0,
          animTimer: 0,
          hurtTimer: 0,
          level: currentStage + 1,
          color: warriorColors[slotIndex % warriorColors.length],
          shieldCrest: 'royal_star',
        };
        this.warriors.push(newWarrior);
        this.particles.emitSparks(castleGateX, castleGateY, 20, '#F59E0B');
        this.particles.addFloatingText('⚔️ New Warrior Enlisted!', castleGateX, castleGateY - 30, '#FDE047', 16, undefined, true);
      }
    }

    // Update stats for existing warriors
    for (const w of this.warriors) {
      w.damage = warriorBaseDamage;
      w.maxHealth = warriorMaxHp;
      w.speed = warriorSpeed;
      w.level = currentStage + 1;
      w.visionRange = warriorVisionRange;
      w.maxPatrolRadius = warriorMaxPatrolRadius;
    }

    // Maintain and Scale Ambient Villagers based on Progression
    const targetVillagerCount = currentStage === 0 ? 0 : Math.min(10, currentStage * 2);
    const roles: Array<'peasant' | 'farmer' | 'merchant' | 'child' | 'scholar'> = ['peasant', 'farmer', 'merchant', 'child', 'scholar'];
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
    const names = ['Felix', 'Greta', 'Lukas', 'Elena', 'Hans', 'Sophie', 'Otto', 'Clara'];

    const townPlot = this.world.buildingPlots.find((p) => p.id === 'plot_town_hall');
    const townCenterX = townPlot ? townPlot.x + townPlot.width / 2 : this.world.width / 2;
    const townCenterY = townPlot ? townPlot.y + townPlot.height / 2 : this.world.height / 2;

    while (this.villagers.length < targetVillagerCount) {
      const idx = this.villagers.length;
      this.villagers.push({
        id: `villager_${Date.now()}_${idx}`,
        name: names[idx % names.length] || `Villager ${idx + 1}`,
        role: roles[idx % roles.length],
        x: townCenterX + (Math.random() - 0.5) * 140,
        y: townCenterY + (Math.random() - 0.5) * 120,
        targetX: townCenterX + (Math.random() - 0.5) * 220,
        targetY: townCenterY + (Math.random() - 0.5) * 220,
        speed: 0.8 + Math.random() * 0.4,
        direction: 'down',
        animFrame: 0,
        animTimer: 0,
        idleTimer: Math.random() * 3,
        color: colors[idx % colors.length],
      });
    }

    this.recalculateKingdomStats();
  }

  // ==========================================
  // ATTACHED DUE PHRASES DISTRIBUTION
  // ==========================================
  public updateAttachedDuePhrases() {
    // ONLY fetch items whose review time has arrived (due items).
    // If not due yet, no bubble will appear on any entity or building.
    const dueQueue = globalSpacedRepetition.getDueReviewQueue();

    if (dueQueue.length === 0) {
      if (this.hero.duePhrase) this.hero.duePhrase = undefined;
      for (const w of this.warriors) w.duePhrase = undefined;
      for (const wk of this.workers) wk.duePhrase = undefined;
      for (const vl of this.villagers) vl.duePhrase = undefined;
      for (const plot of this.world.buildingPlots) {
        if (plot.building) plot.building.duePhrase = undefined;
      }
      return;
    }

    const dueIdSet = new Set(dueQueue.map((item) => item.id));
    const assignedIds = new Set<string>();

    const retainIfValid = (current?: { id: string; native: string; translation: string }) => {
      if (current && dueIdSet.has(current.id) && !assignedIds.has(current.id)) {
        assignedIds.add(current.id);
        return current;
      }
      return undefined;
    };

    const getNextDue = () => {
      for (const item of dueQueue) {
        if (!assignedIds.has(item.id)) {
          assignedIds.add(item.id);
          return {
            id: item.id,
            native: item.primaryText,
            translation: item.secondaryText,
          };
        }
      }
      return undefined;
    };

    // 1. Leader / Hero (القائد)
    this.hero.duePhrase = retainIfValid(this.hero.duePhrase) || getNextDue();

    // 2. Town Hall / Main Castle
    const townPlot = this.world.buildingPlots.find((p) => p.id === 'plot_town_hall');
    if (townPlot?.building) {
      townPlot.building.duePhrase = retainIfValid(townPlot.building.duePhrase) || getNextDue();
    }

    // 3. Castle Warriors (المقاتلون)
    for (const warrior of this.warriors) {
      if (warrior.state !== 'inside_castle') {
        warrior.duePhrase = retainIfValid(warrior.duePhrase) || getNextDue();
      } else {
        warrior.duePhrase = undefined;
      }
    }

    // 4. Workers / Farmers (المزارعون والعمال)
    for (const worker of this.workers) {
      worker.duePhrase = retainIfValid(worker.duePhrase) || getNextDue();
    }

    // 5. Other constructed buildings (المباني)
    for (const plot of this.world.buildingPlots) {
      if (plot.id === 'plot_town_hall' || !plot.building) continue;
      plot.building.duePhrase = retainIfValid(plot.building.duePhrase) || getNextDue();
    }

    // 6. Roaming Villagers (القرويون)
    for (const villager of this.villagers) {
      villager.duePhrase = retainIfValid(villager.duePhrase) || getNextDue();
    }
  }

  // ==========================================
  // REVIEW READINESS & BATTLE MECHANICS
  // ==========================================

  public prepareForRaidReview() {
    // As per user specification: Start with ZERO soldiers on the field!
    // Soldiers are summoned strictly via correct review answers!
    this.isRaidReviewMode = true;
    this.warriors = [];
    this.enemies = [];
    if (this.zombieInvasionSpawnTimer) {
      clearInterval(this.zombieInvasionSpawnTimer);
      this.zombieInvasionSpawnTimer = null;
    }
    this.notify();
  }

  public endRaidReview() {
    this.isRaidReviewMode = false;
    this.notify();
  }

  // ==========================================
  // VILLAGE RAID & REVIEW WARRIOR COMBAT
  // ==========================================
  public spawnZombieInvasion(count: number = 8) {
    if (this.zombieInvasionSpawnTimer) {
      clearInterval(this.zombieInvasionSpawnTimer);
      this.zombieInvasionSpawnTimer = null;
    }

    const cx = this.world.width / 2;
    const cy = this.world.height / 2;
    const spawnDist = 480; // Gentle perimeter distance

    const spawnAngles = [
      0, // East
      Math.PI / 4, // South-East
      Math.PI / 2, // South
      (3 * Math.PI) / 4, // South-West
      Math.PI, // West
      (5 * Math.PI) / 4, // North-West
      (3 * Math.PI) / 2, // North
      (7 * Math.PI) / 4, // North-East
    ];

    let spawned = 0;

    const spawnOneMonster = (idx: number) => {
      const angle = spawnAngles[idx % spawnAngles.length] + (Math.random() - 0.5) * 0.25;
      const type: EnemyType = idx % 4 === 0 ? 'orc' : idx % 2 === 0 ? 'fast_goblin' : 'goblin';
      const sx = cx + Math.cos(angle) * (spawnDist + Math.random() * 60);
      const sy = cy + Math.sin(angle) * (spawnDist + Math.random() * 60);

      this.enemies.push({
        id: `zombie_raid_${Date.now()}_${idx}_${Math.random()}`,
        type,
        name: type === 'orc' ? 'Orc Marauder' : 'Invasion Zombie',
        x: sx,
        y: sy,
        targetX: cx + (Math.random() - 0.5) * 60,
        targetY: cy + (Math.random() - 0.5) * 60,
        width: 28,
        height: 30,
        health: type === 'orc' ? 160 : 90,
        maxHealth: type === 'orc' ? 160 : 90,
        // Gradual, paced speed so monsters do not rush the village instantly
        speed: type === 'fast_goblin' ? 0.55 : 0.40,
        baseSpeed: 0.40,
        damage: 10,
        attackSpeed: 1.0,
        attackRange: 32,
        attackCooldown: 0,
        direction: 'down',
        state: 'moving',
        targetType: 'building',
        targetId: 'plot_town_hall',
        animFrame: 0,
        animTimer: 0,
        slowTimer: 0,
        hurtTimer: 0,
        loot: { coins: 12, wood: 6 },
      });
      this.notify();
    };

    // Spawn 1st monster immediately
    spawnOneMonster(0);
    spawned = 1;

    // Release remaining monsters gradually every 3.5 seconds (شيئاً فشيئاً)
    if (count > 1) {
      this.zombieInvasionSpawnTimer = setInterval(() => {
        if (spawned < count) {
          spawnOneMonster(spawned);
          spawned++;
        } else {
          if (this.zombieInvasionSpawnTimer) {
            clearInterval(this.zombieInvasionSpawnTimer);
            this.zombieInvasionSpawnTimer = null;
          }
        }
      }, 3500);
    }

    this.isThreatDetected = true;
    this.castleGateOpenProgress = 1;
    soundManager.playWaveStart();
    this.camera.triggerShake(5, 0.4);
    this.notify();
  }

  public dispatchWarriorCharge(unitType: 'swordsman' | 'archer' | 'wizard' = 'swordsman') {
    const cx = this.world.width / 2;
    const cy = this.world.height / 2;
    const castleGateX = cx;
    const castleGateY = cy + 24;

    if (unitType === 'wizard') {
      soundManager.playMagic();
    } else if (unitType === 'archer') {
      soundManager.playArrowShoot();
    } else {
      soundManager.playSwordSwing();
    }

    // Find closest enemy
    let closestEnemy: EnemyInstance | null = null;
    let minDist = Infinity;
    for (const e of this.enemies) {
      if (e.health > 0) {
        const d = Math.hypot(e.x - cx, e.y - cy);
        if (d < minDist) {
          minDist = d;
          closestEnemy = e;
        }
      }
    }

    const title = unitType === 'wizard' ? 'ساحر الصواعق' : unitType === 'archer' ? 'رامي سهام ملكي' : 'مقاتل بالسيف';
    const unitColor = unitType === 'wizard' ? '#9333EA' : unitType === 'archer' ? '#16A34A' : '#2563EB';
    const unitDmg = unitType === 'wizard' ? 65 : unitType === 'archer' ? 42 : 32;
    const unitRange = unitType === 'wizard' ? 240 : unitType === 'archer' ? 180 : 50;

    const chargingWarrior: WarriorInstance = {
      id: `charge_${Date.now()}_${Math.random()}`,
      name: title,
      slotIndex: this.warriors.length,
      x: castleGateX,
      y: castleGateY,
      width: 28,
      height: 32,
      direction: 'down',
      speed: unitType === 'wizard' ? 1.2 : unitType === 'archer' ? 1.4 : 1.6,
      health: unitType === 'wizard' ? 120 : unitType === 'archer' ? 140 : 220,
      maxHealth: unitType === 'wizard' ? 120 : unitType === 'archer' ? 140 : 220,
      damage: unitDmg,
      attackRange: unitRange,
      visionRange: 700,
      maxPatrolRadius: 900,
      attackCooldown: unitType === 'wizard' ? 1.0 : unitType === 'archer' ? 0.8 : 0.75,
      attackTimer: 0,
      isAttacking: false,
      attackAnimProgress: 0,
      state: 'charging',
      targetEnemyId: closestEnemy ? closestEnemy.id : null,
      exitDelay: 0,
      animFrame: 0,
      animTimer: 0,
      hurtTimer: 0,
      level: unitType === 'wizard' ? 4 : unitType === 'archer' ? 3 : 2,
      color: unitColor,
      shieldCrest: 'royal_star',
    };

    this.warriors.push(chargingWarrior);
    this.particles.emitSparks(castleGateX, castleGateY, 25, unitType === 'wizard' ? '#C084FC' : unitType === 'archer' ? '#4ADE80' : '#F59E0B');
    
    const bannerText = unitType === 'wizard' ? '🧙‍♂️ ساحر الصواعق (-100🪙)' : unitType === 'archer' ? '🏹 رامي سهام ملكي (-60🪙)' : '⚔️ مقاتل بالسيف (-30🪙)';
    this.particles.addFloatingText(bannerText, castleGateX, castleGateY - 30, unitType === 'wizard' ? '#C084FC' : unitType === 'archer' ? '#4ADE80' : '#FDE047', 18, undefined, true);

    // Also fire an arrow/magic projectile from the central tower if enemies exist
    if (closestEnemy && this.world.buildingPlots[0]?.building) {
      this.fireTowerProjectile(
        this.world.buildingPlots[0].building,
        unitType === 'wizard' ? 'magic' : 'arrow',
        castleGateX,
        castleGateY - 45,
        closestEnemy.x,
        closestEnemy.y,
        closestEnemy.id,
        unitDmg
      );
    }

    this.notify();
  }

  public triggerRestorationPulse(isMajor: boolean = false) {
    const townPlot = this.world.buildingPlots.find((p) => p.id === 'plot_town_hall');
    const cx = townPlot ? townPlot.x + townPlot.width / 2 : this.world.width / 2;
    const cy = townPlot ? townPlot.y + townPlot.height / 2 : this.world.height / 2;

    this.particles.emitRestorationWave(cx, cy, isMajor ? 50 : 25);
    const msg = isMajor ? '🌿 تم ترميم المملكة بالكامل واستعادة رونقها! ✨' : '✨ نبضة ترميم: استعادة حيوية القرية!';
    this.particles.addFloatingText(msg, cx, cy - 36, '#4ADE80', isMajor ? 20 : 16, undefined, true);
    this.camera.triggerShake(isMajor ? 6 : 3, 0.3);
    soundManager.playWaveVictory();

    // Recompute spaced repetition metrics to update vitality immediately
    globalSpacedRepetition.updateKingdomMetrics();
    this.notify();
  }

  public update(dt: number) {
    // Keep kingdom development in sync with spaced repetition mastery
    this.syncKingdomProgressionWithLearning();
    this.updateAttachedDuePhrases();

    this.spriteRenderer.updateTime(dt);
    this.world.update(dt);
    this.particles.update(dt);

    this.updateWarriors(dt);
    this.updateHero(dt);
    this.updateWorkers(dt);
    this.updateVillagers(dt);
    this.updateAtmosphere(dt);
    this.updateBuildings(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateWave(dt);
    this.checkContextualInteractions();

    // Camera follow village center / active warrior frontline
    const cx = this.world.width / 2;
    const cy = this.world.height / 2;
    let camTargetX = cx;
    let camTargetY = cy;

    const activeFightingWarrior = this.warriors.find((w) => w.state === 'charging' || w.state === 'attacking');
    if (activeFightingWarrior) {
      camTargetX = cx * 0.35 + (activeFightingWarrior.x + 14) * 0.65;
      camTargetY = cy * 0.35 + (activeFightingWarrior.y + 16) * 0.65;
    } else {
      camTargetX = cx;
      camTargetY = cy + 10;
    }

    this.camera.follow(camTargetX, camTargetY);
    this.camera.update(dt);

    // Auto save periodic check (every 30s)
    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 30) {
      this.autoSaveTimer = 0;
      this.saveGame();
    }

    this.notify();
  }

  // ==========================================
  // AUTONOMOUS CASTLE WARRIORS AI & DEFENSE
  // ==========================================
  private updateWarriors(dt: number) {
    const cx = this.world.width / 2;
    const cy = this.world.height / 2;
    const castleGateX = cx;
    const castleGateY = cy + 24;
    const insideKeepY = cy - 10;

    const aliveEnemies = this.enemies.filter((e) => e.health > 0);
    const hasThreat = aliveEnemies.length > 0;

    // Castle Threat State & Gate Portcullis Animation
    if (hasThreat) {
      this.isThreatDetected = true;
      this.castleGateOpenProgress = Math.min(1, this.castleGateOpenProgress + dt * 3.5);

      if (!this.threatAlarmTriggered) {
        this.threatAlarmTriggered = true;
        soundManager.playWaveStart();
        this.particles.addFloatingText('🔔 Threat Detected! Castle Gate Opening!', cx, cy - 35, '#EF4444', 16, undefined, true);
      }
    } else {
      this.isThreatDetected = false;
      this.threatAlarmTriggered = false;
      // Close gate smoothly once all warriors have entered
      const allInside = this.warriors.every((w) => w.state === 'inside_castle');
      if (allInside) {
        this.castleGateOpenProgress = Math.max(0, this.castleGateOpenProgress - dt * 2.0);
      }
    }

    const battleCries = ['⚔️ Charge!', '🛡️ For the Realm!', '⚔️ Repel Invaders!', '🛡️ Stand Firm!', '⚔️ To the Frontline!'];

    for (let i = 0; i < this.warriors.length; i++) {
      const warrior = this.warriors[i];

      // Cooldown & timers
      if (warrior.attackTimer > 0) warrior.attackTimer -= dt;
      if (warrior.hurtTimer > 0) warrior.hurtTimer -= dt;

      // Attack Animation Progress
      if (warrior.isAttacking) {
        warrior.attackAnimProgress += dt * 6.5;
        if (warrior.attackAnimProgress >= 1) {
          warrior.isAttacking = false;
          warrior.attackAnimProgress = 0;
        }
      }

      // Inside Castle Resting & Healing
      if (warrior.state === 'inside_castle') {
        if (warrior.health < warrior.maxHealth) {
          warrior.health = Math.min(warrior.maxHealth, warrior.health + 30 * dt);
        }
        warrior.x = castleGateX + (warrior.slotIndex % 2 === 0 ? -1 : 1) * 8;
        warrior.y = insideKeepY;

        // When threat appears and gate begins opening, prepare to deploy!
        if (hasThreat) {
          warrior.exitDelay = warrior.slotIndex * 0.32;
          if (this.castleGateOpenProgress >= 0.3) {
            warrior.state = 'deploying';
          }
        }
        continue;
      }

      // Staggered Gate Deployment
      if (warrior.state === 'deploying') {
        warrior.exitDelay -= dt;
        if (warrior.exitDelay <= 0) {
          // Rush through the open castle gate
          warrior.x = castleGateX + (warrior.slotIndex % 2 === 0 ? -10 : 10);
          warrior.y = castleGateY + 12;
          warrior.direction = 'down';
          warrior.state = 'charging';

          // Emit dust at castle gate threshold & shout battle cry
          this.particles.emitDust(warrior.x + 14, warrior.y + 24, 6);
          const cry = battleCries[warrior.slotIndex % battleCries.length];
          this.particles.addFloatingText(cry, warrior.x, warrior.y - 18, warrior.color || '#F59E0B', 14, undefined, true);
        }
        continue;
      }

      // No enemies: March back to Castle Gate, enter inside and rest
      if (!hasThreat) {
        warrior.targetEnemyId = null;
        const distToGate = Math.hypot(castleGateX - warrior.x, castleGateY - warrior.y);

        if (distToGate > 12) {
          warrior.state = 'returning';
          const dx = castleGateX - warrior.x;
          const dy = castleGateY - warrior.y;
          const dist = Math.hypot(dx, dy);
          const step = warrior.speed * 60 * dt;
          warrior.x += (dx / dist) * Math.min(step, dist);
          warrior.y += (dy / dist) * Math.min(step, dist);
          warrior.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          warrior.animTimer += dt;
          if (warrior.animTimer > 0.14) {
            warrior.animFrame = (warrior.animFrame + 1) % 4;
            warrior.animTimer = 0;
          }
        } else {
          // Reached the gate: Enter the keep
          warrior.state = 'inside_castle';
          warrior.x = castleGateX;
          warrior.y = insideKeepY;
          warrior.direction = 'down';
          warrior.animFrame = 0;
          this.particles.addFloatingText('🛡️ Garrison Rested', warrior.x, warrior.y - 15, '#10B981', 12);
        }
        continue;
      }

      // Enemies Present: Autonomous Target Acquisition & Combat obeying Vision Range & Max Patrol Perimeter
      const wx = warrior.x + warrior.width / 2;
      const wy = warrior.y + warrior.height / 2;

      let targetEnemy = aliveEnemies.find((e) => e.id === warrior.targetEnemyId);

      // Validate existing target against Vision Range & Max Patrol Radius from Castle Gate
      if (targetEnemy) {
        if (targetEnemy.health <= 0) {
          targetEnemy = undefined;
        } else {
          const ex = targetEnemy.x + targetEnemy.width / 2;
          const ey = targetEnemy.y + targetEnemy.height / 2;
          const distToWarrior = Math.hypot(ex - wx, ey - wy);
          const distToCastle = Math.hypot(ex - castleGateX, ey - castleGateY);

          // Disengage if enemy has escaped beyond both vision range and max patrol boundary
          if (distToWarrior > warrior.visionRange && distToCastle > warrior.maxPatrolRadius) {
            targetEnemy = undefined;
            warrior.targetEnemyId = null;
          }
        }
      }

      // Acquire new target within operational vision range & max patrol perimeter
      if (!targetEnemy) {
        let minScore = Infinity;
        let bestEnemy: EnemyInstance | null = null;

        for (const enemy of aliveEnemies) {
          const ex = enemy.x + enemy.width / 2;
          const ey = enemy.y + enemy.height / 2;
          const distToWarrior = Math.hypot(ex - wx, ey - wy);
          const distToCastle = Math.hypot(ex - castleGateX, ey - castleGateY);

          // Rule 32 & 37: Must be within warrior's vision range OR within patrol radius from castle gate
          if (distToWarrior <= warrior.visionRange || distToCastle <= warrior.maxPatrolRadius) {
            const score = distToWarrior + distToCastle * 0.3;
            if (score < minScore) {
              minScore = score;
              bestEnemy = enemy;
            }
          }
        }

        targetEnemy = bestEnemy || undefined;
        warrior.targetEnemyId = targetEnemy ? targetEnemy.id : null;
      }

      if (targetEnemy) {
        const ex = targetEnemy.x + targetEnemy.width / 2;
        const ey = targetEnemy.y + targetEnemy.height / 2;
        const distToTarget = Math.hypot(ex - wx, ey - wy);
        const warriorDistToCastle = Math.hypot(wx - castleGateX, wy - castleGateY);

        // Check Perimeter Boundary limit
        if (warriorDistToCastle >= warrior.maxPatrolRadius && distToTarget > warrior.attackRange) {
          // Warrior reached max patrol perimeter: Fall back to guard stance
          warrior.targetEnemyId = null;
          warrior.state = 'guarding_gate';
          this.particles.addFloatingText('🛡️ Perimeter Guarded!', warrior.x, warrior.y - 15, '#38BDF8', 12);
        } else if (distToTarget > warrior.attackRange) {
          // CHARGE / SPRINT INTO BATTLE WITHIN PERIMETER
          warrior.state = 'charging';
          const dx = ex - wx;
          const dy = ey - wy;
          const step = warrior.speed * 1.25 * 60 * dt;
          warrior.x += (dx / distToTarget) * step;
          warrior.y += (dy / distToTarget) * step;
          warrior.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          warrior.animTimer += dt;
          if (warrior.animTimer > 0.11) {
            warrior.animFrame = (warrior.animFrame + 1) % 4;
            warrior.animTimer = 0;
          }
        } else {
          // ENGAGE IN MELEE COMBAT
          warrior.state = 'attacking';
          const dx = ex - wx;
          const dy = ey - wy;
          warrior.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

          if (warrior.attackTimer <= 0) {
            warrior.attackTimer = warrior.attackCooldown;
            warrior.isAttacking = true;
            warrior.attackAnimProgress = 0;

            soundManager.playSwordSwing();

            // Deal Damage
            const isCrit = Math.random() < 0.25;
            const totalDmg = Math.round(warrior.damage * (isCrit ? 1.8 : 1.0));
            targetEnemy.health -= totalDmg;
            targetEnemy.hurtTimer = 0.2;
            targetEnemy.state = 'hurt';

            // Knockback
            const angle = Math.atan2(ey - wy, ex - wx);
            targetEnemy.x += Math.cos(angle) * 16;
            targetEnemy.y += Math.sin(angle) * 16;

            // Combat FX
            soundManager.playHit();
            this.particles.emitBlood(ex, ey, 8);
            this.particles.emitSparks(ex, ey, 8, '#F59E0B');
            this.particles.addFloatingText(
              isCrit ? `CRIT! -${totalDmg}` : `-${totalDmg}`,
              ex,
              ey - 10,
              isCrit ? '#F59E0B' : '#EF4444',
              isCrit ? 16 : 13,
              undefined,
              true
            );

            if (targetEnemy.health <= 0) {
              this.handleEnemyDeath(targetEnemy);
              warrior.targetEnemyId = null;
            }
          }
        }
      } else {
        // No enemy within vision range or patrol perimeter: Hold post at Castle Gate Guard Zone
        const distToGate = Math.hypot(castleGateX - warrior.x, castleGateY - warrior.y);
        if (distToGate > 35) {
          warrior.state = 'returning';
          const dx = castleGateX - warrior.x;
          const dy = castleGateY - warrior.y;
          const step = warrior.speed * 60 * dt;
          warrior.x += (dx / distToGate) * Math.min(step, distToGate);
          warrior.y += (dy / distToGate) * Math.min(step, distToGate);
          warrior.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          warrior.animTimer += dt;
          if (warrior.animTimer > 0.14) {
            warrior.animFrame = (warrior.animFrame + 1) % 4;
            warrior.animTimer = 0;
          }
        } else {
          warrior.state = 'guarding_gate';
          warrior.direction = 'down';
          warrior.animFrame = 0;
        }
      }
    }
  }

  // ==========================================
  // HERO UPDATE & CONTROLS
  // ==========================================
  private updateHero(dt: number) {
    if (this.hero.isDead) return;

    // Cooldown timers
    if (this.hero.attackTimer > 0) {
      this.hero.attackTimer -= dt;
    }
    if (this.hero.dashCooldownTimer > 0) {
      this.hero.dashCooldownTimer -= dt;
    }
    if (this.hero.hurtTimer > 0) {
      this.hero.hurtTimer -= dt;
      if (this.hero.hurtTimer <= 0) {
        this.hero.isHurt = false;
      }
    }

    // Passive Stamina & HP Regen
    if (this.hero.stamina < this.hero.maxStamina) {
      this.hero.stamina = Math.min(this.hero.maxStamina, this.hero.stamina + 15 * dt);
    }
    if (this.hero.health < this.hero.maxHealth && !this.hero.isHurt) {
      this.hero.health = Math.min(this.hero.maxHealth, this.hero.health + 1.5 * dt);
    }

    // Attack Animation Progress
    if (this.hero.isAttacking) {
      this.hero.attackAnimProgress += dt * 5;
      if (this.hero.attackAnimProgress >= 1) {
        this.hero.isAttacking = false;
        this.hero.attackAnimProgress = 0;
      }
    }

    // Gathering Progress
    if (this.hero.isGathering) {
      this.hero.gatherTimer += dt;
      if (this.hero.gatherTimer >= 0.35) {
        this.hero.gatherTimer = 0;
        this.executeGatherHit();
      }
      return; // Freeze movement while actively gathering
    }

    // Movement Handling (Keyboard or Touch Joystick)
    let moveX = 0;
    let moveY = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    // Apply Touch Joystick if active
    if (Math.abs(this.joystickVector.x) > 0.1 || Math.abs(this.joystickVector.y) > 0.1) {
      moveX = this.joystickVector.x;
      moveY = this.joystickVector.y;
    }

    // Normalize diagonal movement
    const len = Math.hypot(moveX, moveY);
    if (len > 0.1) {
      moveX = (moveX / Math.max(1, len));
      moveY = (moveY / Math.max(1, len));

      // Direction
      if (Math.abs(moveX) > Math.abs(moveY)) {
        this.hero.direction = moveX > 0 ? 'right' : 'left';
      } else {
        this.hero.direction = moveY > 0 ? 'down' : 'up';
      }

      // Speed with dash modifier
      let currentSpeed = this.hero.speed * 60 * dt;
      if (this.hero.isDashing) {
        currentSpeed *= 2.4;
        this.hero.dashTimer -= dt;
        if (this.hero.dashTimer <= 0) {
          this.hero.isDashing = false;
        }
      }

      // Collision Check with sliding on X and Y separately
      const newX = this.hero.x + moveX * currentSpeed;
      const newY = this.hero.y + moveY * currentSpeed;

      if (this.world.isWalkable(newX + this.hero.width / 2, this.hero.y + this.hero.height / 2, 12)) {
        this.hero.x = newX;
      }
      if (this.world.isWalkable(this.hero.x + this.hero.width / 2, newY + this.hero.height / 2, 12)) {
        this.hero.y = newY;
      }

      // Leg walk cycle
      this.hero.animTimer += dt;
      if (this.hero.animTimer > 0.15) {
        this.hero.animFrame = (this.hero.animFrame + 1) % 4;
        this.hero.animTimer = 0;
      }
    } else {
      this.hero.animFrame = 0;

      // Autonomous Hero Castle Defense: If idle and enemies approach within detection radius (disabled during raid review)
      if (!this.isRaidReviewMode && !this.hero.isGathering && !this.hero.isDead && this.enemies.length > 0) {
        const hx = this.hero.x + this.hero.width / 2;
        const hy = this.hero.y + this.hero.height / 2;
        let closestEnemy: EnemyInstance | null = null;
        let minEnemyDist = 180;

        for (const e of this.enemies) {
          if (e.health <= 0) continue;
          const ex = e.x + e.width / 2;
          const ey = e.y + e.height / 2;
          const dist = Math.hypot(ex - hx, ey - hy);
          if (dist < minEnemyDist) {
            minEnemyDist = dist;
            closestEnemy = e;
          }
        }

        if (closestEnemy) {
          const ex = closestEnemy.x + closestEnemy.width / 2;
          const ey = closestEnemy.y + closestEnemy.height / 2;
          const dx = ex - hx;
          const dy = ey - hy;

          if (Math.abs(dx) > Math.abs(dy)) {
            this.hero.direction = dx > 0 ? 'right' : 'left';
          } else {
            this.hero.direction = dy > 0 ? 'down' : 'up';
          }

          if (this.hero.attackTimer <= 0) {
            if (minEnemyDist <= this.hero.attackRange + 28) {
              this.heroAttack();
            } else if (minEnemyDist <= 180) {
              // Ranged Arcane/Arrow burst from Hero to defend the realm
              this.hero.attackTimer = this.hero.attackCooldown;
              this.hero.isAttacking = true;
              this.hero.attackAnimProgress = 0;
              this.fireTowerProjectile(
                this.world.buildingPlots[0]?.building || ({} as BuildingInstance),
                'magic',
                hx,
                hy,
                ex,
                ey,
                closestEnemy.id,
                this.hero.rangedDamage || this.hero.damage,
                undefined,
                0.2
              );
            }
          }
        }
      }
    }
  }

  // ==========================================
  // PLAYER COMBAT & ATTACK
  // ==========================================
  public heroAttack() {
    if (this.hero.isDead || this.hero.attackTimer > 0) return;

    this.hero.isAttacking = true;
    this.hero.attackAnimProgress = 0;
    this.hero.attackTimer = this.hero.attackCooldown;
    this.hero.isGathering = false;

    soundManager.playSwordSwing();

    // Attack hitbox in direction facing
    const hx = this.hero.x + this.hero.width / 2;
    const hy = this.hero.y + this.hero.height / 2;

    let targetCenter = { x: hx, y: hy };
    if (this.hero.direction === 'right') targetCenter.x += 24;
    else if (this.hero.direction === 'left') targetCenter.x -= 24;
    else if (this.hero.direction === 'down') targetCenter.y += 24;
    else if (this.hero.direction === 'up') targetCenter.y -= 24;

    // Check hit against all alive enemies
    let hitCount = 0;
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue;
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height / 2;
      const dist = Math.hypot(ex - targetCenter.x, ey - targetCenter.y);

      if (dist <= this.hero.attackRange + enemy.width / 2) {
        // Deal Damage
        const isCrit = Math.random() < 0.2;
        const totalDmg = Math.round(this.hero.damage * (isCrit ? 1.75 : 1));
        enemy.health -= totalDmg;
        enemy.hurtTimer = 0.2;
        enemy.state = 'hurt';

        // Knockback away from hero
        const angle = Math.atan2(ey - hy, ex - hx);
        enemy.x += Math.cos(angle) * 16;
        enemy.y += Math.sin(angle) * 16;

        // Visual & Audio Feedback
        soundManager.playHit();
        this.camera.triggerShake(3, 0.15);
        this.particles.emitBlood(ex, ey, 8);
        this.particles.emitSparks(ex, ey, 6);
        this.particles.addFloatingText(
          isCrit ? `CRIT! -${totalDmg}` : `-${totalDmg}`,
          ex,
          ey - 10,
          isCrit ? '#F59E0B' : '#EF4444',
          isCrit ? 18 : 14,
          undefined,
          true
        );

        hitCount++;

        // Enemy Death check
        if (enemy.health <= 0) {
          this.handleEnemyDeath(enemy);
        }
      }
    }
  }

  public heroDash() {
    if (this.hero.isDead || this.hero.dashCooldownTimer > 0 || this.hero.stamina < 25) return;

    this.hero.isDashing = true;
    this.hero.dashTimer = 0.22;
    this.hero.dashCooldownTimer = this.hero.dashCooldown;
    this.hero.stamina -= 25;

    soundManager.playDash();
    this.particles.emitSparks(this.hero.x + this.hero.width / 2, this.hero.y + this.hero.height / 2, 8, '#38BDF8');
  }

  // ==========================================
  // CONTEXTUAL ACTIONS & GATHERING
  // ==========================================
  private checkContextualInteractions() {
    const hx = this.hero.x + this.hero.width / 2;
    const hy = this.hero.y + this.hero.height / 2;

    // Check Nearest Resource Node
    let closestNode: ResourceNodeInstance | null = null;
    let minDist = 55;

    for (const node of this.world.resourceNodes) {
      if (node.isDepleted) continue;
      const nx = node.x + node.width / 2;
      const ny = node.y + node.height / 2;
      const dist = Math.hypot(nx - hx, ny - hy);
      if (dist < minDist) {
        minDist = dist;
        closestNode = node;
      }
    }
    this.nearbyNode = closestNode;

    // Check Nearest Building Plot
    let closestPlot: BuildingPlot | null = null;
    let minPlotDist = 70;
    for (const plot of this.world.buildingPlots) {
      const px = plot.x + plot.width / 2;
      const py = plot.y + plot.height / 2;
      const dist = Math.hypot(px - hx, py - hy);
      if (dist < minPlotDist) {
        minPlotDist = dist;
        closestPlot = plot;
      }
    }
    this.nearbyPlot = closestPlot;

    // Check Nearest Exploration Chest
    let closestChest: ChestInstance | null = null;
    let minChestDist = 50;
    for (const chest of this.world.chests) {
      if (chest.isOpened) continue;
      const cx = chest.x + chest.width / 2;
      const cy = chest.y + chest.height / 2;
      const dist = Math.hypot(cx - hx, cy - hy);
      if (dist < minChestDist) {
        minChestDist = dist;
        closestChest = chest;
      }
    }
    this.nearbyChest = closestChest;
  }

  public interact() {
    // 1. Open Chest if nearby
    if (this.nearbyChest && !this.nearbyChest.isOpened) {
      this.openChest(this.nearbyChest);
      return;
    }

    // 2. Start Gathering if nearby node
    if (this.nearbyNode && !this.nearbyNode.isDepleted) {
      this.startGathering(this.nearbyNode);
      return;
    }

    // 3. Open Plot UI if nearby empty plot
    if (this.nearbyPlot) {
      this.selectedPlotId = this.nearbyPlot.id;
      this.selectedBuilding = this.nearbyPlot.building;
      return;
    }
  }

  public startGathering(node: ResourceNodeInstance) {
    if (node.isDepleted) return;

    this.hero.isGathering = true;
    this.hero.gatherTargetId = node.id;
    this.hero.gatherTimer = 0;

    if (node.type.startsWith('tree')) {
      this.hero.gatherType = 'chop';
    } else if (node.type.startsWith('rock')) {
      this.hero.gatherType = 'mine';
    } else {
      this.hero.gatherType = 'harvest';
    }
  }

  private executeGatherHit() {
    if (!this.hero.gatherTargetId) {
      this.hero.isGathering = false;
      return;
    }

    const node = this.world.resourceNodes.find((n) => n.id === this.hero.gatherTargetId);
    if (!node || node.isDepleted) {
      this.hero.isGathering = false;
      return;
    }

    // Node take damage
    const dmg = 15;
    node.health -= dmg;
    node.shakeTimer = 0.2;

    const nx = node.x + node.width / 2;
    const ny = node.y + node.height / 2;

    if (this.hero.gatherType === 'chop') {
      soundManager.playChop();
      this.particles.emitWoodChips(nx, ny, 8);
    } else if (this.hero.gatherType === 'mine') {
      soundManager.playMine();
      this.particles.emitStoneRubble(nx, ny, 8);
    } else {
      soundManager.playHarvest();
      this.particles.emitSparks(nx, ny, 5, '#22C55E');
    }

    // Add Resource Yield
    this.addResource(node.resourceType, node.yieldAmount, nx, ny);

    // Track Quests
    this.updateQuestProgress('gather', node.yieldAmount, node.resourceType);

    // Depleted?
    if (node.health <= 0) {
      node.isDepleted = true;
      node.respawnTimer = 0;
      this.hero.isGathering = false;
      this.hero.gatherTargetId = null;

      // Bonus completion reward
      this.addResource(node.resourceType, node.yieldAmount, nx, ny);
      this.particles.addFloatingText(`+${node.yieldAmount} Bonus!`, nx, ny - 20, '#F59E0B', 16);
    }
  }

  public openChest(chest: ChestInstance) {
    if (chest.isOpened) return;

    chest.isOpened = true;
    soundManager.playChestOpen();

    const cx = chest.x + chest.width / 2;
    const cy = chest.y + chest.height / 2;

    this.particles.emitMagicGlow(cx, cy, 25, '#F59E0B');
    this.particles.addFloatingText('🎁 TREASURE FOUND!', cx, cy - 25, '#FDE047', 18, undefined, true);

    // Deposit Rewards
    for (const [key, amount] of Object.entries(chest.rewards)) {
      if (amount && amount > 0) {
        this.addResource(key as ResourceType, amount, cx, cy);
      }
    }

    // Update quest
    this.updateQuestProgress('explore', 1);
  }

  // ==========================================
  // ECONOMY & RESOURCE MANAGEMENT
  // ==========================================
  public addResource(type: ResourceType, amount: number, x?: number, y?: number): boolean {
    let actualAdded = amount;

    // Capacity limit check for physical resources
    if (type === 'wood' || type === 'stone' || type === 'food') {
      const current = this.resources[type];
      const max = this.storageCapacity[type];
      if (current >= max) {
        if (x !== undefined && y !== undefined) {
          this.particles.addFloatingText('Storage Full!', x, y, '#EF4444', 12);
        }
        return false;
      }
      actualAdded = Math.min(amount, max - current);
    }

    this.resources[type] += actualAdded;

    if (x !== undefined && y !== undefined && actualAdded > 0) {
      const color =
        type === 'wood'
          ? '#92400E'
          : type === 'stone'
            ? '#64748B'
            : type === 'food'
              ? '#16A34A'
              : type === 'coins'
                ? '#F59E0B'
                : '#38BDF8';
      const label = `+${actualAdded} ${type.toUpperCase()}`;
      this.particles.addFloatingText(label, x, y, color, 14);
    }

    return true;
  }

  public canAfford(cost: Partial<Resources>): boolean {
    for (const [key, req] of Object.entries(cost)) {
      if (req && this.resources[key as ResourceType] < req) {
        return false;
      }
    }
    return true;
  }

  public deductResources(cost: Partial<Resources>) {
    for (const [key, req] of Object.entries(cost)) {
      if (req) {
        this.resources[key as ResourceType] -= req;
      }
    }
  }

  // ==========================================
  // BUILDING SYSTEM
  // ==========================================
  public constructBuilding(plotId: string, type: BuildingType): boolean {
    const plot = this.world.buildingPlots.find((p) => p.id === plotId);
    if (!plot || plot.building) return false;

    const blueprint = BUILDING_BLUEPRINTS[type];
    if (!blueprint || !this.canAfford(blueprint.cost)) return false;

    // Check plot allowed category
    if (plot.allowedCategories && !plot.allowedCategories.includes(blueprint.category)) {
      return false;
    }

    // Deduct cost
    this.deductResources(blueprint.cost);

    // Create building instance
    plot.building = {
      id: `b_${type}_${Date.now()}`,
      plotId,
      type,
      level: 1,
      health: blueprint.baseHealth,
      maxHealth: blueprint.baseHealth,
      x: plot.x,
      y: plot.y,
      width: plot.width,
      height: plot.height,
      isConstructing: true,
      constructionProgress: 0,
      constructionTimeTotal: blueprint.constructionTime,
      productionTimer: 0,
      lastAttackTime: 0,
      targetEnemyId: null,
      targetAngle: 0,
    };

    soundManager.playBuildingPlaced();
    this.particles.emitConstructionDust(plot.x, plot.y, plot.width, plot.height);
    this.recalculateKingdomStats();
    this.updateQuestProgress('build', 1, undefined, type);

    return true;
  }

  public upgradeBuilding(building: BuildingInstance): boolean {
    const blueprint = BUILDING_BLUEPRINTS[building.type];
    if (!blueprint || building.level >= blueprint.maxLevel || building.isConstructing) return false;

    // Upgrade cost scales with level
    const upgradeCost: Partial<Resources> = {};
    for (const [key, base] of Object.entries(blueprint.cost)) {
      if (base) {
        upgradeCost[key as ResourceType] = Math.round(base * (1 + building.level * 0.7));
      }
    }

    if (!this.canAfford(upgradeCost)) return false;

    this.deductResources(upgradeCost);
    building.level++;
    building.maxHealth = Math.round(blueprint.baseHealth * (1 + (building.level - 1) * 0.4));
    building.health = building.maxHealth;

    soundManager.playBuildingPlaced();
    this.particles.emitSparks(building.x + building.width / 2, building.y + building.height / 2, 15, '#F59E0B');
    this.particles.addFloatingText(`LEVEL ${building.level}!`, building.x + building.width / 2, building.y - 10, '#F59E0B', 16);

    this.recalculateKingdomStats();
    return true;
  }

  private updateBuildings(dt: number) {
    for (const plot of this.world.buildingPlots) {
      const b = plot.building;
      if (!b) continue;

      // Construction state update
      if (b.isConstructing) {
        b.constructionProgress += dt / b.constructionTimeTotal;
        if (b.constructionProgress >= 1) {
          b.isConstructing = false;
          b.constructionProgress = 1;
          soundManager.playWaveVictory();
          this.particles.emitSparks(b.x + b.width / 2, b.y + b.height / 2, 20, '#22C55E');
          this.particles.addFloatingText('COMPLETED!', b.x + b.width / 2, b.y - 10, '#22C55E', 16);
          this.recalculateKingdomStats();
        }
        continue;
      }

      // Passive Resource Production
      const blueprint = BUILDING_BLUEPRINTS[b.type];
      if (blueprint.productionRate) {
        b.productionTimer += dt;
        if (b.productionTimer >= blueprint.productionRate.intervalSec) {
          b.productionTimer = 0;
          const amt = blueprint.productionRate.amount * b.level;
          this.addResource(blueprint.productionRate.resource, amt, b.x + b.width / 2, b.y + 10);
        }
      }

      // Defensive Tower Target Acquisition & Firing
      if (blueprint.defenseStats) {
        this.updateTowerDefense(b, blueprint, dt);
      }
    }
  }

  private updateTowerDefense(tower: BuildingInstance, blueprint: (typeof BUILDING_BLUEPRINTS)[BuildingType], dt: number) {
    const stats = blueprint.defenseStats!;
    const tx = tower.x + tower.width / 2;
    const ty = tower.y + tower.height / 2;

    // Apply upgrade bonus
    const towerDmgUpgrade = this.upgrades.find((u) => u.id === 'tower_damage')?.level || 1;
    const towerRangeUpgrade = this.upgrades.find((u) => u.id === 'tower_range')?.level || 1;

    const range = stats.range * (1 + (tower.level - 1) * 0.2) * (1 + (towerRangeUpgrade - 1) * 0.15);
    const damage = stats.damage * (1 + (tower.level - 1) * 0.4) * (1 + (towerDmgUpgrade - 1) * 0.2);
    const attackInterval = 1 / stats.attackSpeed;

    tower.lastAttackTime += dt;

    // Find closest enemy in range
    let closestEnemy: EnemyInstance | null = null;
    let minDist = range;

    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue;
      const ex = enemy.x + enemy.width / 2;
      const ey = enemy.y + enemy.height / 2;
      const dist = Math.hypot(ex - tx, ey - ty);
      if (dist <= minDist) {
        minDist = dist;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy) {
      const ex = closestEnemy.x + closestEnemy.width / 2;
      const ey = closestEnemy.y + closestEnemy.height / 2;
      tower.targetAngle = Math.atan2(ey - ty, ex - tx);
      tower.targetEnemyId = closestEnemy.id;

      // Ready to fire?
      if (tower.lastAttackTime >= attackInterval) {
        tower.lastAttackTime = 0;
        this.fireTowerProjectile(tower, stats.projectileType, tx, ty, ex, ey, closestEnemy.id, damage, stats.splashRadius, stats.slowEffect);
      }
    } else {
      tower.targetEnemyId = null;
    }
  }

  private fireTowerProjectile(
    _tower: BuildingInstance,
    type: 'arrow' | 'cannonball' | 'magic',
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    targetEnemyId: string,
    damage: number,
    splashRadius?: number,
    slowEffect?: number
  ) {
    if (type === 'arrow') soundManager.playArrowShoot();
    else if (type === 'cannonball') soundManager.playCannon();
    else soundManager.playMagic();

    this.projectiles.push({
      id: `proj_${Date.now()}_${Math.random()}`,
      type,
      startX,
      startY,
      x: startX,
      y: startY,
      targetX,
      targetY,
      targetEnemyId,
      speed: type === 'arrow' ? 450 : type === 'cannonball' ? 320 : 380,
      progress: 0,
      damage,
      splashRadius,
      slowEffect,
    });
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      const dx = proj.targetX - proj.startX;
      const dy = proj.targetY - proj.startY;
      const totalDist = Math.hypot(dx, dy);

      proj.progress += (proj.speed * dt) / Math.max(1, totalDist);
      proj.x = proj.startX + dx * proj.progress;
      proj.y = proj.startY + dy * proj.progress;

      // Reached Target?
      if (proj.progress >= 1) {
        this.handleProjectileImpact(proj);
        this.projectiles.splice(i, 1);
      }
    }
  }

  private handleProjectileImpact(proj: ProjectileInstance) {
    if (proj.type === 'cannonball') {
      soundManager.playHit();
      this.particles.emitExplosion(proj.targetX, proj.targetY, proj.splashRadius || 50);

      // Splash damage to all nearby enemies
      for (const enemy of this.enemies) {
        if (enemy.health <= 0) continue;
        const ex = enemy.x + enemy.width / 2;
        const ey = enemy.y + enemy.height / 2;
        const dist = Math.hypot(ex - proj.targetX, ey - proj.targetY);

        if (dist <= (proj.splashRadius || 50)) {
          enemy.health -= proj.damage;
          enemy.hurtTimer = 0.2;
          this.particles.addFloatingText(`-${Math.round(proj.damage)}`, ex, ey - 10, '#F97316', 15);
          if (enemy.health <= 0) {
            this.handleEnemyDeath(enemy);
          }
        }
      }
    } else {
      // Single target arrow or magic
      const target = this.enemies.find((e) => e.id === proj.targetEnemyId && e.health > 0);
      if (target) {
        target.health -= proj.damage;
        target.hurtTimer = 0.2;
        soundManager.playHit();

        if (proj.type === 'magic' && proj.slowEffect) {
          target.slowTimer = 3.0;
          target.speed = target.baseSpeed * (1 - proj.slowEffect);
          this.particles.emitMagicGlow(target.x, target.y, 10, '#38BDF8');
        } else {
          this.particles.emitSparks(target.x, target.y, 6);
        }

        this.particles.addFloatingText(`-${Math.round(proj.damage)}`, target.x, target.y - 10, '#F59E0B', 14);

        if (target.health <= 0) {
          this.handleEnemyDeath(target);
        }
      }
    }
  }

  public recalculateKingdomStats() {
    let woodStorage = 150;
    let stoneStorage = 150;
    let foodStorage = 100;
    let maxPop = 2;

    for (const plot of this.world.buildingPlots) {
      if (plot.building && !plot.building.isConstructing) {
        const bp = BUILDING_BLUEPRINTS[plot.building.type];
        const lvl = plot.building.level;
        if (bp.storageBonus) {
          woodStorage += bp.storageBonus * lvl;
          stoneStorage += bp.storageBonus * lvl;
          foodStorage += Math.round(bp.storageBonus * 0.7 * lvl);
        }
        if (bp.populationBonus) {
          maxPop += bp.populationBonus * lvl;
        }
      }
    }

    this.storageCapacity = {
      wood: woodStorage,
      stone: stoneStorage,
      food: foodStorage,
    };
    this.population.max = maxPop;
    this.population.current = this.workers.length;
  }

  // ==========================================
  // WORKER AUTOMATION & MANAGEMENT
  // ==========================================
  public recruitWorker(job: WorkerJob = 'lumberjack'): boolean {
    if (this.population.current >= this.population.max) return false;

    const recruitCost = { food: 25, coins: 20 };
    if (!this.canAfford(recruitCost)) return false;

    this.deductResources(recruitCost);

    const cx = this.world.width / 2;
    const cy = this.world.height / 2;

    const workerSpeedUpgrade = this.upgrades.find((u) => u.id === 'worker_speed')?.level || 1;
    const speed = 2.0 * (1 + (workerSpeedUpgrade - 1) * 0.25);

    const worker: WorkerInstance = {
      id: `w_${Date.now()}_${Math.random()}`,
      name: `${job.charAt(0).toUpperCase() + job.slice(1)} #${this.workers.length + 1}`,
      job,
      x: cx + (Math.random() * 40 - 20),
      y: cy + (Math.random() * 40 - 20),
      targetX: cx,
      targetY: cy,
      speed,
      direction: 'down',
      state: 'idle',
      targetNodeId: null,
      carriedResource: {
        type: job === 'lumberjack' ? 'wood' : job === 'miner' ? 'stone' : 'food',
        amount: 0,
        maxCapacity: 15,
      },
      workTimer: 0,
      animFrame: 0,
      animTimer: 0,
    };

    this.workers.push(worker);
    this.recalculateKingdomStats();
    soundManager.playWaveVictory();
    this.particles.emitSparks(worker.x, worker.y, 10, '#38BDF8');
    this.particles.addFloatingText('Worker Recruited!', worker.x, worker.y - 15, '#38BDF8', 14);

    this.updateQuestProgress('recruit', 1);
    return true;
  }

  public changeWorkerJob(workerId: string, newJob: WorkerJob) {
    const worker = this.workers.find((w) => w.id === workerId);
    if (!worker) return;
    worker.job = newJob;
    worker.carriedResource.type = newJob === 'lumberjack' ? 'wood' : newJob === 'miner' ? 'stone' : 'food';
    worker.state = 'idle';
    worker.targetNodeId = null;
  }

  private updateWorkers(dt: number) {
    const warehousePlot = this.world.buildingPlots.find((p) => p.building?.type === 'warehouse' && !p.building.isConstructing);
    const townPlot = this.world.buildingPlots.find((p) => p.id === 'plot_town_hall');
    const depositTarget = warehousePlot || townPlot;
    const depositX = depositTarget ? depositTarget.x + depositTarget.width / 2 : this.world.width / 2;
    const depositY = depositTarget ? depositTarget.y + depositTarget.height / 2 : this.world.height / 2;

    for (const worker of this.workers) {
      worker.animTimer += dt;

      // State Machine
      if (worker.state === 'idle') {
        // Find best resource target based on job
        const targetTypePrefix = worker.job === 'lumberjack' ? 'tree' : worker.job === 'miner' ? 'rock' : 'bush';
        let closestNode: ResourceNodeInstance | null = null;
        let minDist = Infinity;

        for (const node of this.world.resourceNodes) {
          if (node.isDepleted) continue;
          if (node.type.startsWith(targetTypePrefix)) {
            const dist = Math.hypot(node.x - worker.x, node.y - worker.y);
            if (dist < minDist) {
              minDist = dist;
              closestNode = node;
            }
          }
        }

        if (closestNode) {
          worker.targetNodeId = closestNode.id;
          worker.targetX = closestNode.x + closestNode.width / 2;
          worker.targetY = closestNode.y + closestNode.height / 2;
          worker.state = 'walking_to_node';
        }
      } else if (worker.state === 'walking_to_node') {
        // Move towards target node
        const dx = worker.targetX - worker.x;
        const dy = worker.targetY - worker.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 30) {
          worker.state = 'working';
          worker.workTimer = 0;
        } else {
          const moveStep = worker.speed * 60 * dt;
          worker.x += (dx / dist) * moveStep;
          worker.y += (dy / dist) * moveStep;
          worker.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        }
      } else if (worker.state === 'working') {
        // Working animation & timer
        worker.workTimer += dt;
        if (worker.workTimer >= 1.5) {
          worker.workTimer = 0;

          // Collect resource bundle
          const node = this.world.resourceNodes.find((n) => n.id === worker.targetNodeId);
          if (node && !node.isDepleted) {
            node.health -= 15;
            node.shakeTimer = 0.2;
            worker.carriedResource.amount = worker.carriedResource.maxCapacity;

            if (worker.job === 'lumberjack') {
              soundManager.playChop();
              this.particles.emitWoodChips(node.x, node.y, 5);
            } else if (worker.job === 'miner') {
              soundManager.playMine();
              this.particles.emitStoneRubble(node.x, node.y, 5);
            }

            if (node.health <= 0) {
              node.isDepleted = true;
            }
          }

          // Return to warehouse
          worker.targetX = depositX;
          worker.targetY = depositY;
          worker.state = 'returning_to_warehouse';
        }
      } else if (worker.state === 'returning_to_warehouse') {
        const dx = worker.targetX - worker.x;
        const dy = worker.targetY - worker.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 40) {
          // Deposit Resources into Realm Storage
          this.addResource(worker.carriedResource.type, worker.carriedResource.amount, worker.x, worker.y);
          this.updateQuestProgress('gather', worker.carriedResource.amount, worker.carriedResource.type);
          worker.carriedResource.amount = 0;
          worker.state = 'idle';
          soundManager.playCoin();
        } else {
          const moveStep = worker.speed * 60 * dt;
          worker.x += (dx / dist) * moveStep;
          worker.y += (dy / dist) * moveStep;
          worker.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        }
      }
    }
  }

  private updateVillagers(dt: number) {
    this.villagerSpeechTimer += dt;
    const shouldGreet = this.villagerSpeechTimer >= 8.0;
    if (shouldGreet) {
      this.villagerSpeechTimer = 0;
      if (this.villagers.length > 0) {
        const randomV = this.villagers[Math.floor(Math.random() * this.villagers.length)];
        const kingdomState = globalSpacedRepetition.getKingdomState();
        if ((kingdomState.vitalityScore ?? 1.0) < 0.60) {
          const sadPlea = [
            'القرية بحاجة للمراجعة.. 🥺',
            'النسيان يغمر أبنيتنا! 🌪️',
            'راجع عباراتك لترميمنا! 🌿',
            'المملكة تشتاق إليك 🌾',
            'الهمة يا بطل! أعد إحياءنا 🏰',
          ];
          randomV.speechText = sadPlea[Math.floor(Math.random() * sadPlea.length)];
        } else {
          const greetings = ['Hallo! 👋', 'Guten Tag! ☀️', 'Willkommen! 🏰', 'Schöner Tag!', 'Toll hier! ✨', 'Bonjour! 👋', '¡Hola! ☀️'];
          randomV.speechText = greetings[Math.floor(Math.random() * greetings.length)];
        }
        randomV.speechTimer = 3.5;
      }
    }

    const townPlot = this.world.buildingPlots.find((p) => p.id === 'plot_town_hall');
    const cx = townPlot ? townPlot.x + townPlot.width / 2 : this.world.width / 2;
    const cy = townPlot ? townPlot.y + townPlot.height / 2 : this.world.height / 2;

    for (const v of this.villagers) {
      if (v.speechTimer && v.speechTimer > 0) {
        v.speechTimer -= dt;
        if (v.speechTimer <= 0) {
          v.speechText = undefined;
        }
      }

      if (v.idleTimer > 0) {
        v.idleTimer -= dt;
        v.animFrame = 0;
        continue;
      }

      const dx = v.targetX - v.x;
      const dy = v.targetY - v.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= 15) {
        // Reached target point: rest a bit, then select next destination near village landmarks
        v.idleTimer = 3.0 + Math.random() * 5.0;
        const wanderRadius = 240;
        v.targetX = cx + (Math.random() - 0.5) * wanderRadius;
        v.targetY = cy + (Math.random() - 0.5) * wanderRadius;
      } else {
        const kingdomState = globalSpacedRepetition.getKingdomState();
        const speedMultiplier = (kingdomState.vitalityScore ?? 1.0) < 0.60 ? 0.7 : 1.0;
        const moveStep = v.speed * speedMultiplier * 60 * dt;
        v.x += (dx / dist) * Math.min(moveStep, dist);
        v.y += (dy / dist) * Math.min(moveStep, dist);
        v.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';

        v.animTimer += dt;
        if (v.animTimer > 0.16) {
          v.animFrame = (v.animFrame + 1) % 4;
          v.animTimer = 0;
        }
      }
    }
  }

  private updateAtmosphere(dt: number) {
    const kingdomState = globalSpacedRepetition.getKingdomState();
    // Hearths cold and extinguished due to neglect
    if ((kingdomState.vitalityScore ?? 1.0) < 0.65) {
      return;
    }

    this.chimneySmokeTimer += dt;
    if (this.chimneySmokeTimer >= 0.7) {
      this.chimneySmokeTimer = 0;
      // Emit soft smoke puffs from all active houses
      for (const plot of this.world.buildingPlots) {
        if (plot.building && plot.building.type === 'house' && !plot.building.isConstructing) {
          this.particles.emitChimneySmoke(plot.x + plot.width - 24, plot.y + 12);
        }
      }
    }
  }

  // ==========================================
  // MONSTER INVASION & WAVE SYSTEM
  // ==========================================
  public startMonsterWave() {
    if (this.isWaveActive) return;

    this.isWaveActive = true;
    soundManager.playWaveStart();
    this.camera.triggerShake(5, 0.4);

    // Get Wave Config (or auto scale beyond configured waves)
    let waveConfig = WAVE_CONFIGURATIONS.find((w) => w.waveNumber === this.currentWave);
    if (!waveConfig) {
      waveConfig = {
        waveNumber: this.currentWave,
        enemies: [
          { type: 'goblin', count: 8 + this.currentWave * 2, delaySec: 0.6 },
          { type: 'orc', count: 4 + this.currentWave, delaySec: 1.2 },
          { type: 'heavy_orc', count: 2 + Math.floor(this.currentWave / 2), delaySec: 2.0 },
          { type: 'boss_gargoyle', count: 1, delaySec: 4.0 },
        ],
        reward: {
          coins: 200 + this.currentWave * 50,
          gems: 10 + this.currentWave * 3,
          wood: 100,
          stone: 100,
        },
      };
    }

    this.waveRewardPending = waveConfig.reward;
    this.waveSpawnQueue = [];

    for (const group of waveConfig.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.waveSpawnQueue.push({
          type: group.type,
          delay: group.delaySec,
        });
      }
    }

    this.waveTotalEnemies = this.waveSpawnQueue.length;
    this.waveEnemiesRemaining = this.waveTotalEnemies;
    this.waveSpawnTimer = 0.5;

    this.particles.addFloatingText(`⚔️ WAVE ${this.currentWave} INVASION!`, this.hero.x, this.hero.y - 30, '#EF4444', 20, undefined, true);
  }

  private updateWave(dt: number) {
    // Ambient Wildlife / Scout Raiders in Living World
    if (!this.isWaveActive) {
      this.ambientSpawnTimer -= dt;
      if (this.ambientSpawnTimer <= 0 && this.enemies.length < 4) {
        this.ambientSpawnTimer = 12 + Math.random() * 10;
        const enemyTypes: EnemyType[] = ['goblin', 'fast_goblin', 'orc'];
        const chosen = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        this.spawnEnemy(chosen);
      }
      return;
    }

    // Spawn queue handler
    if (this.waveSpawnQueue.length > 0) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0) {
        const nextSpawn = this.waveSpawnQueue.shift();
        if (nextSpawn) {
          this.spawnEnemy(nextSpawn.type);
          this.waveSpawnTimer = nextSpawn.delay;
        }
      }
    }

    // Wave Completion check
    if (this.waveSpawnQueue.length === 0 && this.enemies.length === 0) {
      this.handleWaveVictory();
    }
  }

  private spawnEnemy(type: EnemyType) {
    // Spawns from North-East ruins or North borders
    const spawnPoints = [
      { x: 1400, y: 120 },
      { x: 2500, y: 350 },
      { x: 2600, y: 1400 },
      { x: 200, y: 300 },
    ];
    const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];

    let name = 'Goblin Raider';
    let width = 26;
    let height = 28;
    let health = 95;
    let speed = 0.8;
    let damage = 10;
    let attackSpeed = 1.0;
    let loot: Partial<Resources> = { coins: 10, wood: 5 };

    if (type === 'fast_goblin') {
      name = 'Goblin Scout';
      width = 24;
      height = 26;
      health = 85;
      speed = 0.95;
      damage = 8;
      attackSpeed = 1.1;
      loot = { coins: 15, gems: 1 };
    } else if (type === 'orc') {
      name = 'Orc Warrior';
      width = 34;
      height = 36;
      health = 180;
      speed = 0.75;
      damage = 18;
      attackSpeed = 0.8;
      loot = { coins: 25, stone: 15 };
    } else if (type === 'heavy_orc') {
      name = 'Armored Orc Brute';
      width = 38;
      height = 40;
      health = 280;
      speed = 0.65;
      damage = 28;
      attackSpeed = 0.6;
      loot = { coins: 50, stone: 30, gems: 2 };
    } else if (type === 'boss_gargoyle') {
      name = 'Dread Ogre Fiend';
      width = 54;
      height = 56;
      health = 650;
      speed = 0.6;
      damage = 45;
      attackSpeed = 0.65;
      loot = { coins: 150, gems: 10, wood: 80, stone: 80 };
    }

    this.enemies.push({
      id: `enemy_${Date.now()}_${Math.random()}`,
      type,
      name,
      x: spawn.x + (Math.random() * 40 - 20),
      y: spawn.y + (Math.random() * 40 - 20),
      targetX: this.world.width / 2,
      targetY: this.world.height / 2,
      width,
      height,
      health,
      maxHealth: health,
      speed,
      baseSpeed: speed,
      damage,
      attackSpeed,
      attackRange: 32,
      attackCooldown: 0,
      direction: 'down',
      state: 'moving',
      targetType: 'building',
      targetId: 'plot_town_hall',
      animFrame: 0,
      animTimer: 0,
      slowTimer: 0,
      hurtTimer: 0,
      loot,
    });
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Slow timer
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        if (enemy.slowTimer <= 0) {
          enemy.speed = enemy.baseSpeed;
        }
      }
      if (enemy.hurtTimer > 0) {
        enemy.hurtTimer -= dt;
      }
      if (enemy.attackCooldown > 0) {
        enemy.attackCooldown -= dt;
      }

      enemy.animTimer += dt;

      // Select Target (Closest: Intercepting Warrior -> Defensive Tower -> Building -> Castle)
      let targetX = this.hero.x;
      let targetY = this.hero.y;
      let targetBuilding: BuildingInstance | null = null;
      let targetWarrior: WarriorInstance | null = null;
      let targetDist = Math.hypot(this.hero.x - enemy.x, this.hero.y - enemy.y);

      // Check intercepting warriors nearby
      for (const warrior of this.warriors) {
        if (warrior.health > 0) {
          const wx = warrior.x + warrior.width / 2;
          const wy = warrior.y + warrior.height / 2;
          const wDist = Math.hypot(wx - enemy.x, wy - enemy.y);
          if (wDist < 90 && wDist < targetDist) {
            targetDist = wDist;
            targetX = wx;
            targetY = wy;
            targetWarrior = warrior;
          }
        }
      }

      // Check defensive towers & buildings nearby if no warrior is engaging
      if (!targetWarrior) {
        for (const plot of this.world.buildingPlots) {
          if (plot.building && plot.building.health > 0) {
            const bx = plot.building.x + plot.building.width / 2;
            const by = plot.building.y + plot.building.height / 2;
            const bDist = Math.hypot(bx - enemy.x, by - enemy.y);

            // Prioritize active towers or central keep
            if (bDist < targetDist || (plot.building.type.includes('tower') && bDist < targetDist + 150)) {
              targetDist = bDist;
              targetX = bx;
              targetY = by;
              targetBuilding = plot.building;
            }
          }
        }
      }

      // Attack or Move
      if (targetDist <= enemy.attackRange + 15) {
        enemy.state = 'attacking';
        if (enemy.attackCooldown <= 0) {
          enemy.attackCooldown = 1 / enemy.attackSpeed;

          // Deal Damage
          if (targetWarrior) {
            targetWarrior.health -= enemy.damage;
            targetWarrior.hurtTimer = 0.25;
            soundManager.playHit();
            this.particles.emitBlood(targetWarrior.x + 14, targetWarrior.y + 16, 6);
            this.particles.addFloatingText(`-${enemy.damage}`, targetWarrior.x + 14, targetWarrior.y - 10, '#EF4444', 13);

            if (targetWarrior.health <= 0) {
              // Warrior retreats to Castle Gate to heal
              targetWarrior.health = Math.round(targetWarrior.maxHealth * 0.4);
              targetWarrior.x = this.world.width / 2;
              targetWarrior.y = this.world.height / 2 + 25;
              targetWarrior.state = 'guarding_gate';
              this.particles.emitSparks(targetWarrior.x, targetWarrior.y, 15, '#38BDF8');
              this.particles.addFloatingText('🛡️ Retreated to Castle!', targetWarrior.x, targetWarrior.y - 20, '#38BDF8', 14);
            }
          } else if (targetBuilding) {
            targetBuilding.health -= enemy.damage;
            soundManager.playHit();
            this.particles.emitStoneRubble(targetX, targetY, 4);
            this.particles.addFloatingText(`-${enemy.damage}`, targetX, targetY, '#EF4444', 14);

            if (targetBuilding.health <= 0) {
              targetBuilding.health = 0;
              this.particles.emitExplosion(targetX, targetY, 40);
              this.particles.addFloatingText('BUILDING DESTROYED!', targetX, targetY - 15, '#EF4444', 16, undefined, true);
              this.recalculateKingdomStats();
            }
          } else {
            // Attack Hero / Castle Sentry
            this.hero.health -= enemy.damage;
            this.hero.isHurt = true;
            this.hero.hurtTimer = 0.25;
            soundManager.playHit();
            this.camera.triggerShake(4, 0.2);
            this.particles.emitBlood(this.hero.x + 14, this.hero.y + 16, 8);
            this.particles.addFloatingText(`-${enemy.damage}`, this.hero.x, this.hero.y - 10, '#EF4444', 16, undefined, true);

            if (this.hero.health <= 0) {
              this.handleHeroDeath();
            }
          }
        }
      } else {
        // Move towards target
        enemy.state = 'moving';
        const dx = targetX - enemy.x;
        const dy = targetY - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 5) {
          const step = enemy.speed * 60 * dt;
          enemy.x += (dx / dist) * step;
          enemy.y += (dy / dist) * step;
          enemy.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        }
      }
    }
  }

  private handleEnemyDeath(enemy: EnemyInstance) {
    const idx = this.enemies.indexOf(enemy);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
    this.waveEnemiesRemaining = Math.max(0, this.waveEnemiesRemaining - 1);

    soundManager.playEnemyDeath();
    this.particles.emitBlood(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 12);
    this.particles.emitSparks(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 8, '#F59E0B');

    // Grant Hero EXP & Loot
    this.hero.exp += 25;
    if (this.hero.exp >= this.hero.expToNextLevel) {
      this.hero.level++;
      this.hero.exp -= this.hero.expToNextLevel;
      this.hero.expToNextLevel = Math.round(this.hero.expToNextLevel * 1.5);
      this.hero.maxHealth += 20;
      this.hero.health = this.hero.maxHealth;
      this.hero.damage += 4;
      soundManager.playWaveVictory();
      this.particles.addFloatingText('LEVEL UP!', this.hero.x, this.hero.y - 25, '#FACC15', 20, undefined, true);
    }

    // Drop Loot
    for (const [res, amt] of Object.entries(enemy.loot)) {
      if (amt) {
        this.addResource(res as ResourceType, amt, enemy.x, enemy.y);
      }
    }
  }

  private handleWaveVictory() {
    this.isWaveActive = false;
    soundManager.playWaveVictory();
    this.camera.triggerShake(4, 0.3);

    // Deposit Wave Rewards
    if (this.waveRewardPending) {
      for (const [key, amt] of Object.entries(this.waveRewardPending)) {
        if (amt) {
          this.addResource(key as ResourceType, amt, this.hero.x, this.hero.y);
        }
      }
    }

    this.showVictoryModal = true;
    this.updateQuestProgress('wave', 1);
    this.currentWave++;
  }

  private handleHeroDeath() {
    this.hero.health = 0;
    this.hero.isDead = true;
    soundManager.playEnemyDeath();
    this.particles.addFloatingText('FALLEN IN BATTLE!', this.hero.x, this.hero.y - 20, '#EF4444', 20, undefined, true);

    // Revive after 3 seconds at Town Hall
    setTimeout(() => {
      this.hero.isDead = false;
      this.hero.health = this.hero.maxHealth;
      this.hero.x = this.world.width / 2;
      this.hero.y = this.world.height / 2 + 50;
      this.particles.emitMagicGlow(this.hero.x, this.hero.y, 20, '#22C55E');
      this.particles.addFloatingText('REVIVED!', this.hero.x, this.hero.y - 20, '#22C55E', 18, undefined, true);
    }, 3000);
  }

  // ==========================================
  // UPGRADES & QUESTS
  // ==========================================
  public purchaseUpgrade(upgradeId: string): boolean {
    const upgrade = this.upgrades.find((u) => u.id === upgradeId);
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return false;

    // Calculate dynamic cost
    const cost: Partial<Resources> = {};
    for (const [key, base] of Object.entries(upgrade.baseCost)) {
      if (base) {
        cost[key as ResourceType] = Math.round(base * Math.pow(upgrade.costMultiplier, upgrade.level - 1));
      }
    }

    if (!this.canAfford(cost)) return false;

    this.deductResources(cost);
    upgrade.level++;

    // Apply immediate stat upgrades
    if (upgrade.id === 'hero_damage') {
      this.hero.damage += 6;
    } else if (upgrade.id === 'hero_health') {
      this.hero.maxHealth += 35;
      this.hero.health += 35;
    } else if (upgrade.id === 'hero_speed') {
      this.hero.speed += 0.4;
    }

    soundManager.playWaveVictory();
    this.particles.addFloatingText('UPGRADE UNLOCKED!', this.hero.x, this.hero.y - 20, '#FACC15', 16, undefined, true);
    this.updateQuestProgress('upgrade', 1);

    return true;
  }

  public updateQuestProgress(
    targetType: Quest['targetType'],
    amount: number = 1,
    resourceType?: ResourceType,
    buildingType?: BuildingType
  ) {
    const quest = this.quests[this.activeQuestIndex];
    if (!quest || quest.isCompleted) return;

    if (quest.targetType === targetType) {
      if (resourceType && quest.resourceType && quest.resourceType !== resourceType) return;
      if (buildingType && quest.buildingType && quest.buildingType !== buildingType) return;

      quest.currentAmount += amount;
      if (quest.currentAmount >= quest.targetAmount) {
        quest.isCompleted = true;
        soundManager.playWaveVictory();
        this.particles.addFloatingText(`⭐ QUEST COMPLETED: ${quest.title}`, this.hero.x, this.hero.y - 30, '#FACC15', 18, undefined, true);

        // Give reward
        for (const [key, amt] of Object.entries(quest.reward)) {
          if (amt) {
            this.addResource(key as ResourceType, amt, this.hero.x, this.hero.y);
          }
        }

        // Advance to next quest
        if (this.activeQuestIndex < this.quests.length - 1) {
          this.activeQuestIndex++;
        }
      }
    }
  }

  // ==========================================
  // SAVE & LOAD (localStorage)
  // ==========================================
  public saveGame() {
    try {
      const state: SavedGameState = {
        version: 1,
        timestamp: Date.now(),
        resources: { ...this.resources },
        storageCapacity: { ...this.storageCapacity },
        population: { ...this.population },
        hero: {
          x: this.hero.x,
          y: this.hero.y,
          level: this.hero.level,
          health: this.hero.health,
          maxHealth: this.hero.maxHealth,
          damage: this.hero.damage,
          speed: this.hero.speed,
          upgrades: this.upgrades.reduce(
            (acc, u) => {
              acc[u.id] = u.level;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
        buildings: this.world.buildingPlots
          .filter((p) => p.building !== null)
          .map((p) => ({
            plotId: p.id,
            type: p.building!.type,
            level: p.building!.level,
          })),
        workers: this.workers.map((w) => ({ job: w.job })),
        chestsOpened: this.world.chests.filter((c) => c.isOpened).map((c) => c.id),
        currentWave: this.currentWave,
        activeQuestId: this.quests[this.activeQuestIndex]?.id || '',
        completedQuestIds: this.quests.filter((q) => q.isCompleted).map((q) => q.id),
      };

      localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save game state to localStorage:', e);
    }
  }

  public activeLanguage: string = 'en';

  public getStorageKey(): string {
    return `realm_of_defense_save_${this.activeLanguage}`;
  }

  public setLanguage(lang: string) {
    const nextLang = (lang || 'en').toLowerCase();
    this.targetLanguage = nextLang;
    if (this.activeLanguage === nextLang) {
      this.updateAttachedDuePhrases();
      this.notify();
      return;
    }
    // Save current language first!
    this.saveGame();
    this.activeLanguage = nextLang;
    // Load new language or reset to fresh kingdom
    const loaded = this.loadGame();
    if (!loaded) {
      this.resetPlotsAndWorkersForNewKingdom();
    }
    this.syncKingdomProgressionWithLearning();
    this.recalculateKingdomStats();
    this.updateAttachedDuePhrases();
    this.notify();
  }

  public resetPlotsAndWorkersForNewKingdom() {
    this.resources = {
      wood: 80,
      stone: 50,
      food: 40,
      coins: 60,
      gems: 5,
    };
    for (const plot of this.world.buildingPlots) {
      plot.building = null;
    }
    this.initTownHall();
    this.workers = [];
    this.warriors = [];
    this.enemies = [];
    this.projectiles = [];
    this.currentWave = 1;
    this.hero.level = 1;
    this.hero.health = this.hero.maxHealth;
    this.upgrades = JSON.parse(JSON.stringify(UPGRADE_ITEMS));
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));
    this.activeQuestIndex = 0;
  }

  public loadGame(): boolean {
    try {
      let data = localStorage.getItem(this.getStorageKey());
      if (!data && this.activeLanguage === 'en') {
        data = localStorage.getItem('realm_of_defense_save');
      }
      if (!data) return false;

      const state: SavedGameState = JSON.parse(data);
      this.resources = { ...state.resources };
      this.currentWave = state.currentWave || 1;

      // Restore Hero
      if (state.hero) {
        this.hero.level = state.hero.level || 1;
        this.hero.damage = state.hero.damage || 22;
        this.hero.speed = state.hero.speed || 3.2;
        this.hero.maxHealth = state.hero.maxHealth || 120;
        this.hero.health = this.hero.maxHealth;

        if (state.hero.upgrades) {
          for (const [id, lvl] of Object.entries(state.hero.upgrades)) {
            const u = this.upgrades.find((up) => up.id === id);
            if (u) u.level = lvl;
          }
        }
      }

      // Reset plots first
      for (const plot of this.world.buildingPlots) {
        plot.building = null;
      }
      this.initTownHall();

      // Restore Buildings
      if (state.buildings) {
        for (const bData of state.buildings) {
          const plot = this.world.buildingPlots.find((p) => p.id === bData.plotId);
          if (plot && BUILDING_BLUEPRINTS[bData.type]) {
            const bp = BUILDING_BLUEPRINTS[bData.type];
            plot.building = {
              id: `b_${bData.type}_${Date.now()}`,
              plotId: plot.id,
              type: bData.type,
              level: bData.level,
              health: bp.baseHealth * bData.level,
              maxHealth: bp.baseHealth * bData.level,
              x: plot.x,
              y: plot.y,
              width: plot.width,
              height: plot.height,
              isConstructing: false,
              constructionProgress: 1,
              constructionTimeTotal: bp.constructionTime,
              productionTimer: 0,
              lastAttackTime: 0,
              targetEnemyId: null,
              targetAngle: 0,
            };
          }
        }
      }

      // Restore Chests
      if (state.chestsOpened) {
        for (const chestId of state.chestsOpened) {
          const chest = this.world.chests.find((c) => c.id === chestId);
          if (chest) chest.isOpened = true;
        }
      }

      // Restore Quests
      if (state.completedQuestIds) {
        for (const qId of state.completedQuestIds) {
          const q = this.quests.find((quest) => quest.id === qId);
          if (q) q.isCompleted = true;
        }
      }
      if (state.activeQuestId) {
        const idx = this.quests.findIndex((q) => q.id === state.activeQuestId);
        if (idx !== -1) this.activeQuestIndex = idx;
      }

      // Restore Workers
      if (state.workers && state.workers.length > 0) {
        this.workers = [];
        for (const wData of state.workers) {
          this.recruitWorker(wData.job);
        }
      } else {
        this.workers = [];
      }

      this.recalculateKingdomStats();
      return true;
    } catch (e) {
      console.warn('Failed to load game state:', e);
      return false;
    }
  }

  public resetGame() {
    try {
      localStorage.removeItem(this.getStorageKey());
      localStorage.removeItem('realm_of_defense_save');
      globalSpacedRepetition.resetAllProgress();
    } catch (e) {
      console.warn('Failed to reset game:', e);
    }
    window.location.reload();
  }
}
