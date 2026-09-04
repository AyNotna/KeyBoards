// ====================== АУДИО ======================
let audioCtx = null;
let clickBuffer = null;
let isSoundLoaded = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  fetch("assets/click.wav")
    .then((response) => {
      if (!response.ok) throw new Error("Файл не найден");
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => audioCtx.decodeAudioData(arrayBuffer))
    .then((buffer) => {
      clickBuffer = buffer;
      isSoundLoaded = true;
      console.log("Звук загружен");
    })
    .catch((err) => {
      console.warn(
        "Не удалось загрузить click.mp3, используем сгенерированный звук",
        err,
      );
      generateFallbackClick();
    });
}

function generateFallbackClick() {
  const duration = 0.05;
  const sampleRate = audioCtx.sampleRate;
  const length = sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 100);
  }

  clickBuffer = buffer;
  isSoundLoaded = true;
  console.log("Сгенерирован fallback-звук");
}

function playClick() {
  if (!audioCtx || !isSoundLoaded) return;

  const source = audioCtx.createBufferSource();
  source.buffer = clickBuffer;
  source.playbackRate.value = 0.95 + Math.random() * 0.1;

  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.8 + Math.random() * 0.2;

  source.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  source.start();
}

// ====================== ОБРАБОТКА КЛАВИШ ======================
function findKeyElements(code) {
  return document.querySelectorAll(`.key[data-code="${code}"]`);
}

function pressKey(code) {
  const keyEls = findKeyElements(code);
  keyEls.forEach((el) => el.classList.add("pressed"));
  playClick();
}

function releaseKey(code) {
  const keyEls = findKeyElements(code);
  keyEls.forEach((el) => el.classList.remove("pressed"));
}

function resetAllKeys() {
  document.querySelectorAll(".key.pressed").forEach((el) => {
    el.classList.remove("pressed");
  });
}

const preventDefaultCodes = new Set([
  "Space",
  "Tab",
  "Backspace",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

function handleKeyDown(event) {
  if (!audioCtx) initAudio();
  if (event.repeat) return;
  //   if (event.code === "ControlLeft") return;
  if (preventDefaultCodes.has(event.code)) event.preventDefault();

  pressKey(event.code);
}

function handleKeyUp(event) {
  releaseKey(event.code);
}

function handleBlur() {
  resetAllKeys();
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", handleBlur);

console.log("Клавиатура готова к использованию");
