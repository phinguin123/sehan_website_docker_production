// utils/alertOnce.js
let hasAlerted = false;

export function alertOnce(message) {
  if (hasAlerted) return;
  hasAlerted = true;
  alert(message);
}

export function resetAlert() {
  hasAlerted = false;
}
