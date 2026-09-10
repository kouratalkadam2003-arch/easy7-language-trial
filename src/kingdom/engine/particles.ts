export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'square' | 'spark' | 'smoke' | 'ring';
  gravity?: number;
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  life: number;
  maxLife: number;
  vy: number;
  icon?: string;
  isBold?: boolean;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private textCounter: number = 0;

  public update(dt: number) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.gravity) {
        p.vy += p.gravity * dt * 60;
      }
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.vRot) {
        p.rotation = (p.rotation || 0) + p.vRot * dt * 60;
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt * 60;
      ft.vy *= 0.95; // decelerate upward speed
    }
  }

  public addFloatingText(
    text: string,
    x: number,
    y: number,
    color: string = '#ffffff',
    fontSize: number = 16,
    icon?: string,
    isBold: boolean = true
  ) {
    this.textCounter++;
    this.floatingTexts.push({
      id: `ft_${this.textCounter}`,
      text,
      x: x + (Math.random() * 20 - 10),
      y: y - 10,
      color,
      fontSize,
      life: 1.0,
      maxLife: 1.0,
      vy: -1.8,
      icon,
      isBold,
    });
  }

  public emitWoodChips(x: number, y: number, count: number = 8) {
    const colors = ['#8B5A2B', '#A0522D', '#CD853F', '#DEB887'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        shape: 'square',
        gravity: 0.15,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  public emitStoneRubble(x: number, y: number, count: number = 8) {
    const colors = ['#708090', '#778899', '#A9A9A9', '#D3D3D3'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.8,
        size: 2.5 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        shape: 'square',
        gravity: 0.2,
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.4,
      });
    }
  }

  public emitSparks(x: number, y: number, count: number = 10, color: string = '#FBBF24') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.3 ? color : '#FFFFFF',
        alpha: 1,
        life: 0.25 + Math.random() * 0.25,
        maxLife: 0.5,
        shape: 'spark',
        gravity: 0.08,
      });
    }
  }

  public emitBlood(x: number, y: number, count: number = 8) {
    const colors = ['#DC2626', '#991B1B', '#EF4444', '#7F1D1D'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.55,
        shape: 'circle',
        gravity: 0.1,
      });
    }
  }

  public emitExplosion(x: number, y: number, radius: number = 30) {
    // Fire sparks
    this.emitSparks(x, y, 20, '#F97316');

    // Smoke
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radius * 0.6);
      const speed = 0.5 + Math.random() * 1.5;
      this.particles.push({
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        size: 8 + Math.random() * 12,
        color: Math.random() > 0.5 ? '#4B5563' : '#9CA3AF',
        alpha: 0.8,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        shape: 'smoke',
      });
    }

    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 5,
      color: '#FEF08A',
      alpha: 1,
      life: 0.3,
      maxLife: 0.3,
      shape: 'ring',
    });
  }

  public emitChimneySmoke(x: number, y: number) {
    this.particles.push({
      x: x + (Math.random() * 4 - 2),
      y: y + (Math.random() * 4 - 2),
      vx: (Math.random() - 0.5) * 0.3 + 0.15,
      vy: -0.9 - Math.random() * 0.4,
      size: 4 + Math.random() * 4,
      color: Math.random() > 0.5 ? '#CBD5E1' : '#94A3B8',
      alpha: 0.65,
      life: 1.2 + Math.random() * 0.5,
      maxLife: 1.7,
      shape: 'smoke',
    });
  }

  public emitMagicGlow(x: number, y: number, count: number = 10, color: string = '#38BDF8') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        size: 3 + Math.random() * 3,
        color: Math.random() > 0.4 ? color : '#E0F2FE',
        alpha: 1,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        shape: 'spark',
      });
    }
  }

  public emitRestorationWave(x: number, y: number, count: number = 30) {
    const colors = ['#22C55E', '#4ADE80', '#86EFAC', '#FDE047', '#38BDF8'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 5.0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        shape: 'spark',
      });
    }
    // Radiant expanding restoration ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 45,
      color: '#4ADE80',
      alpha: 1,
      life: 0.9,
      maxLife: 0.9,
      shape: 'ring',
    });
  }

  public emitDust(x: number, y: number, count: number = 4) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.3 - Math.random() * 0.6,
        size: 2.5 + Math.random() * 3,
        color: '#9CA3AF',
        alpha: 0.5,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        shape: 'smoke',
      });
    }
  }

  public emitConstructionDust(x: number, y: number, width: number, height: number) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + Math.random() * width,
        y: y + Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 1.5,
        size: 4 + Math.random() * 6,
        color: '#D1D5DB',
        alpha: 0.6,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        shape: 'smoke',
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, camera: { worldToScreen: (x: number, y: number) => { sx: number; sy: number } }) {
    // Render particles
    ctx.save();
    for (const p of this.particles) {
      const { sx, sy } = camera.worldToScreen(p.x, p.y);
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'circle') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'square') {
        ctx.save();
        ctx.translate(sx, sy);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.shape === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * (1 + (1 - p.alpha) * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ring') {
        const ringRadius = 35 * (1 - p.alpha);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * p.alpha;
        ctx.beginPath();
        ctx.arc(sx, sy, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Render floating text popups
    ctx.save();
    for (const ft of this.floatingTexts) {
      const { sx, sy } = camera.worldToScreen(ft.x, ft.y);
      const alpha = Math.min(1, ft.life / (ft.maxLife * 0.3)); // hold solid then fade
      ctx.globalAlpha = alpha;

      ctx.font = `${ft.isBold ? 'bold ' : ''}${ft.fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text Shadow / Stroke for readability
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 3.5;
      ctx.strokeText(ft.text, sx, sy);

      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sx, sy);
    }
    ctx.restore();
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
  }
}
