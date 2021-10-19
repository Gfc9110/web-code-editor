export class Editor {
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

    this.element.addEventListener("focusin", this.handleFocus.bind(this))

    this.parent.appendChild(this.element);
  }
  handleFocus(event: FocusEvent): void {
    const element = event.target as HTMLDivElement;
    if (element.classList.contains("line")) {
      const line = this.getLineIndexByElement(element);
      console.log(line);
    }
  };
  getLineByElement(element: HTMLDivElement): Line {
    return this.lines.find((l) => l.element == element);
  }
  getLineIndexByElement(element: HTMLDivElement): Line {
    return this.lines.find((l) => l.element == element);
  }
}

export class Line {
  element: HTMLDivElement;
  constructor(container: HTMLDivElement) {
    this.element = document.createElement("div");
    this.element.className = "line";
    this.element.tabIndex = 0;

    container.appendChild(this.element);
  }
}