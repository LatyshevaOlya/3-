import { resolvePlatformCollision } from './collision.js';

export class Player {
  constructor(x, y) {
    this.width = 58;
    this.height = 58;
    this.startX = x;
    this.startY = y;

    this.image = null;

    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.speed = 300;
    this.jumpSpeed = -700;
    this.gravity = 1800;
    this.onGround = false;
    this.facing = 1;
  }

  getBox() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }

  setImage(image) {
    this.image = image;
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
      const imageRatio = image.naturalWidth / image.naturalHeight;
      const boxRatio = this.width / this.height;

      let drawWidth = this.width;
      let drawHeight = this.height;

      if (imageRatio > boxRatio) {
        drawHeight = this.width / imageRatio;
      } else {
        drawWidth = this.height * imageRatio;
      }

      const drawX = this.x + (this.width - drawWidth) / 2;
      const drawY = this.y + (this.height - drawHeight);

      ctx.drawImage(
        image,
        drawX - cameraX,
        drawY,
        drawWidth,
        drawHeight
      );

      return;
    }

    ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
    ctx.fillRect(this.x - cameraX, this.y, this.width, this.height);
  }
}