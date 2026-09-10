import {
  BuildingPlot,
  ChestInstance,
  ResourceNodeInstance,
  ResourceNodeType,
  ResourceType,
} from '../types/game';

export interface WorldTile {
  type: 'grass' | 'dark_grass' | 'dirt_path' | 'water' | 'bridge' | 'sand' | 'stone_pavement' | 'ruins';
  elevation: number;
  decorType?: 'flower_red' | 'flower_yellow' | 'pebble' | 'mushroom' | 'grass_tuft';
}

export class World {
  public width: number = 2800;
  public height: number = 2800;
  public tileSize: number = 40;
  public cols: number = 70;
  public rows: number = 70;
  public tiles: WorldTile[][] = [];

  public buildingPlots: BuildingPlot[] = [];
  public resourceNodes: ResourceNodeInstance[] = [];
  public chests: ChestInstance[] = [];

  constructor() {
    this.cols = Math.floor(this.width / this.tileSize);
    this.rows = Math.floor(this.height / this.tileSize);
    this.generateTerrain();
    this.generatePlots();
    this.generateResourceNodes();
    this.generateChests();
  }

  private generateTerrain() {
    this.tiles = [];
    const centerTileX = Math.floor(this.cols / 2);
    const centerTileY = Math.floor(this.rows / 2);

    for (let y = 0; y < this.rows; y++) {
      const row: WorldTile[] = [];
      for (let x = 0; x < this.cols; x++) {
        let type: WorldTile['type'] = 'grass';

        // Dark grass patches and biomes
        const distFromCenter = Math.hypot(x - centerTileX, y - centerTileY);
        const noise = Math.sin(x * 0.2) * Math.cos(y * 0.2) + Math.sin(x * 0.05 + y * 0.08);

        if (noise > 0.45 && distFromCenter > 15) {
          type = 'dark_grass';
        }

        // River Generation (Winding from North to South-East)
        const riverCenter = 18 + Math.sin(y * 0.15) * 5 + Math.cos(y * 0.05) * 4;
        const riverWidth = 3.5;
        const isRiver = Math.abs(x - riverCenter) < riverWidth;

        if (isRiver) {
          // Check for Bridges
          const isBridge1 = y >= 25 && y <= 27; // Central West bridge
          const isBridge2 = y >= 48 && y <= 50; // South West bridge
          if (isBridge1 || isBridge2) {
            type = 'bridge';
          } else {
            type = 'water';
          }
        }

        // Village Center Pavement and Dirt Paths
        if (distFromCenter < 9 && type !== 'water') {
          type = 'stone_pavement';
        }

        // Main Cross Dirt Roads
        const isEastWestRoad = Math.abs(y - centerTileY) <= 1 && x >= 15 && x <= 55;
        const isNorthSouthRoad = Math.abs(x - centerTileX) <= 1 && y >= 15 && y <= 55;
        if ((isEastWestRoad || isNorthSouthRoad) && type !== 'water' && type !== 'stone_pavement') {
          type = 'dirt_path';
        }

        // Ruins in North-East
        if (x > 54 && y < 18) {
          type = 'ruins';
        }

        // Sand along river banks
        if (type === 'grass' || type === 'dark_grass') {
          if (Math.abs(x - riverCenter) < riverWidth + 1.2 && Math.abs(x - riverCenter) >= riverWidth) {
            type = 'sand';
          }
        }

        // Add subtle decorative elements on grass
        let decorType: WorldTile['decorType'] = undefined;
        if ((type === 'grass' || type === 'dark_grass') && Math.random() < 0.18) {
          const r = Math.random();
          if (r < 0.25) decorType = 'flower_red';
          else if (r < 0.5) decorType = 'flower_yellow';
          else if (r < 0.75) decorType = 'pebble';
          else if (r < 0.9) decorType = 'mushroom';
          else decorType = 'grass_tuft';
        }

        row.push({
          type,
          elevation: 0,
          decorType,
        });
      }
      this.tiles.push(row);
    }
  }

