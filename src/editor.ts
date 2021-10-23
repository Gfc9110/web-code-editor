export class Editor {
  cursor: Cursor;
  errorCursor: Cursor;
  script: HTMLScriptElement;
  static CreateMarginLine(lineNumber: number) {
    const line = document.createElement("div");
    line.className = "margin-line";
    line.textContent = lineNumber.toString();
    return line;
  }
  element: HTMLDivElement;
  linesContainer: HTMLDivElement;
  lines: Line[] = [];
  margin: HTMLDivElement;
  selecting = false;
  selectStart = -1;
  selectEnd = -1;
  constructor(private parent: Element) {
    window.addEventListener("error", this.handleJSError.bind(this));
    this.element = document.createElement("div");
    this.element.className = "editor";

    const buttons = document.createElement("div");
    buttons.className = "buttons";

    const executeButton = document.createElement("div");
    executeButton.className = "button"
    executeButton.textContent = "Execute JS"
    executeButton.addEventListener("click", this.onExecute.bind(this));
    buttons.appendChild(executeButton);

    this.element.appendChild(buttons);

    this.margin = document.createElement("div");
    this.margin.className = "margin";
    this.margin.appendChild(Editor.CreateMarginLine(1))
    this.element.appendChild(this.margin);

    this.linesContainer = document.createElement("div");
    this.linesContainer.className = "lines";
    this.lines.push(new Line(this));
    this.element.appendChild(this.linesContainer);

    this.cursor = new Cursor(0, 0, this);

    this.errorCursor = new Cursor(0, 0, this, "red");
    this.errorCursor.hide();

    this.element.addEventListener("mousedown", this.handleMousedown.bind(this))
    this.element.addEventListener("mouseup", this.handleMouseup.bind(this))
    this.element.addEventListener("mousemove", this.handleMousemove.bind(this))

    this.element.addEventListener("keydown", this.handleKeydown.bind(this));
    this.parent.appendChild(this.element);
  }
  handleMousedown(event: MouseEvent) {
    event.preventDefault();
    if (event.button == 0) {
      this.stopSelection();
      const element = event.target as HTMLDivElement;
      const lineElement = element.closest(".line");
      if (lineElement != null) {
        this.selecting = true;
        this.cursor.setRow((event.clientY - this.linesContainer.getBoundingClientRect().top) / this.rowSize)
        this.focusRow(this.cursor.row)
        this.cursor.setCol(Math.min(event.offsetX / this.colSize, this.lines[this.cursor.row].text.length))
        this.lines[this.cursor.row].startSelection(this.cursor.col);
        this.selectStart = this.cursor.row;
      }
    }
  }
  handleMousemove(event: MouseEvent) {
    event.preventDefault();
    const element = event.target as HTMLDivElement;
    const lineElement = element.closest(".line");
    if (lineElement != null) {
    }
    if (this.selecting && event.clientX > this.linesContainer.getBoundingClientRect().left) {
      this.cursor.setRow(Math.min((event.clientY - this.linesContainer.getBoundingClientRect().top) / this.rowSize, this.lines.length - 1));
      this.cursor.setCol(Math.min(event.offsetX / this.colSize, this.lines[this.cursor.row].text.length))
      this.focusRow(this.cursor.row)
      if (this.cursor.row == this.selectStart) {
        this.lines[this.cursor.row].endSelection(this.cursor.col);
      } else {
        const direction = Math.sign(this.cursor.row - this.selectStart);
        this.lines[this.selectStart].endSelection(direction > 0 ? this.lines[this.selectStart].text.length : 0);
        let row = this.selectStart + direction;
        while (row != this.cursor.row) {
          this.lines[row].startSelection(0);
          this.lines[row].endSelection(this.lines[row].text.length);
          row += direction;
        }
        if (direction > 0) {
          this.lines[this.cursor.row].startSelection(0);
          this.lines[this.cursor.row].endSelection(this.cursor.col);
        } else {
          this.lines[this.cursor.row].startSelection(this.cursor.col);
          this.lines[this.cursor.row].endSelection(this.lines[this.cursor.row].text.length);
        }
      }
      this.selectEnd = this.cursor.row;
      this.lines.filter((_, i) => i < Math.min(this.selectStart, this.selectEnd) || i > Math.max(this.selectEnd, this.selectStart)).forEach(l => l.stopSelection());
    }
  }
  handleMouseup(event: MouseEvent) {
    event.preventDefault();
    if (event.button == 0) {
      this.selecting = false;
      console.log(this.selectedText);
    }
  }
  handleKeydown(event: KeyboardEvent) {
    this.stopSelection();
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
        this.cursor.setCol(Math.min(this.cursor.col, this.lines[this.cursor.row].text.length));
        this.focusRow(this.cursor.row);
        break;
      }
      case "ArrowDown": {
        this.cursor.setRow(Math.min(this.cursor.row + 1, this.lines.length - 1));
        this.cursor.setCol(Math.min(this.cursor.col, this.lines[this.cursor.row].text.length));
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
          } else if (this.cursor.row > 0) {
            this.cursor.setCol(this.lines[this.cursor.row - 1].text.length);
            this.lines[this.cursor.row - 1].text += this.lines[this.cursor.row].text;
            this.removeLine(this.cursor.row);
            this.cursor.setRow(this.cursor.row - 1);
            this.focusRow(this.cursor.row);
          }
        }
        break;
      }
      case "Delete": {
        if (element.classList.contains("line")) {
          if (this.cursor.col < this.lines[this.cursor.row].text.length) {
            const textArray = Array.from(this.lines[this.cursor.row].text);
            textArray.splice(this.cursor.col, 1).join("");
            this.lines[this.cursor.row].text = textArray.join("");
          } else if (this.cursor.row < this.lines.length - 1) {
            this.lines[this.cursor.row].text += this.lines[this.cursor.row + 1].text;
            this.removeLine(this.cursor.row + 1);
          }
        }
        break;
      }
      case "End": {
        this.cursor.setCol(this.lines[this.cursor.row].text.length);
        break;
      }
      case "Home": {
        this.cursor.setCol(0);
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
  onExecute() {
    this.errorCursor.hide();
    if (this.script)
      this.script.remove();
    this.script = document.createElement("script");
    this.script.innerHTML = "(()=>{\n" + this.getEditorContent() + "\n})();";
    document.body.appendChild(this.script);
  }
  handleJSError(event: ErrorEvent) {
    if (!event.filename) {
      event.preventDefault();
      this.errorCursor.setCol(event.colno - 1);
      this.errorCursor.setRow(event.lineno - 2);
      this.errorCursor.tooltipText = event.error;
      this.errorCursor.show(true);
      this.cursor.hide();
    }
  };
  getEditorContent(): string {
    let content = "";
    this.lines.forEach((l, i) => content += (i > 0 ? "\n" : "") + l.text);
    return content;
  }
  addLine(index: number) {
    this.lines.splice(index, 0, new Line(this, this.linesContainer.childNodes[index] as HTMLDivElement));
    this.margin.appendChild(Editor.CreateMarginLine(this.lines.length))
  }
  removeLine(index: number) {
    this.lines[index].remove();
    this.lines.splice(index, 1);
    this.margin.lastChild.remove();
  }
  getLineByElement(element: HTMLDivElement): Line {
    return this.lines.find((l) => l.element == element);
  }
  getLineIndexByElement(element: HTMLDivElement): Line {
    return this.lines.find((l) => l.element == element);
  }
  focusRow(index: number) {
    this.cursor.show();
    this.lines[index].focus();
  }
  stopSelection() {
    this.selectStart = -1;
    this.selectEnd = -1;
    this.lines.forEach(l => l.stopSelection());
  }
  get colSize() {
    return 10.802;
  }
  get rowSize() {
    return 30;
  }
  get linesTop() {
    return this.linesContainer.getBoundingClientRect().top;
  }
  get selectedText() {
    let text = "";
    if (this.selectStart >= 0 && this.selectEnd >= 0) {
      const min = Math.min(this.selectStart, this.selectEnd);
      const max = Math.max(this.selectStart, this.selectEnd);
      for (let i = min; i <= max; i++) {
        if (i == min && i == max) {
          text += this.lines[min].text.substring(this.lines[min].selectStart, this.lines[min].selectEnd);
          continue;
        }
        if (i == min) {
          text += this.lines[min].text.substring(this.lines[min].selectStart) + "\n";
          continue;
        }
        if (i == max) {
          text += this.lines[max].text.substring(0, this.lines[min].selectEnd);
          continue;
        }
        text += this.lines[i].text + "\n"
      }
    }
    return text;
  }
}

