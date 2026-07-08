"use strict";

/* =========================================================
   Lights Out Terminal Solver
   Author: THELOUISMAHDI
   Engine: Bitset Gaussian Elimination over GF(2)
   Scope: Fully offline, 0x0 to 30x30 boards
========================================================= */

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);

const gridEl = $("grid");
const counterEl = $("counter");
const statusEl = $("status");
const boardModeLabel = $("board-mode-label");
const boardSizeLabel = $("board-size-label");
const terminalLog = $("terminal-log");

const playPanel = $("play-panel");
const builderPanel = $("builder-panel");
const solverPanel = $("solver-panel");

const tabPlay = $("tab-play");
const tabBuilder = $("tab-builder");
const tabSolver = $("tab-solver");

const playSizeSelect = $("size");
const builderSizeSelect = $("builder-size");
const solverSizeSelect = $("solver-size");

const builderMapText = $("builder-map-text");
const solverInput = $("solver-input");
const solutionOutput = $("solution-output");
const solutionList = $("solution-list");

const scoreBody = $("score").querySelector("tbody");

/* ---------- Constants ---------- */
const MIN_SIZE = 0;
const MAX_SIZE = 30;

const dirs = [
  [0, 0],
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

const baseLabel = {
  playSolve: "Auto Solve",
  solverAuto: "Auto Solve Here",
};

/* ---------- State ---------- */
let activeView = "play";

let playSize = 5;
let builderSize = 5;
let solverSize = 5;

let playBoard = [];
let playInit = [];
let builderBoard = [];
let solverBoard = [];
let solverOriginal = [];

let playHint = [];
let solverHint = [];

let tiles = [];

let playMoves = 0;
let solverSteps = 0;

let solving = false;
let anim = null;
let activeBtn = null;
let activeRunView = null;
let activeRunStartedAt = 0;
let gameStartedAt = 0;

const solverCache = {};
const best = new Map();

/* =========================================================
   Basic Helpers
========================================================= */
function indexOf(r, c, size) {
  return r * size + c;
}

function cloneBoard(board) {
  return board.map((v) => (v ? 1 : 0));
}

function emptyBoard(size) {
  if (!validateSize(size)) return [];
  return Array(size * size).fill(0);
}

function boardIsEmpty(board) {
  return board.every((v) => !v);
}

function boardIsSolved(board) {
  return board.every((v) => !v);
}

function countOn(board) {
  return board.reduce((sum, v) => sum + (v ? 1 : 0), 0);
}

function activeSize() {
  if (activeView === "builder") return builderSize;
  if (activeView === "solver") return solverSize;
  return playSize;
}

function activeBoard() {
  if (activeView === "builder") return builderBoard;
  if (activeView === "solver") return solverBoard;
  return playBoard;
}

function activeHint() {
  if (activeView === "solver") return solverHint;
  if (activeView === "play") return playHint;
  return [];
}

function setStatus(text, type = "info") {
  statusEl.textContent = text.startsWith("Status:") ? text : `Status: ${text}`;
  logTerminal(text, type);
}

function updateCounter() {
  if (activeView === "builder") {
    counterEl.textContent = `Lights On: ${countOn(builderBoard)}`;
  } else if (activeView === "solver") {
    counterEl.textContent = `Engine Step: ${solverSteps}`;
  } else {
    counterEl.textContent = `Moves: ${playMoves}`;
  }
}

function updateBoardLabels() {
  const size = activeSize();
  const mode = activeView === "play"
    ? "PLAY GRID"
    : activeView === "builder"
      ? "MAP BUILDER"
      : "SOLVER GRID";

  boardModeLabel.textContent = mode;
  boardSizeLabel.textContent = `${size}×${size}`;
}

function logTerminal(message, type = "info") {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const line = document.createElement("div");
  line.className = `log-line ${type}`;
  line.innerHTML = `<span class="time">[${time}]</span> ${escapeHtml(message)}`;

  terminalLog.appendChild(line);

  while (terminalLog.children.length > 80) {
    terminalLog.removeChild(terminalLog.firstChild);
  }

  terminalLog.scrollTop = terminalLog.scrollHeight;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validateSize(size) {
  return Number.isInteger(size) && size >= MIN_SIZE && size <= MAX_SIZE;
}

function populateSizeSelect(select, selectedSize = 5) {
  select.innerHTML = "";

  for (let size = MIN_SIZE; size <= MAX_SIZE; size++) {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = String(size);
    select.appendChild(option);
  }

  select.value = String(selectedSize);
}

function syncSizeSelects() {
  playSizeSelect.value = String(playSize);
  builderSizeSelect.value = String(builderSize);
  solverSizeSelect.value = String(solverSize);
}

/* =========================================================
   Grid Render
========================================================= */
function buildGrid() {
  const size = activeSize();
  const total = size * size;

  gridEl.innerHTML = "";
  gridEl.style.setProperty("--n", Math.max(size, 1));
  gridEl.style.gridTemplateColumns = size > 0 ? `repeat(${size}, var(--tile))` : "none";

  if (total === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-grid";
    empty.textContent = "0×0 empty board";
    gridEl.appendChild(empty);
    tiles = [];
    render(true);
    return;
  }

  tiles = Array.from({ length: total }, (_, k) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile";
    tile.setAttribute("aria-label", `Cell ${k + 1}`);
    tile.addEventListener("click", () => clickTile(k));
    gridEl.appendChild(tile);
    return tile;
  });

  render(true);
}

function render(clearHints = false) {
  const board = activeBoard();
  const hints = activeHint();

  gridEl.classList.toggle("builder-mode", activeView === "builder");
  gridEl.classList.toggle("solver-mode", activeView === "solver");

  tiles.forEach((tile, i) => {
    tile.classList.toggle("on", !!board[i]);

    if (clearHints || activeView === "builder") {
      tile.classList.remove("hint");
      tile.removeAttribute("data-hint");
    }
  });

  if (activeView !== "builder") {
    hints.forEach((k, i) => {
      const tile = tiles[k];

      if (tile) {
        tile.classList.add("hint");
        tile.dataset.hint = String(i + 1);
      }
    });
  }

  updateCounter();
  updateBoardLabels();
}

/* =========================================================
   Game Mechanics
========================================================= */
function press(board, k, size) {
  if (size <= 0) return;

  const x = k % size;
  const y = Math.floor(k / size);

  dirs.forEach(([dx, dy]) => {
    const nx = x + dx;
    const ny = y + dy;

    if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
      board[indexOf(ny, nx, size)] ^= 1;
    }
  });
}

