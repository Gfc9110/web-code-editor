const editor = document.querySelector("#mainEditor")
const marginsContainer = editor.querySelector(".margin")
const linesContainer = editor.querySelector(".lines")
const cursorElement = editor.querySelector(".cursor")
/**
 * @type {HTMLScriptElement || null}
 */
let scriptElement;
String.prototype.splice = function (index, count, add) {
  return this.slice(0, index) + (add || "") + this.slice(index + count);
}
let cursor = { x: 0, y: 0 }

window.addEventListener("error", console.log)

function addScript(content) {
  if (scriptElement) {
    scriptElement.remove();
  }
  scriptElement = document.createElement("script");
  scriptElement.innerHTML = content
  document.body.appendChild(scriptElement)
}

function clearScript() {
  scriptElement?.remove();
  scriptElement = null
}

function repositonCursor() {
  cursor.x = Math.floor(cursor.x);
  cursor.y = Math.floor(cursor.y);
  if (linesContainer.childNodes[cursor.y]) {
    cursor.x = Math.min(linesContainer.childNodes[cursor.y].textContent.length, cursor.x);
  }
  cursorElement.style.left = 65 + (cursor.x * 10.81) + "px"
  cursorElement.style.top = (cursor.y * 30) + "px"
}

function lineExists(i) {
  return !!linesContainer.childNodes[i];
}

function getEditorFileContent() {
  let content = "";
  Array.from(linesContainer.childNodes).forEach((line, i) => content += line.textContent + (i < linesContainer.childNodes.length - 1 ? "\n" : ""))
  return content;
}

function focusLine(i) {
  linesContainer.childNodes[i]?.focus();
}

function deleteLine(i) {
  linesContainer.childNodes[i]?.remove();
}

function SetCursorX(val) {
  cursor.x = val
  repositonCursor();
}

function SetCursorY(val) {
  cursor.y = Math.min(linesContainer.childNodes.length - 1, val)
  repositonCursor();
}

function moveCursorRight(val = 1) {
  cursor.x += val;
  repositonCursor();
}

function moveCursorLeft(val = 1) {
  cursor.x -= val;
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
  while (mutations[0].target.childNodes.length < (marginsContainer.childNodes?.length || 0)) {
    marginsContainer.lastChild.remove();
  }
})

linesObserver.observe(linesContainer, { childList: true });

function newLine(active = false) {
  const line = document.createElement("div");
  line.className = "line";
  if (active) {
    line.tabIndex = 0;
    line.addEventListener("keydown", (event) => {
      let result = interpretSpecial(event);
      if (result && typeof result == "string") {
        line.textContent = line.textContent.splice(cursor.x, 0, result);
        moveCursorRight(result.length);
      } else if (!result) {
        line.textContent = line.textContent.splice(cursor.x, 0, event.key);
        moveCursorRight(event.key.length);
      }
    })
    line.addEventListener("mousedown", (event) => {
      //event.preventDefault()
      SetCursorY(Array.from(linesContainer.childNodes).findIndex((l) => l === line))
      SetCursorX(event.offsetX / 10.81)
    })
  }
  return line;
}

if (linesContainer.childNodes.length < 1) {
  const firstLine = newLine(true);
  linesContainer.appendChild(firstLine)
}

function interpretSpecial(event) {
  if (event.key.startsWith("Arrow")) {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      switch (event.key.replace("Arrow", "")) {
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
  if (event.key == "Backspace") {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      if (cursor.x > 0) {
        focus.textContent = focus.textContent.splice(cursor.x - 1, 1)
        moveCursorLeft();
      } else if (cursor.y > 0) {
        SetCursorX(focus.previousSibling.textContent.length)
        focus.previousSibling.textContent += focus.textContent
        deleteLine(cursor.y)
        moveCursorUp()
        focusLine(cursor.y)
      }
      return true;
    }
  }
  if (event.key == "Delete") {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      if (cursor.x == focus.textContent.length) {
        if (lineExists(cursor.y + 1)) {
          focus.textContent = focus.textContent + focus.nextSibling.textContent
          deleteLine(cursor.y + 1)
        }
        return true
      } else {
        focus.textContent = focus.textContent.splice(cursor.x, 1)
        return true;
      }
    }
  }
  if (event.key == "Enter") {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      const line = newLine(true);
      focus.parentElement.insertBefore(line, focus.nextSibling)
      focus.nextSibling.focus();
      if (cursor.x < focus.textContent.length) {
        focus.nextSibling.textContent += focus.textContent.substring(cursor.x);
        focus.textContent = focus.textContent.substring(0, cursor.x);
        SetCursorX(0)
      }
      moveCursorDown();
      return true;
    }
  }
  if (event.key == "Tab") {
    event.preventDefault();
    return "   ";
  }
  if (event.key == "F2") {
    event.preventDefault();
    //TODO find error line number??
    addScript(getEditorFileContent())
    return true;
  }
  if (event.key == "End") {
    SetCursorX(Infinity)
    return true
  }
  if (event.key == "Home") {
    SetCursorX(0)
    return true
  }
  if (event.key.length > 1) {
    return true;
  }
  return false;
}