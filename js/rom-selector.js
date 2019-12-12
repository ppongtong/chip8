const files = {
  "": "",
  Brix:
    "Classic Breakout game. Use Q to move paddle left, E to move right. Written by Andreas Gustafsson.",
  IBMLogo: "Displays an IBM Logo, then enters infinite loop. Non-interactive.",
  Maze: "Draws a maze, then enters an infinite loop. Non-interactive.",
  Particle: "Draws shooting particles. Non-interactive.",
  Pong:
    "Pong game for two players. 1 moves left player up, Q moves down. 4 moves right player up, R moves down.",
  RandomNumber: "Displays a random number each time a key is pressed.",
  Reversi:
    "The game of Reversi or Othello. Players alternate. Use Q, 2, E, and S to move cursor and W to select. Written by Philip Baltzer.",
  Tetris:
    "Tetris in only 494 bytes. Use W and E to move left and right. Q rotates block. A drops block. Written by Fran Dachille."
};

export class RomSelector {
  constructor(selector, descriptionSelector, chip8) {
    this.chip8 = chip8;
    const container = document.querySelector(selector);

    const select = document.createElement("select");
    select.className = "rom-select";
    select.addEventListener("change", this.handleOnChange);

    for (const file of Object.keys(files)) {
      const option = document.createElement("option");
      option.value = file;
      option.textContent = file ? file : "Select ROM";
      select.appendChild(option);
    }

    container.appendChild(select);

    this.description = document.querySelector(descriptionSelector);
  }

  handleOnChange = async event => {
    const value = event.target.value;

    if (!value) {
      return;
    }

    const data = await (await fetch(`rom/${value}.ch8`)).arrayBuffer();
    this.chip8.loadProgram(new Uint8Array(data));

    this.description.textContent = files[value];
  };
}
