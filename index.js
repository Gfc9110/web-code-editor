const editor = document.querySelector("#mainEditor")
const marginsContainer = editor.querySelector(".margin")
const linesContainer = editor.querySelector(".lines")
let cursor = { x: 0, y: 0 }

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
    console.log(key);
    if (interpretSpecial(key)) return;
    line.textContent += key
    moveCursorLeft();
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
            focus.previousSibling.focus()
            return true
          }
        case "Down":
          {
            focus.nextSibling.focus()
            return true
          }
      }
    }
  }
  if (key == "Backspace") {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      focus.textContent = focus.textContent.substring(0, focus.textContent.length - 1)
      return true;
    }
  }
  if (key == "Enter") {
    const focus = document.activeElement;
    if (focus.classList.contains("line")) {
      const line = newLine();
      focus.parentElement.insertBefore(line, focus.nextSibling)
      focus.nextSibling.focus();
      return true;
    }
  }
  return false;
}