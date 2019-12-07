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
  constructor(screenSelector, rows = 32, columns = 64) {
    this.rows = rows;
    this.columns = columns;
    this.cell = 10;

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
    if (window.innerWidth >= 900) {
      this.cell = 10;
    } else {
      this.cell = Math.min(Math.trunc(window.innerWidth / 64), 10);
    }

    this.canvas.width = this.columns * this.cell;
    this.canvas.height = this.rows * this.cell;
  };

  clear = () => {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
  };

  render = bits => {
    if (!this.ctx) {
      return;
    }

    this.clear();
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