function clickTile(k) {
  if (solving) return;

  if (activeView === "builder") {
    builderBoard[k] ^= 1;
    builderMapText.value = exportMap(builderBoard, builderSize);
    render(true);
    setStatus("Map editing in progress.", "info");
    return;
  }

  if (activeView === "solver") {
    solverBoard[k] ^= 1;
    solverOriginal = cloneBoard(solverBoard);
    solverHint = [];
    solverSteps = 0;
    solverInput.value = exportMap(solverBoard, solverSize);
    solutionOutput.value = "";
    solutionList.textContent = "Input changed. Load, check, or solve again.";
    render(true);
    setStatus("Solver input changed from the grid.", "info");
    return;
  }

  const wasHint = playHint.includes(k);

  press(playBoard, k, playSize);
  playMoves++;

  if (wasHint) {
    playHint = playHint.filter((h) => h !== k);
  } else {
    playHint = [];
  }

  render(true);

  if (boardIsSolved(playBoard)) {
    finishManualSolve();
  } else {
    setStatus("Game in progress.", "info");
  }
}

/* =========================================================
   Solver: GF(2) Bitset Gaussian Elimination
========================================================= */
function buildMatrixRows(size) {
  if (solverCache[size]) return solverCache[size];

  if (size === 0) {
    solverCache[size] = [];
    return solverCache[size];
  }

  const total = size * size;
  const rows = [];

  for (let cell = 0; cell < total; cell++) {
    let mask = 0n;

    const x = cell % size;
    const y = Math.floor(cell / size);

    dirs.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;

      if (nx >= 0 && ny >= 0 && nx < size && ny < size) {
        const pressIndex = indexOf(ny, nx, size);
        mask |= 1n << BigInt(pressIndex);
      }
    });

    rows.push(mask);
  }

  solverCache[size] = rows;
  return rows;
}

