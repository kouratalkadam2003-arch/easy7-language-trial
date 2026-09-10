import {
  ItemMemoryState,
  KingdomLearningState,
  KnowledgeLocation,
  KnowledgeNodeInstance,
  LearningItemRecord,
  MemoryVulnerabilityState,
  ReviewRating,
} from '../types/learning';
import { isErroneousEnglishCard } from '@/store/reviewStore';

const STORAGE_KEY_ITEMS = 'realm_learning_items_v2';
const STORAGE_KEY_KINGDOM = 'realm_kingdom_state_v2';
const STORAGE_KEY_CURRICULUM = 'realm_custom_curriculum_v2';

// Seed starter curriculum items mapped to specific world buildings
const SEED_KNOWLEDGE_ITEMS: Array<{
  knowledgeId: string;
  subject: string;
  primaryText: string;
  secondaryText: string;
  contextOrNotes?: string;
  categoryTag: string;
  plotId: string;
  buildingType: string;
  buildingName: string;
  nodeIndex: number;
  nodeLabel: string;
  offsetX: number;
  offsetY: number;
}> = [
  // Starter Sentry Spire / Hut (Stage 0)
  {
    knowledgeId: 'DE_A1_0001',
    subject: 'German (A1)',
    primaryText: 'Hallo! Wie geht es dir?',
    secondaryText: 'مرحباً! كيف حالك؟',
    contextOrNotes: 'تحية ودية شائعة بين الأصدقاء والمعارف.',
    categoryTag: 'Greeting',
    plotId: 'plot_town_hall',
    buildingType: 'town_hall',
    buildingName: 'Sentry Spire',
    nodeIndex: 0,
    nodeLabel: 'Spire Crystal 01',
    offsetX: -26,
    offsetY: 28,
  },
  {
    knowledgeId: 'DE_A1_0002',
    subject: 'German (A1)',
    primaryText: 'Ich heiße Maximilian.',
    secondaryText: 'اسمي ماكسيميليان.',
    contextOrNotes: 'فعل: heißen (يُدعى أو يُسمى).',
    categoryTag: 'Introduction',
    plotId: 'plot_town_hall',
    buildingType: 'town_hall',
    buildingName: 'Sentry Spire',
    nodeIndex: 1,
    nodeLabel: 'Spire Crystal 02',
    offsetX: 26,
    offsetY: 28,
  },
  {
    knowledgeId: 'DE_A1_0003',
    subject: 'German (A1)',
    primaryText: 'Guten Morgen allerseits!',
    secondaryText: 'صباح الخير للجميع!',
    contextOrNotes: 'تحية الصباح حتى منتصف النهار.',
    categoryTag: 'Greeting',
    plotId: 'plot_town_hall',
    buildingType: 'town_hall',
    buildingName: 'Sentry Spire',
    nodeIndex: 2,
    nodeLabel: 'Spire Crystal 03',
    offsetX: 0,
    offsetY: 38,
  },

  // Pioneer Shelter (Stage 1)
  {
    knowledgeId: 'DE_A1_0004',
    subject: 'German (A1)',
    primaryText: 'Hier ist unser gemütliches Haus.',
    secondaryText: 'هنا بيتنا المريح والمبهج.',
    contextOrNotes: 'صفة: gemütlich (مريح ودافئ).',
    categoryTag: 'Shelter',
    plotId: 'plot_north_1',
    buildingType: 'house',
    buildingName: 'Pioneer Shelter',
    nodeIndex: 0,
    nodeLabel: 'Shelter Rune 01',
    offsetX: -20,
    offsetY: 18,
  },
  {
    knowledgeId: 'DE_A1_0005',
    subject: 'German (A1)',
    primaryText: 'Wir machen ein warmes Feuer.',
    secondaryText: 'نحن نشعل ناراً دافئة.',
    contextOrNotes: 'اسم: das Feuer (النار).',
    categoryTag: 'Camp',
    plotId: 'plot_north_1',
    buildingType: 'house',
    buildingName: 'Pioneer Shelter',
    nodeIndex: 1,
    nodeLabel: 'Shelter Rune 02',
    offsetX: 20,
    offsetY: 18,
  },

  // Homestead Farm (Stage 2)
  {
    knowledgeId: 'DE_A1_0006',
    subject: 'German (A1)',
    primaryText: 'Ich habe großen Hunger.',
    secondaryText: 'أنا جائع جداً.',
    contextOrNotes: 'تعبير: Hunger haben = الشعور بالجوع.',
    categoryTag: 'Food & Farming',
    plotId: 'plot_east_1',
    buildingType: 'farm',
    buildingName: 'Homestead Farm',
    nodeIndex: 0,
    nodeLabel: 'Farm Seed 01',
    offsetX: -24,
    offsetY: -18,
  },
  {
    knowledgeId: 'DE_A1_0007',
    subject: 'German (A1)',
    primaryText: 'Ein Glas kühles Wasser, bitte.',
    secondaryText: 'كوب ماء بارد، من فضلك.',
    contextOrNotes: 'اسم: das Wasser (الماء).',
    categoryTag: 'Food & Farming',
    plotId: 'plot_east_1',
    buildingType: 'farm',
    buildingName: 'Homestead Farm',
    nodeIndex: 1,
    nodeLabel: 'Farm Seed 02',
    offsetX: 24,
    offsetY: -18,
  },
  {
    knowledgeId: 'DE_A1_0008',
    subject: 'German (A1)',
    primaryText: 'Das frische Brot schmeckt lecker.',
    secondaryText: 'الخبز الطازج لذيذ جداً.',
    contextOrNotes: 'فعل: schmecken (طعمه لذيذ).',
    categoryTag: 'Food & Farming',
    plotId: 'plot_east_1',
    buildingType: 'farm',
    buildingName: 'Homestead Farm',
    nodeIndex: 2,
    nodeLabel: 'Farm Seed 03',
    offsetX: -24,
    offsetY: 18,
  },
  {
    knowledgeId: 'DE_A1_0009',
    subject: 'German (A1)',
    primaryText: 'Wir ernten das goldene Getreide.',
    secondaryText: 'نحن نحصد القمح الذهبي.',
    contextOrNotes: 'فعل: ernten (يحصد).',
    categoryTag: 'Agriculture',
    plotId: 'plot_east_1',
    buildingType: 'farm',
    buildingName: 'Homestead Farm',
    nodeIndex: 3,
    nodeLabel: 'Farm Seed 04',
    offsetX: 24,
    offsetY: 18,
  },
  {
    knowledgeId: 'DE_A1_0010',
    subject: 'German (A1)',
    primaryText: 'Der Bauer füttert die Tiere.',
    secondaryText: 'المزارع يطعم الحيوانات.',
    contextOrNotes: 'اسم: die Tiere (الحيوانات).',
    categoryTag: 'Agriculture',
    plotId: 'plot_east_1',
    buildingType: 'farm',
    buildingName: 'Homestead Farm',
    nodeIndex: 4,
    nodeLabel: 'Farm Seed 05',
    offsetX: 0,
    offsetY: 26,
  },

  // Lumber Workshop (Stage 3)
  {
    knowledgeId: 'DE_A1_0011',
    subject: 'German (A1)',
    primaryText: 'Das Holz aus dem Wald ist stark.',
    secondaryText: 'الخشب من الغابة قوي ومتين.',
    contextOrNotes: 'صفة: stark (قوي).',
    categoryTag: 'Crafting',
    plotId: 'plot_west_1',
    buildingType: 'lumber_camp',
    buildingName: 'Lumber Workshop',
    nodeIndex: 0,
    nodeLabel: 'Workshop Node 01',
    offsetX: -22,
    offsetY: -16,
  },
  {
    knowledgeId: 'DE_A1_0012',
    subject: 'German (A1)',
    primaryText: 'Der Handwerker baut Werkzeuge.',
    secondaryText: 'الحرفي يصنع الأدوات المتقنة.',
    contextOrNotes: 'اسم: das Werkzeug (الأداة).',
    categoryTag: 'Crafting',
    plotId: 'plot_west_1',
    buildingType: 'lumber_camp',
    buildingName: 'Lumber Workshop',
    nodeIndex: 1,
    nodeLabel: 'Workshop Node 02',
    offsetX: 22,
    offsetY: -16,
  },

  // Stone Quarry (Stage 3)
  {
    knowledgeId: 'DE_A1_0013',
    subject: 'German (A1)',
    primaryText: 'Der Stein ist schwer und fest.',
    secondaryText: 'الحجر ثقيل وصلب جداً.',
    contextOrNotes: 'صفة: schwer (ثقيل).',
    categoryTag: 'Quarry',
    plotId: 'plot_south_2',
    buildingType: 'mine',
    buildingName: 'Stone Quarry',
    nodeIndex: 0,
    nodeLabel: 'Quarry Rune 01',
    offsetX: -20,
    offsetY: 16,
  },
  {
    knowledgeId: 'DE_A1_0014',
    subject: 'German (A1)',
    primaryText: 'Wir bauen eine hohe Mauer.',
    secondaryText: 'نحن نبني جداراً منيعاً وعالياً.',
    contextOrNotes: 'اسم: die Mauer (الجدار/السور).',
    categoryTag: 'Quarry',
    plotId: 'plot_south_2',
    buildingType: 'mine',
    buildingName: 'Stone Quarry',
    nodeIndex: 1,
    nodeLabel: 'Quarry Rune 02',
    offsetX: 20,
    offsetY: 16,
  },
];

