import { Chip8Canvas } from "./screen-canvas.js";
import { OpcodesBoard } from "./opcodes-board.js";
import { ScreenControls } from "./screen-controls.js";

// http://www.multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/

export class Chip8 {
  // The Chip 8 has 4K memory in total
  // 0x000-0x1FF - Chip 8 interpreter (contains font set in emu)
  // 0x050-0x0A0 - Used for the built in 4x5 pixel font set (0-F)
  // 0x200-0xFFF - Program ROM and work RAM
  memory = new Uint8Array(4096);

  // CPU registers: The Chip 8 has 15 8-bit general purpose registers named
  // V0,V1 up to VE. The 16th register is used  for the ‘carry flag’
  V = new Uint8Array(16);
  changedV = new Set();

  // There is an Index register I and a program counter (pc)
  I = 0;
  iChanged = false;
  pc = 0;

  // The graphics of the Chip 8 are black and white
  // and the screen has a total of 2048 pixels (64 x 32).
  gfx = new Array(64 * 32).fill(0);

  // Interupts and hardware registers.
  // The Chip 8 has none, but there are two timer registers
  // that count at 60 Hz.
  // When set above zero they will count down to zero
  delayTimer = 0;
  soundTimer = 0;

  // The stack is used to remember the current location before a jump is performed
  stack = [];

  // Chip 8 has a HEX based keypad (0x0-0xF),
  // you can use an array to store the current state of the key
  key = [];

  chip8FontSet = [
    [0xf0, 0x90, 0x90, 0x90, 0xf0], // 0
    [0x20, 0x60, 0x20, 0x20, 0x70], // 1
    [0xf0, 0x10, 0xf0, 0x80, 0xf0], // 2
    [0xf0, 0x10, 0xf0, 0x10, 0xf0], // 3
    [0x90, 0x90, 0xf0, 0x10, 0x10], // 4
    [0xf0, 0x80, 0xf0, 0x10, 0xf0], // 5
    [0xf0, 0x80, 0xf0, 0x90, 0xf0], // 6
    [0xf0, 0x10, 0x20, 0x40, 0x40], // 7
    [0xf0, 0x90, 0xf0, 0x90, 0xf0], // 8
    [0xf0, 0x90, 0xf0, 0x10, 0xf0], // 9
    [0xf0, 0x90, 0xf0, 0x90, 0x90], // A
    [0xe0, 0x90, 0xe0, 0x90, 0xe0], // B
    [0xf0, 0x80, 0x80, 0x80, 0xf0], // C
    [0xe0, 0x90, 0x90, 0x90, 0xe0], // D
    [0xf0, 0x80, 0xf0, 0x80, 0xf0], // E
    [0xf0, 0x80, 0xf0, 0x80, 0x80] // F
  ];

  rAFId = -1;
  waitForKey = false;
  waitForKeyX = undefined;
  display = undefined;
  columns = 64;
  rows = 32;
  drawFlag = false;
  step = 0;

  keyCodeMap = {
    49: 0x1, // 1
    50: 0x2, // 2
    51: 0x3, // 3
    52: 0xc, // 4
    81: 0x4, // Q
    87: 0x5, // W
    69: 0x6, // E
    82: 0xd, // R
    65: 0x7, // A
    83: 0x8, // S
    68: 0x9, // D
    70: 0xe, // F
    90: 0xa, // Z
    88: 0x0, // X
    67: 0xb, // C
    86: 0xf // V
  };

  cyclesPerFrame = 10;

  constructor(screenId) {
    this.display = new Chip8Canvas(screenId);
    this.controller = new ScreenControls(
      ".screen-control",
      this,
      this.cyclesPerFrame
    );

    this.renderRegisters();
    this.renderPc();

    this.opcodesBoard = new OpcodesBoard(".opcodes-card", ".card-title");
  }

  setCyclesPerFrame = value => {
    this.cyclesPerFrame = value;
    this.controller.focus();
  };