function solveBoard(board, size) {
  if (!validateSize(size) || board.length !== size * size) return null;

  if (size === 0) {
    return {
      solvable: true,
      path: [],
      vector: [],
      rank: 0,
    };
  }

  const total = size * size;
  const A = [...buildMatrixRows(size)];
  const b = board.map((v) => (v ? 1 : 0));

  let row = 0;
  const pivotCols = [];

  for (let col = 0; col < total && row < total; col++) {
    let pivot = row;

    while (pivot < total && ((A[pivot] >> BigInt(col)) & 1n) === 0n) {
      pivot++;
    }

    if (pivot === total) continue;

    [A[row], A[pivot]] = [A[pivot], A[row]];
    [b[row], b[pivot]] = [b[pivot], b[row]];

    for (let r = 0; r < total; r++) {
      if (r !== row && ((A[r] >> BigInt(col)) & 1n) === 1n) {
        A[r] ^= A[row];
        b[r] ^= b[row];
      }
    }

    pivotCols.push(col);
    row++;
  }

  for (let r = row; r < total; r++) {
    if (A[r] === 0n && b[r] === 1) {
      return null;
    }
  }

  const vector = Array(total).fill(0);

  pivotCols.forEach((col, i) => {
    vector[col] = b[i];
  });

  const path = [];

  vector.forEach((value, i) => {
    if (value) path.push(i);
  });

  return {
    solvable: true,
    path,
    vector,
    rank: pivotCols.length,
  };
}

/* =========================================================
   Map Parser / Exporter
========================================================= */
function exportMap(board, size) {
  if (size === 0) return "0x0:";

  const rows = [];

  for (let r = 0; r < size; r++) {
    let line = "";

    for (let c = 0; c < size; c++) {
      line += board[indexOf(r, c, size)] ? "1" : "0";
    }

    rows.push(line);
  }

  return `${size}x${size}:${rows.join("/")}`;
}

function parseMap(text) {
  const raw = text.trim();

  if (!raw) return null;

  let size = null;
  let body = raw;

  const header = raw.match(/^\s*(\d+)\s*x\s*(\d+)\s*:?\s*([\s\S]*)$/i);

  if (header) {
    const a = Number(header[1]);
    const b = Number(header[2]);

    if (a !== b || !validateSize(a)) return null;

    size = a;
    body = header[3].trim();

    if (size === 0) {
      return body ? null : { size: 0, board: [] };
    }
  }

  body = body.replace(/[|,;]+/g, "/");

  let rows;

  if (body.includes("/") || body.includes("\n") || body.includes("\r")) {
    rows = body
      .split(/[\/\n\r]+/)
      .map((row) => row.replace(/\s+/g, ""))
      .filter(Boolean);
  } else {
    const flat = body.replace(/\s+/g, "");

    if (!/^[01]+$/.test(flat)) return null;

    const root = Math.sqrt(flat.length);

    if (!Number.isInteger(root)) return null;

    size = size ?? root;
    rows = [];

    for (let i = 0; i < flat.length; i += size) {
      rows.push(flat.slice(i, i + size));
    }
  }

  if (!rows || !rows.length) return null;

  size = size ?? rows.length;

  if (!validateSize(size) || size === 0) return null;
  if (rows.length !== size) return null;

  const board = [];

  for (const row of rows) {
    if (row.length !== size) return null;
    if (!/^[01]+$/.test(row)) return null;

    for (const ch of row) {
      board.push(ch === "1" ? 1 : 0);
    }
  }

  return { size, board };
}