export class SpacedRepetitionEngine {
  private items: Map<string, LearningItemRecord> = new Map();
  private kingdom: KingdomLearningState;

  constructor() {
    this.kingdom = this.getDefaultKingdomState();
    this.loadFromStorage();
    this.purgeErroneousItems();
    if (this.items.size === 0) {
      this.seedStarterKnowledgeForLang(this.activeLanguage);
    }
    this.updateKingdomMetrics();
  }

  public purgeErroneousItems(): void {
    if (this.activeLanguage === 'en') return;
    let purged = false;
    for (const [id, item] of this.items.entries()) {
      if (isErroneousEnglishCard(item.primaryText)) {
        this.items.delete(id);
        purged = true;
      }
    }
    if (purged) {
      this.saveToStorage();
      this.updateKingdomMetrics();
    }
  }

  private seedStarterKnowledge() {
    for (const seed of SEED_KNOWLEDGE_ITEMS) {
      const item: LearningItemRecord = {
        id: seed.knowledgeId,
        knowledgeId: seed.knowledgeId,
        subject: seed.subject,
        primaryText: seed.primaryText,
        secondaryText: seed.secondaryText,
        contextOrNotes: seed.contextOrNotes,
        categoryTag: seed.categoryTag,
        location: {
          plotId: seed.plotId,
          buildingType: seed.buildingType,
          buildingName: seed.buildingName,
          nodeIndex: seed.nodeIndex,
          nodeLabel: seed.nodeLabel,
          offsetX: seed.offsetX,
          offsetY: seed.offsetY,
        },
        createdAt: Date.now() - 3600000 * (seed.nodeIndex + 1),
        lastReviewedAt: null,
        nextDueDate: Date.now(), // Due for initial study
        intervalDays: 0,
        stability: 0.8,
        difficulty: 4.5,
        repsCount: 0,
        lapsesCount: 0,
        state: 'new',
        history: [],
      };
      this.items.set(item.id, item);
    }
    this.saveToStorage();
  }

  public getKingdomState(): KingdomLearningState {
    return { ...this.kingdom };
  }

  public getAllItems(): LearningItemRecord[] {
    return Array.from(this.items.values());
  }

  public getItemById(id: string): LearningItemRecord | undefined {
    return this.items.get(id);
  }

  public getItemsForPlot(plotId: string): LearningItemRecord[] {
    return Array.from(this.items.values()).filter((item) => item.location?.plotId === plotId);
  }

  public getDueItemsForPlot(plotId: string): LearningItemRecord[] {
    const now = Date.now();
    return this.getItemsForPlot(plotId).filter((item) => item.nextDueDate <= now);
  }

  public getItemsForRole(role: string): LearningItemRecord[] {
    return Array.from(this.items.values()).filter((item) => item.location?.boundEntityRole === role);
  }

