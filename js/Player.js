import { resolvePlatformCollision } from './collision.js';

export class Player {
  constructor(x, y) {
    this.width = 52;
    this.height = 52;
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
    this.jumpSpeed = -660;
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
    const image = this.image;

    if (image?.complete && image.naturalWidth > 0) {
      const ratio = image.naturalWidth / image.naturalHeight;
      const boxRatio = this.width / this.height;

      let drawWidth = this.width;
      let drawHeight = this.height;

      if (ratio > boxRatio) {
        drawHeight = this.width / ratio;
      } else {
        drawWidth = this.height * ratio;
      }

      const drawX = this.x + (this.width - drawWidth) / 2;
      const drawY = this.y + (this.height - drawHeight);

      ctx.drawImage(image, drawX - cameraX, drawY, drawWidth, drawHeight);
      return;
    }

    ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }

  setImage(image) {
    this.image = image;
  }
}