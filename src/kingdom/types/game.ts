export type ResourceType = 'wood' | 'stone' | 'food' | 'coins' | 'gems';

export interface Resources {
  wood: number;
  stone: number;
  food: number;
  coins: number;
  gems: number;
}

export type GameMode = 'exploration' | 'defense';
export type TargetPriority = 'nearest' | 'strongest' | 'weakest' | 'first' | 'manual';

export interface ResourceTypeAmount {
  type: ResourceType;
  amount: number;
}

export type BuildingType =
  | 'town_hall'
  | 'house'
  | 'warehouse'
  | 'lumber_camp'
  | 'mine'
  | 'farm'
  | 'market'
  | 'archer_tower'
  | 'cannon_tower'
  | 'magic_tower'
  | 'wall';

export interface BuildingBlueprint {
  type: BuildingType;
  name: string;
  category: 'village' | 'production' | 'defense';
  description: string;
  cost: Partial<Resources>;
  constructionTime: number; // in seconds
  icon: string;
  maxLevel: number;
  baseHealth: number;
  // Stats
  populationBonus?: number;
  storageBonus?: number;
  productionRate?: { resource: ResourceType; amount: number; intervalSec: number };
  defenseStats?: {
    damage: number;
    range: number;
    attackSpeed: number; // attacks per sec
    projectileType: 'arrow' | 'cannonball' | 'magic';
    splashRadius?: number;
    slowEffect?: number; // 0 to 1
  };
}

export interface AttachedDuePhrase {
  id: string;
  native: string;
  translation: string;
}

export interface BuildingInstance {
  id: string;
  plotId: string;
  type: BuildingType;
  level: number;
  health: number;
  maxHealth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isConstructing: boolean;
  constructionProgress: number; // 0 to 1
  constructionTimeTotal: number;
  productionTimer: number;
  lastAttackTime: number;
  targetEnemyId: string | null;
  targetAngle: number;
  duePhrase?: AttachedDuePhrase;
}

export interface BuildingPlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  building: BuildingInstance | null;
  allowedCategories?: Array<'village' | 'production' | 'defense'>;
  name?: string;
  unlockStage?: number; // 0 for lone tower, 1 for hut, 2 for farm, 3 for mine/lumber, 4 for market/towers, 5 for citadel
  autoUnlockBuilding?: BuildingType; // Automatically constructed upon reaching stage
}

export type WorkerJob = 'lumberjack' | 'miner' | 'farmer' | 'builder';

export interface WarriorInstance {
  id: string;
  name: string;
  slotIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'up' | 'down' | 'left' | 'right';
  speed: number;
  health: number;
  maxHealth: number;
  damage: number;
  attackRange: number;
  visionRange: number; // Detection/Vision range (e.g., 280 - 360px)
  maxPatrolRadius: number; // Max operational engagement radius from Castle Gate (e.g., 420px)
  attackCooldown: number;
  attackTimer: number;
  isAttacking: boolean;
  attackAnimProgress: number; // 0 to 1
  state: 'inside_castle' | 'deploying' | 'guarding_gate' | 'charging' | 'attacking' | 'returning';
  targetEnemyId: string | null;
  exitDelay: number;
  battleCry?: string;
  animFrame: number;
  animTimer: number;
  hurtTimer: number;
  level: number;
  color: string;
  shieldCrest: string;
  duePhrase?: AttachedDuePhrase;
}

export interface WorkerInstance {
  id: string;
  name: string;
  job: WorkerJob;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  direction: 'up' | 'down' | 'left' | 'right';
  state: 'idle' | 'walking_to_node' | 'working' | 'returning_to_warehouse' | 'depositing';
  targetNodeId: string | null;
  carriedResource: {
    type: ResourceType;
    amount: number;
    maxCapacity: number;
  };
  workTimer: number;
  animFrame: number;
  animTimer: number;
  duePhrase?: AttachedDuePhrase;
}

export interface VillagerInstance {
  id: string;
  name: string;
  role: 'peasant' | 'farmer' | 'merchant' | 'child' | 'scholar';
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  direction: 'up' | 'down' | 'left' | 'right';
  animFrame: number;
  animTimer: number;
  idleTimer: number;
  color: string;
  speechText?: string;
  speechTimer?: number;
  duePhrase?: AttachedDuePhrase;
}