  reset = () => {
    this.pc = 0x200; // Program Counter start at 0x200
    this.I = 0;
    this.stack = [];
    this.sp = 0;
    this.key = [];
    this.waitForKey = false;
    this.waitForKeyX = undefined;
    this.step = 0;
    this.delayTimer = 0;
    this.soundTimer = 0;
    this.gfx.fill(0);

    this.V = new Uint8Array(16);
    this.memory = new Uint8Array(4096);
    this.changedV.clear();
    this.iChanged = false;

    this.start = false;
    this.pausing = false;

    // clear screen
    this.opcodesBoard.reset();
    this.display.clear();
    this.clearRegisters();
    this.updatePCRender();

    // load fonts
    for (let i = 0; i < this.chip8FontSet.length; i++) {
      for (let j = 0; j < this.chip8FontSet[i].length; j++) {
        this.memory[i * 5 + j] = this.chip8FontSet[i][j];
      }
    }
  };

  handleKeyDown = e => {
    if (!this.start || this.pausing) {
      return;
    }

    const keyValue = this.keyCodeMap[e.keyCode];
    if (this.waitForKey) {
      if (this.V[this.waitForKeyX] !== keyValue) {
        this.changedV.add(this.waitForKeyX);
      }

      this.V[this.waitForKeyX] = keyValue;

      this.waitForKey = false;
    }
    this.key[this.keyCodeMap[e.keyCode]] = true;
  };

  handleKeyUp = e => {
    if (!this.start || this.pausing) {
      return;
    }

    this.key[this.keyCodeMap[e.keyCode]] = false;
  };

  updateTimer = () => {
    if (this.delayTimer > 0) {
      this.delayTimer--;
    }

    if (this.soundTimer > 0) {
      if (this.soundTimer == 1) {
        this.runSound();
      }
      this.soundTimer--;
    }
  };

  runSound = () => {
    if (!this.audioContext) {
      this.audioContext =
        (window.AudioContext && new AudioContext()) ||
        (window.webkitAudioContext && new webkitAudioContext());

      if (!this.audioContext) {
        return;
      }
    }

    const osc = this.audioContext.createOscillator();
    osc.frequency.value = 440;
    osc.type = "triangle";
    osc.connect(this.audioContext.destination);
    osc.start();

    setTimeout(function() {
      osc.stop();
    }, 100);
  };

  loadProgram = (bytes, shouldPlay = true) => {
    this.reset();
    this.stop();

    this.bytes = bytes;
    for (let i = 0; i < bytes.length; i++) {
      this.memory[0x200 + i] = bytes[i];
      if (i % 2 === 1) {
        this.opcodesBoard.load(
          bytes[i - 1],
          bytes[i],
          (i - 1) / 2,
          bytes.length
        );
      }
    }

    this.controller.setVisible(true);
    window.addEventListener("keydown", this.handleKeyDown, true);
    window.addEventListener("keyup", this.handleKeyUp, true);

    if (shouldPlay) {
      this.controller.setToPauseButton();
      this.play();
    } else {
      this.controller.resetPlayButton();
    }
  };

  play = () => {
    if (this.bytes === undefined || this.bytes.length === 0) {
      return;
    }

    if (!this.start || this.pausing) {
      this.pausing = false;
      this.start = true;
      this.runAF();
    }
  };

  pause = () => {
    if (this.bytes === undefined || this.bytes.length === 0) {
      return;
    }

    this.pausing = true;
    cancelAnimationFrame(this.rAFId);
  };

  stop = () => {
    if (this.bytes === undefined || this.bytes.length === 0) {
      return;
    }

    window.removeEventListener("keydown", this.handleKeyDown, true);
    window.removeEventListener("keyup", this.handleKeyUp, true);

    cancelAnimationFrame(this.rAFId);
    this.start = false;
    this.pausing = false;
  };

  replay = () => {
    if (this.bytes === undefined || this.bytes.length === 0) {
      return;
    }

    this.loadProgram(this.bytes, !this.pausing);
  };

