import { Player } from './Player.js';
import { intersects } from './collision.js';

const WORLD_WIDTH = 7200;
const REQUIRED_FIREFLIES = 20;
const STORAGE_KEY = 'frogAdventureRecord';
const LEVEL_LIFT = 45;
const CAMERA_ZOOM = 1.25;

const ASSETS = {
  frog: 'assets/legu1.png',

  sweetkingdom: 'assets/sweetkingdom.png',
  swamp: 'assets/swamp.png',
  cloudkingdom: 'assets/cloudkingdom.png',
  icekingdom: 'assets/icekingdom.png',

  cake0: 'assets/cake.png',
  cake1: 'assets/cake1.png',
  cake2: 'assets/cake2.png',
  cake3: 'assets/cake3.png',
  cake4: 'assets/cake4.png',
  cake5: 'assets/cake5.png',

  cart: 'assets/cart.png',
  banana: 'assets/banstay.png',
  bananaLying: 'assets/bunlying.png',

  bird: 'assets/bird.png',
  swampCloud: 'assets/cloud.png',

  cloudCitizen0: 'assets/cloudp.png',
  cloudCitizen1: 'assets/cloudp1.png',
  cloudCitizen2: 'assets/cloudp2.png',
  cloudCitizen3: 'assets/cloudp3.png',
  cloudCitizen4: 'assets/cloudp4.png',
  cloudCitizen5: 'assets/cloudp5.png',
  cloudCitizen6: 'assets/cloudp6.png',
  cloudCitizen7: 'assets/cloudp7.png',

  penguin: 'assets/pin.png',
  penguin2: 'assets/pin2.png',
  penguinLying: 'assets/pinlyung.png'
};

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;

    this.images = {};
    this.state = 'menu';
    this.cameraX = 0;
    this.lastTime = 0;
    this.rafId = null;

    this.viewWidth = 960;
    this.viewHeight = 540;

    this.level = this.#createLevel();
    this.player = new Player(80, 380 - LEVEL_LIFT);

    this.record = this.#loadRecord();
    this.ui.record.textContent = `Рекорд: ${this.record}`;

    this.#bindUI();
    this.#resize();
    this.#loadAssets();
    this.#render();
  }

  #resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.viewWidth = this.canvas.width / CAMERA_ZOOM;
    this.viewHeight = this.canvas.height / CAMERA_ZOOM;

    this.#render();
  }

  #loadAssets() {
    const names = Object.keys(ASSETS);
    let loaded = 0;

    names.forEach((name) => {
      const image = new Image();
      image.src = ASSETS[name];

      image.onload = () => {
        loaded += 1;

        if (name === 'frog') {
          this.player.setImage(image);
        }

        if (loaded === names.length) {
          this.#render();
        }
      };

      image.onerror = () => {
        console.warn(`Не удалось загрузить рисунок: ${ASSETS[name]}`);
        loaded += 1;

        if (loaded === names.length) {
          this.#render();
        }
      };

      this.images[name] = image;
    });
  }

  #createLevel() {
    const ground = (x, w, y = 520) => ({
      x,
      y: y - LEVEL_LIFT,
      width: w,
      height: 80,
      kind: 'ground'
    });

    const platform = (x, y, w, kind = 'platform') => ({
      x,
      y: y - LEVEL_LIFT,
      width: w,
      height: 24,
      kind
    });

    const platforms = [
      ground(0, 1700),
      platform(380, 420, 170),
      platform(680, 330, 160),
      platform(1000, 420, 180),
      platform(1330, 320, 170),

      platform(1700, 500, 150, 'lily'),
      platform(1960, 430, 140, 'lily'),
      platform(2220, 360, 150, 'cloud'),
      platform(2500, 450, 160, 'lily'),
      platform(2780, 350, 160, 'cloud'),
      platform(3060, 430, 160, 'lily'),
      platform(3320, 320, 190, 'cloud'),

      platform(3600, 460, 170, 'cloud'),
      platform(3880, 370, 160, 'cloud'),
      platform(4160, 280, 160, 'cloud'),
      platform(4450, 390, 170, 'cloud'),
      platform(4740, 300, 170, 'cloud'),
      platform(5030, 410, 180, 'cloud'),

      platform(5350, 480, 170),
      platform(5640, 390, 160),
      platform(5930, 300, 160),
      platform(6220, 400, 170),
      platform(6510, 310, 170),
      platform(6800, 430, 200),
      ground(7050, 150)
    ];

    const decorations = [
      { image: 'cake0', x: 180, y: 390 - LEVEL_LIFT, width: 110, height: 125 },
      { image: 'cake1', x: 520, y: 400 - LEVEL_LIFT, width: 100, height: 115 },
      { image: 'cake2', x: 820, y: 395 - LEVEL_LIFT, width: 105, height: 120 },
      { image: 'cake3', x: 1150, y: 402 - LEVEL_LIFT, width: 95, height: 110 },
      { image: 'cake4', x: 1450, y: 398 - LEVEL_LIFT, width: 100, height: 115 },
      { image: 'cake5', x: 1600, y: 404 - LEVEL_LIFT, width: 92, height: 106 },

      { image: 'cake0', x: 700, y: 402 - LEVEL_LIFT, width: 88, height: 100 },
      { image: 'cake1', x: 1060, y: 406 - LEVEL_LIFT, width: 84, height: 96 },
      { image: 'cake2', x: 1380, y: 400 - LEVEL_LIFT, width: 90, height: 104 },
      { image: 'cake3', x: 240, y: 408 - LEVEL_LIFT, width: 82, height: 94 },
      { image: 'cake4', x: 940, y: 410 - LEVEL_LIFT, width: 80, height: 92 },
      { image: 'cake5', x: 1240, y: 406 - LEVEL_LIFT, width: 86, height: 98 },

      { image: 'swampCloud', x: 1850, y: 190 - LEVEL_LIFT, width: 190, height: 105 },
      { image: 'swampCloud', x: 2600, y: 150 - LEVEL_LIFT, width: 210, height: 115 },
      { image: 'swampCloud', x: 3150, y: 185 - LEVEL_LIFT, width: 175, height: 96 },

      { image: 'cloudCitizen0', x: 3650, y: 220 - LEVEL_LIFT, width: 85, height: 95 },
      { image: 'cloudCitizen1', x: 4250, y: 180 - LEVEL_LIFT, width: 80, height: 90 },
      { image: 'cloudCitizen2', x: 4850, y: 215 - LEVEL_LIFT, width: 85, height: 95 },
      { image: 'cloudCitizen3', x: 5150, y: 175 - LEVEL_LIFT, width: 80, height: 90 }
    ];

    const fireflies = [];
    const positions = [
      [420, 380], [720, 290], [1040, 380], [1370, 280],
      [1740, 460], [2000, 390], [2260, 320], [2540, 410],
      [2820, 310], [3100, 390], [3360, 280],
      [3640, 420], [3920, 330], [4200, 240], [4490, 350],
      [4780, 260], [5070, 370],
      [5390, 440], [5680, 350], [5970, 260]
    ];

    positions.forEach(([x, y]) => {
      fireflies.push({
        x,
        y: y - LEVEL_LIFT,
        collected: false
      });
    });

    const hazards = [
      { type: 'banana', x: 550, y: 420 - LEVEL_LIFT, width: 85, height: 90, min: 450, max: 900, speed: 130, direction: 1 },
      { type: 'banana', x: 1150, y: 420 - LEVEL_LIFT, width: 85, height: 90, min: 1050, max: 1550, speed: 155, direction: -1 },
      { type: 'cart', x: 1350, y: 400 - LEVEL_LIFT, width: 130, height: 115, min: 1250, max: 1650, speed: 110, direction: 1 },

      { type: 'banana', x: 1750, y: 450 - LEVEL_LIFT, width: 85, height: 90, min: 1700, max: 2100, speed: 120, direction: 1 },
      { type: 'cart', x: 2450, y: 400 - LEVEL_LIFT, width: 130, height: 115, min: 2350, max: 2750, speed: 100, direction: -1 },

      { type: 'bird', x: 2200, y: 230 - LEVEL_LIFT, width: 115, height: 82, min: 2100, max: 2600, speed: 180, direction: 1 },
      { type: 'bird', x: 2900, y: 200 - LEVEL_LIFT, width: 115, height: 82, min: 2800, max: 3300, speed: 200, direction: -1 },

      { type: 'cloudCitizen', x: 3700, y: 290 - LEVEL_LIFT, width: 85, height: 95, min: 3600, max: 4050, speed: 145, direction: 1, imageIndex: 4 },
      { type: 'cloudCitizen', x: 4400, y: 300 - LEVEL_LIFT, width: 85, height: 95, min: 4300, max: 4800, speed: 165, direction: -1, imageIndex: 5 },
      { type: 'cloudCitizen', x: 5000, y: 280 - LEVEL_LIFT, width: 85, height: 95, min: 4900, max: 5350, speed: 150, direction: 1, imageIndex: 6 },

      { type: 'icicle', x: 5600, y: 200 - LEVEL_LIFT, width: 36, height: 78, min: 5550, max: 5950, speed: 0, direction: 0 },
      { type: 'icicle', x: 6150, y: 120 - LEVEL_LIFT, width: 36, height: 78, min: 6100, max: 6500, speed: 0, direction: 0 },
      { type: 'icicle', x: 6700, y: 150 - LEVEL_LIFT, width: 36, height: 78, min: 6650, max: 7050, speed: 0, direction: 0 }
    ];

    const crown = {
      x: 7050,
      y: 350 - LEVEL_LIFT,
      width: 120,
      height: 120,
      taken: false
    };

    const penguin = {
      x: 6950,
      y: 400 - LEVEL_LIFT,
      width: 110,
      height: 120
    };

    return {
      platforms,
      decorations,
      fireflies,
      hazards,
      crown,
      penguin
    };
  }

  #bindUI() {
    this.ui.start.addEventListener('click', () => this.start());
    this.ui.pause.addEventListener('click', () => this.togglePause());
    this.ui.restart.addEventListener('click', () => this.restart());
    this.ui.overlayButton.addEventListener('click', () => this.start());

    window.addEventListener('resize', () => this.#resize());

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing') {
        this.pause();
      }
    });
  }

  start() {
    if (this.state === 'playing') return;

    if (this.state === 'menu' || this.state === 'won' || this.state === 'lost') {
      this.#resetLevel();
    }

    this.state = 'playing';
    this.lastTime = performance.now();
    this.ui.overlay.classList.add('hidden');
    this.#startLoop();
  }

  pause() {
    if (this.state !== 'playing') return;

    this.state = 'paused';
    this.#stopLoop();
    this.input?.clear();
    this.#showOverlay('Пауза', 'Игра остановлена. Нажми «Продолжить».');
    this.ui.overlayButton.textContent = 'Продолжить';
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.start();
  }

  restart() {
    this.#stopLoop();
    this.#resetLevel();
    this.#showOverlay(
      'Заново',
      'Собери 20 светлячков и доберись до короны.'
    );
    this.ui.overlayButton.textContent = 'Начать игру';
    this.state = 'menu';
  }

  #resetLevel() {
    this.level = this.#createLevel();
    this.player.reset();
    this.cameraX = 0;
    this.score = 0;

    if (this.images.frog) {
      this.player.setImage(this.images.frog);
    }

    this.ui.score.textContent = `Светлячки: 0 / ${REQUIRED_FIREFLIES}`;
    this.ui.zone.textContent = 'Локация: Королевство сладостей';
  }

  #startLoop() {
    if (this.rafId !== null) return;

    const loop = (time) => {
      const rawDt = (time - this.lastTime) / 1000;
      this.lastTime = time;
      const dt = Math.min(rawDt, 1 / 30);

      this.#update(dt);
      this.#render();

      if (this.state === 'playing') {
        this.rafId = requestAnimationFrame(loop);
      } else {
        this.rafId = null;
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  #stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  #update(dt) {
    this.player.update(dt, this.input, this.level.platforms, WORLD_WIDTH);

    this.cameraX = Math.max(
      0,
      Math.min(
        this.player.x - this.viewWidth / 2 + this.player.width / 2,
        WORLD_WIDTH - this.viewWidth
      )
    );

    this.#updateHazards(dt);
    this.#checkPickups();
    this.#checkDanger();
    this.#updateHud();
  }

  #updateHazards(dt) {
    for (const hazard of this.level.hazards) {
      if (hazard.speed === 0) continue;

      hazard.x += hazard.speed * hazard.direction * dt;

      if (hazard.x <= hazard.min) {
        hazard.x = hazard.min;
        hazard.direction = 1;
      }

      if (hazard.x + hazard.width >= hazard.max) {
        hazard.x = hazard.max - hazard.width;
        hazard.direction = -1;
      }
    }
  }

  #checkPickups() {
    const playerBox = this.player.getBox();

    for (const firefly of this.level.fireflies) {
      if (
        !firefly.collected &&
        intersects(playerBox, {
          x: firefly.x - 18,
          y: firefly.y - 18,
          width: 36,
          height: 36
        })
      ) {
        firefly.collected = true;
        this.score += 1;
      }
    }

    const crown = this.level.crown;
    const penguinBox = {
      x: this.level.penguin.x,
      y: this.level.penguin.y,
      width: this.level.penguin.width,
      height: this.level.penguin.height
    };

    if (
      !crown.taken &&
      this.score >= REQUIRED_FIREFLIES &&
      intersects(playerBox, penguinBox)
    ) {
      crown.taken = true;
      this.#win();
    }
  }

  #checkDanger() {
    const playerBox = this.player.getBox();

    if (playerBox.y > this.viewHeight + 120) {
      this.#lose('Лягушка упала!');
      return;
    }

    for (const hazard of this.level.hazards) {
      if (intersects(playerBox, hazard)) {
        this.#lose('Осторожно! Опасность!');
        return;
      }
    }
  }

  #updateHud() {
    this.ui.score.textContent = `Светлячки: ${this.score} / ${REQUIRED_FIREFLIES}`;
    this.ui.zone.textContent = `Локация: ${this.#getZoneName()}`;
  }

  #getZoneName() {
    const x = this.player.x;

    if (x < 1700) return 'Королевство сладостей';
    if (x < 3500) return 'Болото';
    if (x < 5350) return 'Облачное королевство';
    return 'Ледяное королевство';
  }

  #win() {
    this.state = 'won';
    this.#stopLoop();
    this.input.clear();

    if (this.score > this.record) {
      this.record = this.score;
      this.#saveRecord(this.record);
      this.ui.record.textContent = `Рекорд: ${this.record}`;
    }

    this.#showOverlay(
      'Победа!',
      'Лягушка получила корону и стала королевой приключений!'
    );
    this.ui.overlayButton.textContent = 'Играть снова';
  }

  #lose(message) {
    this.state = 'lost';
    this.#stopLoop();
    this.input.clear();
    this.#showOverlay('Поражение', message);
    this.ui.overlayButton.textContent = 'Заново';
  }

  #showOverlay(title, text) {
    this.ui.overlayTitle.textContent = title;
    this.ui.overlayText.textContent = text;
    this.ui.overlay.classList.remove('hidden');
  }

  #loadRecord() {
    try {
      return Number(localStorage.getItem(STORAGE_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  #saveRecord(value) {
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* Хранилище недоступно */
    }
  }

  #render() {
    const ctx = this.ctx;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.#renderBackground();

    ctx.scale(CAMERA_ZOOM, CAMERA_ZOOM);
    ctx.translate(-this.cameraX, 0);

    this.#renderDecorations();
    this.#renderFireflies();
    this.#renderHazards();
    this.#renderFinish();
    this.#renderPlayer();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  #renderBackground() {
    const ctx = this.ctx;
    const zone = this.#getZoneName();

    const backgroundNames = {
      'Королевство сладостей': 'sweetkingdom',
      'Болото': 'swamp',
      'Облачное королевство': 'cloudkingdom',
      'Ледяное королевство': 'icekingdom'
    };

    const image = this.images[backgroundNames[zone]];

    if (image?.complete && image.naturalWidth > 0) {
      ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  #renderDecorations() {
    for (const item of this.level.decorations) {
      this.#drawImage(item.image, item.x, item.y, item.width, item.height);
    }
  }

  #renderFireflies() {
    const ctx = this.ctx;
    const time = performance.now() / 500;

    for (const firefly of this.level.fireflies) {
      if (firefly.collected) continue;

      const glow = 10 + Math.sin(time + firefly.x) * 3;

      ctx.fillStyle = 'rgba(255, 236, 120, 0.35)';
      ctx.beginPath();
      ctx.arc(firefly.x, firefly.y, glow + 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(firefly.x, firefly.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #renderHazards() {
    for (const hazard of this.level.hazards) {
      if (hazard.type === 'banana') {
        this.#drawImage('banana', hazard.x, hazard.y, hazard.width, hazard.height);
      }

      if (hazard.type === 'cart') {
        this.#drawImage('cart', hazard.x, hazard.y, hazard.width, hazard.height);
      }

      if (hazard.type === 'bird') {
        this.#drawImage('bird', hazard.x, hazard.y, hazard.width, hazard.height);
      }

      if (hazard.type === 'cloudCitizen') {
        this.#drawImage(
          `cloudCitizen${hazard.imageIndex}`,
          hazard.x,
          hazard.y,
          hazard.width,
          hazard.height
        );
      }

      if (hazard.type === 'icicle') {
        this.#renderIcicle(hazard);
      }
    }
  }

  #renderIcicle(hazard) {
    const ctx = this.ctx;

    ctx.fillStyle = '#bfe9ff';
    ctx.beginPath();
    ctx.moveTo(hazard.x, hazard.y);
    ctx.lineTo(hazard.x + hazard.width, hazard.y);
    ctx.lineTo(hazard.x + hazard.width / 2, hazard.y + hazard.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#e8f8ff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  #renderFinish() {
    const ctx = this.ctx;
    const { crown, penguin } = this.level;

    if (crown.taken) {
      this.#drawImage(
        'penguinLying',
        penguin.x,
        penguin.y + 25,
        penguin.width,
        penguin.height
      );
    } else {
      const penguinImage = this.score >= REQUIRED_FIREFLIES ? 'penguin2' : 'penguin';
      this.#drawImage(penguinImage, penguin.x, penguin.y, penguin.width, penguin.height);
    }

    if (crown.taken) return;

    const glow = this.score >= REQUIRED_FIREFLIES;

    if (glow) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(
        crown.x + crown.width / 2,
        crown.y + crown.height / 2,
        85,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = glow ? '#ffd700' : '#b28e2b';
    ctx.beginPath();
    ctx.moveTo(crown.x, crown.y + crown.height);
    ctx.lineTo(crown.x, crown.y + 32);
    ctx.lineTo(crown.x + 30, crown.y + 62);
    ctx.lineTo(crown.x + 60, crown.y);
    ctx.lineTo(crown.x + 90, crown.y + 62);
    ctx.lineTo(crown.x + 120, crown.y + 32);
    ctx.lineTo(crown.x + 120, crown.y + crown.height);
    ctx.closePath();
    ctx.fill();

    if (!glow) {
      ctx.fillStyle = '#333';
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Нужно ${REQUIRED_FIREFLIES} светлячков`,
        crown.x + crown.width / 2,
        crown.y - 24
      );
    }
  }

  #renderPlayer() {
    this.player.render(this.ctx, this.cameraX);
  }

  #drawImage(name, x, y, width, height) {
    const image = this.images[name];
    const ctx = this.ctx;

    if (!image?.complete || image.naturalWidth === 0) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      ctx.fillRect(x, y, width, height);
      return;
    }

    const imageRatio = image.naturalWidth / image.naturalHeight;
    const boxRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;

    if (imageRatio > boxRatio) {
      drawHeight = width / imageRatio;
    } else {
      drawWidth = height * imageRatio;
    }

    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight);

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  }
}