function pathToSolutionMap(path, size) {
  const solution = emptyBoard(size);

  path.forEach((k) => {
    solution[k] = 1;
  });

  return solution;
}

function pathToCoordinateList(path, size) {
  if (size === 0) return "0x0 empty board.";
  if (!path.length) return "Already solved.";

  return path
    .map((k, i) => {
      const r = Math.floor(k / size) + 1;
      const c = (k % size) + 1;
      return `${i + 1}) R${r}C${c}`;
    })
    .join("  |  ");
}

/* =========================================================
   View Management
========================================================= */
function setView(view) {
  if (solving) stopCurrent("Status: Active run stopped.", "warn");

  activeView = view;

  tabPlay.classList.toggle("active", view === "play");
  tabBuilder.classList.toggle("active", view === "builder");
  tabSolver.classList.toggle("active", view === "solver");

  playPanel.classList.toggle("active", view === "play");
  builderPanel.classList.toggle("active", view === "builder");
  solverPanel.classList.toggle("active", view === "solver");

  syncSizeSelects();
  buildGrid();

  if (view === "builder") {
    builderMapText.value = exportMap(builderBoard, builderSize);
    setStatus("Map Builder is active.", "info");
  } else if (view === "solver") {
    if (!solverInput.value.trim()) {
      solverInput.value = exportMap(solverBoard, solverSize);
    }
    setStatus("Solver Engine is active.", "info");
  } else {
    setStatus("Play Mode is active.", "info");
  }
}

function setPlaySize(size) {
  playSize = size;
  playBoard = emptyBoard(size);
  playInit = emptyBoard(size);
  playHint = [];
  playMoves = 0;
  gameStartedAt = performance.now();
  syncSizeSelects();
}

function setBuilderSize(size) {
  builderSize = size;
  builderBoard = emptyBoard(size);
  syncSizeSelects();
}

function setSolverBoard(size, board, preserveOriginal = false) {
  solverSize = size;
  solverBoard = cloneBoard(board);
  solverOriginal = preserveOriginal ? cloneBoard(solverOriginal) : cloneBoard(board);
  solverHint = [];
  solverSteps = 0;
  solverInput.value = exportMap(solverBoard, solverSize);
  solutionOutput.value = "";
  solutionList.textContent = "Input loaded. Check or solve it.";
  syncSizeSelects();
}

/* =========================================================
   Random Puzzle / Transfer
========================================================= */
function randomizeSolvableBoard(size) {
  if (size === 0) return { board: [], result: solveBoard([], 0) };

  const boardLength = size * size;
  const board = emptyBoard(size);

  const baseCount = {
    1: 1,
    2: 2,
    3: 5,
    4: 7,
    5: 10,
    8: 18,
    10: 25,
    15: 40,
    20: 60,
    30: 110,
  }[size] || Math.max(1, Math.floor(boardLength * 0.18));

  let result = null;
  let tries = 0;
  let current = board;

  do {
    current = emptyBoard(size);

    const pressCount = Math.min(
      boardLength,
      baseCount + Math.floor(Math.random() * Math.max(1, baseCount))
    );

    const used = new Set();

    while (used.size < pressCount) {
      used.add(Math.floor(Math.random() * boardLength));
    }

    used.forEach((k) => press(current, k, size));

    result = solveBoard(current, size);
    tries++;
  } while (
    tries < 120 &&
    (boardIsEmpty(current) || !result || result.path.length === 0)
  );

  return { board: current, result };
}

