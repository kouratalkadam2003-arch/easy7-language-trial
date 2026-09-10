export class Camera {
  public x: number = 0;
  public y: number = 0;
  public targetX: number = 0;
  public targetY: number = 0;
  public viewportWidth: number = 800;
  public viewportHeight: number = 600;
  public worldWidth: number = 3200;
  public worldHeight: number = 3200;
  public lerpSpeed: number = 0.12;

  // Screen shake
  private shakeTime: number = 0;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  public shakeOffsetX: number = 0;
  public shakeOffsetY: number = 0;

  constructor(viewportWidth: number, viewportHeight: number, worldWidth: number, worldHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  public resize(width: number, height: number) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  public follow(targetX: number, targetY: number, instant: boolean = false) {
    this.targetX = targetX - this.viewportWidth / 2;
    this.targetY = targetY - this.viewportHeight / 2;

    // Clamp target to world boundaries
    this.targetX = Math.max(0, Math.min(this.worldWidth - this.viewportWidth, this.targetX));
    this.targetY = Math.max(0, Math.min(this.worldHeight - this.viewportHeight, this.targetY));

    if (instant) {
      this.x = this.targetX;
      this.y = this.targetY;
    }
  }

  public triggerShake(intensity: number = 6, durationSec: number = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = durationSec;
    this.shakeTime = durationSec;
  }

  public update(dt: number) {
    // Smooth camera lerp
    this.x += (this.targetX - this.x) * Math.min(1, this.lerpSpeed * 60 * dt);
    this.y += (this.targetY - this.y) * Math.min(1, this.lerpSpeed * 60 * dt);

    // Update screen shake
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const progress = this.shakeTime / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  public worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
    return {
      sx: Math.round(wx - this.x + this.shakeOffsetX),
      sy: Math.round(wy - this.y + this.shakeOffsetY),
    };
  }

  public screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
    return {
      wx: sx + this.x - this.shakeOffsetX,
      wy: sy + this.y - this.shakeOffsetY,
    };
  }

  public isVisible(wx: number, wy: number, width: number, height: number, margin: number = 100): boolean {
    const left = this.x - margin;
    const right = this.x + this.viewportWidth + margin;
    const top = this.y - margin;
    const bottom = this.y + this.viewportHeight + margin;

    return wx + width >= left && wx <= right && wy + height >= top && wy <= bottom;
  }
}
