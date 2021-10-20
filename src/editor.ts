export class Editor {
  cursor: Cursor;
  static CreateLine(): HTMLDivElement {
    let line = document.createElement("div");
    line.className = "line";
    return line
  }
  element: HTMLDivElement;
  linesContainer: HTMLDivElement;
  lines: Line[] = [];
  margin: HTMLDivElement;
  constructor(private parent: Element) {
    this.element = document.createElement("div");
    this.element.className = "editor";

    this.margin = document.createElement("div");
    this.margin.className = "margin";
    this.element.appendChild(this.margin);

    this.linesContainer = document.createElement("div");
    this.linesContainer.className = "lines";
    this.lines.push(new Line(this.linesContainer));
    this.element.appendChild(this.linesContainer);

    this.cursor = new Cursor(0, 0, this);

    //this.element.addEventListener("focusin", this.handleFocus.bind(this))
    this.element.addEventListener("mousedown", this.handleMousedown.bind(this))

    this.element.addEventListener("keydown", this.handleKeydown.bind(this));
    this.parent.appendChild(this.element);
  }
  /*handleFocus(event: FocusEvent): void {
    const element = event.target as HTMLDivElement;
    if (element.classList.contains("line")) {
      const line = this.getLineIndexByElement(element);
      console.log(line);
    }
  };*/
  handleMousedown(event: MouseEvent) {
    const element = event.target as HTMLDivElement;
    if (element.classList.contains("line")) {
      this.cursor.setRow((event.clientY - this.linesContainer.clientTop) / this.rowSize)
      this.cursor.setCol(Math.min(event.offsetX / this.colSize, this.lines[this.cursor.row].text.length))
    }

  }
  handleKeydown(event: KeyboardEvent) {
    const element = event.target as HTMLDivElement;
    switch (event.key) {
      case "ArrowRight": {
        this.cursor.setCol(Math.min(this.cursor.col + 1, this.lines[this.cursor.row].text.length));
        break;
      }
      case "ArrowLeft": {
        this.cursor.setCol(this.cursor.col - 1);
        break;
      }
      case "ArrowUp": {
        this.cursor.setRow(this.cursor.row - 1);
        this.focusRow(this.cursor.row);
        break;
      }
      case "ArrowDown": {
        this.cursor.setRow(Math.min(this.cursor.row + 1, this.lines.length - 1));
        this.focusRow(this.cursor.row);
        break;
      }
      case "Enter": {
        this.addLine(this.cursor.row + 1);
        this.focusRow(this.cursor.row + 1)
        let newText = "";
        if (this.cursor.col < this.lines[this.cursor.row].text.length) {
          newText = this.lines[this.cursor.row].text.substring(this.cursor.col);
          this.lines[this.cursor.row].text = this.lines[this.cursor.row].text.substring(0, this.cursor.col)
        }
        this.cursor.setRow(this.cursor.row + 1);
        this.cursor.setCol(Math.min(this.cursor.col, this.lines[this.cursor.row].text.length));
        this.lines[this.cursor.row].text = newText;
        break;
      }
      case "Backspace": {
        if (element.classList.contains("line")) {
          if (this.cursor.col > 0) {
            const line = this.getLineByElement(element);
            const newText = Array.from(line.text);
            newText.splice(this.cursor.col - 1, 1, "");
            this.cursor.setCol(this.cursor.col - 1)
            line.text = newText.join("");
          }
        }
        break;
      }
      default: {
        if (event.key.length > 1) {
          break;
        }
        if (element.classList.contains("line")) {
          const line = this.getLineByElement(element);
          if (this.cursor.col == line.text.length) {
            line.text = line.text + event.key;
            this.cursor.setCol(this.cursor.col + 1);
            break;
          }
          const newText = Array.from(line.text);
          newText.splice(this.cursor.col, 0, event.key);
          line.text = newText.join("");
          this.cursor.setCol(this.cursor.col + 1);
        }
      }
    }
  }
  addLine(index: number) {
    this.lines.splice(index, 0, new Line(this.linesContainer, this.linesContainer.childNodes[index] as HTMLDivElement));
  }
  getLineByElement(element: HTMLDivElement): Line {
    return this.lines.find((l) => l.element == element);
  }
  getLineIndexByElement(element: HTMLDivElement): Line {
    return this.lines.find((l) => l.element == element);
  }
  focusRow(index: number) {
    this.lines[index].focus();
  }
  get colSize() {
    return 10.802;
  }
  get rowSize() {
    return 30;
  }
}

export class Line {
  element: HTMLDivElement;
  constructor(container: HTMLDivElement, before?: HTMLDivElement) {
    this.element = document.createElement("div");
    this.element.className = "line";
    this.element.tabIndex = 0;

    container.insertBefore(this.element, before)
  }
  focus() {
    this.element.focus();
  }
  get text() {
    return this.element.textContent;
  }
  set text(val: string) {
    this.element.textContent = val;
  }
}

export class Cursor {
  element: HTMLDivElement;
  constructor(public col = 0, public row = 0, private editor: Editor) {
    this.element = document.createElement("div");
    this.element.className = "cursor";

    this.update();

    this.editor.element.appendChild(this.element);
  }
  setCol(val: number) {
    val = Math.floor(Math.max(val, 0));
    this.col = val;
    /*this.update();*/
    this.element.style.left = (60 + 5 + (this.editor.colSize * this.col)) + "px";
  }
  setRow(val: number) {
    val = Math.floor(Math.max(val, 0));
    this.row = val;
    /*this.update();*/
    this.element.style.top = (this.editor.rowSize * this.row) + "px";
  }
  update() {
    this.element.style.left = (this.editor.rowSize * this.row) + "px";
    this.element.style.top = (this.editor.colSize * this.col) + "px";
  }
}