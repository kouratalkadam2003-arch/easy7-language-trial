import { create } from 'zustand';
import { GameState, Building, Position, BuildingType, TroopType, AttackTroop, EnemyBuilding, GameView } from './types';
import { BUILDING_DEFS, TROOP_DEFS, INITIAL_GOLD, INITIAL_ELIXIR, INITIAL_GEMS, MAX_TROOP_CAPACITY, ATTACK_DURATION, GRID_ROWS, GRID_COLS, getBuildingCost, getBuildingMaxHP, getBuildingMaxStorage, getProductionRate } from './constants';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function createBuilding(type: BuildingType, position: Position, level: number = 1): Building {
  const def = BUILDING_DEFS[type];
  if (!def) throw new Error(`Unknown building type: ${type}`);
  const maxHP = getBuildingMaxHP(type, level);
  return {
    id: generateId(),
    type,
    position,
    level,
    hitpoints: maxHP,
    maxHitpoints: maxHP,
    isBuilding: def.buildTime > 0 && type !== 'town_hall',
    buildStartTime: def.buildTime > 0 && type !== 'town_hall' ? Date.now() : undefined,
    buildEndTime: def.buildTime > 0 && type !== 'town_hall' ? Date.now() + def.buildTime * 1000 : undefined,
    isProducing: !!def.productionRate,
    storedAmount: 0,
    maxStorage: getBuildingMaxStorage(type, level),
    lastCollectTime: Date.now(),
    waterLevel: 100,
    decayLevel: 0,
  };
}

function generateEnemyVillage(): EnemyBuilding[] {
  const buildings: EnemyBuilding[] = [];
  const center = { row: 10, col: 10 };
  
  buildings.push({
    ...createBuilding('town_hall', center),
    currentHitpoints: getBuildingMaxHP('town_hall', 5),
  });

  const defenses: [BuildingType, number, number][] = [
    ['cannon', 8, 8], ['cannon', 8, 12], ['cannon', 12, 8], ['cannon', 12, 12],
    ['archer_tower', 7, 10], ['archer_tower', 13, 10], ['archer_tower', 10, 7], ['archer_tower', 10, 13],
    ['wizard_tower', 9, 9], ['wizard_tower', 11, 11],
  ];

  for (const [type, r, c] of defenses) {
    const b = createBuilding(type, { row: r, col: c }, 4);
    buildings.push({ ...b, currentHitpoints: b.maxHitpoints });
  }

  const resources: [BuildingType, number, number][] = [
    ['gold_mine', 6, 6], ['gold_mine', 6, 14], ['gold_mine', 14, 6], ['gold_mine', 14, 14],
    ['elixir_collector', 6, 8], ['elixir_collector', 6, 12], ['elixir_collector', 14, 8], ['elixir_collector', 14, 12],
    ['gold_storage', 8, 6], ['gold_storage', 12, 14],
    ['elixir_storage', 8, 14], ['elixir_storage', 12, 6],
  ];

  for (const [type, r, c] of resources) {
    const b = createBuilding(type, { row: r, col: c }, 4);
    buildings.push({ ...b, currentHitpoints: b.maxHitpoints });
  }

  const walls: [number, number][] = [
    [5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],[5,15],
    [6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],
    [15,6],[15,7],[15,8],[15,9],[15,10],[15,11],[15,12],[15,13],[15,14],[15,15],
    [6,15],[7,15],[8,15],[9,15],[10,15],[11,15],[12,15],[13,15],[14,15],
  ];

  for (const [r, c] of walls) {
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      const b = createBuilding('wall', { row: r, col: c }, 4);
      buildings.push({ ...b, currentHitpoints: b.maxHitpoints });
    }
  }

  return buildings;
}

function getInitialBuildings(): Building[] {
  const buildings: Building[] = [];
  const center = { row: 10, col: 10 };
  buildings.push(createBuilding('elihut', center));
  buildings.push(createBuilding('chicken_coop', { row: 8, col: 9 }));
  buildings.push(createBuilding('farm_plot', { row: 12, col: 11 }));
  return buildings;
}

