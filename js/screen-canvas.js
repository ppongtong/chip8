export class Chip8Canvas {
  constructor(screenSelector, rows = 32, columns = 64, cell = 10) {
    this.rows = rows;
    this.columns = columns;
    this.cell = 10;

    const screenContainer = document.querySelector(screenSelector);
    const canvas = document.createElement("canvas");
    canvas.id = "chip8-canvas";
    this.ctx = canvas.getContext("2d");
    canvas.width = columns * cell;
    canvas.height = rows * cell;
    canvas.classList.add("screen-bg");
    screenContainer.appendChild(canvas);
  }

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
  };
}