function randomizePlay() {
  stopCurrent("Status: Generating a new puzzle.", "info");

  if (playSize === 0) {
    playBoard = [];
    playInit = [];
    playMoves = 0;
    playHint = [];
    gameStartedAt = performance.now();
    render(true);
    setStatus("0×0 is an empty board. Choose size 1 to 30 for a real puzzle.", "warn");
    return;
  }

  const { board, result } = randomizeSolvableBoard(playSize);

  playBoard = cloneBoard(board);
  playInit = cloneBoard(board);
  playMoves = 0;
  playHint = [];
  gameStartedAt = performance.now();

  render(true);

  if (result) {
    setStatus(`New ${playSize}×${playSize} puzzle ready. Engine solution: ${result.path.length} moves.`, "ok");
  } else {
    setStatus("Puzzle generation failed. Try again.", "error");
  }
}

function transferToPlay(board, size, sourceName) {
  const result = solveBoard(board, size);

  if (!result) {
    setStatus("This map is not solvable. Transfer cancelled.", "error");
    return false;
  }

  playSize = size;
  playBoard = cloneBoard(board);
  playInit = cloneBoard(board);
  playHint = [];
  playMoves = 0;
  gameStartedAt = performance.now();

  syncSizeSelects();
  setView("play");
  render(true);

  setStatus(`${sourceName} transferred to Play Mode. Engine solution: ${result.path.length} moves.`, "ok");
  return true;
}

/* =========================================================
   Auto Run / Score
========================================================= */
function runAuto(view, path, button, label) {
  stopCurrent("Status: Ready", "info");

  if (!path.length) {
    setStatus("This board is already solved.", "ok");
    return;
  }

  activeRunView = view;
  activeBtn = button;
  activeBtn.textContent = "Stop";
  solving = true;
  activeRunStartedAt = performance.now();

  if (view === "solver") {
    solverSteps = 0;
  }

  setStatus(`${label} started.`, "ok");

  let i = 0;

  anim = setInterval(() => {
    if (i >= path.length) {
      finishAutoRun();
      return;
    }

    if (view === "play") {
      press(playBoard, path[i], playSize);
      playMoves++;
    } else if (view === "solver") {
      press(solverBoard, path[i], solverSize);
      solverSteps++;
    }

    i++;
    render(true);

    const board = view === "play" ? playBoard : solverBoard;

    if (boardIsSolved(board)) {
      finishAutoRun();
    }
  }, 78);
}

function stopCurrent(message = "Status: Ready", type = "info") {
  if (anim) {
    clearInterval(anim);
    anim = null;
  }

  if (activeBtn) {
    activeBtn.textContent = baseLabel[activeBtn.dataset.kind] || activeBtn.textContent;
    activeBtn = null;
  }

  solving = false;
  activeRunView = null;
  setStatus(message, type);
}

function finishAutoRun() {
  if (!solving) return;

  const elapsed = ((performance.now() - activeRunStartedAt) / 1000).toFixed(1) + " s";

  if (activeRunView === "play") {
    addScore("Auto Solve", playMoves, elapsed);
    playHint = [];
    stopCurrent("Status: Auto solve completed.", "ok");
  } else if (activeRunView === "solver") {
    solverHint = [];
    stopCurrent("Status: Solver Engine completed the board.", "ok");
  }

  render(true);
}

function finishManualSolve() {
  const elapsed = ((performance.now() - gameStartedAt) / 1000).toFixed(1) + " s";
  addScore("Manual Solve", playMoves, elapsed);
  playHint = [];
  setStatus("Manual solve completed.", "ok");
  render(true);
}

function addScore(name, steps, elapsed) {
  const key = `${playSize}-${name}`;
  const prev = best.get(key);

  if (prev && prev.steps <= steps) return;

  best.set(key, { steps, elapsed });

  scoreBody.querySelectorAll(`tr[data-key="${key}"]`).forEach((tr) => tr.remove());

  const tr = document.createElement("tr");
  tr.dataset.key = key;
  tr.innerHTML = `<td>${name} (${playSize}×${playSize})</td><td>${steps}</td><td>${elapsed}</td>`;
  scoreBody.appendChild(tr);
}

