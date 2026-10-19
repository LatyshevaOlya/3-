import { Game } from './Game.js';
import { Input } from './input.js';

const canvas = document.querySelector('#game');

const ui = {
  score: document.querySelector('#score'),
  zone: document.querySelector('#zone'),
  record: document.querySelector('#record'),
  start: document.querySelector('#startBtn'),
  pause: document.querySelector('#pauseBtn'),
  restart: document.querySelector('#restartBtn'),
  fullscreen: document.querySelector('#fullscreenBtn'),
  overlay: document.querySelector('#overlay'),
  overlayTitle: document.querySelector('#overlayTitle'),
  overlayText: document.querySelector('#overlayText'),
  overlayButton: document.querySelector('#overlayBtn')
};

const input = new Input();

input.bindTouchButtons({
  left: document.querySelector('#leftBtn'),
  right: document.querySelector('#rightBtn'),
  jump: document.querySelector('#jumpBtn')
});

const game = new Game(canvas, ui);
game.setInput(input);

ui.fullscreen.addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn('Полноэкранный режим недоступен:', error);
  }
});