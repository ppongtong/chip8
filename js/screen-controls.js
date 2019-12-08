const createButton = (icon, title) => {
  const button = document.createElement("button");
  button.className = "button-icon";
  button.title = title;

  const materialIcon = document.createElement("i");
  materialIcon.className = "material-icons";
  materialIcon.innerText = icon;

  button.appendChild(materialIcon);
  return button;
};

export class ScreenControls {
  constructor(selector, chip8, cyclePerFrameInput) {
    this.chip8 = chip8;
    const container = document.querySelector(selector);

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "screen-controls-container";

    const input = document.createElement("input");
    input.type = "number";
    input.max = 20;
    input.min = 0;
    input.className = "cycles-per-frame-input";
    input.title = "Cycle per frame";
    input.value = cyclePerFrameInput;

    input.addEventListener("change", this.handleCyclesPerFrameChange);
    controlsDiv.appendChild(input);

    container.appendChild(controlsDiv);

    this.buttons = document.createElement("div");
    this.buttons.className = "screen-controls-buttons hide";
    controlsDiv.appendChild(this.buttons);

    // play/pause button
    this.playPauseButton = document.createElement("button");
    this.playPauseButton.className = "button-icon";
    this.playPauseButton.title = "play";
    this.playPauseButton.addEventListener(
      "click",
      this.handlePlayPauseButtonClick
    );

    const playPauseButtonIcon = document.createElement("div");
    playPauseButtonIcon.className = "play-button";
    this.playPauseButton.appendChild(playPauseButtonIcon);

    this.buttons.appendChild(this.playPauseButton);

    // replay button
    const replayButton = createButton("replay", "replay");
    this.buttons.appendChild(replayButton);
    replayButton.addEventListener("click", this.handleReplay);

    // next button;
    const nextButton = createButton("skip_next", "next opcode");
    this.buttons.appendChild(nextButton);
    nextButton.addEventListener("click", this.handleNext);
  }

  resetPlayButton = () => {
    if (this.playPauseButton.title === "play") {
      return;
    }
    this.playPauseButton.title = "play";
    this.playPauseButton.firstElementChild.classList.remove("pause-button");
  };

  setToPauseButton = () => {
    if (this.playPauseButton.title === "pause") {
      return;
    }

    this.playPauseButton.title = "pause";
    this.playPauseButton.firstElementChild.classList.add("pause-button");
  };

  setVisible = visible => {
    if (visible) {
      this.buttons.classList.remove("hide");
      this.resetPlayButton();
    } else {
      this.buttons.classList.add("hide");
    }
  };

  handlePlayPauseButtonClick = event => {
    const button = event.currentTarget;
    const isPlayButton = button.title === "play";
    if (isPlayButton) {
      this.setToPauseButton();
      this.chip8.play();
    } else {
      this.resetPlayButton();
      this.chip8.pause();
    }
  };

  handleReplay = () => {
    this.chip8.replay();
    this.resetPlayButton();
  };

  handleNext = () => {
    this.chip8.next();
    this.resetPlayButton();
  };

  handleCyclesPerFrameChange = e => {
    this.chip8.setCyclesPerFrame(e.currentTarget.value);
  };
}