/* =========================================================
   Builder Actions
========================================================= */
function checkBuilderMap() {
  const result = solveBoard(builderBoard, builderSize);

  if (!result) {
    setStatus("The custom map is not solvable.", "error");
    return null;
  }

  if (builderSize === 0) {
    setStatus("0×0 is empty and already solved.", "warn");
    return result;
  }

  if (boardIsEmpty(builderBoard)) {
    setStatus("The map is empty and already solved. You can transfer it, but it is not a real puzzle.", "warn");
    return result;
  }

  setStatus(`Custom ${builderSize}×${builderSize} map is solvable. Engine solution: ${result.path.length} moves.`, "ok");
  return result;
}

function loadBuilderMapFromText() {
  const parsed = parseMap(builderMapText.value);

  if (!parsed) {
    setStatus("Invalid builder map format.", "error");
    return;
  }

  builderSize = parsed.size;
  builderBoard = cloneBoard(parsed.board);
  syncSizeSelects();

  setView("builder");
  builderMapText.value = exportMap(builderBoard, builderSize);
  render(true);

  setStatus(`${builderSize}×${builderSize} map loaded into Map Builder.`, "ok");
}

/* =========================================================
   Solver Actions
========================================================= */
function loadSolverInput() {
  const parsed = parseMap(solverInput.value);

  if (!parsed) {
    setStatus("Invalid Solver input format.", "error");
    return null;
  }

  setSolverBoard(parsed.size, parsed.board);
  setView("solver");

  const result = solveBoard(solverBoard, solverSize);

  if (!result) {
    solutionOutput.value = "UNSOLVABLE";
    solutionList.textContent = "No solution.";
    setStatus("Solver input is not solvable.", "error");
    return null;
  }

  const solutionMap = pathToSolutionMap(result.path, solverSize);
  solverHint = [...result.path];
  solutionOutput.value = exportMap(solutionMap, solverSize);
  solutionList.textContent = pathToCoordinateList(result.path, solverSize);

  render(true);
  setStatus(`Solver input ${solverSize}×${solverSize} is solvable. ${result.path.length} moves.`, "ok");

  return result;
}

function runSolverHere() {
  const parsed = parseMap(solverInput.value);

  if (parsed) {
    setSolverBoard(parsed.size, parsed.board);
  } else if (!solverBoard.length && solverSize !== 0) {
    setStatus("Enter a valid map first.", "error");
    return;
  }

  const result = solveBoard(solverBoard, solverSize);

  if (!result) {
    solutionOutput.value = "UNSOLVABLE";
    solutionList.textContent = "No solution.";
    setView("solver");
    setStatus("This board is not solvable.", "error");
    return;
  }

  solverOriginal = cloneBoard(solverBoard);
  solverHint = [...result.path];

  const solutionMap = pathToSolutionMap(result.path, solverSize);
  solutionOutput.value = exportMap(solutionMap, solverSize);
  solutionList.textContent = pathToCoordinateList(result.path, solverSize);

  setView("solver");
  render(true);
  runAuto("solver", result.path, $("solver-auto"), "Solver Engine auto-run");
}

function transferSolverInputToPlay() {
  let board = solverOriginal.length || solverSize === 0 ? cloneBoard(solverOriginal) : cloneBoard(solverBoard);
  let size = solverSize;

  const parsed = parseMap(solverInput.value);

  if (parsed) {
    board = cloneBoard(parsed.board);
    size = parsed.size;
  }

  if (!validateSize(size) || board.length !== size * size) {
    setStatus("No valid input to transfer.", "error");
    return;
  }

  transferToPlay(board, size, "Solver input");
}

