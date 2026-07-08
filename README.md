<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:020807,50:33ff97,100:00d9ff&height=180&section=header&text=Lights%20Out%20GF(2)%20Solver&fontColor=d8ffe9&fontSize=38&fontAlignY=38&desc=Offline%20Terminal%20Puzzle%20Engine%20%7C%20Map%20Builder%20%7C%20Auto%20Solver&descAlignY=58&animation=fadeIn" alt="Lights Out GF(2) Solver Header" />

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=20&duration=2800&pause=700&color=33FF97&center=true&vCenter=true&width=760&lines=Linear+Algebra+meets+Lights+Out;GF(2)+Gaussian+Elimination+Solver;Custom+Map+Builder+%2B+Auto+Solve+Engine;Fully+Offline+Vanilla+JavaScript+App" alt="Animated terminal typing intro" />

<br />

<a href="https://github.com/TheLouisMahdi/lights-out-gf2-solver/archive/refs/heads/main.zip">
  <img src="https://img.shields.io/badge/DOWNLOAD_FULL_PROJECT-ZIP-33ff97?style=for-the-badge&logo=github&logoColor=020807" alt="Download full project ZIP" />
</a>

<a href="https://github.com/TheLouisMahdi/lights-out-gf2-solver">
  <img src="https://img.shields.io/badge/VIEW_ON-GITHUB-00d9ff?style=for-the-badge&logo=github&logoColor=020807" alt="View on GitHub" />
</a>

<br />
<br />

<img src="https://img.shields.io/badge/HTML-Offline_App-33ff97?style=flat-square" />
<img src="https://img.shields.io/badge/CSS-Cyber_Terminal_UI-00d9ff?style=flat-square" />
<img src="https://img.shields.io/badge/JavaScript-Vanilla-f7df1e?style=flat-square" />
<img src="https://img.shields.io/badge/Algorithm-GF(2)_Gaussian_Elimination-ff3d71?style=flat-square" />

</div>

---

## Overview

**Lights Out GF(2) Solver** is an offline browser-based Lights Out puzzle engine with a cyber-terminal interface, custom map builder, portable map format, and automatic solver.

The app is designed for both normal users who want to play the puzzle and students/developers who want to see how a Lights Out board can be solved using **linear algebra over GF(2)**.

---

## Quick Start

This project is split into multiple files, so download or clone the **full repository**, not only `index.html`.

Required files:

```txt
index.html
styles.css
app.js
README.md
```

After downloading:

1. Extract the ZIP file.
2. Keep all files in the same folder.
3. Open `index.html` in your browser.

Clone option:

```bash
git clone https://github.com/TheLouisMahdi/lights-out-gf2-solver.git
cd lights-out-gf2-solver
```

Then open `index.html`.

---

## Project Background

This project started about **one to two years ago** as a simple **Linear Algebra course assignment**. The original version was mainly intended to generate and solve small `3×3` or `5×5` Lights Out boards.

I later expanded it into a complete offline puzzle tool with a solver engine, custom map builder, board transfer system, solvability checker, and support for board sizes from `0×0` to `30×30`.

The final interface polish, cyber-terminal visual style, and README presentation were refined with assistance from ChatGPT.

---

## Main Features

| Feature | Description |
|---|---|
| Play Mode | Play Lights Out normally and solve boards manually. |
| Map Builder | Create custom boards by toggling cells directly. |
| Solver Engine | Paste or generate a board and solve it automatically. |
| Solvability Check | Detect whether a board has a valid solution. |
| Solution Map | Export a map where `1` means “press this cell”. |
| Board Transfer | Move boards between Builder, Solver, and Play Mode. |
| Offline Use | Runs locally in the browser with no external runtime dependencies. |

---

## Modes

### Play Mode

Clicking a cell toggles the selected cell plus its four orthogonal neighbors: up, down, left, and right.

You can generate a new puzzle, reset it, check solvability, get a hint, or auto-solve the current state.

### Map Builder

Clicking a cell toggles **only that cell**, which makes it easy to design a custom Lights Out board.

The created map can be checked, copied, loaded from text, or transferred directly into Play Mode.

### Solver Engine

The Solver Engine accepts a custom board, checks whether it is solvable, generates a solution map, and can animate the solving process inside the solver screen.

---

## Supported Board Sizes

```txt
0×0 to 30×30
```

`0×0` is treated as a safe empty boundary case. Real playable puzzles start from `1×1`.

---

## Map Format

Header format:

```txt
5x5:01010/00100/11100/00010/01001
```

Multiline format:

```txt
01010
00100
11100
00010
01001
```

Meaning:

```txt
Board map:     1 = light on, 0 = light off
Solution map:  1 = press this cell, 0 = do not press this cell
```

---

## How the Solver Works

Lights Out can be written as a binary linear system:

```txt
A × x = b
```

| Symbol | Meaning |
|---|---|
| `A` | Toggle-effect matrix |
| `x` | Press vector, meaning which cells should be clicked |
| `b` | Current board state |

Each light is either off or on, so the board naturally fits **GF(2)**, a field with only two values:

```txt
0 and 1
```

A press toggles a light:

```txt
0 -> 1
1 -> 0
```

This is XOR behavior, also known as addition modulo 2.

The solver uses **Gaussian elimination over GF(2)**. Matrix rows are stored as `BigInt` bitsets, so binary row elimination can be done efficiently with XOR:

```js
A[r] ^= A[row];
```

During elimination, if the system reaches a contradiction like:

```txt
0 = 1
```

then the board is not solvable. Otherwise, the solver returns a valid press path.

---

## Puzzle Generation

Random puzzles are generated from the solved state by applying random valid presses. Because the board is created through real moves, it is reachable from the solved state. The solver is still used afterward as a safety check.

---

## Note About Optimality

The solver returns **a valid solution**, not necessarily the shortest possible solution.

Finding the absolute minimum-move solution can be much more expensive for larger boards, so this project prioritizes reliability, clear logic, and broad board-size support.

---

## Tech Stack

```txt
HTML
CSS
Vanilla JavaScript
BigInt bitset operations
No build step
No external runtime dependencies
```

---

## File Structure

```txt
lights-out-gf2-solver/
├── index.html
├── styles.css
├── app.js
└── README.md
```

---

## Credits

Developed by **THELOUISMAHDI**.

<div align="center">

<br />

<a href="https://github.com/TheLouisMahdi">
  <img src="https://img.shields.io/badge/THELOUISMAHDI-GitHub_Profile-33ff97?style=for-the-badge&logo=github&logoColor=020807" alt="THELOUISMAHDI GitHub Profile" />
</a>

<br />
<br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:020807,50:33ff97,100:00d9ff&height=120&section=footer" alt="Footer" />

</div>
