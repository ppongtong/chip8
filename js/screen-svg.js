/**
 * The graphics of the Chip 8 are black and white and the screen has a total of 2048 pixels
 * (64 x 32)
 */

// (function() {
//   const columns = 64;
//   const rows = 32;

export class Chip8ScreenSVG {
  // bits = new Array(rows * columns).fill(0);
  // change = new Set();
  // shouldRender = false;
  // columns = 64;
  // rows = 32;

  constructor(id, rows, columns) {
    const svg = document.getElementById(id);

    // Create the BG
    const rect = document.createElementNS(svg.namespaceURI, "rect");
    rect.id = "svg-screen-bg-rect";
    rect.setAttribute("width", columns * 10);
    rect.setAttribute("height", rows * 10);
    rect.setAttribute("stroke", "#ffffff");
    rect.setAttribute("stroke-width", "3px");
    rect.setAttribute("fill", "#1b1b1b");
    svg.appendChild(rect);

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        const rect = document.createElementNS(svg.namespaceURI, "rect");
        rect.id = `rect${i + j * columns}`;
        rect.setAttribute("width", 10);
        rect.setAttribute("height", 10);
        rect.setAttribute("x", j * 10);
        rect.setAttribute("y", i * 10);
        rect.setAttribute("fill", "#ffffff");
        rect.setAttribute("opacity", 0);
        svg.appendChild(rect);
      }
    }
  }

  clear = () => {};
  render = bits => {};
}