  runAF = () => {
    if (this.pausing) {
      return;
    }

    const boardIndexes = new Set();
    for (let i = 0; i < this.cyclesPerFrame; i++) {
      if (this.waitForKey) {
        break;
      }
      boardIndexes.add(this.executeOpcode());
    }

    this.processAfterExecuteOpcodes(boardIndexes);

    this.rAFId = requestAnimationFrame(this.runAF);
  };

  processAfterExecuteOpcodes = boardIndexes => {
    // update screen
    if (this.drawFlag) {
      this.display.render(this.gfx);
      this.drawFlag = false;
    }

    // update timer
    this.updateTimer();

    this.updateRegisters();
    this.updatePCRender();
    this.opcodesBoard.executeOpcodes(boardIndexes);
  };

  next = () => {
    if (this.waitForKey) {
      return;
    }

    this.processAfterExecuteOpcodes([this.executeOpcode()]);
  };

  executeOpcode = () => {
    // Fetch Opcode
    // In chip-8, 1 opcode has 2 bytes long
    // shift first byte by 8 bits (adds 8 zeros)
    // the bitwise OR to merge 2nd byte
    const currentBoardIndex = (this.pc - 0x200) / 2;
    const opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];

    // point Programe Counter to next op code (2 bytes)
    this.pc += 2;

    // _ x _ _
    const x = (opcode & 0x0f00) >> 8;
    // _ _ y _
    const y = (opcode & 0x00f0) >> 4;

    const last2 = opcode & 0x00ff;

