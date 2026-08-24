export type BuildingType =
  | 'town_hall'
  | 'gold_mine'
  | 'elixir_collector'
  | 'gold_storage'
  | 'elixir_storage'
  | 'barracks'
  | 'army_camp'
  | 'cannon'
  | 'archer_tower'
  | 'wizard_tower'
  | 'wall';

export type TroopType = 'barbarian' | 'archer' | 'giant' | 'wizard' | 'dragon';

export type ResourceType = 'gold' | 'elixir' | 'gems';

export type GameView = 'village' | 'attack' | 'shop' | 'troops' | 'settings';

export interface Position {
  row: number;
  col: number;
}

export interface BuildingDef {
  type: BuildingType;
  name: string;
  nameAr: string;
  description: string;
  size: number; // grid cells (1x1, 2x2, 3x3)
  hitpoints: number;
  cost: number;
  costType: ResourceType;
  buildTime: number; // seconds
  icon: string; // emoji
  color: string;
  productionRate?: number; // per minute
  productionType?: ResourceType;
  attackDamage?: number;
  attackRange?: number;
  maxLevel: number;
  upgradeCostMultiplier: number;
  maxStorage?: number;
}

export interface TroopDef {
  type: TroopType;
  name: string;
  nameAr: string;
  hitpoints: number;
  damage: number;
  speed: number;
  range: number;
  cost: number;
  costType: ResourceType;
  trainingTime: number; // seconds
  housingSpace: number;
  icon: string;
  color: string;
}

export interface Building {
  id: string;
  type: BuildingType;
  position: Position;
  level: number;
  hitpoints: number;
  maxHitpoints: number;
  isBuilding: boolean;
  buildStartTime?: number;
  buildEndTime?: number;
  isProducing: boolean;
  storedAmount: number;
  maxStorage: number;
  lastCollectTime: number;
  waterLevel?: number; // 0-100 (For mines/collectors)
  decayLevel?: number; // 0-100 (For general structures)
}

export interface Troop {
  type: TroopType;
  count: number;
}

export interface AttackTroop {
  id: string;
  type: TroopType;
  position: { x: number; y: number };
  targetId?: string;
  hitpoints: number;
  maxHitpoints: number;
  damage: number;
  speed: number;
  range: number;
  isAttacking: boolean;
  isDead: boolean;
}

export interface EnemyBuilding extends Building {
  currentHitpoints: number;
}

export interface AttackState {
  isActive: boolean;
  troops: AttackTroop[];
  enemyBuildings: EnemyBuilding[];
  stars: number;
  destroyedBuildings: number;
  totalBuildings: number;
  timeRemaining: number;
  goldLooted: number;
  elixirLooted: number;
}

export interface GameState {
  // Resources
  gold: number;
  elixir: number;
  gems: number;
  
  // Player info
  playerName: string;
  playerLevel: number;
  experience: number;
  trophies: number;
  
  // Village
  buildings: Building[];
  troops: Record<TroopType, number>;
  maxTroopCapacity: number;
  
  // View
  currentView: GameView;
  
  // Attack
  attack: AttackState;
  
  // Selected building for placement or info
  selectedBuildingType: BuildingType | null;
  selectedBuildingId: string | null;

  // --- Easy7Language Gamification States ---
  isIntroActive: boolean;
  streak: number;
  shieldExpiresAt: number; // timestamp
  hasTodayStudied: boolean;
  alerts: { id: string; sender: string; senderAr: string; message: string; date: string; read: boolean; type: 'info' | 'drought' | 'danger' | 'victory' }[];
  activeDialog: { character: 'wife' | 'khalid' | 'dirgham'; message: string; title: string } | null;
  completedLessons: string[]; // lesson IDs completed
  
  // Actions
  placeBuilding: (type: BuildingType, position: Position) => boolean;
  removeBuilding: (id: string) => void;
  upgradeBuilding: (id: string) => boolean;
  collectResources: (id: string) => void;
  
  // Troop actions
  trainTroop: (type: TroopType) => boolean;
  
  // View
  setView: (view: GameView) => void;
  setSelectedBuildingType: (type: BuildingType | null) => void;
  setSelectedBuildingId: (id: string | null) => void;
  
  // Resource tick
  updateResources: () => void;
  
  // Attack
  startAttack: () => void;
  deployTroop: (type: TroopType, x: number, y: number) => void;
  endAttack: () => void;
  
  // Init
  initGame: () => void;

  // --- Easy7Language Actions ---
  completeLesson: (lessonId: string, goldEarned: number, elixirEarned: number, gemsEarned: number) => void;
  waterOrRepairBuilding: (buildingId: string) => void;
  closeIntro: () => void;
  setAlertRead: (id: string) => void;
  dismissDialog: () => void;
  triggerStoryDialog: (character: 'wife' | 'khalid' | 'dirgham', title: string, message: string) => void;
  addAlert: (sender: string, senderAr: string, message: string, type: 'info' | 'drought' | 'danger' | 'victory') => void;
}