export type EnemyType = 'goblin' | 'orc' | 'fast_goblin' | 'heavy_orc' | 'boss_gargoyle';

export interface EnemyInstance {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  speed: number;
  baseSpeed: number;
  damage: number;
  attackSpeed: number; // attacks per sec
  attackRange: number;
  attackCooldown: number;
  direction: 'up' | 'down' | 'left' | 'right';
  state: 'moving' | 'attacking' | 'hurt' | 'dead';
  targetType: 'building' | 'player';
  targetId: string | null;
  animFrame: number;
  animTimer: number;
  slowTimer: number;
  hurtTimer: number;
  loot: Partial<Resources>;
}

export interface ProjectileInstance {
  id: string;
  type: 'arrow' | 'cannonball' | 'magic';
  source?: 'hero' | 'tower';
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetEnemyId: string | null;
  speed: number;
  progress: number; // 0 to 1
  damage: number;
  isCrit?: boolean;
  splashRadius?: number;
  slowEffect?: number;
  arcHeight?: number;
}

export type ResourceNodeType = 'tree_oak' | 'tree_pine' | 'rock_stone' | 'rock_gold' | 'bush_berry';

export interface ResourceNodeInstance {
  id: string;
  type: ResourceNodeType;
  resourceType: ResourceType;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  yieldAmount: number;
  isDepleted: boolean;
  respawnTime: number; // sec
  respawnTimer: number;
  shakeTimer: number;
}

export interface ChestInstance {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOpened: boolean;
  rewards: Partial<Resources>;
  name: string;
}

export interface HeroState {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: 'up' | 'down' | 'left' | 'right';
  speed: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  // Melee & Exploration
  damage: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  isAttacking: boolean;
  attackAnimProgress: number; // 0 to 1
  isGathering: boolean;
  gatherType: 'chop' | 'mine' | 'harvest' | null;
  gatherTimer: number;
  gatherTargetId: string | null;
  isDashing: boolean;
  dashTimer: number;
  dashCooldown: number;
  dashCooldownTimer: number;
  // Stationary Ranged Defense Attributes
  rangedDamage: number;
  rangedAttackRange: number;
  rangedAttackSpeed: number; // attacks per sec
  projectileSpeed: number;
  targetPriority: TargetPriority;
  manualTargetEnemyId: string | null;
  currentTargetEnemyId: string | null;
  aimAngle: number;
  bowDrawProgress: number; // 0 to 1
  abilityCooldown: number;
  abilityMaxCooldown: number;
  isTargetingAbility: boolean;
  abilityRadius: number;
  // Status
  isHurt: boolean;
  hurtTimer: number;
  isDead: boolean;
  animFrame: number;
  animTimer: number;
  level: number;
  exp: number;
  expToNextLevel: number;
  duePhrase?: AttachedDuePhrase;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  targetType: 'gather' | 'build' | 'recruit' | 'wave' | 'upgrade' | 'explore';
  currentAmount: number;
  targetAmount: number;
  resourceType?: ResourceType;
  buildingType?: BuildingType;
  isCompleted: boolean;
  reward: Partial<Resources>;
}

export interface WaveConfig {
  waveNumber: number;
  enemies: Array<{
    type: EnemyType;
    count: number;
    delaySec: number;
  }>;
  reward: Partial<Resources>;
}

export interface UpgradeItem {
  id: string;
  category: 'hero' | 'economy' | 'defense';
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  baseCost: Partial<Resources>;
  costMultiplier: number;
  statBonusText: (level: number) => string;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  showHealthBars: boolean;
  showFloatingText: boolean;
}

export interface SavedGameState {
  version: number;
  timestamp: number;
  resources: Resources;
  storageCapacity: {
    wood: number;
    stone: number;
    food: number;
  };
  population: {
    current: number;
    max: number;
  };
  hero: {
    x: number;
    y: number;
    level: number;
    health: number;
    maxHealth: number;
    damage: number;
    speed: number;
    upgrades: Record<string, number>;
  };
  buildings: Array<{
    plotId: string;
    type: BuildingType;
    level: number;
  }>;
  workers: Array<{
    job: WorkerJob;
  }>;
  chestsOpened: string[];
  currentWave: number;
  activeQuestId: string;
  completedQuestIds: string[];
}
