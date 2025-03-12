# Feature Specification: 9×9 Sudoku Puzzle Selection & Levels

## Feature Overview

The game will offer predefined 9×9 Sudoku puzzles at different difficulty levels. Each puzzle consists of:
	•	A partially pre-filled grid with empty cells for the player to solve.
	•	A corresponding solution for validation.
	•	A puzzle selection system, allowing players to choose from predefined puzzles.

⸻

## Functional Requirements

### Puzzle Selection
	1.	The game provides a list of predefined puzzles.
	2.	Players can select a puzzle to play.
	3.	The game loads the selected puzzle into the board.
	4.	The corresponding solution is stored internally for validation.

### Game Mechanics
	1.	Pre-filled numbers are uneditable (marked as Initial Cells).
	2.	Players can place numbers 1-9 in empty cells.
	3.	Hints & validation features use the stored solution.
	4.	Game reset allows replaying a puzzle from the beginning.

⸻

## Predefined Puzzles

### Puzzle 1: Empty Middle 3×3 Square
	•	The entire grid is solved, except for the middle 3×3 block, which is left empty.

#### Puzzle Grid
5 3 4 | 6 7 8 | 9 1 2
6 7 2 | 1 9 5 | 3 4 8
1 9 8 | 3 4 2 | 5 6 7
---------------------
8 5 9 | . . . | 4 2 6
4 2 6 | . . . | 7 9 1
7 1 3 | . . . | 8 5 9
---------------------
9 6 1 | 5 3 7 | 2 8 4
2 8 7 | 4 1 9 | 6 3 5
3 4 5 | 2 8 6 | 1 7 9

(Cells marked ”.” are empty and must be filled by the player.)

#### Solution Grid
5 3 4 | 6 7 8 | 9 1 2
6 7 2 | 1 9 5 | 3 4 8
1 9 8 | 3 4 2 | 5 6 7
---------------------
8 5 9 | 7 6 1 | 4 2 6
4 2 6 | 8 5 3 | 7 9 1
7 1 3 | 9 2 4 | 8 5 9
---------------------
9 6 1 | 5 3 7 | 2 8 4
2 8 7 | 4 1 9 | 6 3 5
3 4 5 | 2 8 6 | 1 7 9

### Puzzle 2: Three Empty Rows
	•	The entire grid is solved, except for rows 4, 5, and 6, which are left empty.

#### Puzzle Grid
5 3 4 | 6 7 8 | 9 1 2
6 7 2 | 1 9 5 | 3 4 8
1 9 8 | 3 4 2 | 5 6 7
---------------------
. . . | . . . | . . .
. . . | . . . | . . .
. . . | . . . | . . .
---------------------
9 6 1 | 5 3 7 | 2 8 4
2 8 7 | 4 1 9 | 6 3 5
3 4 5 | 2 8 6 | 1 7 9

Cells marked ”.” are empty and must be filled by the player.)

#### Solution Grid
5 3 4 | 6 7 8 | 9 1 2
6 7 2 | 1 9 5 | 3 4 8
1 9 8 | 3 4 2 | 5 6 7
---------------------
8 5 9 | 7 6 1 | 4 2 3
4 2 6 | 8 5 3 | 7 9 1
7 1 3 | 9 2 4 | 8 5 6
---------------------
9 6 1 | 5 3 7 | 2 8 4
2 8 7 | 4 1 9 | 6 3 5
3 4 5 | 2 8 6 | 1 7 9

## Game UI & Styling
	•	Puzzle Selection Screen
	•	Players choose from available puzzles.
	•	Simple labels: “Puzzle 1 - Empty Middle” and “Puzzle 2 - Three Empty Rows”.
	•	Game Board
	•	Pre-filled numbers are styled as bold and uneditable.
	•	Empty cells remain interactive.

## Edge Cases
	•	Puzzle Completion Detection: Ensure the player can win the game only when all numbers match the stored solution.
	•	Restart Mechanic: Allow restarting the puzzle while keeping it within the same difficulty level.
	•	Adding More Puzzles Later: The system should allow adding more predefined Sudoku puzzles with minimal code changes.  

## Suggested Implementation

### Puzzle Data Storage
const puzzles = [
    {
        id: 1,
        name: "Empty Middle Square",
        difficulty: "Easy",
        grid: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 0, 0, 0, 4, 2, 6],
            [4, 2, 6, 0, 0, 0, 7, 9, 1],
            [7, 1, 3, 0, 0, 0, 8, 5, 9],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ],
        solution: [
            [5, 3, 4, 6, 7, 8, 9, 1, 2],
            [6, 7, 2, 1, 9, 5, 3, 4, 8],
            [1, 9, 8, 3, 4, 2, 5, 6, 7],
            [8, 5, 9, 7, 6, 1, 4, 2, 3],
            [4, 2, 6, 8, 5, 3, 7, 9, 1],
            [7, 1, 3, 9, 2, 4, 8, 5, 6],
            [9, 6, 1, 5, 3, 7, 2, 8, 4],
            [2, 8, 7, 4, 1, 9, 6, 3, 5],
            [3, 4, 5, 2, 8, 6, 1, 7, 9]
        ]
    },
    // Add Puzzle 2...
];