  public getDueItemsForRole(role: string): LearningItemRecord[] {
    const now = Date.now();
    return this.getItemsForRole(role).filter((item) => item.nextDueDate <= now);
  }

  /**
   * Calculates Retrievability R(t) = exp(-deltaT / S)
   */
  public calculateRetrievability(item: LearningItemRecord): number {
    const now = Date.now();
    if (item.nextDueDate > now) {
      // Review is in the future: high retrievability
      const daysUntilDue = (item.nextDueDate - now) / (1000 * 60 * 60 * 24);
      return Math.min(1.0, 0.9 + Math.min(0.1, daysUntilDue * 0.05));
    }

    // Overdue: Calculate exponential memory decay
    const daysOverdue = (now - item.nextDueDate) / (1000 * 60 * 60 * 24);
    const stability = Math.max(0.2, item.stability || 0.5);
    const retrievability = Math.exp(-daysOverdue / stability);
    return Math.max(0.05, Math.min(1.0, Number(retrievability.toFixed(3))));
  }

  /**
   * Evaluates memory vulnerability state based on retrievability R:
   * - stable: R >= 0.85 (Shield active)
   * - due: 0.65 <= R < 0.85 (Review approaching, shield flickers)
   * - weak: 0.40 <= R < 0.65 (Shield down, node exposed)
   * - critical: R < 0.40 (Shield destroyed, RED ALARM BEACON, primary monster target)
   */
  public getMemoryVulnerabilityState(item: LearningItemRecord): MemoryVulnerabilityState {
    const r = this.calculateRetrievability(item);
    if (r >= 0.85) return 'stable';
    if (r >= 0.65) return 'due';
    if (r >= 0.40) return 'weak';
    return 'critical';
  }

  /**
   * Assigns a deterministic physical world location for any new item with semantic category matching.
   */
  public assignDeterministicLocation(
    itemId: string,
    indexOffset: number = 0,
    context?: { primaryText?: string; secondaryText?: string; categoryTag?: string }
  ): KnowledgeLocation {
    const text = `${context?.primaryText || ''} ${context?.secondaryText || ''} ${context?.categoryTag || ''}`.toLowerCase();

    // 1. Semantic matching to appropriate building and role
    if (/food|bread|water|hunger|eat|drink|apple|tea|coffee|milk|rice|meal|essen|trinken|wasser|brot|pomme|pain|eau|nourriture|مزرعة|أكل|شرب|طعام|ماء|خبز/.test(text)) {
      return {
        plotId: 'plot_east_1',
        buildingType: 'farm',
        buildingName: 'Homestead Farm',
        nodeIndex: 0,
        nodeLabel: 'Farm Harvest Rune',
        offsetX: -22,
        offsetY: -16,
        boundEntityRole: 'farmer',
        districtId: 'district_valley',
      };
    }

    if (/wood|lumber|tree|forest|axe|chop|plank|craft|timber|shelter|holz|wald|baum|bois|arbre|forêt|خشب|شجر|غابة|حطاب|فأس/.test(text)) {
      return {
        plotId: 'plot_west_1',
        buildingType: 'lumber_camp',
        buildingName: 'Lumber Workshop',
        nodeIndex: 0,
        nodeLabel: 'Lumber Craft Rune',
        offsetX: 22,
        offsetY: -16,
        boundEntityRole: 'lumberjack',
        districtId: 'district_valley',
      };
    }

    if (/stone|mine|quarry|iron|gold|rock|hammer|ore|metal|stein|mine|or|pierre|حجر|منجم|حديد|معدن|ذهب|صخر/.test(text)) {
      return {
        plotId: 'plot_south_2',
        buildingType: 'mine',
        buildingName: 'Stone Quarry',
        nodeIndex: 0,
        nodeLabel: 'Stone Mine Rune',
        offsetX: -20,
        offsetY: 16,
        boundEntityRole: 'miner',
        districtId: 'district_valley',
      };
    }

    if (/market|shop|buy|sell|price|cost|money|coin|euro|dollar|markt|kaufen|geld|marché|acheter|argent|سوق|شراء|بيع|سعر|نقود|مال/.test(text)) {
      return {
        plotId: 'plot_east_2',
        buildingType: 'market',
        buildingName: 'Merchant Bazaar',
        nodeIndex: 0,
        nodeLabel: 'Market Trade Rune',
        offsetX: 0,
        offsetY: 22,
        boundEntityRole: 'merchant',
        districtId: 'district_valley',
      };
    }

    if (/fight|war|sword|shield|guard|protect|soldier|battle|victory|kämpfen|ritter|soldat|guerre|épée|قتال|حرب|سيف|درع|حارس|مقاتل|دفاع/.test(text)) {
      return {
        plotId: 'plot_town_hall',
        buildingType: 'town_hall',
        buildingName: 'Sentry Spire',
        nodeIndex: 0,
        nodeLabel: 'Citadel Honor Rune',
        offsetX: 0,
        offsetY: -28,
        boundEntityRole: 'warrior',
        districtId: 'district_valley',
      };
    }

    // Default slots cycling across village plots
    const total = this.items.size + indexOffset;
    const plots = [
      { plotId: 'plot_north_1', buildingType: 'house', buildingName: 'Pioneer Shelter', slots: 3, role: 'villager' as const },
      { plotId: 'plot_east_1', buildingType: 'farm', buildingName: 'Homestead Farm', slots: 4, role: 'farmer' as const },
      { plotId: 'plot_west_1', buildingType: 'lumber_camp', buildingName: 'Lumber Workshop', slots: 4, role: 'lumberjack' as const },
      { plotId: 'plot_south_2', buildingType: 'mine', buildingName: 'Stone Quarry', slots: 4, role: 'miner' as const },
      { plotId: 'plot_east_2', buildingType: 'market', buildingName: 'Merchant Market', slots: 4, role: 'merchant' as const },
      { plotId: 'plot_south_1', buildingType: 'warehouse', buildingName: 'Granary Barn', slots: 4, role: 'villager' as const },
      { plotId: 'plot_town_hall', buildingType: 'town_hall', buildingName: 'Sentry Spire', slots: 4, role: 'warrior' as const },
    ];

    let count = 0;
    for (const p of plots) {
      if (total < count + p.slots) {
        const slotIdx = total - count;
        const offsets = [
          { offsetX: -22, offsetY: -16 },
          { offsetX: 22, offsetY: -16 },
          { offsetX: -22, offsetY: 18 },
          { offsetX: 22, offsetY: 18 },
        ];
        const off = offsets[slotIdx % offsets.length];
        return {
          plotId: p.plotId,
          buildingType: p.buildingType,
          buildingName: p.buildingName,
          nodeIndex: slotIdx,
          nodeLabel: `${p.buildingName} Node ${slotIdx + 1}`,
          offsetX: off.offsetX,
          offsetY: off.offsetY,
          boundEntityRole: p.role,
          districtId: 'district_valley',
        };
      }
      count += p.slots;
    }

    // Default fallback to Spire
    return {
      plotId: 'plot_town_hall',
      buildingType: 'town_hall',
      buildingName: 'Sentry Spire',
      nodeIndex: total % 4,
      nodeLabel: `Spire Node ${(total % 4) + 1}`,
      offsetX: (total % 2 === 0 ? -1 : 1) * 24,
      offsetY: 28,
      boundEntityRole: 'warrior',
      districtId: 'district_valley',
    };
  }