  private generatePlots() {
    // Village center is at (1400, 1400)
    const cx = this.width / 2;
    const cy = this.height / 2;

    this.buildingPlots = [
      // 1. Central Sentry Tower Plot (Present at start Stage 0)
      {
        id: 'plot_town_hall',
        name: 'Sentry Spire',
        x: cx - 60,
        y: cy - 70,
        width: 120,
        height: 120,
        building: null, // Initialized with Sentry Spire / Town Hall
        allowedCategories: ['village'],
        unlockStage: 0,
      },

      // 2. Stage 1: First Shelter & Campfire (West & East starter shelters)
      {
        id: 'plot_north_1',
        name: 'Pioneer Shelter',
        x: cx - 180,
        y: cy - 220,
        width: 90,
        height: 90,
        building: null,
        unlockStage: 1,
        autoUnlockBuilding: 'house',
      },

      // 3. Stage 2: Homestead (Farm & Granary Warehouse)
      {
        id: 'plot_east_1',
        name: 'Homestead Farm',
        x: cx + 170,
        y: cy - 60,
        width: 90,
        height: 90,
        building: null,
        unlockStage: 2,
        autoUnlockBuilding: 'farm',
      },
      {
        id: 'plot_south_1',
        name: 'Granary Warehouse',
        x: cx - 180,
        y: cy + 180,
        width: 90,
        height: 90,
        building: null,
        unlockStage: 2,
        autoUnlockBuilding: 'warehouse',
      },

      // 4. Stage 3: Village Production (Lumber Camp & Stone Quarry)
      {
        id: 'plot_west_1',
        name: 'Lumber Workshop',
        x: cx - 260,
        y: cy - 60,
        width: 90,
        height: 90,
        building: null,
        unlockStage: 3,
        autoUnlockBuilding: 'lumber_camp',
      },
      {
        id: 'plot_south_2',
        name: 'Stone Quarry',
        x: cx + 90,
        y: cy + 180,
        width: 90,
        height: 90,
        building: null,
        unlockStage: 3,
        autoUnlockBuilding: 'mine',
      },

      // 5. Stage 4: Fortified Town (Merchant Market & Guard Towers)
      {
        id: 'plot_east_2',
        name: 'Merchant Bazaar',
        x: cx + 170,
        y: cy + 70,
        width: 90,
        height: 90,
        building: null,
        unlockStage: 4,
        autoUnlockBuilding: 'market',
      },
      {
        id: 'plot_tower_north',
        name: 'North Bastion',
        x: cx - 35,
        y: cy - 360,
        width: 70,
        height: 70,
        building: null,
        allowedCategories: ['defense'],
        unlockStage: 4,
        autoUnlockBuilding: 'archer_tower',
      },
      {
        id: 'plot_tower_south',
        name: 'South Bastion',
        x: cx - 35,
        y: cy + 300,
        width: 70,
        height: 70,
        building: null,
        allowedCategories: ['defense'],
        unlockStage: 4,
        autoUnlockBuilding: 'archer_tower',
      },

      // 6. Stage 5: Royal Arcane Citadel (Arcane Crystal Towers & Fortress Gate)
      {
        id: 'plot_north_2',
        name: 'Royal Manor',
        x: cx + 90,
        y: cy - 220,
        width: 90,
        height: 90,
        building: null,
        unlockStage: 5,
        autoUnlockBuilding: 'house',
      },
      {
        id: 'plot_west_2',
        name: 'Arcane Spire West',
        x: cx - 260,
        y: cy + 70,
        width: 90,
        height: 90,
        building: null,
        allowedCategories: ['defense'],
        unlockStage: 5,
        autoUnlockBuilding: 'magic_tower',
      },
      {
        id: 'plot_tower_east',
        name: 'East Cannon Bastion',
        x: cx + 320,
        y: cy - 35,
        width: 70,
        height: 70,
        building: null,
        allowedCategories: ['defense'],
        unlockStage: 5,
        autoUnlockBuilding: 'cannon_tower',
      },
      {
        id: 'plot_tower_west_bridge',
        name: 'River Bridge Citadel Spire',
        x: cx - 440,
        y: cy - 35,
        width: 70,
        height: 70,
        building: null,
        allowedCategories: ['defense'],
        unlockStage: 5,
        autoUnlockBuilding: 'magic_tower',
      },
    ];
  }

