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
        "Не удалось загрузить click.wav, используем сгенерированный звук",
        err,
      );
      generateFallbackClick();
    });
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

// ====================== РЕНДЕРИНГ ======================
function createKeyElement(keyData) {
  if (keyData.type === "spacer") {
    const spacer = document.createElement("div");
    spacer.className = "spacer";
    if (keyData.width) {
      spacer.style.width = `calc(var(--unit) * ${keyData.width})`;
    }
    if (keyData.height) {
      spacer.style.height = `calc(var(--key-height) * ${keyData.height})`;
    } else {
      spacer.style.height = "var(--key-height)";
    }
    return spacer;
  }
  const key = document.createElement("div");
  key.className = "key";
  if (keyData.class) key.classList.add(keyData.class);
  key.dataset.code = keyData.code;
  key.textContent = keyData.label || "";

  if (keyData.width) {
    key.style.width = `calc(var(--unit) * ${keyData.width})`;
  }
  if (keyData.height && keyData.height !== 1) {
    if (keyData.height === 0.5) {
      key.style.height = `calc((var(--key-height) - var(--gap)) / 2)`;
      key.classList.add("half-height");
    } else if (keyData.height === 2) {
      key.style.height = `calc(var(--key-height) * 2 + var(--gap))`;
      key.classList.add("tall");
    } else {
      key.style.height = `calc(var(--key-height) * ${keyData.height})`;
    }
  }
  return key;
}

function renderRow(rowData, container) {
  const row = document.createElement("div");
  row.className = "row";
  container.appendChild(row);

  for (let i = 0; i < rowData.keys.length; i++) {
    const keyData = rowData.keys[i];
    if (!keyData) continue;

    if (
      keyData.height === 0.5 &&
      rowData.keys[i + 1] &&
      rowData.keys[i + 1].height === 0.5
    ) {
      const wrapper = document.createElement("div");
      wrapper.className = "arrow-center";
      const upKey = createKeyElement(keyData);
      const downKey = createKeyElement(rowData.keys[i + 1]);
      wrapper.appendChild(upKey);
      wrapper.appendChild(downKey);
      row.appendChild(wrapper);
      i++;
    } else {
      row.appendChild(createKeyElement(keyData));
    }
  }
}

function renderColumn(rowsData, container) {
  rowsData.forEach((rowData) => renderRow(rowData, container));
}

function renderKeyboard(layout) {
  const container = document.querySelector(".keyboard");
  container.innerHTML = "";

  const mainWrapper = document.createElement("div");
  mainWrapper.className = "keyboard-main";
  container.appendChild(mainWrapper);
  layout.main.forEach((rowData) => renderRow(rowData, mainWrapper));

  if (layout.side && layout.side.length > 0) {
    const isColumnsFormat = Array.isArray(layout.side[0].rows);

    if (isColumnsFormat) {
      layout.side.forEach((columnData) => {
        const sideWrapper = document.createElement("div");
        sideWrapper.className = "keyboard-side";
        container.appendChild(sideWrapper);
        renderColumn(columnData.rows, sideWrapper);
      });
    } else {
      const sideWrapper = document.createElement("div");
      sideWrapper.className = "keyboard-side";
      container.appendChild(sideWrapper);
      renderColumn(layout.side, sideWrapper);
    }
  }
}

// ====================== ЗАГРУЗКА РАСКЛАДКИ ======================
async function loadLayout(layoutName) {
  try {
    const response = await fetch(`assets/layouts/${layoutName}.json`);
    if (!response.ok) throw new Error("Ошибка загрузки");
    const layout = await response.json();
    renderKeyboard(layout);
  } catch (err) {
    console.error("Не удалось загрузить раскладку", err);
  }
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

  if (
    event.getModifierState("AltGraph") &&
    (event.code === "ControlLeft" || event.code === "ControlRight")
  ) {
    return;
  }
  if (event.code === "ControlRight") return;

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

// ====================== ИНИЦИАЛИЗАЦИЯ ======================
document.addEventListener("DOMContentLoaded", () => {
  loadLayout("full-ansi");

  const selector = document.getElementById("layout-select");
  if (selector) {
    selector.addEventListener("change", (e) => {
      loadLayout(e.target.value);
    });
  }
});