    // Decode Opcode
    switch (
      opcode & 0xf000 // reading the first 4 bits
    ) {
      case 0x0000:
        // Ignore 0NNN
        // This instruction is only used on the old computers on which
        // Chip-8 was originally implemented. It is ignored by modern interpreters.

        if (opcode === 0x00e0) {
          // clear screen
          this.display.clear();
          this.gfx.fill(0);
        } else if (opcode === 0x00ee) {
          // return to subroutine
          this.pc = this.stack.pop();
        }
        break;

      case 0x1000:
        // call addr
        this.pc = opcode & 0x0fff;
        break;

      case 0x2000:
        // call subroutine
        this.stack.push(this.pc);
        this.pc = opcode & 0x0fff;
        break;

      case 0x3000:
        // 3XNN
        // skip the next instruction if VX === NN
        if (this.V[x] === (opcode & 0x00ff)) {
          this.pc += 2;
        }
        break;

      case 0x4000:
        // 4XNN skips the next instruction if VX !== NN
        if (this.V[x] !== (opcode & 0x00ff)) {
          this.pc += 2;
        }
        break;

      case 0x5000:
        // 5XY0 skip the next instruction if VX === VY
        if (this.V[x] === this.V[y]) {
          this.pc += 2;
        }
        break;

      case 0x6000:
        // 6XNN Set VX = NN
        if (this.V[x] !== (opcode & 0x00ff)) {
          this.changedV.add(x);
        }

        this.V[x] = opcode & 0x00ff;
        break;

      case 0x7000:
        // 7XNN Add NN to VX (Carry flage is not changed)
        if (this.V[x] !== this.V[x] + (opcode & 0x00ff)) {
          this.changedV.add(x);
        }

        this.V[x] += opcode & 0x00ff;
        break;

      case 0x8000:
        const last1 = opcode & 0x000f;
        if (last1 === 0x0000) {
          // 8XY0 set VX to value of VY
          if (this.V[x] !== this.V[y]) {
            this.changedV.add(x);
          }

          this.V[x] = this.V[y];
        } else if (last1 === 0x0001) {
          // 8XY1 set VX to VX or VY
          if (this.V[x] !== (this.V[x] | this.V[y])) {
            this.changedV.add(x);
          }
          this.V[x] |= this.V[y];
        } else if (last1 === 0x0002) {
          // 8XY2 set VX to VX and VY
          if (this.V[x] !== (this.V[x] & this.V[y])) {
            this.changedV.add(x);
          }
          this.V[x] &= this.V[y];
        } else if (last1 === 0x0003) {
          // 8XY3 set VX to VX xor VY
          if (this.V[x] !== (this.V[x] ^ this.V[y])) {
            this.changedV.add(x);
          }
          this.V[x] ^= this.V[y];
        } else if (last1 === 0x0004) {
          // 8XY4 Add VY to VX.
          // VF is set to 1 when there is a carry and 0 otherwise
          const sum = this.V[x] + this.V[y];

          this.V[0xf] = sum > 0xff ? 1 : 0;
          this.V[x] = sum;

          this.changedV.add(x);
          this.changedV.add(0xf);
        } else if (last1 === 0x0005) {
          // VY is subtracted from VX. VF is set to 0 when there's a borrow, and 1 when there isn't.
          this.V[0xf] = this.V[x] < this.V[y] ? 0 : 1;
          this.V[x] -= this.V[y];

          this.changedV.add(x);
          this.changedV.add(0xf);
        } else if (last1 === 0x0006) {
          // Stores the least significant bit of VX in VF and then shifts VX to the right by 1
          this.V[0xf] = this.V[x] & 0x01;
          this.V[x] = this.V[x] >> 1;

          this.changedV.add(x);
          this.changedV.add(0xf);
        } else if (last1 === 0x0007) {
          // Sets VX to VY minus VX. VF is set to 0 when there's a borrow, and 1 when there isn't
          this.V[0xf] = this.V[y] < this.V[x] ? 0 : 1;
          this.V[x] = this.V[y] - this.V[x];

          this.changedV.add(x);
          this.changedV.add(0xf);
        } else if (last1 === 0x000e) {
          // Stores the most significant bit of VX in VF and then shifts VX to the left by 1
          this.V[0xf] = this.V[x] & 0x80; // 10000000
          this.V[x] = this.V[x] << 1;

          this.changedV.add(x);
          this.changedV.add(0xf);
        }
        break;

      case 0x9000:
        // Skips the next instruction if VX doesn't equal VY. (Usually the next instruction is a jump to skip a code block)
        if (this.V[x] != this.V[y]) {
          this.pc += 2;
        }
        break;

      case 0xa000:
        // Sets I to the address NNN.
        this.I = opcode & 0x0fff;
        this.iChanged = true;
        break;

      case 0xb000:
        // Jumps to the address NNN plus V0.
        this.pc = (opcode & 0x0fff) + this.V[0];
        break;

      case 0xc000:
        // CXNN
        // Sets VX to the result of a bitwise and operation on a random number (Typically: 0 to 255) and NN.
        this.V[x] = Math.trunc(Math.random() * 0xff) & (opcode & 0x00ff);
        this.changedV.add(x);
        break;

      case 0xd000:
        // DXYN
        // Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels.
        // Each row of 8 pixels is read as bit-coded starting from memory location I;
        // I value doesn’t change after the execution of this instruction.
        // As described above, VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn,
        // and to 0 if that doesn’t happen

        const height = opcode & 0x000f;

        this.V[0xf] = 0;

        for (let row = 0; row < height; row++) {
          let sprite = this.memory[this.I + row];

          // 8 pixel
          for (let col = 0; col < 8; col++) {
            if ((sprite & 0x80) > 0) {
              this.drawFlag = true;

              let xPixel = (this.V[x] + col) % this.columns;
              if (xPixel < 0) {
                while (xPixel < 0) {
                  xPixel += this.columns;
                }
              }

              let yPixel = (this.V[y] + row) % this.rows;
              if (yPixel < 0) {
                while (yPixel < 0) {
                  yPixel += this.rows;
                }
              }

              const key = xPixel + yPixel * this.columns;

              if (this.gfx[key] === 1) {
                this.V[0xf] = 1;
              }

              this.gfx[key] ^= 1;
            }

            // shift to next col
            sprite = sprite << 1;
          }
        }

        this.changedV.add(0xf);
        break;

      case 0xe000:
        if (last2 === 0x009e) {
          // Skips the next instruction if the key stored in VX is pressed
          if (this.key[this.V[x]]) {
            this.pc += 2;
          }
        } else if (last2 === 0x00a1) {
          // Skips the next instruction if the key stored in VX isn't pressed.
          if (!this.key[this.V[x]]) {
            this.pc += 2;
          }
        }
        break;

      case 0xf000:
        if (last2 === 0x0007) {
          // Sets VX to the value of the delay timer.
          this.V[x] = this.delayTimer;
          this.changedV.add(x);
        } else if (last2 === 0x000a) {
          // A key press is awaited, and then stored in VX. (Blocking Operation. All instruction halted until next key event)
          this.waitForKeyX = x;
          this.waitForKey = true;
        } else if (last2 === 0x0015) {
          // Sets the delay timer to VX.
          this.delayTimer = this.V[x];
        } else if (last2 === 0x0018) {
          // Sets the sound timer to VX.
          this.soundTimer = this.V[x];
        } else if (last2 === 0x001e) {
          // Adds VX to I. VF is set to 1 when there is a range overflow (I+VX>0xFFF), and to 0 when there isn't.
          this.I += this.V[x];
        } else if (last2 === 0x0029) {
          // Sets I to the location of the sprite for the character in VX.
          // Characters 0-F (in hexadecimal) are represented by a 4x5 font.
          this.I = this.V[x] * 5; // http://devernay.free.fr/hacks/chip8/C8TECH10.HTM#font
          this.iChanged = true;
        } else if (last2 === 0x0033) {
          this.memory[this.I] = parseInt(this.V[x] / 100);
          this.memory[this.I + 1] = parseInt((this.V[x] % 100) / 10);
          this.memory[this.I + 2] = this.V[x] % 10;
        } else if (last2 === 0x0055) {
          // Stores V0 to VX (including VX) in memory starting at address I.
          // The offset from I is increased by 1 for each value written, but I itself is left unmodified
          for (let i = 0; i <= x; i++) {
            this.memory[this.I + i] = this.V[i];
          }
        } else if (last2 === 0x0065) {
          // Fills V0 to VX (including VX) with values from memory starting at address I.
          // The offset from I is increased by 1 for each value written, but I itself is left unmodified
          for (let i = 0; i <= x; i++) {
            this.V[i] = this.memory[this.I + i];
            this.changedV.add(i);
          }
        }

        break;
      default:
    }

