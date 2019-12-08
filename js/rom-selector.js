const files = [
  "",
  "Brix",
  "IBMLogo",
  "Maze",
  "Particle",
  "Pong",
  "RandomNumber"
];

export class RomSelector {
  constructor(selector, chip8) {
    this.chip8 = chip8;
    const container = document.querySelector(selector);

    const select = document.createElement("select");
    select.className = "rom-select";
    select.addEventListener("change", this.handleOnChange);

    for (const file of files) {
      const option = document.createElement("option");
      option.value = file;
      option.innerText = file ? file : "Select ROM";
      select.appendChild(option);
    }

    container.appendChild(select);
  }

  handleOnChange = async event => {
    const value = event.target.value;

    if (!value) {
      return;
    }

    const data = await (await fetch(`rom/${value}.ch8`)).arrayBuffer();
    this.chip8.loadProgram(new Uint8Array(data));
  };
}