export const useGameStore = create<GameState>((set, get) => ({
  gold: INITIAL_GOLD,
  elixir: INITIAL_ELIXIR,
  gems: INITIAL_GEMS,
  playerName: 'المحارب',
  playerLevel: 1,
  experience: 0,
  trophies: 0,
  buildings: [],
  troops: { barbarian: 0, archer: 0, giant: 0, wizard: 0, dragon: 0 },
  maxTroopCapacity: MAX_TROOP_CAPACITY,
  currentView: 'village' as GameView,
  attack: {
    isActive: false,
    troops: [],
    enemyBuildings: [],
    stars: 0,
    destroyedBuildings: 0,
    totalBuildings: 0,
    timeRemaining: ATTACK_DURATION,
    goldLooted: 0,
    elixirLooted: 0,
  },
  selectedBuildingType: null,
  selectedBuildingId: null,

  // --- Easy7Language Gamification States ---
  isIntroActive: false,
  streak: 3,
  shieldExpiresAt: Date.now() + 18 * 60 * 60 * 1000, // 18 hours remaining
  hasTodayStudied: false,
  alerts: [
    {
      id: 'alert_initial',
      sender: 'Qarmaz',
      senderAr: 'ضرغام (الخائن)',
      message: 'قريتك في متناول يدي! إذا توقفت عن التعلم والمراجعة، فسأهدم قلاعك بالكامل وأستولي على العرش للأبد!',
      date: 'اليوم',
      read: false,
      type: 'danger'
    },
    {
      id: 'alert_welcome',
      sender: 'Sarah',
      senderAr: 'إيلي (رفيقتك ومعلمتك)',
      message: 'ليث... أنت بأمان الآن. لنبدأ من الصفر، الكلمات هي سلاحك الجديد. سنتعلم الإنجليزية معاً ونبني حياتنا.',
      date: 'اليوم',
      read: false,
      type: 'info'
    }
  ],
  activeDialog: null,
  completedLessons: [],
  
  isAutoBuild: true,
  toggleAutoBuild: () => set((state) => ({ isAutoBuild: !state.isAutoBuild })),

  initGame: () => {
    const buildings = getInitialBuildings();
    set({ buildings });
  },

  setView: (view: GameView) => {
    set({ currentView: view, selectedBuildingType: null, selectedBuildingId: null });
    if (view === 'attack') {
      const enemyBuildings = generateEnemyVillage();
      set((state) => ({
        attack: {
          ...state.attack,
          isActive: true,
          enemyBuildings,
          totalBuildings: enemyBuildings.length,
          destroyedBuildings: 0,
          stars: 0,
          troops: [],
          timeRemaining: ATTACK_DURATION,
          goldLooted: 0,
          elixirLooted: 0,
        },
      }));
    }
  },

  setSelectedBuildingType: (type: BuildingType | null) => {
    set({ selectedBuildingType: type, selectedBuildingId: null });
  },

  setSelectedBuildingId: (id: string | null) => {
    set({ selectedBuildingId: id, selectedBuildingType: null });
  },

  placeBuilding: (type: BuildingType, position: Position): boolean => {
    const state = get();
    const def = BUILDING_DEFS[type];
    if (!def) return false;

    const resource = def.costType === 'gold' ? state.gold : state.elixir;
    if (resource < def.cost) return false;

    const size = def.size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const checkRow = position.row + r;
        const checkCol = position.col + c;
        if (checkRow < 0 || checkRow >= GRID_ROWS || checkCol < 0 || checkCol >= GRID_COLS) return false;
        const occupied = state.buildings.some((b) => {
          const bSize = BUILDING_DEFS[b.type].size;
          return (
            checkRow >= b.position.row &&
            checkRow < b.position.row + bSize &&
            checkCol >= b.position.col &&
            checkCol < b.position.col + bSize
          );
        });
        if (occupied) return false;
      }
    }

    const newBuilding = createBuilding(type, position);
    const costReduction = def.costType === 'gold' ? { gold: state.gold - def.cost } : { elixir: state.elixir - def.cost };
    set((s) => ({
      buildings: [...s.buildings, newBuilding],
      ...costReduction,
      selectedBuildingType: null,
    }));
    return true;
  },

  removeBuilding: (id: string) => {
    set((state) => ({
      buildings: state.buildings.filter((b) => b.id !== id),
      selectedBuildingId: null,
    }));
  },

  upgradeBuilding: (id: string): boolean => {
    const state = get();
    const building = state.buildings.find((b) => b.id === id);
    if (!building) return false;
    if (building.isBuilding) return false;

    const def = BUILDING_DEFS[building.type];
    if (!def) return false;
    if (building.level >= def.maxLevel) return false;

    const cost = getBuildingCost(building.type, building.level + 1);
    const resource = def.costType === 'gold' ? state.gold : state.elixir;
    if (resource < cost) return false;

    const newLevel = building.level + 1;
    const newMaxHP = getBuildingMaxHP(building.type, newLevel);
    const newMaxStorage = getBuildingMaxStorage(building.type, newLevel);
    const costReduction = def.costType === 'gold' ? { gold: state.gold - cost } : { elixir: state.elixir - cost };

    set((s) => ({
      buildings: s.buildings.map((b) =>
        b.id === id
          ? {
              ...b,
              level: newLevel,
              maxHitpoints: newMaxHP,
              hitpoints: newMaxHP,
              maxStorage: newMaxStorage,
              isBuilding: true,
              buildStartTime: Date.now(),
              buildEndTime: Date.now() + def.buildTime * 1000 * (1 + newLevel * 0.5),
            }
          : b
      ),
      ...costReduction,
    }));
    return true;
  },

  collectResources: (id: string) => {
    set((state) => {
      const building = state.buildings.find((b) => b.id === id);
      if (!building || !BUILDING_DEFS[building.type].productionRate) return state;

      const amount = building.storedAmount;
      if (amount <= 0) return state;

      const prodType = BUILDING_DEFS[building.type].productionType!;
      const resourceUpdate = prodType === 'gold' ? { gold: state.gold + Math.floor(amount) } : { elixir: state.elixir + Math.floor(amount) };

      return {
        buildings: state.buildings.map((b) =>
          b.id === id ? { ...b, storedAmount: 0, lastCollectTime: Date.now() } : b
        ),
        ...resourceUpdate,
      };
    });
  },

  trainTroop: (type: TroopType): boolean => {
    const state = get();
    const def = TROOP_DEFS[type];
    if (!def) return false;

    const totalTroops = Object.values(state.troops).reduce((a, b) => a + b, 0);
    if (totalTroops + def.housingSpace > state.maxTroopCapacity) return false;
    if (def.costType === 'elixir' && state.elixir < def.cost) return false;
    if (def.costType === 'gold' && state.gold < def.cost) return false;

    const costReduction = def.costType === 'elixir' ? { elixir: state.elixir - def.cost } : { gold: state.gold - def.cost };

    set((s) => ({
      troops: { ...s.troops, [type]: s.troops[type] + 1 },
      ...costReduction,
    }));
    return true;
  },

  updateResources: () => {
    set((state) => {
      const now = Date.now();
      let goldDelta = 0;
      let elixirDelta = 0;
      let newAlerts = [...state.alerts];

      // Detect if shield just expired
      const wasShieldActive = state.shieldExpiresAt > now;
      
      const updatedBuildings = state.buildings.map((b) => {
        if (b.isBuilding && b.buildEndTime) {
          if (now >= b.buildEndTime) {
            return { ...b, isBuilding: false, buildStartTime: undefined, buildEndTime: undefined };
          }
          return b;
        }

        const def = BUILDING_DEFS[b.type];
        let bWater = b.waterLevel ?? 100;
        let bDecay = b.decayLevel ?? 0;
        let currentHP = b.hitpoints;

        // 1. Water level decay for resource collectors
        if (b.type === 'gold_mine' || b.type === 'elixir_collector') {
          const oldWater = bWater;
          bWater = Math.max(0, bWater - 1.2); // Decays ~1.2% every 5s (~7 minutes to go from 100 to 0)
          
          if (oldWater >= 40 && bWater < 40) {
            newAlerts.unshift({
              id: `alert_drought_${b.id}_${now}`,
              sender: 'Sarah',
              senderAr: 'إيلي (رفيقتك ومعلمتك)',
              message: `⚠️ انتبه! منسوب المياه في ${def.nameAr} انخفض عن 40%! تراجع الإنتاج وسيجف تماماً قريباً. راجع كلماتك لريّه!`,
              date: 'الآن',
              read: false,
              type: 'drought'
            });
          }
        }

        // 2. Structural decay if shield is expired
        const isShieldExpired = now > state.shieldExpiresAt;
        if (isShieldExpired && b.type !== 'gold_mine' && b.type !== 'elixir_collector' && b.type !== 'wall') {
          const oldDecay = bDecay;
          bDecay = Math.min(100, bDecay + 0.8); // Crack growth
          
          if (oldDecay < 80 && bDecay >= 80) {
            newAlerts.unshift({
              id: `alert_decay_${b.id}_${now}`,
              sender: 'Qarmaz',
              senderAr: 'ضرغام (الخائن)',
              message: `🏚️ ههههه! لقد بدأت أسوار ومباني ${def.nameAr} بالتصدع لغياب درعك الذهبي. سأهدمها قريباً!`,
              date: 'الآن',
              read: false,
              type: 'danger'
            });
          }

          if (bDecay >= 80) {
            currentHP = Math.max(10, Math.floor(currentHP - b.maxHitpoints * 0.015)); // Wear and tear damage
          }
        }

        // 3. Collect/Produce rate influenced by water factor
        if (!def.productionRate || !def.productionType) {
          return { ...b, waterLevel: bWater, decayLevel: bDecay, hitpoints: currentHP };
        }

        const elapsed = (now - b.lastCollectTime) / 60000;
        // Water level directly scales production rate
        const waterFactor = bWater / 100;
        const rate = getProductionRate(b.type, b.level) * waterFactor;
        const produced = Math.min(rate * elapsed, b.maxStorage - b.storedAmount);

        let newStored = b.storedAmount;
        if (produced > 0) {
          newStored += produced;
          if (def.productionType === 'gold') goldDelta += produced;
          else elixirDelta += produced;
        }

        return {
          ...b,
          storedAmount: newStored,
          waterLevel: bWater,
          decayLevel: bDecay,
          hitpoints: currentHP
        };
      });

      let activeDialog = state.activeDialog;
      
      // Randomly trigger arcade games if no active dialog exists
      if (!activeDialog && Math.random() < 0.05) { // 5% chance every 5s tick
         if (now > state.shieldExpiresAt && Math.random() < 0.5) {
             activeDialog = {
                 character: 'eli',
                 title: 'الوحوش تهاجم! 🧟',
                 message: 'ليث! الوحوش تقترب من القرية بسبب اختفاء الدرع الذهبي! يجب أن نطردهم فوراً ونحمي المزرعة!',
                 action: 'zombie'
             };
         } else if (state.elixir < 200) {
             activeDialog = {
                 character: 'tom',
                 title: 'ينقصنا الحطب والموارد 🪓',
                 message: 'مرحباً ليث! المخازن شبه فارغة، نحتاج لجمع الحطب لبناء المزيد. هل تذهب للاحتطاب عبر رمي السكاكين؟',
                 action: 'knifehit'
             };
         } else if (Math.random() < 0.3) {
             activeDialog = {
                 character: 'eli',
                 title: 'الحروف المفقودة 🔠',
                 message: 'عاصفة البارحة طيّرت بعض الحروف من كتاب التعليم الخاص بي.. هل يمكنك مساعدتي في استعادتها؟',
                 action: 'lostlanguage'
             };
         }
      }

      return {
        buildings: updatedBuildings,
        gold: state.gold + goldDelta,
        elixir: state.elixir + elixirDelta,
        alerts: newAlerts.slice(0, 20), // Keep latest 20 alerts
        activeDialog: activeDialog,
      };
    });
  },

  startAttack: () => {
    get().setView('attack');
  },

  deployTroop: (type: TroopType, x: number, y: number) => {
    const state = get();
    if (state.troops[type] <= 0) return;
    const def = TROOP_DEFS[type];

    const newTroop: AttackTroop = {
      id: generateId(),
      type,
      position: { x, y },
      hitpoints: def.hitpoints,
      maxHitpoints: def.hitpoints,
      damage: def.damage,
      speed: def.speed,
      range: def.range,
      isAttacking: false,
      isDead: false,
    };

    set((s) => ({
      troops: { ...s.troops, [type]: s.troops[type] - 1 },
      attack: {
        ...s.attack,
        troops: [...s.attack.troops, newTroop],
      },
    }));
  },

  endAttack: () => {
    set((state) => ({
      currentView: 'village' as GameView,
      gold: state.gold + state.attack.goldLooted,
      elixir: state.elixir + state.attack.elixirLooted,
      trophies: state.trophies + state.attack.stars,
      attack: {
        isActive: false,
        troops: [],
        enemyBuildings: [],
        stars: 0,
        destroyedBuildings: 0,
        totalBuildings: 0,
        timeRemaining: ATTACK_DURATION,
        goldLooted: 0,
        elixirLooted: 0,
      },
      selectedBuildingType: null,
      selectedBuildingId: null,
    }));
  },

  // --- Easy7Language Actions Implementation ---
  completeLesson: (lessonId: string, goldEarned: number, elixirEarned: number, gemsEarned: number) => {
    const state = get();
    const alreadyCompleted = state.completedLessons.includes(lessonId);
    const newCompleted = alreadyCompleted ? state.completedLessons : [...state.completedLessons, lessonId];
    
    // Grant resources and activate 24h shield
    const now = Date.now();
    const shieldExpiry = now + 24 * 60 * 60 * 1000;
    
    // Train soldiers automatically as reward
    const recruitedInfantry = 5;
    const recruitedArchers = 2;
    
    set((s) => ({
      gold: s.gold + goldEarned,
      elixir: s.elixir + elixirEarned,
      gems: s.gems + gemsEarned,
      shieldExpiresAt: shieldExpiry,
      hasTodayStudied: true,
      experience: s.experience + 100,
      playerLevel: Math.floor((s.experience + 100) / 500) + 1,
      streak: s.streak + 1,
      completedLessons: newCompleted,
      troops: {
        ...s.troops,
        barbarian: s.troops.barbarian + recruitedInfantry,
        archer: s.troops.archer + recruitedArchers
      },
      activeDialog: {
        character: 'eli',
        title: '🎉 عمل رائع يا ليث!',
        message: `لقد أتممت الدرس بنجاح! كسبت ${goldEarned} 🪙 و ${elixirEarned} 🧪 و ${gemsEarned} ������. وبفضل علمك، تدرّب ${recruitedInfantry} مشاة و ${recruitedArchers} رماة سهام للانضمام لجيشك، وتم تفعيل الدرع الذهبي الحامي للقرية لمدة 24 ساعة!`
      }
    }));

    if (get().isAutoBuild) {
        let placed = false;
        // Try to build a new wall if we have enough gold
        const currentGold = get().gold;
        const wallCost = BUILDING_DEFS['wall'].cost;
        if (currentGold >= wallCost) {
            // Find an empty spot for a wall
             for (let r = 5; r < 15; r++) {
                for (let c = 5; c < 15; c++) {
                    const isOccupied = get().buildings.some(b => b.position.row === r && b.position.col === c);
                    if (!isOccupied) {
                        get().placeBuilding('wall', {row: r, col: c});
                        placed = true;
                        get().addAlert(
                            'Sarah',
                            'إيلي (رفيقتك ومعلمتك)',
                            `لقد قمت ببناء جدار جديد تلقائيا لحماية القرية! 🧱`,
                            'victory'
                        );
                        break;
                    }
                }
                if (placed) break;
            }
        }
    }

    get().addAlert(
      'Sarah',
      'إيلي (رفيقتك ومعلمتك)',
      `🎉 نصر تعليمي! لقد أتممت درساً بنجاح وتم تحصين القرية بالكامل وحشد الجنود!`,
      'victory'
    );
  },

  waterOrRepairBuilding: (buildingId: string) => {
    set((state) => {
      const b = state.buildings.find((x) => x.id === buildingId);
      if (!b) return state;

      const def = BUILDING_DEFS[b.type];
      
      // Fully water or repair cracks, and restore full hitpoints
      const updated = state.buildings.map((x) => {
        if (x.id === buildingId) {
          return {
            ...x,
            waterLevel: 100,
            decayLevel: 0,
            hitpoints: x.maxHitpoints
          };
        }
        return x;
      });

      return {
        buildings: updated,
        activeDialog: {
          character: 'tom',
          title: `🛠️ تمّت أعمال الصيانة بنجاح!`,
          message: `بفضل مراجعتك الممتازة للكلمات، هرع البنّاؤون والعمال لريّ وإصلاح ${def.nameAr} بالكامل! تم استعادة كفاءة الإنتاج 100% وإصلاح الأضرار الهيكلية.`
        }
      };
    });

    get().addAlert(
      'Khalid',
      'خالد القائد',
      `🛠️ تم ري وإصلاح أحد المباني الهامة في القرية بالكامل بفضل نجاح مراجعتك للكلمات!`,
      'victory'
    );
  },

  closeIntro: () => {
    set({ isIntroActive: false });
    get().triggerStoryDialog(
      'eli',
      'بداية بناء قريتنا 🌱',
      'هيا يا ليث! الجفاف يهدد مزروعاتنا وعملنا. استخدم الكلمات التي تعلمناها معاً لريّ الأرض وإصلاح ما تلف! اضغط على بوابة التعليم أو على أي مبنى جاف لتنشيطه وتطوير القرية.'
    );
  },

  setAlertRead: (id: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a))
    }));
  },

  dismissDialog: () => {
    set({ activeDialog: null });
  },

  triggerStoryDialog: (character: 'eli' | 'tom' | 'dirgham', title: string, message: string, action?: 'knifehit' | 'zombie' | 'lostlanguage') => {
    set({ activeDialog: { character, title, message, action } });
  },

  addAlert: (sender: string, senderAr: string, message: string, type: 'info' | 'drought' | 'danger' | 'victory') => {
    const now = Date.now();
    set((state) => ({
      alerts: [
        {
          id: `alert_custom_${now}`,
          sender,
          senderAr,
          message,
          date: 'الآن',
          read: false,
          type
        },
        ...state.alerts
      ].slice(0, 20)
    }));
  },
}));