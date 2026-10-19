import { Player } from './Player.js';
import { intersects } from './collision.js';

const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 540;
const WORLD_WIDTH = 6400;
const REQUIRED_FIREFLIES = 20;
const STORAGE_KEY = 'frogAdventureRecord';

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;

    this.state = 'menu';
    this.cameraX = 0;
    this.lastTime = 0;
    this.rafId = null;

    this.level = this.#createLevel();
    this.player = new Player(60, 420);

    this.record = this.#loadRecord();
    this.ui.record.textContent = `Рекорд: ${this.record}`;

    this.#bindUI();
    this.#render();
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
      { type: 'banana', x: 500, y: 440, width: 36, height: 40, min: 420, max: 760, speed: 110, direction: 1 },
      { type: 'banana', x: 1000, y: 440, width: 36, height: 40, min: 900, max: 1300, speed: 130, direction: -1 },
      { type: 'cart', x: 1300, y: 430, width: 52, height: 50, min: 1200, max: 1460, speed: 90, direction: 1 },

      { type: 'crow', x: 1900, y: 260, width: 42, height: 30, min: 1800, max: 2150, speed: 150, direction: 1 },
      { type: 'crow', x: 2500, y: 240, width: 42, height: 30, min: 2380, max: 2720, speed: 170, direction: -1 },

      { type: 'cloudCitizen', x: 3300, y: 300, width: 38, height: 42, min: 3200, max: 3500, speed: 120, direction: 1 },
      { type: 'cloudCitizen', x: 3900, y: 310, width: 38, height: 42, min: 3800, max: 4150, speed: 140, direction: -1 },

      { type: 'icicle', x: 4700, y: 220, width: 22, height: 46, min: 4650, max: 4950, speed: 0, direction: 0 },
      { type: 'icicle', x: 5150, y: 150, width: 22, height: 46, min: 5100, max: 5400, speed: 0, direction: 0 },
      { type: 'icicle', x: 5600, y: 170, width: 22, height: 46, min: 5550, max: 5850, speed: 0, direction: 0 }
    ];

    const crown = { x: 6120, y: 380, width: 60, height: 60, taken: false };
    const penguin = { x: 6060, y: 420, width: 44, height: 50 };

    return { platforms, fireflies, hazards, crown, penguin };
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
        x: firefly.x - 12,
        y: firefly.y - 12,
        width: 24,
        height: 24
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
      /* Хранилище недоступно — игра продолжается без сохранения */
    }
  }

  #render() {
    const ctx = this.ctx;
    const cameraX = this.cameraX;

    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    this.#renderBackground();

    ctx.save();
    ctx.translate(-cameraX, 0);

    this.#renderPlatforms();
    this.#renderFireflies();
    this.#renderHazards();
    this.#renderFinish();
    this.player.render(ctx, cameraX);

    ctx.restore();
  }

  #renderBackground() {
    const ctx = this.ctx;
    const zone = this.#getZoneName();

    const gradients = {
      'Королевство сладостей': ['#ffc2d1', '#ffe8b0'],
      'Болото': ['#274e36', '#7bb661'],
      'Облачное королевство': ['#7fb2ff', '#dff0ff'],
      'Ледяное королевство': ['#9fd8ff', '#eaf8ff']
    };

    const [top, bottom] = gradients[zone];
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  #renderPlatforms() {
    const ctx = this.ctx;

    for (const p of this.level.platforms) {
      if (p.kind === 'ground') {
        ctx.fillStyle = '#8b5e3c';
      } else if (p.kind === 'lily') {
        ctx.fillStyle = '#3f9b4c';
      } else if (p.kind === 'cloud') {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#a56b3f';
      }

      ctx.beginPath();
      ctx.roundRect(p.x, p.y, p.width, p.height, p.kind === 'cloud' ? 14 : 6);
      ctx.fill();

      if (p.kind === 'cloud') {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.roundRect(p.x + 10, p.y - 8, p.width - 20, 12, 8);
        ctx.fill();
      }
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
    const ctx = this.ctx;

    for (const hazard of this.level.hazards) {
      if (hazard.type === 'banana') {
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath();
        ctx.roundRect(hazard.x, hazard.y, hazard.width, hazard.height, 12);
        ctx.fill();

        ctx.fillStyle = '#111';
        ctx.fillRect(hazard.x + 8, hazard.y + 12, 6, 6);
        ctx.fillRect(hazard.x + 22, hazard.y + 12, 6, 6);
      }

      if (hazard.type === 'cart') {
        ctx.fillStyle = '#b0413e';
        ctx.beginPath();
        ctx.roundRect(hazard.x, hazard.y, hazard.width, hazard.height - 12, 6);
        ctx.fill();

        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.arc(hazard.x + 26, hazard.y - 4, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(hazard.x + 12, hazard.y + hazard.height - 6, 7, 0, Math.PI * 2);
        ctx.arc(hazard.x + hazard.width - 12, hazard.y + hazard.height - 6, 7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (hazard.type === 'crow') {
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(hazard.x + 21, hazard.y + 15, 20, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.ellipse(hazard.x + 14, hazard.y + 10, 12, 6, -0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.moveTo(hazard.x + 38, hazard.y + 15);
        ctx.lineTo(hazard.x + 50, hazard.y + 18);
        ctx.lineTo(hazard.x + 38, hazard.y + 21);
        ctx.fill();
      }

      if (hazard.type === 'cloudCitizen') {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(hazard.x, hazard.y, hazard.width, hazard.height, 16);
        ctx.fill();

        ctx.fillStyle = '#5aa9ff';
        ctx.fillRect(hazard.x + 9, hazard.y + 14, 6, 6);
        ctx.fillRect(hazard.x + 23, hazard.y + 14, 6, 6);
      }

      if (hazard.type === 'icicle') {
        ctx.fillStyle = '#bfe9ff';
        ctx.beginPath();
        ctx.moveTo(hazard.x, hazard.y);
        ctx.lineTo(hazard.x + hazard.width, hazard.y);
        ctx.lineTo(hazard.x + hazard.width / 2, hazard.y + hazard.height);
        ctx.fill();
      }
    }
  }

  #renderFinish() {
    const ctx = this.ctx;
    const { crown, penguin } = this.level;

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(penguin.x + 22, penguin.y + 28, 20, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(penguin.x + 22, penguin.y + 32, 13, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.moveTo(penguin.x + 16, penguin.y + 34);
    ctx.lineTo(penguin.x + 28, penguin.y + 34);
    ctx.lineTo(penguin.x + 22, penguin.y + 42);
    ctx.fill();

    if (crown.taken) return;

    const glow = this.score >= REQUIRED_FIREFLIES ? 1 : 0.35;

    ctx.fillStyle = `rgba(255, 215, 0, ${glow})`;
    ctx.beginPath();
    ctx.moveTo(crown.x, crown.y + crown.height);
    ctx.lineTo(crown.x, crown.y + 18);
    ctx.lineTo(crown.x + 15, crown.y + 34);
    ctx.lineTo(crown.x + 30, crown.y);
    ctx.lineTo(crown.x + 45, crown.y + 34);
    ctx.lineTo(crown.x + 60, crown.y + 18);
    ctx.lineTo(crown.x + 60, crown.y + crown.height);
    ctx.fill();

    if (this.score < REQUIRED_FIREFLIES) {
      ctx.fillStyle = '#333';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Нужно ${REQUIRED_FIREFLIES} светлячков`,
        crown.x + 30,
        crown.y - 16
      );
    }
  }

  setInput(input) {
    this.input = input;
  }
}