function resetSolver() {
  solverSize = 5;
  solverBoard = emptyBoard(5);
  solverOriginal = cloneBoard(solverBoard);
  solverHint = [];
  solverSteps = 0;
  solverInput.value = exportMap(solverBoard, solverSize);
  solutionOutput.value = "";
  solutionList.textContent = "Engine reset. Enter a new map.";
  syncSizeSelects();
  setView("solver");
  render(true);
  setStatus("Solver Engine reset.", "info");
}

function createBlankSolverInput() {
  const size = Number(solverSizeSelect.value);

  if (!validateSize(size)) {
    setStatus("Invalid engine size.", "error");
    return;
  }

  setSolverBoard(size, emptyBoard(size));
  setView("solver");
  render(true);
  setStatus(`Blank ${size}×${size} input created.`, size === 0 ? "warn" : "info");
}

function createRandomSolverInput() {
  const size = Number(solverSizeSelect.value);

  if (!validateSize(size)) {
    setStatus("Invalid engine size.", "error");
    return;
  }

  if (size === 0) {
    setSolverBoard(0, []);
    setView("solver");
    render(true);
    setStatus("Random 0×0 input is just an empty board.", "warn");
    return;
  }

  const { board, result } = randomizeSolvableBoard(size);
  setSolverBoard(size, board);
  setView("solver");

  if (result) {
    solverHint = [...result.path];
    solutionOutput.value = exportMap(pathToSolutionMap(result.path, size), size);
    solutionList.textContent = pathToCoordinateList(result.path, size);
    render(true);
    setStatus(`Random solvable ${size}×${size} input created.`, "ok");
  } else {
    setStatus("Random input generation failed.", "error");
  }
}

/* =========================================================
   Clipboard
========================================================= */
async function copyText(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    setStatus(successMessage, "ok");
  } catch {
    const temp = document.createElement("textarea");
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    setStatus(successMessage, "ok");
  }
}

/* =========================================================
   Events
========================================================= */
tabPlay.addEventListener("click", () => setView("play"));
tabBuilder.addEventListener("click", () => setView("builder"));
tabSolver.addEventListener("click", () => setView("solver"));

playSizeSelect.addEventListener("change", () => {
  const size = Number(playSizeSelect.value);

  if (!validateSize(size)) {
    setStatus("Invalid size.", "error");
    return;
  }

  setPlaySize(size);
  setView("play");
  randomizePlay();
});

builderSizeSelect.addEventListener("change", () => {
  const size = Number(builderSizeSelect.value);

  if (!validateSize(size)) {
    setStatus("Invalid size.", "error");
    return;
  }

  builderSize = size;
  builderBoard = emptyBoard(size);
  builderMapText.value = exportMap(builderBoard, builderSize);
  setView("builder");
  render(true);
  setStatus(`Map Builder size changed to ${size}×${size}.`, "info");
});

solverSizeSelect.addEventListener("change", () => {
  const size = Number(solverSizeSelect.value);

  if (!validateSize(size)) {
    setStatus("Invalid engine size.", "error");
    return;
  }

  setSolverBoard(size, emptyBoard(size));
  setView("solver");
  render(true);
  setStatus(`Solver Engine size changed to ${size}×${size}.`, "info");
});

$("new").addEventListener("click", () => {
  setView("play");
  randomizePlay();
});

$("reset").addEventListener("click", () => {
  stopCurrent("Status: Reset completed.", "info");
  playBoard = cloneBoard(playInit);
  playMoves = 0;
  playHint = [];
  gameStartedAt = performance.now();
  setView("play");
  render(true);
});

$("check").addEventListener("click", () => {
  const result = solveBoard(playBoard, playSize);

  if (!result) {
    setStatus("This state is not solvable.", "error");
    return;
  }

  if (boardIsSolved(playBoard)) {
    setStatus("This state is already solved.", "ok");
    return;
  }

  setStatus(`Solvable. Engine solution: ${result.path.length} moves.`, "ok");
});

