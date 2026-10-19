export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.jump = false;
    this.jumpPressed = false;

    this.#bindKeyboard();
  }

  bindTouchButtons({ left, right, jump }) {
    this.#bindHold(left, 'left');
    this.#bindHold(right, 'right');
    this.#bindHold(jump, 'jump');
  }

  #bindHold(button, action) {
    if (!button) return;

    const press = (event) => {
      event.preventDefault();
      this[action] = true;
      if (action === 'jump') this.jumpPressed = true;
    };

    const release = (event) => {
      event.preventDefault();
      this[action] = false;
    };

    button.addEventListener('pointerdown', press);
    button.addEventListener('pointerup', release);
    button.addEventListener('pointerleave', release);
    button.addEventListener('pointercancel', release);
  }

  #bindKeyboard() {
    const keys = {
      ArrowLeft: 'left',
      KeyA: 'left',
      ArrowRight: 'right',
      KeyD: 'right',
      Space: 'jump',
      KeyW: 'jump',
      ArrowUp: 'jump'
    };

    window.addEventListener('keydown', (event) => {
      const action = keys[event.code];
      if (!action) return;

      if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        event.preventDefault();
      }

      this[action] = true;

      if (action === 'jump' && !event.repeat) {
        this.jumpPressed = true;
      }
    });

    window.addEventListener('keyup', (event) => {
      const action = keys[event.code];
      if (action) this[action] = false;
    });
  }

  clear() {
    this.left = false;
    this.right = false;
    this.jump = false;
    this.jumpPressed = false;
  }

  consumeJump() {
    const value = this.jumpPressed;
    this.jumpPressed = false;
    return value;
  }
}