  private generateResourceNodes() {
    this.resourceNodes = [];
    let idCounter = 1;

    const cx = this.width / 2;
    const cy = this.height / 2;

    // Helper to spawn node if safe from plots and water
    const trySpawnNode = (x: number, y: number, type: ResourceNodeType) => {
      // Check collision with water or center
      const tx = Math.floor(x / this.tileSize);
      const ty = Math.floor(y / this.tileSize);
      if (tx < 1 || tx >= this.cols - 1 || ty < 1 || ty >= this.rows - 1) return;
      if (this.tiles[ty]?.[tx]?.type === 'water') return;

      // Check distance from village center
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < 180) return; // keep center clearing open

      // Check distance from plots
      for (const plot of this.buildingPlots) {
        if (
          x >= plot.x - 40 &&
          x <= plot.x + plot.width + 40 &&
          y >= plot.y - 40 &&
          y <= plot.y + plot.height + 40
        ) {
          return;
        }
      }

      let resType: ResourceType = 'wood';
      let width = 50;
      let height = 65;
      let maxHp = 40;
      let yieldAmount = 10;
      let respawnTime = 25;

      if (type === 'tree_oak') {
        resType = 'wood';
        width = 48;
        height = 64;
        maxHp = 30;
        yieldAmount = 10;
        respawnTime = 20;
      } else if (type === 'tree_pine') {
        resType = 'wood';
        width = 44;
        height = 68;
        maxHp = 35;
        yieldAmount = 12;
        respawnTime = 24;
      } else if (type === 'rock_stone') {
        resType = 'stone';
        width = 45;
        height = 42;
        maxHp = 40;
        yieldAmount = 10;
        respawnTime = 28;
      } else if (type === 'rock_gold') {
        resType = 'coins';
        width = 42;
        height = 40;
        maxHp = 50;
        yieldAmount = 25;
        respawnTime = 40;
      } else if (type === 'bush_berry') {
        resType = 'food';
        width = 38;
        height = 36;
        maxHp = 20;
        yieldAmount = 15;
        respawnTime = 18;
      }

      this.resourceNodes.push({
        id: `node_${idCounter++}`,
        type,
        resourceType: resType,
        x,
        y,
        width,
        height,
        health: maxHp,
        maxHealth: maxHp,
        yieldAmount,
        isDepleted: false,
        respawnTime,
        respawnTimer: 0,
        shakeTimer: 0,
      });
    };

    // 1. Forest Clusters in North-West & South-West
    for (let i = 0; i < 45; i++) {
      const rx = 200 + Math.random() * 900;
      const ry = 200 + Math.random() * 2400;
      trySpawnNode(rx, ry, Math.random() > 0.4 ? 'tree_oak' : 'tree_pine');
    }

    // 2. Village Outskirts (Starter trees and rocks near player spawn)
    const starterNodes: Array<[number, number, ResourceNodeType]> = [
      // Starter Trees near Town
      [cx - 150, cy - 130, 'tree_oak'],
      [cx - 190, cy - 150, 'tree_oak'],
      [cx + 140, cy - 140, 'tree_oak'],
      [cx + 170, cy - 170, 'tree_pine'],
      [cx - 120, cy + 130, 'tree_oak'],
      [cx + 130, cy + 140, 'tree_pine'],

      // Starter Stone rocks near Town
      [cx - 130, cy + 240, 'rock_stone'],
      [cx + 140, cy + 240, 'rock_stone'],
      [cx + 260, cy - 140, 'rock_stone'],
      [cx - 280, cy - 150, 'rock_stone'],

      // Starter Berry Bushes
      [cx - 70, cy - 160, 'bush_berry'],
      [cx + 60, cy - 160, 'bush_berry'],
      [cx - 70, cy + 150, 'bush_berry'],
      [cx + 60, cy + 150, 'bush_berry'],
    ];

    for (const [sx, sy, stype] of starterNodes) {
      trySpawnNode(sx, sy, stype);
    }

    // 3. Rocky Quarry Cluster in South-East
    for (let i = 0; i < 28; i++) {
      const rx = cx + 250 + Math.random() * 850;
      const ry = cy + 200 + Math.random() * 900;
      trySpawnNode(rx, ry, Math.random() > 0.25 ? 'rock_stone' : 'rock_gold');
    }