    return currentBoardIndex;
  };

  createRegister = (title, id, valueClass = "", titleClass = "") => {
    const div = document.createElement("div");
    div.className = "register";

    const titleDiv = document.createElement("div");
    titleDiv.className = `register-title ${titleClass}`;
    titleDiv.textContent = title;
    div.appendChild(titleDiv);

    const value = document.createElement("div");
    value.className = `register-value ${valueClass}`;
    value.id = id;
    div.appendChild(value);

    return div;
  };
  /**
   * Render Registers
   */
  renderRegisters = () => {
    const registers = document.querySelector(".registers-card");
    const registersVGroup = document.createElement("div");
    registersVGroup.className = "registers-v-group";
    registers.appendChild(registersVGroup);

    for (let i = 0; i < this.V.length; i++) {
      const hexId = i.toString(16);
      registersVGroup.appendChild(this.createRegister(`V${hexId}`, `V${i}`));
    }

    registers.appendChild(
      this.createRegister("I", "IReg", "register-i", "register-i-title")
    );
  };

  clearRegisters = () => {
    const registers = document.querySelectorAll(".register-value");
    for (const register of registers) {
      register.textContent = "";
    }
  };

  updateRegisters = () => {
    for (const i of this.changedV) {
      document.querySelector(`#V${i}`).textContent = this.getHex(this.V[i], 2);
    }

    if (this.iChanged) {
      document.querySelector("#IReg").textContent = this.getHex(this.I, 4);
    }

    this.changedV.clear();
  };

  renderPc = () => {
    const pcContainer = document.querySelector(".pc-card-content");
    const div = document.createElement("div");
    div.className = "pc-value";
    div.id = "pc-value";
    pcContainer.appendChild(div);
  };

  updatePCRender = () => {
    document.querySelector("#pc-value").textContent = this.getHex(this.pc, 4);
  };

  getHex = (num, digits) => {
    const hex = num.toString(16);
    return `${"0".repeat(digits - hex.length)}${hex}`;
  };
}
