export class OpcodesBoard {
  debounceMap = new Map();

  constructor(selector, titleSelector) {
    const container = document.querySelector(selector);
    this.board = document.createElement("div");
    this.board.className = "opcodes-board";
    container.appendChild(this.board);

    this.size = document.createElement("div");
    this.size.className = "opcodes-size";
    document.querySelector(titleSelector).appendChild(this.size);
  }

  reset = () => {
    const children = this.board.children;
    while (children.length > 0) {
      children[0].remove();
    }
  };

  // opcode is 2 bytes
  // 10 opcodes per row
  load = (byte1, byte2, index, size) => {
    const opcode = document.createElement("div");
    opcode.className = "opcode";
    opcode.id = `opcode-${index}`;

    const opcode16 = (byte1 << 8) | byte2;
    let opcodeText = opcode16.toString(16);
    while (opcodeText.length < 4) {
      opcodeText = "0" + opcodeText;
    }

    opcode.textContent = opcodeText;

    this.board.appendChild(opcode);
    this.size.innerText = `${size} bytes`;
  };

  executeOpcodes = indexes => {
    for (let index of indexes) {
      const opcodeElement = document.getElementById(`opcode-${index}`);
      opcodeElement.className =
        opcodeElement.className === "opcode opcode-execute"
          ? "opcode opcode-execute-2"
          : "opcode opcode-execute";
    }
  };
}
