import { Player } from './Player.js';
import { intersects } from './collision.js';

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;
const WORLD_WIDTH = 6400;
const REQUIRED_FIREFLIES = 20;
const STORAGE_KEY = 'frogAdventureRecord';

const ASSETS = {
  frog: 'assets/frog.png',

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
    this.assetsReady = false;

    this.state = 'menu';
    this.cameraX = 0;
    this.lastTime = 0;
    this.rafId = null;

    this.level = this.#createLevel();
    this.player = new Player(60, 420);

    this.record = this.#loadRecord();
    this.ui.record.textContent = `Рекорд: ${this.record}`;

    this.#bindUI();
    this.#loadAssets();
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

        if (loaded === names.length) {
          this.assetsReady = true;
          this.#render();
        }
      };

      image.onerror = () => {
        console.warn(`Не удалось загрузить рисунок: ${ASSETS[name]}`);
        loaded += 1;

        if (loaded === names.length) {
          this.assetsReady = true;
          this.#render();
        }
      };

      this.images[name] = image;
    });
  }

  #createLevel() {
    const ground = (x, w, y = 480) => ({ x, y, width: w, height: 60, kind: 'ground' });
    const platform = (x, y, w, kind = 'platform') => ({ x, y, width: w, height: 20, kind });

    const platforms = [
      ground(0, 1500),
      platform(320, 390, 140),
      platform(580, 310, 130),
      platform(860, 390, 150),
      platform(1150, 300, 140),

      platform(1500, 470, 120, 'lily'),
      platform(1720, 410, 110, 'lily'),
      platform(1940, 350, 110, 'cloud'),
      platform(2180, 420, 120, 'lily'),
      platform(2420, 330, 120, 'cloud'),
      platform(2660, 400, 120, 'lily'),
      platform(2880, 300, 150, 'cloud'),

      platform(3100, 430, 130, 'cloud'),
      platform(3330, 350, 120, 'cloud'),
      platform(3560, 270, 120, 'cloud'),
      platform(3800, 360, 130, 'cloud'),
      platform(4040, 280, 130, 'cloud'),
      platform(4280, 380, 140, 'cloud'),

      platform(4550, 450, 130),
      platform(4790, 370, 120),
      platform(5030, 290, 120),
      platform(5270, 380, 130),
      platform(5510, 300, 130),
      platform(5750, 400, 160),
      ground(5950, 450)
    ];

    const decorations = [
      { image: 'cake0', x: 220, y: 408, width: 64, height: 72 },
      { image: 'cake1', x: 700, y: 412, width: 60, height: 68 },
      { image: 'cake2', x: 1050, y: 410, width: 62, height: 70 },
      { image: 'cake3', x: 1380, y: 414, width: 58, height: 66 },
      { image: 'cake4', x: 760, y: 416, width: 56, height: 64 },
      { image: 'cake5', x: 1240, y: 412, width: 60, height: 68 },

      { image: 'swampCloud', x: 1650, y: 220, width: 110, height: 60 },
      { image: 'swampCloud', x: 2300, y: 190, width: 120, height: 64 },
      { image: 'swampCloud', x: 2800, y: 210, width: 100, height: 56 },

      { image: 'cloudCitizen0', x: 3180, y: 250, width: 48, height: 54 },
      { image: 'cloudCitizen1', x: 3650, y: 220, width: 46, height: 52 },
      { image: 'cloudCitizen2', x: 4150, y: 240, width: 48, height: 54 },
      { image: 'cloudCitizen3', x: 4400, y: 210, width: 46, height: 52 }
    ];

    const fireflies = [];
    const positions = [
      [360, 350], [620, 270], [900, 350], [1190, 260],
      [1540, 430], [1760, 370], [1980, 310], [2220, 380],
      [2460, 290], [2700, 360], [2920, 260],
      [3140, 390], [3370, 310], [3600, 230], [3840, 320],
      [4080, 240], [4320, 340],
      [4590, 410], [4830, 330], [5070, 250]
    ];

    positions.forEach(([x, y]) => {
      fireflies.push({ x, y, collected: false });
    });

    const hazards = [
      { type: 'banana', x: 500, y: 430, width: 48, height: 50, min: 420, max: 760, speed: 110, direction: 1 },
      { type: 'banana', x: 1000, y: 430, width: 48, height: 50, min: 900, max: 1300, speed: 130, direction: -1 },
      { type: 'cart', x: 1300, y: 420, width: 70, height: 60, min: 1200, max: 1460, speed: 90, direction: 1 },

      { type: 'bird', x: 1900, y: 250, width: 64, height: 46, min: 1800, max: 2150, speed: 150, direction: 1 },
      { type: 'bird', x: 2500, y: 230, width: 64, height: 46, min: 2380, max: 2720, speed: 170, direction: -1 },

      { type: 'cloudCitizen', x: 3300, y: 290, width: 48, height: 54, min: 3200, max: 3500, speed: 120, direction: 1, imageIndex: 4 },
      { type: 'cloudCitizen', x: 3900, y: 300, width: 48, height: 54, min: 3800, max: 4150, speed: 140, direction: -1, imageIndex: 5 },

      { type: 'icicle', x: 4700, y: 220, width: 22, height: 46, min: 4650, max: 4950, speed: 0, direction: 0 },
      { type: 'icicle', x: 5150, y: 150, width: 22, height: 46, min: 5100, max: 5400, speed: 0, direction: 0 },
      { type: 'icicle', x: 5600, y: 170, width: 22, height: 46, min: 5550, max: 5850, speed: 0, direction: 0 }
    ];

    const crown = { x: 6120, y: 370, width: 70, height: 70, taken: false };
    const penguin = { x: 6040, y: 410, width: 64, height: 70 };

    return { platforms, decorations, fireflies, hazards, crown, penguin };
  }

  #bindUI() {
    this.ui.start.addEventListener('click', () => this.start());
    this.ui.pause.addEventListener('click', () => this.togglePause());
    this.ui.restart.addEventListener('click', () => this.restart());
    this.ui.overlayButton.addEventListener('click', () => this.start());

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
      Math.min(this.player.x - VIEW_WIDTH / 2 + this.player.width / 2, WORLD_WIDTH - VIEW_WIDTH)
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
      if (!firefly.collected && intersects(playerBox, {
        x: firefly.x - 14,
        y: firefly.y - 14,
        width: 28,
        height: 28
      })) {
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

    if (playerBox.y > VIEW_HEIGHT + 80) {
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

    if (x < 1500) return 'Королевство сладостей';
    if (x < 3000) return 'Болото';
    if (x < 4500) return 'Облачное королевство';
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

    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    this.#renderBackground();

    ctx.save();
    ctx.translate(-this.cameraX, 0);

    this.#renderPlatforms();
    this.#renderDecorations();
    this.#renderFireflies();
    this.#renderHazards();
    this.#renderFinish();
    this.#renderPlayer();

    ctx.restore();
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
      ctx.drawImage(image, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      return;
    }

    ctx.fillStyle = '#20364f';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  #renderPlatforms() {
    const ctx = this.ctx;

    for (const p of this.level.platforms) {
      if (p.kind === 'lily') {
        ctx.fillStyle = '#3f9b4c';
      } else if (p.kind === 'cloud') {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#7b5233';
      }

      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, p.kind === 'cloud' ? 14 : 6);
      ctx.fill();
    }
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

      const glow = 8 + Math.sin(time + firefly.x) * 3;

      ctx.fillStyle = 'rgba(255, 236, 120, 0.35)';
      ctx.beginPath();
      ctx.arc(firefly.x, firefly.y, glow + 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(firefly.x, firefly.y, 6, 0, Math.PI * 2);
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
      this.#drawImage('penguinLying', penguin.x, penguin.y + 20, penguin.width, penguin.height);
    } else {
      const penguinImage = this.score >= REQUIRED_FIREFLIES ? 'penguin2' : 'penguin';
      this.#drawImage(penguinImage, penguin.x, penguin.y, penguin.width, penguin.height);
    }

    if (crown.taken) return;

    const glow = this.score >= REQUIRED_FIREFLIES;

    if (glow) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(crown.x + crown.width / 2, crown.y + crown.height / 2, 52, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = glow ? '#ffd700' : '#b28e2b';
    ctx.beginPath();
    ctx.moveTo(crown.x, crown.y + crown.height);
    ctx.lineTo(crown.x, crown.y + 20);
    ctx.lineTo(crown.x + 17, crown.y + 38);
    ctx.lineTo(crown.x + 35, crown.y);
    ctx.lineTo(crown.x + 53, crown.y + 38);
    ctx.lineTo(crown.x + 70, crown.y + 20);
    ctx.lineTo(crown.x + 70, crown.y + crown.height);
    ctx.closePath();
    ctx.fill();

    if (!glow) {
      ctx.fillStyle = '#333';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Нужно ${REQUIRED_FIREFLIES} светлячков`,
        crown.x + crown.width / 2,
        crown.y - 16
      );
    }
  }

  #renderPlayer() {
    this.#drawImage(
      'frog',
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height
    );
  }

  #drawImage(name, x, y, width, height) {
    const image = this.images[name];

    if (image?.complete && image.naturalWidth > 0) {
      this.ctx.drawImage(image, x, y, width, height);
      return;
    }

    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.35)';
    this.ctx.fillRect(x, y, width, height);
  }
}