export class Line {
  selectStart = -1;
  selectEnd = -1;
  selection: HTMLDivElement;
  remove() {
    this.element.remove();
  }
  element: HTMLDivElement;
  textElement: HTMLDivElement;
  constructor(private editor: Editor, before?: HTMLDivElement) {
    this.element = document.createElement("div");
    this.element.className = "line";
    this.element.tabIndex = 0;

    this.textElement = document.createElement("div");
    this.textElement.className = "text";
    this.element.appendChild(this.textElement);

    this.selection = document.createElement("div");
    this.selection.className = "selection";
    this.element.appendChild(this.selection);

    this.editor.linesContainer.insertBefore(this.element, before)
  }
  focus() {
    this.element.focus();
  }
  startSelection(start: number) {
    this.selectStart = start;
    this.updateSelection();
  }
  endSelection(end: number) {
    this.selectEnd = end;
    this.updateSelection();
  }
  stopSelection() {
    this.selectStart = -1;
    this.selectEnd = -1;
    this.updateSelection();
  }
  private updateSelection() {
    if (this.selectStart >= 0 && this.selectEnd >= 0 && this.selectStart != this.selectEnd) {
      this.selection.classList.add("active");
      this.selection.style.left = (Math.min(this.selectStart, this.selectEnd) * this.editor.colSize) + 5 + "px";
      this.selection.style.width = (Math.max(this.selectStart, this.selectEnd) - Math.min(this.selectStart, this.selectEnd)) * this.editor.colSize + "px";
      return
    }
    this.selection.classList.remove("active");
  }
  get text() {
    return this.textElement.textContent;
  }
  set text(val: string) {
    this.textElement.textContent = val;
  }
}