    // 4. North & East Lush Woods & Berry Groves
    for (let i = 0; i < 40; i++) {
      const rx = cx - 400 + Math.random() * 1200;
      const ry = 150 + Math.random() * 800;
      const r = Math.random();
      if (r < 0.6) trySpawnNode(rx, ry, 'tree_pine');
      else if (r < 0.85) trySpawnNode(rx, ry, 'tree_oak');
      else trySpawnNode(rx, ry, 'bush_berry');
    }

    // 5. Eastern Meadow
    for (let i = 0; i < 25; i++) {
      const rx = cx + 300 + Math.random() * 900;
      const ry = cy - 600 + Math.random() * 900;
      const r = Math.random();
      if (r < 0.5) trySpawnNode(rx, ry, 'bush_berry');
      else if (r < 0.8) trySpawnNode(rx, ry, 'tree_oak');
      else trySpawnNode(rx, ry, 'rock_stone');
    }
  }

  private generateChests() {
    this.chests = [
      {
        id: 'chest_1',
        name: 'Hidden Forest Cache',
        x: 350,
        y: 400,
        width: 36,
        height: 32,
        isOpened: false,
        rewards: { wood: 50, coins: 60, gems: 5 },
      },
      {
        id: 'chest_2',
        name: 'Ancient River Vault',
        x: 520,
        y: 1950,
        width: 36,
        height: 32,
        isOpened: false,
        rewards: { stone: 60, coins: 80, gems: 8 },
      },
      {
        id: 'chest_3',
        name: 'Ruins of the Old Guard',
        x: 2450,
        y: 380,
        width: 36,
        height: 32,
        isOpened: false,
        rewards: { coins: 150, gems: 15, food: 60 },
      },
      {
        id: 'chest_4',
        name: 'Deep Quarry Treasure',
        x: 2350,
        y: 2350,
        width: 36,
        height: 32,
        isOpened: false,
        rewards: { stone: 100, coins: 120, gems: 10 },
      },
      {
        id: 'chest_5',
        name: 'Sacred Grove Relic',
        x: 1400,
        y: 350,
        width: 36,
        height: 32,
        isOpened: false,
        rewards: { wood: 80, food: 80, coins: 100, gems: 12 },
      },
    ];
  }

  public isWalkable(x: number, y: number, radius: number = 14): boolean {
    // Map Boundaries
    if (x - radius < 40 || x + radius > this.width - 40 || y - radius < 40 || y + radius > this.height - 40) {
      return false;
    }

    // Tile checks
    const tileX = Math.floor(x / this.tileSize);
    const tileY = Math.floor(y / this.tileSize);
    const tile = this.tiles[tileY]?.[tileX];
    if (tile && tile.type === 'water') {
      return false;
    }

    // Check active buildings collision
    for (const plot of this.buildingPlots) {
      if (plot.building) {
        const b = plot.building;
        // Building box
        const pad = 6;
        if (
          x + radius > b.x + pad &&
          x - radius < b.x + b.width - pad &&
          y + radius > b.y + pad &&
          y - radius < b.y + b.height - pad
        ) {
          return false;
        }
      }
    }

    // Check solid resource nodes (rocks and trees when not depleted)
    for (const node of this.resourceNodes) {
      if (!node.isDepleted && (node.type.startsWith('rock') || node.type.startsWith('tree'))) {
        // Small collision footprint at trunk / base of node
        const trunkW = node.width * 0.45;
        const trunkH = node.height * 0.3;
        const trunkX = node.x + (node.width - trunkW) / 2;
        const trunkY = node.y + node.height - trunkH;

        if (
          x + radius > trunkX &&
          x - radius < trunkX + trunkW &&
          y + radius > trunkY &&
          y - radius < trunkY + trunkH
        ) {
          return false;
        }
      }
    }

    return true;
  }

  public update(dt: number) {
    // Update resource nodes respawn
    for (const node of this.resourceNodes) {
      if (node.shakeTimer > 0) {
        node.shakeTimer -= dt;
      }
      if (node.isDepleted) {
        node.respawnTimer += dt;
        if (node.respawnTimer >= node.respawnTime) {
          node.isDepleted = false;
          node.health = node.maxHealth;
          node.respawnTimer = 0;
        }
      }
    }
  }
}
