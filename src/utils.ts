export function divWithClass(className: string) {
  let el = document.createElement("div");
  el.className = className;
  return el;
}