export class Cursor {
  element: HTMLDivElement;
  tooltipElement: HTMLDivElement;
  constructor(public col = 0, public row = 0, private editor: Editor, color = "#fff") {
    this.element = document.createElement("div");
    this.element.className = "cursor";
    this.element.style.background = color;

    this.tooltipElement = document.createElement("div");
    this.tooltipElement.className = "tooltip";

    this.element.appendChild(this.tooltipElement)

    this.update();

    this.editor.element.appendChild(this.element);
  }
  setCol(val: number) {
    val = Math.floor(Math.max(val, 0));
    this.col = val;
    this.element.style.left = (60 + 5 + (this.editor.colSize * this.col)) + "px";
  }
  setRow(val: number) {
    val = Math.floor(Math.max(val, 0));
    this.row = val;
    this.element.style.top = this.editor.linesTop + (this.editor.rowSize * this.row) + "px";
  }
  hide() {
    this.element.style.display = "none";
    this.tooltipElement.style.display = "none";
  }
  show(tooltip = false) {
    this.element.style.display = "block";
    if (tooltip) {
      this.tooltipElement.style.display = "flex";
    }
  }
  update() {
    this.element.style.left = (60 + 5 + (this.editor.colSize * this.col)) + "px";
    this.element.style.top = this.editor.linesTop + (this.editor.colSize * this.col) + "px";
  }
  get tooltipText() {
    return this.tooltipElement.textContent;
  }
  set tooltipText(val: string) {
    this.tooltipElement.textContent = val;
  }
}