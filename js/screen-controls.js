const createButton = (icon, title) => {
  const button = document.createElement("button");
  button.className = "button-icon";
  button.title = title;

  const materialIcon = document.createElement("i");
  materialIcon.className = "material-icons";
  materialIcon.textContent = icon;

  button.appendChild(materialIcon);
  return button;
};

export class ScreenControls {
  constructor(selector, chip8, cyclePerFrameInput) {
    this.chip8 = chip8;
    const container = document.querySelector(selector);

    const controlsDiv = document.createElement("div");
    controlsDiv.className = "screen-controls-container";

    const frameInput = document.createElement("select");
    frameInput.className = "cycles-per-frame-input";
    frameInput.title = "Cycle per frame";

    [1, 5, 10, 20, 30].forEach(item => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      frameInput.appendChild(option);
    });
    frameInput.value = cyclePerFrameInput;

    frameInput.addEventListener("change", this.handleCyclesPerFrameChange);
    controlsDiv.appendChild(frameInput);

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

  focus = () => {
    this.playPauseButton.focus();
  };

  resetPlayButton = () => {
    if (this.playPauseButton.title === "play") {
      return;
    }
    this.playPauseButton.title = "play";
    this.playPauseButton.firstElementChild.classList.remove("pause-button");
    this.playPauseButton.focus();
  };

  setToPauseButton = () => {
    if (this.playPauseButton.title === "pause") {
      return;
    }

    this.playPauseButton.title = "pause";
    this.playPauseButton.firstElementChild.classList.add("pause-button");
    this.playPauseButton.focus();
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
  };

  handleNext = () => {
    this.chip8.next();
    this.resetPlayButton();
  };

  handleCyclesPerFrameChange = e => {
    this.chip8.setCyclesPerFrame(e.currentTarget.value);
  };
}
