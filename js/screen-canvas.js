const debounce = fn => {
  let timeout = -1;
  return (...args) => {
    if (timeout > -1) {
      window.clearTimeout(timeout);
    }

    timeout = window.setTimeout(fn, 200, ...args);
  };
};

export class Chip8Canvas {
  constructor(screenSelector) {
    this.rows = 32;
    this.columns = 64;
    this.cell = 0;
    this.innerWidth = 0;

    const screenContainer = document.querySelector(screenSelector);

    this.canvas = document.createElement("canvas");
    this.canvas.id = "chip8-canvas";
    this.ctx = this.canvas.getContext("2d");
    this.onWindowSizeChange();

    this.canvas.classList.add("screen-bg");
    screenContainer.appendChild(this.canvas);

    this.debounceResize = debounce(this.onWindowSizeChange);
    window.addEventListener("resize", this.debounceResize);
  }

  onWindowSizeChange = () => {
    let newCell = this.cell;
    if (window.innerWidth >= 900) {
      newCell = 10;
    } else {
      newCell = Math.min(Math.trunc(window.innerWidth / 64), 10);
    }

    if (newCell !== this.cell) {
      this.cell = newCell;
      this.canvas.width = this.columns * this.cell;
      this.canvas.height = this.rows * this.cell;

      if (this.bits) {
        this.render(this.bits);
      }
    }
  };

  clear = () => {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
    this.bits = undefined;
  };

  render = bits => {
    if (!this.ctx) {
      return;
    }

    this.clear();
    this.bits = bits;

    for (let i = 0; i < bits.length; i++) {
      const x = (i % this.columns) * this.cell;
      const y = Math.trunc(i / this.columns) * this.cell;

      if (bits[i]) {
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(x, y, this.cell, this.cell);
      }
    }
  };

  unmount = () => {
    document.querySelector(`#${this.ctx.canvas.id}`).remove();
    window.removeEventListener("resize", this.debounceResize);
  };
}
