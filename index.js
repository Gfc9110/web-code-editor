const editor = document.querySelector("#mainEditor")
const marginsContainer = editor.querySelector(".margin")
const linesContainer = editor.querySelector(".lines")
const cursorElement = editor.querySelector(".cursor")
String.prototype.splice = function (index, count, add) {
  return this.slice(0, index) + (add || "") + this.slice(index + count);
}
let cursor = { x: 0, y: 0 }

function repositonCursor() {
  if (linesContainer.childNodes[cursor.y]) {
    cursor.x = Math.min(linesContainer.childNodes[cursor.y].textContent.length, cursor.x);
  }
  cursorElement.style.left = 65 + (cursor.x * 10.81) + "px"
  cursorElement.style.top = (cursor.y * 30) + "px"
}


function moveCursorRight() {
  cursor.x++;
  repositonCursor();
}

function moveCursorLeft() {
  cursor.x--;
  cursor.x = Math.max(0, cursor.x);
  repositonCursor();
}

function moveCursorDown() {
  cursor.y++;
  repositonCursor();
}

function moveCursorUp() {
  cursor.y--;
  cursor.y = Math.max(0, cursor.y);
  repositonCursor();
}

repositonCursor();

var linesObserver = new MutationObserver((mutations) => {
  while (mutations[0].target.childNodes.length > (marginsContainer.childNodes?.length || 0)) {
    let marginLine = newLine();
    marginLine.textContent = (marginsContainer.childNodes?.length || 0) + 1
    marginsContainer.appendChild(marginLine)
  }
})

linesObserver.observe(linesContainer, { childList: true });

function newLine() {
  const line = document.createElement("div");
  line.className = "line";
  line.tabIndex = 0;
  line.addEventListener("keydown", ({ key }) => {
    if (interpretSpecial(key)) return;
    line.textContent = line.textContent.splice(cursor.x, 0, key);
    moveCursorRight();
  })
  return line;
}

if (linesContainer.childNodes.length < 1) {
  const firstLine = newLine();
  linesContainer.appendChild(firstLine)
}

function interpretSpecial(key) {
  if (key.startsWith("Arrow")) {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      switch (key.replace("Arrow", "")) {
        case "Up":
          {
            if (focus.previousSibling) {
              focus.previousSibling?.focus()
              moveCursorUp()
            }
            return true
          }
        case "Down":
          {
            if (focus.nextSibling) {
              focus.nextSibling?.focus()
              moveCursorDown()
            }
            return true
          }
        case "Left":
          {
            moveCursorLeft()
            return true
          }
        case "Right":
          {
            moveCursorRight()
            return true
          }
      }
    }
  }
  if (key == "Backspace") {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      focus.textContent = focus.textContent.splice(cursor.x - 1, 1)
      moveCursorLeft();
      return true;
    }
  }
  if (key == "Delete") {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      focus.textContent = focus.textContent.splice(cursor.x, 1)
      return true;
    }
  }
  if (key == "Enter") {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      const line = newLine();
      focus.parentElement.insertBefore(line, focus.nextSibling)
      focus.nextSibling.focus();
      moveCursorDown();
      return true;
    }
  }
  return false;
}