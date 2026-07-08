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

## What is this?

**Lights Out GF(2) Solver** is an offline browser-based puzzle engine for the classic **Lights Out** game.

It includes:

- a playable Lights Out board,
- a custom map builder,
- a portable text-based map format,
- a solvability checker,
- and an automatic solver based on **linear algebra over GF(2)**.

The interface is styled like a cyber-terminal dashboard, but the core of the project is mathematical: it turns a puzzle board into a binary linear system and solves it.

---

## Important: download the full project, not only `index.html`

This app is split into multiple files:

```txt
index.html
styles.css
app.js
README.md
```

To run it correctly, download the **entire project folder**.

Do **not** download only `index.html`, because the page also needs:

- `styles.css` for the interface, layout, terminal theme, and animations,
- `app.js` for the game logic, map builder, parser, and solver engine.

### Easiest way

Click this button:

<div align="center">

<a href="https://github.com/TheLouisMahdi/lights-out-gf2-solver/archive/refs/heads/main.zip">
  <img src="https://img.shields.io/badge/DOWNLOAD_FULL_PROJECT-ZIP-33ff97?style=for-the-badge&logo=github&logoColor=020807" alt="Download full project ZIP" />
</a>

</div>

Then extract the ZIP and open:

```txt
index.html
```

in your browser.

---

## Project story

This project started about **one to two years ago** as a simple **Linear Algebra course assignment**.

The original goal was much smaller: generate a basic Lights Out board, mainly around `3×3` or `5×5`, and solve it using ideas from linear algebra.

After that, I expanded it into a more complete tool:

- added a real solver engine,
- added support for more board sizes,
- added custom map input/output,
- added a separate builder mode,
- added solvability detection,
- and turned the project into a small offline puzzle engine.

The final visual style, interface polish, README structure, and GitHub-ready presentation were improved with help from ChatGPT, while the project concept and algorithmic direction were based on my original coursework and development process.

---

## Features

### Play Mode

Play the normal Lights Out puzzle.

Clicking a cell toggles:

- the selected cell,
- the cell above,
- the cell below,
- the left neighbor,
- the right neighbor.

Available actions:

- generate a new puzzle,
- reset the board,
- check solvability,
- get a hint,
- auto-solve the current board.

### Map Builder

Create your own board manually.

In this mode, clicking a cell toggles **only that cell**, so you can design a custom puzzle state.

Available actions:

- clear the board,
- create a random layout,
- check whether the map is solvable,
- export the map as text,
- copy the map,
- load a map from text,
- transfer the map to Play Mode.

### Solver Engine

Paste or generate a board and let the solver analyze it.

Available actions:

- load a custom board,
- check if it is solvable,
- generate a solution map,
- auto-solve inside the solver screen,
- transfer the board to Play Mode.

---

## Supported board sizes

The app supports board sizes from:

```txt
0×0 to 30×30
```

Notes:

- `0×0` is treated as a safe empty boundary case.
- Real playable boards start from `1×1`.
- Larger boards use the same GF(2) solver engine.

---

## Map format

You can share or load boards using a compact text format.

### Header format

```txt
5x5:01010/00100/11100/00010/01001
```

### Multiline format

```txt
01010
00100
11100
00010
01001
```

For a board map:

```txt
1 = light is on
0 = light is off
```

For a solution map:

```txt
1 = this cell should be pressed
0 = this cell should not be pressed
```

---

## The math behind the solver

Lights Out can be represented as a linear system over **GF(2)**.

GF(2) means a field with only two values:

```txt
0 and 1
```

This is perfect for Lights Out because each light has only two states:

```txt
0 = off
1 = on
```

Pressing a cell toggles affected cells:

```txt
0 -> 1
1 -> 0
```

That is the same as XOR, or addition modulo 2.

---

## Linear system model

The board is modeled as:

```txt
A × x = b
```

Where:

| Symbol | Meaning |
|---|---|
| `A` | Toggle-effect matrix |
| `x` | Unknown press vector |
| `b` | Current board state |

Each column of `A` describes what happens when one specific cell is pressed.

The solver tries to find `x`, meaning:

```txt
which cells should be pressed to turn all lights off
```

---

## Algorithm details

The solver uses **Gaussian elimination over GF(2)**.

Instead of normal arithmetic, every operation is binary:

```txt
1 + 1 = 0
1 + 0 = 1
0 + 0 = 0
```

In JavaScript, this is naturally handled with XOR operations.

The implementation also stores matrix rows as `BigInt` bitsets, so row elimination can be done compactly:

```js
A[r] ^= A[row];
```

That single operation applies a binary row elimination step.

---

## Solvability detection

The same Gaussian elimination process also checks whether a board is solvable.

If elimination produces a contradiction like this:

```txt
0 = 1
```

then the puzzle is impossible to solve.

In code, that state is detected and the solver returns:

```js
null
```

If there is no contradiction, the solver returns a valid press path.

---

## Puzzle generation logic

Random puzzles in Play Mode are generated from the solved state.

The app starts with an all-off board, then applies a set of random valid presses.

Because the puzzle is created by real moves, it is guaranteed to be reachable from the solved state.

The solver is still used afterward as a safety check.

---

## Is the solution always the shortest?

No.

The solver returns a **valid solution**, not necessarily the minimum-move solution.

Finding the absolute shortest solution can be much more expensive, especially for larger boards.

For this project, the priority was:

- correctness,
- reliable solvability checking,
- broad board-size support,
- clean implementation,
- and a useful interactive interface.

---

## How to run

### Option 1: Download ZIP

1. Click the **Download Full Project ZIP** button near the top of this README.
2. Extract the ZIP file.
3. Open `index.html` in your browser.

### Option 2: Clone the repository

```bash
git clone https://github.com/TheLouisMahdi/lights-out-gf2-solver.git
cd lights-out-gf2-solver
```

Then open:

```txt
index.html
```

---

## File structure

```txt
lights-out-gf2-solver/
├── index.html
├── styles.css
├── app.js
└── README.md
```

---

## Tech stack

- HTML
- CSS
- Vanilla JavaScript
- BigInt bitset operations
- No external runtime dependencies
- No build step

---

## Credits

Developed by **THELOUISMAHDI**.

This project began as a simple Linear Algebra assignment and was later expanded into a complete Lights Out solving engine.

The final UI polish, cyber-terminal presentation, and README organization were refined with assistance from ChatGPT.

<div align="center">

<br />

<a href="https://github.com/TheLouisMahdi">
  <img src="https://img.shields.io/badge/THELOUISMAHDI-GitHub_Profile-33ff97?style=for-the-badge&logo=github&logoColor=020807" alt="THELOUISMAHDI GitHub Profile" />
</a>

<br />
<br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:020807,50:33ff97,100:00d9ff&height=120&section=footer" alt="Footer" />

</div>
