import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Shield,
  Zap,
  Flame,
  Award,
  RotateCcw,
  Sparkles,
  Swords,
  X,
  Play,
  Heart,
  Crosshair,
  Wand2,
  Volume2,
  Skull,
  Coins,
  AlertTriangle,
  Radio,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import { SpacedRepetitionEngine } from '../engine/spacedRepetition';
import { soundManager } from '../audio/soundManager';

interface DefenseWaveModalProps {
  engine: SpacedRepetitionEngine;
  onClose: () => void;
}

type HeroClass = 'mage' | 'archer';

interface Enemy {
  id: number;
  x: number;
  y: number;
  maxHp: number;
  hp: number;
  speed: number;
  size: number;
  type: 'goblin' | 'orc' | 'boss';
  name: string;
  color: string;
  attackTimer: number;
  animTimer: number;
}

interface Projectile {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetEnemyId: number;
  speed: number;
  damage: number;
  progress: number;
  heroClass: HeroClass;
  type: 'magic' | 'lightning' | 'arrow';
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  isCrit?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export const DefenseWaveModal: React.FC<DefenseWaveModalProps> = ({
  engine,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Wave & Battle state
  const [wave, setWave] = useState(1);
  const [inBattle, setInBattle] = useState(false);
  const [spireHp, setSpireHp] = useState(100);
  const [maxSpireHp, setMaxSpireHp] = useState(100);
  const [battleGold, setBattleGold] = useState(250);
  const [heroClass, setHeroClass] = useState<HeroClass>('mage');

  // Upgrades
  const [bonusDamage, setBonusDamage] = useState(0);
  const [bonusFireRate, setBonusFireRate] = useState(0);
  const [bonusRange, setBonusRange] = useState(0);

  // Status & Alerts
  const [enemiesRemaining, setEnemiesRemaining] = useState(0);
  const [isVictory, setIsVictory] = useState(false);
  const [isDefeat, setIsDefeat] = useState(false);
  const [showBossBanner, setShowBossBanner] = useState(false);
  const [bossBannerText, setBossBannerText] = useState('THE PRISONER HAS BROKEN FREE!');
  const [screenShake, setScreenShake] = useState(0);

  // Statistics
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [totalGoldEarned, setTotalGoldEarned] = useState(0);

  const kingdom = engine.getKingdomState();
  const baseDamage = kingdom.heroStats.power;
  const baseFireRate = kingdom.heroStats.fireRate;
  const baseRange = 145 + kingdom.tier * 8;

  // Refs for the high-performance animation loop
  const enemiesRef = useRef<Enemy[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lastShotTimeRef = useRef(0);
  const aimAngleRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const spireHpRef = useRef(100);
  const maxSpireHpRef = useRef(100);

  // Keep ref in sync
  useEffect(() => {
    spireHpRef.current = spireHp;
    maxSpireHpRef.current = maxSpireHp;
  }, [spireHp, maxSpireHp]);

  const startWave = () => {
    const isBossWave = wave % 2 === 0 || wave >= 3;
    const totalGoblins = 6 + wave * 3;
    const totalOrcs = Math.floor(wave * 1.5);
    const totalBosses = isBossWave ? 1 : 0;
    const totalEnemies = totalGoblins + totalOrcs + totalBosses;

    setEnemiesRemaining(totalEnemies);
    setSpireHp(maxSpireHp);
    spireHpRef.current = maxSpireHp;
    setIsVictory(false);
    setIsDefeat(false);
    setInBattle(true);

    soundManager.playWaveStart();

    // Trigger Boss Alert Banner if Boss Wave
    if (isBossWave) {
      setBossBannerText(wave === 2 ? '⚠️ THE PRISONER HAS BROKEN FREE!' : '🔥 BOSS MONSTER APPROACHING!');
      setShowBossBanner(true);
      setScreenShake(6);
      setTimeout(() => setScreenShake(0), 600);
      setTimeout(() => setShowBossBanner(false), 3200);
    }

    const newEnemies: Enemy[] = [];
    const centerX = 200;
    const centerY = 200;

    // 1. Common Goblins (Fast swarm)
    for (let i = 0; i < totalGoblins; i++) {
      const angle = (Math.PI * 2 * i) / totalGoblins + (Math.random() - 0.5) * 0.4;
      const distance = 250 + Math.random() * 90;
      newEnemies.push({
        id: Math.random(),
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        maxHp: 35 + wave * 12,
        hp: 35 + wave * 12,
        speed: 0.8 + Math.random() * 0.25,
        size: 10,
        type: 'goblin',
        name: 'Goblin Raider',
        color: '#22c55e',
        attackTimer: 0,
        animTimer: Math.random() * 10,
      });
    }

    // 2. Orc Brutes (Medium tough)
    for (let i = 0; i < totalOrcs; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 270 + Math.random() * 80;
      newEnemies.push({
        id: Math.random(),
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        maxHp: 85 + wave * 30,
        hp: 85 + wave * 30,
        speed: 0.55,
        size: 14,
        type: 'orc',
        name: 'Orc Berserker',
        color: '#f97316',
        attackTimer: 0,
        animTimer: Math.random() * 10,
      });
    }

    // 3. Giant Boss / The Prisoner (Slow, Colossal HP)
    if (totalBosses > 0) {
      const bossAngle = Math.PI * 1.5 + (Math.random() - 0.5) * 0.5; // From Top
      const distance = 300;
      newEnemies.push({
        id: Math.random(),
        x: centerX + Math.cos(bossAngle) * distance,
        y: centerY + Math.sin(bossAngle) * distance,
        maxHp: 350 + wave * 150,
        hp: 350 + wave * 150,
        speed: 0.35,
        size: 22,
        type: 'boss',
        name: wave === 2 ? 'The Prisoner' : 'Dread Fiend',
        color: '#dc2626',
        attackTimer: 0,
        animTimer: 0,
      });
    }

    enemiesRef.current = newEnemies;
    projectilesRef.current = [];
    floatingTextsRef.current = [];
    particlesRef.current = [];
  };

  // Upgrades
  const upgradeDamage = () => {
    if (battleGold >= 50) {
      setBattleGold((g) => g - 50);
      setBonusDamage((d) => d + 15);
      soundManager.playCoin();
      floatingTextsRef.current.push({
        id: Math.random(),
        x: 200,
        y: 160,
        text: '⚔️ DAMAGE UP +15!',
        color: '#fbbf24',
        life: 1.2,
      });
    }
  };

  const upgradeFireRate = () => {
    if (battleGold >= 50) {
      setBattleGold((g) => g - 50);
      setBonusFireRate((r) => r + 0.4);
      soundManager.playCoin();
      floatingTextsRef.current.push({
        id: Math.random(),
        x: 200,
        y: 160,
        text: '⚡ FIRE RATE UP +0.4/s!',
        color: '#38bdf8',
        life: 1.2,
      });
    }
  };

  const upgradeRange = () => {
    if (battleGold >= 50) {
      setBattleGold((g) => g - 50);
      setBonusRange((r) => r + 20);
      soundManager.playCoin();
      floatingTextsRef.current.push({
        id: Math.random(),
        x: 200,
        y: 160,
        text: '🎯 RANGE EXPANDED +20px!',
        color: '#a855f7',
        life: 1.2,
      });
    }
  };

  const repairSpire = () => {
    if (battleGold >= 40 && spireHpRef.current < maxSpireHpRef.current) {
      setBattleGold((g) => g - 40);
      const newHp = Math.min(maxSpireHpRef.current, spireHpRef.current + 35);
      setSpireHp(newHp);
      spireHpRef.current = newHp;
      soundManager.playHarvest();
      floatingTextsRef.current.push({
        id: Math.random(),
        x: 200,
        y: 160,
        text: '🛡️ TOWER REPAIRED +35 HP!',
        color: '#22c55e',
        life: 1.2,
      });
    }
  };

  // Canvas Game Loop
  useEffect(() => {
    if (!inBattle) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = 200;
    const centerY = 200;
    const currentRange = baseRange + bonusRange;
    const effectiveDamage = baseDamage + bonusDamage;
    const effectiveFireRate = baseFireRate + bonusFireRate;
    const shotInterval = 1000 / effectiveFireRate;

    let lastFrameTime = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(0.1, (timestamp - lastFrameTime) / 1000);
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, 400, 400);

      // 1. Draw Forest Clearing Background
      ctx.fillStyle = '#0f172a'; // Deep slate
      ctx.fillRect(0, 0, 400, 400);

      // Subtle grass texture rings
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 185, 0, Math.PI * 2);
      ctx.fill();

      // Path clearing circle
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
      ctx.fill();

      // 2. Attack Range Circle (Dashed & Pulsing)
      ctx.save();
      const pulseAlpha = 0.25 + Math.sin(timestamp * 0.004) * 0.08;
      ctx.strokeStyle = `rgba(251, 191, 36, ${pulseAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRange, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle glowing fill
      ctx.fillStyle = `rgba(251, 191, 36, 0.03)`;
      ctx.fill();
      ctx.restore();

      // 3. Auto-Targeting: Scan for nearest enemy inside Attack Range
      const enemies = enemiesRef.current;
      const enemiesInRange = enemies.filter((e) => {
        const dist = Math.hypot(e.x - centerX, e.y - centerY);
        return dist <= currentRange;
      });

      let targetEnemy: Enemy | null = null;
      if (enemiesInRange.length > 0) {
        // Sort by distance to center tower
        enemiesInRange.sort((a, b) => {
          const distA = Math.hypot(a.x - centerX, a.y - centerY);
          const distB = Math.hypot(b.x - centerX, b.y - centerY);
          return distA - distB;
        });
        targetEnemy = enemiesInRange[0];

        // Smoothly rotate hero weapon towards target
        const targetAngle = Math.atan2(targetEnemy.y - centerY, targetEnemy.x - centerX);
        aimAngleRef.current = targetAngle;

        // Auto-Attack: Continuous firing based on Fire Rate
        if (timestamp - lastShotTimeRef.current >= shotInterval) {
          lastShotTimeRef.current = timestamp;

          if (heroClass === 'archer') {
            soundManager.playArrowShoot();
          } else {
            soundManager.playMagic();
          }

          projectilesRef.current.push({
            id: Math.random(),
            startX: centerX,
            startY: centerY - 12,
            x: centerX,
            y: centerY - 12,
            targetX: targetEnemy.x,
            targetY: targetEnemy.y,
            targetEnemyId: targetEnemy.id,
            speed: heroClass === 'archer' ? 8.5 : 7.0,
            damage: effectiveDamage,
            progress: 0,
            heroClass: heroClass,
            type: heroClass === 'archer' ? 'arrow' : kingdom.tier >= 3 ? 'lightning' : 'magic',
          });
        }
      }

      // 4. Update & Render Projectiles
      const nextProjectiles: Projectile[] = [];
      for (const p of projectilesRef.current) {
        // Homing or direct trajectory
        const target = enemies.find((e) => e.id === p.targetEnemyId) || { x: p.targetX, y: p.targetY };
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= p.speed + 4) {
          // Projectile Impact
          const isCrit = Math.random() < 0.22;
          const finalDamage = Math.round(p.damage * (isCrit ? 1.75 : 1));

          soundManager.playHit();

          // Find hit enemy
          for (const e of enemies) {
            if (Math.hypot(e.x - target.x, e.y - target.y) <= e.size + 16) {
              e.hp -= finalDamage;

              // Spark particles
              for (let k = 0; k < 6; k++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 1 + Math.random() * 2;
                particlesRef.current.push({
                  x: e.x,
                  y: e.y,
                  vx: Math.cos(angle) * spd,
                  vy: Math.sin(angle) * spd,
                  color: p.heroClass === 'archer' ? '#f59e0b' : '#38bdf8',
                  size: 2.5,
                  life: 0.35,
                  maxLife: 0.35,
                });
              }

              // Floating Damage Text
              floatingTextsRef.current.push({
                id: Math.random(),
                x: e.x + (Math.random() - 0.5) * 10,
                y: e.y - e.size - 8,
                text: isCrit ? `CRIT! -${finalDamage}` : `-${finalDamage}`,
                color: isCrit ? '#f59e0b' : '#ef4444',
                life: 1.0,
                isCrit,
              });
              break;
            }
          }
        } else {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
          nextProjectiles.push(p);

          // Render Projectile
          ctx.save();
          if (p.type === 'arrow') {
            const angle = Math.atan2(dy, dx);
            ctx.translate(p.x, p.y);
            ctx.rotate(angle);

            // Wooden shaft
            ctx.strokeStyle = '#78350F';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(8, 0);
            ctx.stroke();

            // Arrow head
            ctx.fillStyle = '#CBD5E1';
            ctx.beginPath();
            ctx.moveTo(8, -3);
            ctx.lineTo(13, 0);
            ctx.lineTo(8, 3);
            ctx.closePath();
            ctx.fill();

            // White fletching
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-10, -2, 3, 4);
          } else {
            // Arcane Magic Orb
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.type === 'lightning' ? 5.5 : 4.5, 0, Math.PI * 2);
            ctx.fillStyle = p.type === 'lightning' ? '#fbbf24' : '#38bdf8';
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fill();

            // Inner core
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
          ctx.restore();
        }
      }
      projectilesRef.current = nextProjectiles;

      // 5. Update & Render Monsters
      const nextEnemies: Enemy[] = [];
      for (const e of enemies) {
        e.animTimer += dt;

        // Enemy Defeated Check
        if (e.hp <= 0) {
          soundManager.playEnemyDeath();
          setEnemiesKilled((k) => k + 1);

          const goldDrop = e.type === 'boss' ? 75 : e.type === 'orc' ? 25 : 12;
          setBattleGold((g) => g + goldDrop);
          setTotalGoldEarned((tg) => tg + goldDrop);

          // Gold Floating Text
          floatingTextsRef.current.push({
            id: Math.random(),
            x: e.x,
            y: e.y - 12,
            text: `+${goldDrop} 🪙`,
            color: '#fbbf24',
            life: 1.2,
          });

          // Death explosion particles
          for (let k = 0; k < 12; k++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1.5 + Math.random() * 3;
            particlesRef.current.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              color: e.type === 'boss' ? '#dc2626' : '#22c55e',
              size: 3.5,
              life: 0.45,
              maxLife: 0.45,
            });
          }
          continue;
        }

        // Move towards central wooden tower
        const dx = centerX - e.x;
        const dy = centerY - e.y;
        const dist = Math.hypot(dx, dy);

        // Tower perimeter contact radius
        const towerHitRadius = 32;

        if (dist <= towerHitRadius) {
          // Attack the Tower directly
          e.attackTimer += dt;
          if (e.attackTimer >= 0.8) {
            e.attackTimer = 0;
            const dmg = e.type === 'boss' ? 12 : e.type === 'orc' ? 6 : 3;

            soundManager.playHit();
            const currentHp = Math.max(0, spireHpRef.current - dmg);
            spireHpRef.current = currentHp;
            setSpireHp(currentHp);

            // Spire damage floating text
            floatingTextsRef.current.push({
              id: Math.random(),
              x: centerX + (Math.random() - 0.5) * 20,
              y: centerY - 25,
              text: `-${dmg}`,
              color: '#ef4444',
              life: 0.9,
            });
          }
        } else {
          // March directly forward
          e.x += (dx / dist) * e.speed * 60 * dt;
          e.y += (dy / dist) * e.speed * 60 * dt;
        }

        // Render Enemy Sprite
        ctx.save();
        const legOffset = Math.sin(e.animTimer * 10) * 3;

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(e.x, e.y + e.size - 1, e.size * 0.9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (e.type === 'goblin') {
          // --- Fast Green Goblin ---
          ctx.fillStyle = '#15803d'; // Green legs
          ctx.fillRect(e.x - 4, e.y + 2 - legOffset, 3, 5 + legOffset);
          ctx.fillRect(e.x + 1, e.y + 2 + legOffset, 3, 5 - legOffset);

          // Body rags
          ctx.fillStyle = '#78350f';
          ctx.fillRect(e.x - 5, e.y - 4, 10, 7);

          // Green Head
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(e.x, e.y - 7, 6, 0, Math.PI * 2);
          ctx.fill();

          // Pointy Ears
          ctx.beginPath();
          ctx.moveTo(e.x - 5, e.y - 7);
          ctx.lineTo(e.x - 11, e.y - 9);
          ctx.lineTo(e.x - 5, e.y - 4);
          ctx.moveTo(e.x + 5, e.y - 7);
          ctx.lineTo(e.x + 11, e.y - 9);
          ctx.lineTo(e.x + 5, e.y - 4);
          ctx.fill();

          // Red glowing eyes
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(e.x - 3, e.y - 8, 2, 2);
          ctx.fillRect(e.x + 1, e.y - 8, 2, 2);
        } else if (e.type === 'orc') {
          // --- Orc Berserker ---
          ctx.fillStyle = '#334155';
          ctx.fillRect(e.x - 6, e.y + 3 - legOffset, 4, 6 + legOffset);
          ctx.fillRect(e.x + 2, e.y + 3 + legOffset, 4, 6 - legOffset);

          // Muscular Torso & Spiked Shoulder
          ctx.fillStyle = '#166534';
          ctx.fillRect(e.x - 8, e.y - 5, 16, 10);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(e.x - 10, e.y - 7, 4, 4);
          ctx.fillRect(e.x + 6, e.y - 7, 4, 4);

          // Head with tusks
          ctx.beginPath();
          ctx.arc(e.x, e.y - 9, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(e.x - 3, e.y - 6, 2, 3);
          ctx.fillRect(e.x + 1, e.y - 6, 2, 3);
        } else {
          // --- The Boss / Dread Fiend ---
          ctx.fillStyle = '#4c0519';
          ctx.fillRect(e.x - 10, e.y + 6 - legOffset, 7, 10 + legOffset);
          ctx.fillRect(e.x + 3, e.y + 6 + legOffset, 7, 10 - legOffset);

          // Giant Armored Torso
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(e.x - 14, e.y - 8, 28, 16);

          // Boss Head
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(e.x, e.y - 14, 11, 0, Math.PI * 2);
          ctx.fill();

          // Giant Demon Horns
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(e.x - 7, -18 + e.y);
          ctx.lineTo(e.x - 17, -29 + e.y);
          ctx.lineTo(e.x - 4, -20 + e.y);
          ctx.moveTo(e.x + 7, -18 + e.y);
          ctx.lineTo(e.x + 17, -29 + e.y);
          ctx.lineTo(e.x + 4, -20 + e.y);
          ctx.fill();

          // Fiery Eyes
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(e.x - 5, e.y - 16, 3, 3);
          ctx.fillRect(e.x + 2, e.y - 16, 3, 3);
        }

        // Enemy HP Bar above head
        const barW = e.size * 2.2;
        const barH = 4;
        const barX = e.x - barW / 2;
        const barY = e.y - e.size - 8;
        const hpRatio = Math.max(0, e.hp / e.maxHp);

        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
        ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(barX, barY, barW * hpRatio, barH);

        ctx.restore();
        nextEnemies.push(e);
      }
      enemiesRef.current = nextEnemies;
      setEnemiesRemaining(nextEnemies.length);

      // 6. Draw Central Wooden Tower & Stationary Hero
      ctx.save();

      // Tower Wooden Base Platform
      ctx.fillStyle = '#5c2b09'; // Dark Wood Log Pillars
      ctx.fillRect(centerX - 18, centerY - 6, 8, 26);
      ctx.fillRect(centerX + 10, centerY - 6, 8, 26);
      ctx.fillRect(centerX - 6, centerY - 6, 12, 26);

      // Wooden Cross-Beams
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 16, centerY);
      ctx.lineTo(centerX + 16, centerY + 18);
      ctx.moveTo(centerX + 16, centerY);
      ctx.lineTo(centerX - 16, centerY + 18);
      ctx.stroke();

      // Top Wooden Battlement Platform
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(centerX - 24, centerY - 14, 48, 14, 4);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Platform Crenels
      ctx.fillStyle = '#78350f';
      ctx.fillRect(centerX - 24, centerY - 18, 8, 6);
      ctx.fillRect(centerX + 16, centerY - 18, 8, 6);
      ctx.fillRect(centerX - 4, centerY - 18, 8, 6);

      // Hero Character (Stationary at centerX, centerY - 20)
      const heroX = centerX;
      const heroY = centerY - 22;

      // Combat Cloak / Robe
      ctx.fillStyle = heroClass === 'mage' ? '#4338ca' : '#15803d';
      ctx.beginPath();
      ctx.moveTo(heroX - 8, heroY - 4);
      ctx.lineTo(heroX + 8, heroY - 4);
      ctx.lineTo(heroX + 10, heroY + 10);
      ctx.lineTo(heroX - 10, heroY + 10);
      ctx.closePath();
      ctx.fill();

      // Hero Head & Hat
      ctx.fillStyle = '#fde047'; // Skin
      ctx.beginPath();
      ctx.arc(heroX, heroY - 9, 6, 0, Math.PI * 2);
      ctx.fill();

      if (heroClass === 'mage') {
        // Pointy Wizard Hat
        ctx.fillStyle = '#312e81';
        ctx.beginPath();
        ctx.moveTo(heroX - 9, heroY - 9);
        ctx.lineTo(heroX, heroY - 24);
        ctx.lineTo(heroX + 9, heroY - 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fbbf24'; // Gold Hat Ribbon
        ctx.fillRect(heroX - 8, heroY - 11, 16, 2.5);
      } else {
        // Archer Green Hood
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(heroX, heroY - 11, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#fbbf24'; // Feather
        ctx.fillRect(heroX + 4, heroY - 18, 2, 7);
      }

      // Hero Weapon with Dynamic Aim Rotation
      ctx.save();
      ctx.translate(heroX, heroY);
      ctx.rotate(aimAngleRef.current);

      if (heroClass === 'mage') {
        // Mystic Arcane Staff
        ctx.fillStyle = '#78350f';
        ctx.fillRect(4, -2, 18, 4); // Shaft
        // Crystal Tip
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(23, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        // Glowing crystal glow
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(23, 0, 9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Recurve Longbow
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(12, 0, 12, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();

        // Bowstring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(18, -10);
        ctx.lineTo(18, 10);
        ctx.stroke();
      }
      ctx.restore();

      // Spire 100/100 HP Bar & Display directly over tower
      const spireHpRatio = Math.max(0, spireHpRef.current / maxSpireHpRef.current);
      const hpBarW = 60;
      const hpBarX = centerX - hpBarW / 2;
      const hpBarY = centerY + 24;

      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.roundRect(hpBarX - 2, hpBarY - 2, hpBarW + 4, 10, 3);
      ctx.fill();

      ctx.fillStyle = spireHpRatio > 0.5 ? '#22c55e' : spireHpRatio > 0.25 ? '#eab308' : '#ef4444';
      ctx.roundRect(hpBarX, hpBarY, hpBarW * spireHpRatio, 6, 2);
      ctx.fill();

      // Exact numerical HP text
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(`${spireHpRef.current}/${maxSpireHpRef.current} HP`, centerX, hpBarY + 17);

      ctx.restore();

      // 7. Update & Draw Particles
      const nextParticles: Particle[] = [];
      for (const pt of particlesRef.current) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= dt;
        if (pt.life > 0) {
          ctx.fillStyle = pt.color;
          ctx.globalAlpha = pt.life / pt.maxLife;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
          nextParticles.push(pt);
        }
      }
      particlesRef.current = nextParticles;

      // 8. Update & Draw Floating Combat Text
      const nextTexts: FloatingText[] = [];
      for (const ft of floatingTextsRef.current) {
        ft.y -= 0.7;
        ft.life -= 0.025;
        if (ft.life > 0) {
          ctx.font = ft.isCrit ? 'bold 13px sans-serif' : 'bold 11px sans-serif';
          ctx.fillStyle = ft.color;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.9)';
          ctx.shadowBlur = 4;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.shadowBlur = 0;
          nextTexts.push(ft);
        }
      }
      floatingTextsRef.current = nextTexts;

      // Check Defeat: Spire HP reaches 0
      if (spireHpRef.current <= 0) {
        setIsDefeat(true);
        setInBattle(false);
        soundManager.playEnemyDeath();
        return;
      }

      // Check Victory: All wave enemies destroyed
      if (nextEnemies.length === 0) {
        setIsVictory(true);
        setInBattle(false);
        soundManager.playWaveVictory();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        return;
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [inBattle, baseDamage, baseFireRate, bonusDamage, bonusFireRate, bonusRange, heroClass, kingdom]);

  return (
    <div
      id="defense-wave-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: screenShake ? (Math.random() - 0.5) * screenShake * 2 : 0,
        }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[96vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Stationary Tower Defense
                </h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Wave {wave}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                برج المراقبة الخشبي الثابت والتصويب التلقائي المحكم
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Hero Class Selector */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setHeroClass('mage')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  heroClass === 'mage'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="الساحر (Mage Magic Orbs)"
              >
                <Wand2 className="w-3.5 h-3.5" /> ساحر
              </button>
              <button
                onClick={() => setHeroClass('archer')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  heroClass === 'archer'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="رامي السهام (Archer Bow & Arrows)"
              >
                <Crosshair className="w-3.5 h-3.5" /> رامي
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cinematic Boss Warning Alert Banner */}
        <AnimatePresence>
          {showBossBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-4 py-2 flex items-center justify-center gap-2 text-white font-extrabold text-xs sm:text-sm tracking-wider shadow-lg shadow-red-900/50"
            >
              <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
              <span>{bossBannerText}</span>
              <AlertTriangle className="w-5 h-5 text-amber-300 animate-bounce" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Canvas Container */}
        <div className="relative bg-slate-950 flex items-center justify-center p-3 sm:p-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full max-w-[360px] aspect-square rounded-2xl border border-slate-800 shadow-2xl"
          />

          {/* Overlays for Pre-Battle / Victory / Defeat */}
          {!inBattle && !isVictory && !isDefeat && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl m-3 sm:m-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-100">Ready for Wave {wave}?</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                  يقف البطل بثبات في أعلى البرج الخشبي، ويقوم بالتصويب التلقائي وإطلاق المقذوفات المستمرة على الأعداء القادمين.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-current" /> {spireHp} HP
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                  <Coins className="w-3.5 h-3.5" /> {battleGold} Gold
                </span>
              </div>

              <button
                onClick={startWave}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition"
              >
                <Play className="w-5 h-5 fill-current" /> بدء المعركة والدفاع (Start)
              </button>
            </div>
          )}

          {/* Victory Overlay */}
          {isVictory && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl m-3 sm:m-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-emerald-400">Wave {wave} Cleared!</h3>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                صمد البرج بنجاح ضد هجوم الوحوش! كسبت +120 عملة ذهبية ومكافآت تطوير جديدة.
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setWave((w) => w + 1);
                    setIsVictory(false);
                    setBattleGold((g) => g + 120);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-slate-950 transition shadow-md shadow-amber-500/20"
                >
                  الموجة التالية ({wave + 1})
                </button>
              </div>
            </div>
          )}

          {/* FAIL (Defeat) Overlay */}
          {isDefeat && (
            <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl m-3 sm:m-4 border border-rose-600/50 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Skull className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-rose-500 tracking-wider">FAIL</h3>
                <p className="text-xs text-slate-200 mt-1 max-w-xs leading-relaxed">
                  تم تدمير البرج الخشبي بواسطة جحافل الوحوش! قم بترقية قوة الضربات وسرعة الإطلاق وأعد المحاولة.
                </p>
              </div>

              <div className="text-xs text-slate-400 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 flex gap-4">
                <span>⚔️ وحوش قُتلت: {enemiesKilled}</span>
                <span>🪙 ذهب مكتسب: {totalGoldEarned}</span>
              </div>

              <button
                onClick={startWave}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-100 border border-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4" /> إعادة المحاولة (Retry Wave {wave})
              </button>
            </div>
          )}
        </div>

        {/* Top In-Battle Status Bar */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-rose-400">
            <Heart className="w-4 h-4 fill-current" />
            <span>صحة البرج: {spireHp} / {maxSpireHp} HP</span>
          </div>

          <div className="flex items-center gap-1 text-yellow-400 font-mono">
            <Coins className="w-4 h-4" />
            <span>{battleGold} 🪙</span>
          </div>

          <div className="flex items-center gap-1 text-purple-300">
            <Skull className="w-4 h-4" />
            <span>الوحوش المتبقية: {enemiesRemaining}</span>
          </div>
        </div>

        {/* In-Battle Interactive Upgrade Action Buttons (Prompt Requirement!) */}
        <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800/80 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
            <span>ترقيات البطل والبرج المباشرة (Instant Upgrades):</span>
            <span className="text-amber-400/90 font-mono">تزيد القوة فوراً</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Upgrade Damage */}
            <button
              onClick={upgradeDamage}
              disabled={battleGold < 50}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/40 text-purple-200 text-xs font-bold disabled:opacity-40 transition active:scale-95 shadow-xs"
            >
              <div className="flex items-center gap-1 text-purple-400">
                <Zap className="w-3.5 h-3.5" />
                <span>الضرر +15</span>
              </div>
              <span className="text-[10px] font-mono text-yellow-400 mt-0.5">50 🪙</span>
            </button>

            {/* Upgrade Fire Rate */}
            <button
              onClick={upgradeFireRate}
              disabled={battleGold < 50}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-700/40 text-amber-200 text-xs font-bold disabled:opacity-40 transition active:scale-95 shadow-xs"
            >
              <div className="flex items-center gap-1 text-amber-400">
                <Flame className="w-3.5 h-3.5" />
                <span>السرعة +0.4/s</span>
              </div>
              <span className="text-[10px] font-mono text-yellow-400 mt-0.5">50 🪙</span>
            </button>

            {/* Upgrade Range */}
            <button
              onClick={upgradeRange}
              disabled={battleGold < 50}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-700/40 text-blue-200 text-xs font-bold disabled:opacity-40 transition active:scale-95 shadow-xs"
            >
              <div className="flex items-center gap-1 text-blue-400">
                <Radio className="w-3.5 h-3.5" />
                <span>النطاق +20px</span>
              </div>
              <span className="text-[10px] font-mono text-yellow-400 mt-0.5">50 🪙</span>
            </button>

            {/* Repair Tower */}
            <button
              onClick={repairSpire}
              disabled={battleGold < 40 || spireHp >= maxSpireHp}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-200 text-xs font-bold disabled:opacity-40 transition active:scale-95 shadow-xs"
            >
              <div className="flex items-center gap-1 text-emerald-400">
                <Heart className="w-3.5 h-3.5" />
                <span>ترميم البرج +35</span>
              </div>
              <span className="text-[10px] font-mono text-yellow-400 mt-0.5">40 🪙</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