$("hint-btn").addEventListener("click", () => {
  const result = solveBoard(playBoard, playSize);

  if (!result) {
    setStatus("This state is not solvable.", "error");
    return;
  }

  playHint = [...result.path];
  render(true);
  setStatus(`Hint generated. ${playHint.length} suggested moves.`, "ok");
});

$("solve").addEventListener("click", function () {
  if (solving && activeBtn === this) {
    stopCurrent("Status: Auto solve stopped.", "warn");
    return;
  }

  const result = solveBoard(playBoard, playSize);

  if (!result) {
    setStatus("This state is not solvable.", "error");
    return;
  }

  playHint = [];
  runAuto("play", result.path, this, "Play Mode auto-solve");
});

$("builder-clear").addEventListener("click", () => {
  builderBoard = emptyBoard(builderSize);
  builderMapText.value = exportMap(builderBoard, builderSize);
  render(true);
  setStatus("Map cleared.", "info");
});

$("builder-random").addEventListener("click", () => {
  if (builderSize === 0) {
    builderBoard = [];
    builderMapText.value = exportMap(builderBoard, builderSize);
    render(true);
    setStatus("No random layout exists for 0×0.", "warn");
    return;
  }

  builderBoard = builderBoard.map(() => (Math.random() < 0.36 ? 1 : 0));
  builderMapText.value = exportMap(builderBoard, builderSize);
  render(true);
  setStatus(`Random ${builderSize}×${builderSize} layout created. Check or transfer it.`, "info");
});

$("builder-check").addEventListener("click", checkBuilderMap);

$("builder-to-play").addEventListener("click", () => {
  transferToPlay(builderBoard, builderSize, "Custom map");
});

$("builder-map-refresh").addEventListener("click", () => {
  builderMapText.value = exportMap(builderBoard, builderSize);
  setStatus("Map output generated.", "ok");
});

$("builder-map-copy").addEventListener("click", () => {
  builderMapText.value = exportMap(builderBoard, builderSize);
  copyText(builderMapText.value, "Map copied.");
});

$("builder-map-load").addEventListener("click", loadBuilderMapFromText);

$("solver-blank").addEventListener("click", createBlankSolverInput);
$("solver-random").addEventListener("click", createRandomSolverInput);
$("solver-load").addEventListener("click", loadSolverInput);

$("solver-auto").addEventListener("click", function () {
  if (solving && activeBtn === this) {
    stopCurrent("Status: Solver run stopped.", "warn");
    return;
  }

  runSolverHere();
});

$("solver-to-play").addEventListener("click", transferSolverInputToPlay);
$("solver-reset").addEventListener("click", resetSolver);

$("solution-copy").addEventListener("click", () => {
  const text = solutionOutput.value.trim();

  if (!text) {
    setStatus("No solution output yet.", "warn");
    return;
  }

  copyText(text, "Solution copied.");
});

$("solver-current-copy").addEventListener("click", () => {
  copyText(exportMap(solverBoard, solverSize), "Current engine map copied.");
});

/* =========================================================
   Init
========================================================= */
function initApp() {
  populateSizeSelect(playSizeSelect, 5);
  populateSizeSelect(builderSizeSelect, 5);
  populateSizeSelect(solverSizeSelect, 5);

  playSize = 5;
  builderSize = 5;
  solverSize = 5;

  playBoard = emptyBoard(playSize);
  playInit = emptyBoard(playSize);
  builderBoard = emptyBoard(builderSize);
  solverBoard = emptyBoard(solverSize);
  solverOriginal = cloneBoard(solverBoard);

  builderMapText.value = exportMap(builderBoard, builderSize);
  solverInput.value = exportMap(solverBoard, solverSize);

  setView("play");
  randomizePlay();

  logTerminal("Terminal Solver boot complete.", "ok");
}

initApp();
