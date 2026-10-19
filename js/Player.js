import { resolvePlatformCollision } from './collision.js';

export class Player {
  constructor(x, y) {
    this.width = 34;
    this.height = 34;
    this.startX = x;
    this.startY = y;

    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.speed = 280;
    this.jumpSpeed = -620;
    this.gravity = 1700;
    this.onGround = false;
    this.facing = 1;
    this.animationTime = 0;
  }

  getBox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  update(dt, input, platforms, worldWidth) {
    const previous = {
      x: this.x,
      y: this.y
    };

    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.vx = direction * this.speed;

    if (direction !== 0) {
      this.facing = direction;
      this.animationTime += dt;
    }

    if (input.consumeJump() && this.onGround) {
      this.vy = this.jumpSpeed;
      this.onGround = false;
    }

    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = Math.max(0, Math.min(this.x, worldWidth - this.width));
    this.onGround = false;

    for (const platform of platforms) {
      resolvePlatformCollision(this, platform, previous);
    }
  }

  render(ctx, cameraX) {
    const x = this.x - cameraX;
    const y = this.y;
    const bounce = this.onGround ? Math.sin(this.animationTime * 14) * 1.5 : 0;

    ctx.fillStyle = '#5ec26a';
    ctx.beginPath();
    ctx.ellipse(x + 17, y + 20 + bounce, 17, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7ee787';
    ctx.beginPath();
    ctx.ellipse(x + 17, y + 14 + bounce, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + 12 + this.facing * 2, y + 12 + bounce, 4.5, 0, Math.PI * 2);
    ctx.arc(x + 22 + this.facing * 2, y + 12 + bounce, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x + 12 + this.facing * 3, y + 12 + bounce, 2, 0, Math.PI * 2);
    ctx.arc(x + 22 + this.facing * 3, y + 12 + bounce, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#3f9b4c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(x + 10, y + 31 + bounce);
    ctx.lineTo(x + 8, y + 38 + bounce);
    ctx.moveTo(x + 24, y + 31 + bounce);
    ctx.lineTo(x + 26, y + 38 + bounce);
    ctx.stroke();
  }
}