  /**
   * Adds an individual item/card to the active memory tracking system.
   */
  public addIndividualItem(params: {
    id?: string;
    knowledgeId?: string;
    subject: string;
    sourceLevelId?: string;
    sourceUnitId?: string;
    sourceLessonId?: string;
    primaryText: string;
    secondaryText: string;
    contextOrNotes?: string;
    categoryTag?: string;
    location?: KnowledgeLocation;
  }): LearningItemRecord {
    const id = params.knowledgeId || params.id || `KN_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    if (this.items.has(id)) {
      return this.items.get(id)!;
    }

    const location =
      params.location ||
      this.assignDeterministicLocation(id, 0, {
        primaryText: params.primaryText,
        secondaryText: params.secondaryText,
        categoryTag: params.categoryTag,
      });

    const newItem: LearningItemRecord = {
      id,
      knowledgeId: id,
      subject: params.subject,
      sourceLevelId: params.sourceLevelId,
      sourceUnitId: params.sourceUnitId,
      sourceLessonId: params.sourceLessonId,
      primaryText: params.primaryText,
      secondaryText: params.secondaryText,
      contextOrNotes: params.contextOrNotes,
      categoryTag: params.categoryTag || 'Knowledge Item',
      location,
      createdAt: Date.now(),
      lastReviewedAt: null,
      nextDueDate: Date.now(), // Due immediately for first study
      intervalDays: 0,
      stability: 0.6,
      difficulty: 4.5,
      repsCount: 0,
      lapsesCount: 0,
      state: 'new',
      history: [],
    };

    this.items.set(id, newItem);
    this.saveToStorage();
    this.updateKingdomMetrics();
    return newItem;
  }

  public removeItem(id: string): boolean {
    const deleted = this.items.delete(id);
    if (deleted) {
      this.saveToStorage();
      this.updateKingdomMetrics();
    }
    return deleted;
  }

  public getDueReviewQueue(filterPlotId?: string): LearningItemRecord[] {
    const now = Date.now();
    const list: Array<{ item: LearningItemRecord; urgency: number }> = [];

    for (const item of this.items.values()) {
      if (filterPlotId && item.location?.plotId !== filterPlotId) {
        continue;
      }

      if (this.activeLanguage !== 'en' && isErroneousEnglishCard(item.primaryText)) {
        continue;
      }

      if (item.nextDueDate <= now) {
        const retrievability = this.calculateRetrievability(item);
        const urgency = 1 - retrievability;
        list.push({ item, urgency });
      }
    }

    list.sort((a, b) => b.urgency - a.urgency);
    return list.map((entry) => entry.item);
  }

  public recordReview(itemId: string, rating: ReviewRating): {
    item: LearningItemRecord;
    resourceReward: { timber: number; stone: number; essence: number; gold: number };
    vitalityBoost: number;
  } {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Item ${itemId} not found in spaced-repetition store`);
    }

    const now = Date.now();
    const isFirstReview = item.lastReviewedAt === null;

    let newStability = item.stability;
    let newDifficulty = item.difficulty;
    let newInterval = 1;
    let newState: ItemMemoryState = item.state;

    const diffDeltas = { 1: 1.2, 2: 0.5, 3: 0, 4: -0.8 };
    newDifficulty = Math.min(9.5, Math.max(1.5, item.difficulty + diffDeltas[rating]));

    if (rating === 1) {
      item.lapsesCount += 1;
      newStability = Math.max(0.3, item.stability * 0.4);
      newInterval = 1;
      newState = 'learning';
    } else {
      item.repsCount += 1;
      const difficultyMultiplier = (11 - newDifficulty) / 5;
      let stabilityFactor = 1.0;

      if (rating === 2) {
        stabilityFactor = 1.2 * difficultyMultiplier;
        newInterval = Math.max(1, Math.round((item.intervalDays || 1) * 1.3));
      } else if (rating === 3) {
        stabilityFactor = 2.1 * difficultyMultiplier;
        newInterval = Math.max(2, Math.round((item.intervalDays || 1) * 2.2));
      } else if (rating === 4) {
        stabilityFactor = 3.5 * difficultyMultiplier;
        newInterval = Math.max(4, Math.round((item.intervalDays || 1) * 3.4));
      }

      newStability = Math.max(0.8, item.stability * stabilityFactor);

      if (newInterval >= 21 || item.repsCount >= 4) {
        newState = 'mastered';
      } else {
        newState = 'reviewing';
      }
    }

    item.lastReviewedAt = now;
    item.intervalDays = newInterval;
    item.stability = Number(newStability.toFixed(2));
    item.difficulty = Number(newDifficulty.toFixed(2));
    item.state = newState;
    item.nextDueDate = now + newInterval * 24 * 60 * 60 * 1000;

    item.history.push({
      reviewedAt: now,
      rating,
      intervalDays: newInterval,
    });

    const qualityBonus = rating === 4 ? 2.5 : rating === 3 ? 1.8 : rating === 2 ? 1.0 : 0.3;
    const stabilityBonus = Math.min(20, Math.round(item.stability * 3));
    const earnedPoints = Math.round((rating === 1 ? 5 : (15 + stabilityBonus + (item.repsCount * 5))) * (rating === 4 ? 1.5 : 1));
    this.kingdom.learningPoints = (this.kingdom.learningPoints || 0) + earnedPoints;

    const resourceReward = {
      timber: Math.round(15 * qualityBonus),
      stone: Math.round(10 * qualityBonus),
      essence: Math.round((newState === 'mastered' ? 12 : 3) * qualityBonus),
      gold: Math.round(20 * qualityBonus),
    };

    this.kingdom.timber += resourceReward.timber;
    this.kingdom.stone += resourceReward.stone;
    this.kingdom.essence += resourceReward.essence;
    this.kingdom.gold += resourceReward.gold;
    this.kingdom.todayReviewsCount += 1;

    const todayStr = new Date().toDateString();
    if (this.kingdom.lastActiveDate !== todayStr) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      if (this.kingdom.lastActiveDate === yesterday) {
        this.kingdom.streakDays += 1;
      } else {
        this.kingdom.streakDays = 1;
      }
      this.kingdom.lastActiveDate = todayStr;
    }

    this.saveToStorage();
    this.updateKingdomMetrics();

    return {
      item,
      resourceReward,
      vitalityBoost: 0.15,
    };
  }

  public syncWithEasy7Progress(params: {
    completedLessons: string[];
    cards: Array<{
      id: string;
      native: string;
      translation: string;
      pronunciation?: string;
      intervalMinutes?: number;
      repetitionCount?: number;
      repetitions?: number;
      lapsesCount?: number;
    }>;
    streak: number;
  }): { currentStage: number; previousStage: number; promoted: boolean } {
    const { completedLessons = [], cards = [], streak = 0 } = params;
    const previousStage = this.kingdom.developmentStage ?? 0;

    // 1. Sync cards to memory items
    for (const card of cards) {
      if (this.activeLanguage !== 'en' && isErroneousEnglishCard(card.native)) {
        continue;
      }
      const existing = this.items.get(card.id);
      if (!existing) {
        this.addIndividualItem({
          id: card.id,
          subject: 'Easy7 Curriculum',
          sourceLevelId: 'Vocabulary',
          sourceUnitId: 'Core Words',
          primaryText: card.native,
          secondaryText: card.translation,
          contextOrNotes: card.pronunciation,
          categoryTag: 'Vocabulary',
        });
      } else {
        existing.repsCount = Math.max(existing.repsCount, card.repetitionCount || card.repetitions || 0);
        existing.intervalDays = Math.max(existing.intervalDays, (card.intervalMinutes || 0) / 1440);
        if ((card.intervalMinutes || 0) >= 1440 * 3) {
          existing.state = 'mastered';
        }
      }
    }

    // 2. Calculate true Learning / Prosperity Points
    // Completed lesson = +100 LP
    // Mastered card (interval >= 3 days) = +25 LP
    // Learning card = +10 LP
    // Streak day = +15 LP
    const lessonPoints = completedLessons.length * 100;
    const masteredCardsCount = cards.filter((c) => (c.intervalMinutes || 0) >= 1440 * 3).length;
    const cardPoints = masteredCardsCount * 25 + (cards.length - masteredCardsCount) * 10;
    const streakPoints = streak * 15;

    const totalLearningPoints = Math.max(this.kingdom.learningPoints || 0, lessonPoints + cardPoints + streakPoints);
    this.kingdom.learningPoints = totalLearningPoints;
    this.kingdom.streakDays = Math.max(this.kingdom.streakDays || 0, streak);
    this.kingdom.lastActiveDate = new Date().toDateString();

    this.updateKingdomMetrics();
    this.saveToStorage();

    const currentStage = this.kingdom.developmentStage ?? 0;
    return {
      currentStage,
      previousStage,
      promoted: currentStage > previousStage,
    };
  }

  public updateKingdomMetrics(): void {
    const now = Date.now();
    let activeCount = 0;
    let masteredCount = 0;
    let dueCount = 0;
    let overdueCount = 0;

    for (const item of this.items.values()) {
      activeCount += 1;
      if (item.state === 'mastered' || item.intervalDays >= 21) {
        masteredCount += 1;
      }

      if (item.nextDueDate <= now) {
        dueCount += 1;
        const hoursOverdue = (now - item.nextDueDate) / (1000 * 60 * 60);
        if (hoursOverdue > 24) {
          overdueCount += 1;
        }
      }
    }

    this.kingdom.totalItemsActive = activeCount;
    this.kingdom.totalItemsMastered = masteredCount;
    this.kingdom.dueItemsCount = dueCount;
    this.kingdom.overdueItemsCount = overdueCount;

    if (activeCount === 0 || overdueCount === 0) {
      this.kingdom.vitalityScore = 1.0;
    } else {
      const overdueRatio = overdueCount / activeCount;
      this.kingdom.vitalityScore = Math.max(0.35, Number((1.0 - overdueRatio * 0.65).toFixed(2)));
    }

    // Inactivity Decay: If more than 1 day has passed without study or review
    const lastActive = this.kingdom.lastActiveDate ? new Date(this.kingdom.lastActiveDate).getTime() : now;
    const daysInactive = Math.max(0, Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)));
    if (daysInactive > 1) {
      const decayAmount = Math.min(0.40, (daysInactive - 1) * 0.15);
      this.kingdom.vitalityScore = Math.max(0.30, Number((this.kingdom.vitalityScore - decayAmount).toFixed(2)));
    }

    // District Expansion Progress
    const districtTitles = [
      'وادي البدايات والمأوى الأول',
      'مروج الفرسان ومزارع الريف الشرقية',
      'مرتفعات الحكمة وقلعة العلم الشمالية',
      'الإمبراطورية الملكية الممتدة',
    ];
    const districtCapacities = [12, 25, 45, 80];
    let districtIdx = 0;
    while (districtIdx < districtCapacities.length - 1 && masteredCount >= districtCapacities[districtIdx]) {
      districtIdx++;
    }
    this.kingdom.currentDistrictIndex = districtIdx;
    this.kingdom.districtNameAr = districtTitles[districtIdx] || 'المقاطعة الممتدة';
    this.kingdom.districtCapacity = districtCapacities[districtIdx] || 100;
    this.kingdom.districtMasteredCount = masteredCount;
    this.kingdom.unlockedDistrictsCount = districtIdx + 1;

    const lp = this.kingdom.learningPoints || 0;
    let devStage = 0;
    let stageName = 'Lone Sentry Tower';
    let stageNameAr = 'برج الاستطلاع المنعزل';
    let stageDesc = 'One lone hero defending a solitary outpost in the wilderness. Complete your first lesson to build a shelter.';
    let stageDescAr = 'بطل وحيد يحرس برجاً منعزلاً وسط الطبيعة. أكمل درساً أو راجع بضع بطاقات لبناء المأوى الأول.';
    let pointsToNext = 100;

    if (lp >= 2000 || masteredCount >= 40) {
      devStage = 5;
      stageName = 'Royal Arcane Citadel';
      stageNameAr = 'قلعة الحكمة الإمبراطورية';
      stageDesc = 'A majestic empire glowing with arcane crystals, grand knights, and ultimate knowledge.';
      stageDescAr = 'إمبراطورية رخامية مهيبة مشعة ببلورات الحكمة والفرسان الملكيين وعظمة العلم.';
      pointsToNext = 2000;
    } else if (lp >= 1200 || masteredCount >= 25) {
      devStage = 4;
      stageName = 'Fortified Township';
      stageNameAr = 'المقاطعة المحصنة وسوق التجارة';
      stageDesc = 'Stone walls, watchtowers, and a bustling merchant market.';
      stageDescAr = 'أسوار حجرية منيعة، أبراج مراقبة وسوق تجاري عامر بالمظلات الملونة.';
      pointsToNext = 2000;
    } else if (lp >= 600 || masteredCount >= 15) {
      devStage = 3;
      stageName = 'Thriving Village';
      stageNameAr = 'البلدة الحرفية العامرة';
      stageDesc = 'Lumber workshops, stone quarries, and skilled craftsmen expanding the realm.';
      stageDescAr = 'ورشات نجارة ومناجم حجارة وعمال حرفيون يطورون المملكة بحماس.';
      pointsToNext = 1200;
    } else if (lp >= 300 || masteredCount >= 8) {
      devStage = 2;
      stageName = 'Homestead Farm';
      stageNameAr = 'المزرعة والريف الذهبي';
      stageDesc = 'Lush golden wheat fields and granary barns flourish with life.';
      stageDescAr = 'حقول قمح ذهبية ومستودعات زراعية عامرة بالحياة ومزارعون يجمعون المحصول.';
      pointsToNext = 600;
    } else if (lp >= 100 || masteredCount >= 3) {
      devStage = 1;
      stageName = 'Pioneer Camp & Shelter';
      stageNameAr = 'المخيم الأول والمأوى الخشبي';
      stageDesc = 'A cozy wooden shelter and warm campfire. Villagers begin settling your land.';
      stageDescAr = 'كوخ خشبي دافئ وموقد نار. بدأ أول القرويين بالاستقرار في أرضك.';
      pointsToNext = 300;
    } else {
      devStage = 0;
      stageName = 'Lone Sentry Tower';
      stageNameAr = 'برج الاستطلاع المنعزل';
      stageDesc = 'One lone hero defending a solitary outpost. Complete lessons and reviews to develop your realm.';
      stageDescAr = 'بطل وحيد يحرس برجاً منعزلاً وسط الطبيعة. أكمل درساً أو راجع بضع بطاقات لبناء المأوى الأول.';
      pointsToNext = 100;
    }

    this.kingdom.developmentStage = devStage;
    this.kingdom.stageName = stageName;
    this.kingdom.stageNameAr = stageNameAr;
    this.kingdom.stageDescription = stageDesc;
    this.kingdom.stageDescriptionAr = stageDescAr;
    this.kingdom.learningPointsToNextStage = pointsToNext;

    let tier: 1 | 2 | 3 | 4 | 5 = 1;
    if (devStage >= 5) tier = 5;
    else if (devStage === 4) tier = 4;
    else if (devStage === 3) tier = 3;
    else if (devStage === 2) tier = 2;
    else tier = 1;
    this.kingdom.tier = tier;

    const basePower = 25 + devStage * 15 + masteredCount * 4 + activeCount * 1.5;
    const baseFireRate = 1.2 + Math.min(2.5, this.kingdom.streakDays * 0.15) + (tier - 1) * 0.3;
    const baseRange = 260 + (tier - 1) * 35;
    const maxSpireHp = 100 + devStage * 80 + (tier - 1) * 120 + masteredCount * 10;

    const unlockedRunes: string[] = [];
    if (tier >= 2) unlockedRunes.push('Twin Magic Bolts');
    if (tier >= 3) unlockedRunes.push('Chain Lightning');
    if (tier >= 4) unlockedRunes.push('Elemental Tornado');
    if (tier >= 5) unlockedRunes.push('Arcane Crystal Beam');

    this.kingdom.heroStats = {
      level: Math.max(1, Math.floor(Math.sqrt(masteredCount * 3 + activeCount + devStage * 4) + 1)),
      power: Math.round(basePower * this.kingdom.vitalityScore),
      fireRate: Number(baseFireRate.toFixed(2)),
      range: baseRange,
      spireHealth: maxSpireHp,
      maxSpireHealth: maxSpireHp,
      unlockedRunes,
    };

    this.saveToStorage();
  }

  private getDefaultKingdomState(): KingdomLearningState {
    return {
      tier: 1,
      developmentStage: 0,
      stageName: 'Lone Sentry Tower',
      stageDescription: 'One lone hero defending a solitary tower. Complete reviews to develop the realm.',
      learningPoints: 0,
      learningPointsToNextStage: 50,
      vitalityScore: 1.0,
      totalItemsActive: 0,
      totalItemsMastered: 0,
      dueItemsCount: 0,
      overdueItemsCount: 0,
      streakDays: 1,
      lastActiveDate: new Date().toDateString(),
      todayReviewsCount: 0,
      essence: 50,
      timber: 100,
      stone: 80,
      gold: 150,
      heroStats: {
        level: 1,
        power: 30,
        fireRate: 1.5,
        range: 260,
        spireHealth: 100,
        maxSpireHealth: 100,
        unlockedRunes: [],
      },
      currentDistrictIndex: 0,
      districtNameAr: 'وادي البدايات والمأوى الأول',
      districtMasteredCount: 0,
      districtCapacity: 12,
      unlockedDistrictsCount: 1,
    };
  }

  private activeLanguage: string = typeof window !== 'undefined' ? (localStorage.getItem('target_lang') || 'en') : 'en';

  public getActiveLanguage(): string {
    return this.activeLanguage;
  }

  public setLanguage(lang: string) {
    if (!lang) return;
    const target = lang.toLowerCase();
    if (this.activeLanguage === target && this.items.size > 0) return;
    this.saveToStorage();
    this.activeLanguage = target;
    this.items.clear();
    this.kingdom = this.getDefaultKingdomState();
    this.loadFromStorage();
    this.purgeErroneousItems();
    if (this.items.size === 0) {
      this.seedStarterKnowledgeForLang(target);
    }
    this.updateKingdomMetrics();
  }

  private getItemsStorageKey(): string {
    return `${STORAGE_KEY_ITEMS}_${this.activeLanguage}`;
  }

  private getKingdomStorageKey(): string {
    return `${STORAGE_KEY_KINGDOM}_${this.activeLanguage}`;
  }

  private seedStarterKnowledgeForLang(lang: string) {
    const langSeeds: Record<string, Array<{ primary: string; secondary: string; tag: string; plot: string; role: any }>> = {
      de: [
        { primary: 'Hallo! Wie geht es dir?', secondary: 'مرحباً! كيف حالك؟', tag: 'Greeting', plot: 'plot_town_hall', role: 'warrior' },
        { primary: 'Hier ist unser schönes Haus.', secondary: 'هنا بيتنا الجميل والمريح.', tag: 'Shelter', plot: 'plot_north_1', role: 'villager' },
        { primary: 'Ich habe großen Hunger.', secondary: 'أنا جائع جداً.', tag: 'Food', plot: 'plot_east_1', role: 'farmer' },
        { primary: 'Wir bauen mit starkem Holz.', secondary: 'نحن نبني بأخشاب متينة.', tag: 'Building', plot: 'plot_west_1', role: 'lumberjack' },
        { primary: 'Wie viel kostet das Brot?', secondary: 'كم ثمن الخبز الطازج؟', tag: 'Market', plot: 'plot_east_2', role: 'merchant' },
      ],
      fr: [
        { primary: 'Bonjour! Comment allez-vous?', secondary: 'مرحباً! كيف حالكم؟', tag: 'Greeting', plot: 'plot_town_hall', role: 'warrior' },
        { primary: 'Voici notre maison chaleureuse.', secondary: 'هنا بيتنا الدافئ الجميل.', tag: 'Shelter', plot: 'plot_north_1', role: 'villager' },
        { primary: "J'ai très faim maintenant.", secondary: 'أنا جائع جداً الآن.', tag: 'Food', plot: 'plot_east_1', role: 'farmer' },
        { primary: 'Le bois est solide et robuste.', secondary: 'الخشب متين وقوي جداً.', tag: 'Building', plot: 'plot_west_1', role: 'lumberjack' },
        { primary: 'Combien coûte ce livre?', secondary: 'كم ثمن هذا الكتاب؟', tag: 'Market', plot: 'plot_east_2', role: 'merchant' },
      ],
      es: [
        { primary: '¡Hola! ¿Cómo estás hoy?', secondary: 'مرحباً! كيف حالك اليوم؟', tag: 'Greeting', plot: 'plot_town_hall', role: 'warrior' },
        { primary: 'Esta es nuestra casa acogedora.', secondary: 'هذا بيتنا المريح والمبهج.', tag: 'Shelter', plot: 'plot_north_1', role: 'villager' },
        { primary: 'Tengo mucha hambre y sed.', secondary: 'أنا جائع وعطشان جداً.', tag: 'Food', plot: 'plot_east_1', role: 'farmer' },
        { primary: 'Cortamos madera en el bosque.', secondary: 'نحن نقطع الخشب في الغابة.', tag: 'Building', plot: 'plot_west_1', role: 'lumberjack' },
        { primary: '¿Cuánto cuesta este sombrero?', secondary: 'كم ثمن هذه القبعة الجميلة؟', tag: 'Market', plot: 'plot_east_2', role: 'merchant' },
      ],
      it: [
        { primary: 'Ciao! Come stai oggi?', secondary: 'مرحباً! كيف حالك اليوم؟', tag: 'Greeting', plot: 'plot_town_hall', role: 'warrior' },
        { primary: 'Questa è la nostra bella casa.', secondary: 'هذا بيتنا الجميل والرحب.', tag: 'Shelter', plot: 'plot_north_1', role: 'villager' },
        { primary: 'Ho molta fame, mangiamo!', secondary: 'أنا جائع جداً، هيا نأكل!', tag: 'Food', plot: 'plot_east_1', role: 'farmer' },
        { primary: 'Il legno è forte e profumato.', secondary: 'الخشب قوي وذو رائحة عطرة.', tag: 'Building', plot: 'plot_west_1', role: 'lumberjack' },
        { primary: 'Quanto costa questo formaggio?', secondary: 'كم ثمن هذا الجبن اللذيذ؟', tag: 'Market', plot: 'plot_east_2', role: 'merchant' },
      ],
      ja: [
        { primary: 'Konnichiwa! Ogenki desu ka?', secondary: 'مرحباً! كيف حالك؟', tag: 'Greeting', plot: 'plot_town_hall', role: 'warrior' },
        { primary: 'Koko wa watashitachi no ie desu.', secondary: 'هنا بيتنا المريح.', tag: 'Shelter', plot: 'plot_north_1', role: 'villager' },
        { primary: 'Onaka ga sukimashita.', secondary: 'أنا جائع وأريد الأكل.', tag: 'Food', plot: 'plot_east_1', role: 'farmer' },
        { primary: 'Mori de ki o kirimasu.', secondary: 'نحن نقطع الأشجار في الغابة.', tag: 'Building', plot: 'plot_west_1', role: 'lumberjack' },
        { primary: 'Kore wa ikura desu ka?', secondary: 'كم ثمن هذا؟', tag: 'Market', plot: 'plot_east_2', role: 'merchant' },
      ],
      zh: [
        { primary: 'Nǐ hǎo! Nǐ hǎo ma?', secondary: 'مرحباً! كيف حالك؟', tag: 'Greeting', plot: 'plot_town_hall', role: 'warrior' },
        { primary: 'Zhè shì wǒmen de fángzi.', secondary: 'هذا منزلنا الجميل.', tag: 'Shelter', plot: 'plot_north_1', role: 'villager' },
        { primary: 'Wǒ hěn è, xiǎng chīfàn.', secondary: 'أنا جائع وأرغب في الطعام.', tag: 'Food', plot: 'plot_east_1', role: 'farmer' },
        { primary: 'Wǒmen yòng mùtou jiàn fáng.', secondary: 'نحن نبني المنازل بالأخشاب.', tag: 'Building', plot: 'plot_west_1', role: 'lumberjack' },
        { primary: 'Zhège duōshǎo qián?', secondary: 'كم ثمن هذا؟', tag: 'Market', plot: 'plot_east_2', role: 'merchant' },
      ],
      en: [
        { primary: 'Hello! How are you today?', secondary: 'مرحباً! كيف حالك اليوم؟', tag: 'Greeting', plot: 'plot_town_hall', role: 'warrior' },
        { primary: 'Here is our cozy shelter.', secondary: 'هنا مأوانا الدافئ.', tag: 'Shelter', plot: 'plot_north_1', role: 'villager' },
        { primary: 'I am very hungry for bread.', secondary: 'أنا جائع جداً للخبز.', tag: 'Food', plot: 'plot_east_1', role: 'farmer' },
        { primary: 'We gather timber from trees.', secondary: 'نجمع الخشب من الأشجار.', tag: 'Building', plot: 'plot_west_1', role: 'lumberjack' },
        { primary: 'How much does this cost?', secondary: 'كم يكلف هذا؟', tag: 'Market', plot: 'plot_east_2', role: 'merchant' },
      ],
    };

    const seeds = langSeeds[lang] || langSeeds.en;
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const id = `${lang.toUpperCase()}_SEED_${i + 1}`;
      this.addIndividualItem({
        id,
        knowledgeId: id,
        subject: `${lang.toUpperCase()} Knowledge`,
        primaryText: s.primary,
        secondaryText: s.secondary,
        categoryTag: s.tag,
      });
    }
  }

  private loadFromStorage(): void {
    try {
      const itemsRaw =
        localStorage.getItem(this.getItemsStorageKey()) ||
        (this.activeLanguage === 'en' ? localStorage.getItem(STORAGE_KEY_ITEMS) : null);
      if (itemsRaw) {
        const parsed: LearningItemRecord[] = JSON.parse(itemsRaw);
        this.items.clear();
        for (const item of parsed) {
          // Never load an erroneous English card into a non-English kingdom
          if (this.activeLanguage !== 'en' && isErroneousEnglishCard(item.primaryText)) {
            continue;
          }

          // If a non-English language accidentally stored English text as translation, sanitize it
          if (this.activeLanguage !== 'en' && item.secondaryText && /^[A-Za-z\s.,!?'-]+$/.test(item.secondaryText.trim())) {
            // Check if known seed
            if (item.primaryText.includes('Hallo')) item.secondaryText = 'مرحباً! كيف حالك؟';
            else if (item.primaryText.includes('schönes Haus') || item.primaryText.includes('gemütliches')) item.secondaryText = 'هنا بيتنا الجميل والمريح.';
            else if (item.primaryText.includes('Hunger')) item.secondaryText = 'أنا جائع جداً.';
            else if (item.primaryText.includes('Holz')) item.secondaryText = 'نحن نبني بأخشاب متينة.';
            else if (item.primaryText.includes('Brot')) item.secondaryText = 'كم ثمن الخبز الطازج؟';
            else if (item.primaryText.includes('Wasser')) item.secondaryText = 'كوب ماء بارد، من فضلك.';
            else if (item.primaryText.includes('Morgen')) item.secondaryText = 'صباح الخير للجميع!';
            else if (item.primaryText.includes('Maximilian')) item.secondaryText = 'اسمي ماكسيميليان.';
          }
          // Ensure location exists on loaded records
          if (!item.location) {
            item.location = this.assignDeterministicLocation(item.id);
          }
          this.items.set(item.id, item);
        }
      }

      const kingdomRaw =
        localStorage.getItem(this.getKingdomStorageKey()) ||
        (this.activeLanguage === 'en' ? localStorage.getItem(STORAGE_KEY_KINGDOM) : null);
      if (kingdomRaw) {
        this.kingdom = { ...this.getDefaultKingdomState(), ...JSON.parse(kingdomRaw) };
      }
    } catch (err) {
      console.warn('Failed to load spaced repetition storage:', err);
    }
  }

  private saveToStorage(): void {
    try {
      const itemsList = Array.from(this.items.values());
      localStorage.setItem(this.getItemsStorageKey(), JSON.stringify(itemsList));
      localStorage.setItem(this.getKingdomStorageKey(), JSON.stringify(this.kingdom));
    } catch (err) {
      console.warn('Failed to save spaced repetition storage:', err);
    }
  }

  public resetAllProgress(): void {
    try {
      localStorage.removeItem(this.getItemsStorageKey());
      localStorage.removeItem(this.getKingdomStorageKey());
      localStorage.removeItem(STORAGE_KEY_ITEMS);
      localStorage.removeItem(STORAGE_KEY_KINGDOM);
      localStorage.removeItem(STORAGE_KEY_CURRICULUM);
    } catch (err) {
      console.warn('Failed to clear spaced repetition storage:', err);
    }
    this.items.clear();
    this.kingdom = this.getDefaultKingdomState();
    this.seedStarterKnowledgeForLang(this.activeLanguage);
    this.updateKingdomMetrics();
  }
}

export const globalSpacedRepetition = new SpacedRepetitionEngine();
