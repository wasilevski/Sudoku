/**
 * SudokuGame class
 * Manages the state and rules of a Sudoku puzzle
 */
class SudokuGame {
    /**
     * Create a new Sudoku game
     * @param {string} difficulty - The difficulty level ('easy', 'medium', 'hard', 'expert')
     */
    constructor(difficulty = 'medium') {
      this.grid = Array(9).fill().map(() => Array(9).fill(0));
      this.initialGrid = Array(9).fill().map(() => Array(9).fill(0));
      this.notes = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
      this.difficulty = difficulty;
      this.moveHistory = [];
      this.redoStack = [];
      this.moveCount = 0;
      this.bombs = 0;
      this.maxBombs = 3; // Game over at 3 bombs
      this.generatePuzzle();
      this.currentPuzzleId = null;
    }
    
    /**
     * Generate a new Sudoku puzzle
     */
    generatePuzzle() {
      // Step 1: Generate a solved puzzle
      this.grid = Array(9).fill().map(() => Array(9).fill(0));
      this.solveGrid();
      
      // Step 2: Make a deep copy for the solution
      const solution = JSON.parse(JSON.stringify(this.grid));
      
      // Step 3: Remove numbers based on difficulty
      let cellsToRemove;
      switch(this.difficulty) {
        case 'easy':
          cellsToRemove = 40; // 41 clues remain
          break;
        case 'medium':
          cellsToRemove = 50; // 31 clues remain
          break;
        case 'hard':
          cellsToRemove = 55; // 26 clues remain
          break;
        case 'expert':
          cellsToRemove = 60; // 21 clues remain
          break;
        default:
          cellsToRemove = 50;
      }
      
      // Remove numbers while ensuring the puzzle remains solvable
      this.removeNumbers(cellsToRemove);
      
      // Save the initial state
      this.initialGrid = JSON.parse(JSON.stringify(this.grid));
      this.moveHistory = [];
      this.redoStack = [];
      this.moveCount = 0;
      this.notes = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
    }
    
    /**
     * Check if a move is valid according to Sudoku rules
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     * @param {number} value - Value to check (1-9)
     * @returns {boolean} True if the move is valid
     */
    isValidMove(row, col, value) {
      // Check if the cell is part of the initial puzzle
      if (this.initialGrid[row][col] !== 0) {
        return false;
      }
      
      // Check row
      for (let c = 0; c < 9; c++) {
        if (c !== col && this.grid[row][c] === value) {
          return false;
        }
      }
      
      // Check column
      for (let r = 0; r < 9; r++) {
        if (r !== row && this.grid[r][col] === value) {
          return false;
        }
      }
      
      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const currentRow = boxRow + r;
          const currentCol = boxCol + c;
          if (currentRow !== row || currentCol !== col) {
            if (this.grid[currentRow][currentCol] === value) {
              return false;
            }
          }
        }
      }
      
      return true;
    }
    
    /**
     * Make a move
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     * @param {number} value - The number to place (0-9, 0 clears the cell)
     * @returns {boolean} Whether the move was successful
     */
    makeMove(row, col, value) {
      // Check if the cell is part of the initial grid
      if (this.initialGrid[row][col] !== 0) {
        console.log(`Cannot modify initial cell at ${row},${col}`);
        return false;
      }
      
      // Check if the value is valid
      if (value < 0 || value > 9) {
        console.log(`Invalid value: ${value}`);
        return false;
      }
      
      // Save the current state for undo (if the method exists)
      if (typeof this.saveState === 'function') {
        this.saveState();
      } else {
        console.warn('saveState method not available - undo functionality disabled');
      }
      
      // Clear the redo stack (if it exists)
      if (this.redoStack) {
        this.redoStack = [];
      }
      
      // Update the grid
      this.grid[row][col] = value;
      
      // Clear notes for this cell
      if (value !== 0) {
        this.notes[row][col].clear();
      }
      
      // Increment move counter
      this.moveCount++;
      
      console.log(`Move made: ${value} at ${row},${col}`);
      return true;
    }
    
    /**
     * Toggle a note in a cell
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     * @param {number} value - Value to toggle (1-9)
     * @returns {boolean} True if the note was toggled
     */
    toggleNote(row, col, value) {
      // Don't allow notes in initial cells or filled cells
      if (this.initialGrid[row][col] !== 0 || this.grid[row][col] !== 0) {
        return false;
      }
      
      // Save for undo functionality
      this.moveHistory.push(new Move(
        row, col, 
        this.grid[row][col], 
        this.grid[row][col], 
        this.notes[row][col]
      ));
      
      // Toggle the note
      if (this.notes[row][col].has(value)) {
        this.notes[row][col].delete(value);
      } else {
        this.notes[row][col].add(value);
      }
      
      // Clear redo stack when a new move is made
      this.redoStack = [];
      this.moveCount++;
      return true;
    }
    
    /**
     * Check if a cell has a specific note
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     * @param {number} value - Value to check (1-9)
     * @returns {boolean} True if the cell has the note
     */
    hasNote(row, col, value) {
      return this.notes[row][col].has(value);
    }
    
    /**
     * Save the current game state for undo
     */
    saveState() {
      // Create deep copies of the grid and notes
      const gridCopy = this.grid.map(row => [...row]);
      const notesCopy = this.notes.map(row => 
        row.map(cell => new Set([...cell]))
      );
      
      // Save the state
      this.moveHistory.push({
        grid: gridCopy,
        notes: notesCopy,
        moveCount: this.moveCount
      });
      
      console.log('Game state saved for undo');
    }
    
    /**
     * Undo the last move
     * @returns {boolean} Whether the undo was successful
     */
    undo() {
      if (this.moveHistory.length === 0) {
        console.log('No moves to undo');
        return false;
      }
      
      // Save current state for redo
      const gridCopy = this.grid.map(row => [...row]);
      const notesCopy = this.notes.map(row => 
        row.map(cell => new Set([...cell]))
      );
      
      this.redoStack.push({
        grid: gridCopy,
        notes: notesCopy,
        moveCount: this.moveCount
      });
      
      // Restore previous state
      const previousState = this.moveHistory.pop();
      this.grid = previousState.grid;
      this.notes = previousState.notes;
      this.moveCount = previousState.moveCount;
      
      console.log('Undo performed');
      return true;
    }
    
    /**
     * Redo a previously undone move
     * @returns {boolean} Whether the redo was successful
     */
    redo() {
      if (this.redoStack.length === 0) {
        console.log('No moves to redo');
        return false;
      }
      
      // Save current state for undo
      const gridCopy = this.grid.map(row => [...row]);
      const notesCopy = this.notes.map(row => 
        row.map(cell => new Set([...cell]))
      );
      
      this.moveHistory.push({
        grid: gridCopy,
        notes: notesCopy,
        moveCount: this.moveCount
      });
      
      // Restore redo state
      const redoState = this.redoStack.pop();
      this.grid = redoState.grid;
      this.notes = redoState.notes;
      this.moveCount = redoState.moveCount;
      
      console.log('Redo performed');
      return true;
    }
    
    /**
     * Check if the puzzle is solved
     * @returns {boolean} True if the puzzle is solved
     */
    checkWinCondition() {
      // Check if all cells are filled
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (this.grid[row][col] === 0) {
            return false;
          }
        }
      }
      
      // Check rows
      for (let row = 0; row < 9; row++) {
        const rowSet = new Set();
        for (let col = 0; col < 9; col++) {
          rowSet.add(this.grid[row][col]);
        }
        if (rowSet.size !== 9) {
          return false;
        }
      }
      
      // Check columns
      for (let col = 0; col < 9; col++) {
        const colSet = new Set();
        for (let row = 0; row < 9; row++) {
          colSet.add(this.grid[row][col]);
        }
        if (colSet.size !== 9) {
          return false;
        }
      }
      
      // Check boxes
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          const boxSet = new Set();
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              boxSet.add(this.grid[boxRow * 3 + r][boxCol * 3 + c]);
            }
          }
          if (boxSet.size !== 9) {
            return false;
          }
        }
      }
      
      return true;
    }
    
    /**
     * Get a hint by revealing a correct number
     * @returns {Object|null} The hint information or null if no hint is available
     */
    getHint() {
      // Find all empty cells
      const emptyCells = [];
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (this.grid[row][col] === 0) {
            emptyCells.push({ row, col });
          }
        }
      }
      
      if (emptyCells.length === 0) {
        return null; // No empty cells
      }
      
      // Choose a random empty cell
      const randomIndex = Math.floor(Math.random() * emptyCells.length);
      const { row, col } = emptyCells[randomIndex];
      
      // Find the correct value for this cell
      const tempGrid = JSON.parse(JSON.stringify(this.grid));
      for (let value = 1; value <= 9; value++) {
        if (this.isValidPlacement(tempGrid, row, col, value)) {
          tempGrid[row][col] = value;
          
          // Check if this leads to a solution
          const gridCopy = JSON.parse(JSON.stringify(tempGrid));
          if (this.solveGridCopy(gridCopy)) {
            // This is a correct value
            this.makeMove(row, col, value);
            return { row, col, value };
          }
          
          // Reset for next attempt
          tempGrid[row][col] = 0;
        }
      }
      
      return null; // No valid hint found (shouldn't happen in a valid puzzle)
    }
    
    /**
     * Find all conflicts in the current grid
     * @returns {Array} Array of conflicting cells
     */
    findConflicts() {
      const conflicts = [];
      
      // Check rows
      for (let row = 0; row < 9; row++) {
        const values = {};
        for (let col = 0; col < 9; col++) {
          const value = this.grid[row][col];
          if (value !== 0) {
            if (values[value]) {
              conflicts.push({ row, col });
              conflicts.push(values[value]);
            } else {
              values[value] = { row, col };
            }
          }
        }
      }
      
      // Check columns
      for (let col = 0; col < 9; col++) {
        const values = {};
        for (let row = 0; row < 9; row++) {
          const value = this.grid[row][col];
          if (value !== 0) {
            if (values[value]) {
              conflicts.push({ row, col });
              conflicts.push(values[value]);
            } else {
              values[value] = { row, col };
            }
          }
        }
      }
      
      // Check boxes
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          const values = {};
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const row = boxRow * 3 + r;
              const col = boxCol * 3 + c;
              const value = this.grid[row][col];
              if (value !== 0) {
                if (values[value]) {
                  conflicts.push({ row, col });
                  conflicts.push(values[value]);
                } else {
                  values[value] = { row, col };
                }
              }
            }
          }
        }
      }
      
      // Remove duplicates
      const uniqueConflicts = [];
      const seen = new Set();
      
      for (const conflict of conflicts) {
        const key = `${conflict.row},${conflict.col}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueConflicts.push(conflict);
        }
      }
      
      return uniqueConflicts;
    }
    
    /**
     * Solve the current grid using backtracking
     * @returns {boolean} True if the grid was solved
     */
    solveGrid() {
      const emptyCell = this.findEmptyCell();
      if (!emptyCell) return true; // Puzzle is solved
      
      const [row, col] = emptyCell;
      const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      
      for (const num of numbers) {
        if (this.isValidPlacement(this.grid, row, col, num)) {
          this.grid[row][col] = num;
          
          if (this.solveGrid()) {
            return true;
          }
          
          this.grid[row][col] = 0; // Backtrack
        }
      }
      
      return false; // Trigger backtracking
    }
    
    /**
     * Solve a copy of a grid using backtracking
     * @param {Array} grid - The grid to solve
     * @returns {boolean} True if the grid was solved
     */
    solveGridCopy(grid) {
      // Find an empty cell
      let emptyCell = null;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            emptyCell = [row, col];
            break;
          }
        }
        if (emptyCell) break;
      }
      
      if (!emptyCell) return true; // Puzzle is solved
      
      const [row, col] = emptyCell;
      
      for (let num = 1; num <= 9; num++) {
        if (this.isValidPlacement(grid, row, col, num)) {
          grid[row][col] = num;
          
          if (this.solveGridCopy(grid)) {
            return true;
          }
          
          grid[row][col] = 0; // Backtrack
        }
      }
      
      return false; // Trigger backtracking
    }
    
    /**
     * Find an empty cell in the grid
     * @returns {Array|null} [row, col] of the empty cell, or null if none found
     */
    findEmptyCell() {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (this.grid[row][col] === 0) {
            return [row, col];
          }
        }
      }
      return null; // No empty cells
    }
    
    /**
     * Check if placing a value in a grid is valid
     * @param {Array} grid - The grid to check
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     * @param {number} num - Value to check (1-9)
     * @returns {boolean} True if the placement is valid
     */
    isValidPlacement(grid, row, col, num) {
      // Check row
      for (let c = 0; c < 9; c++) {
        if (grid[row][c] === num) {
          return false;
        }
      }
      
      // Check column
      for (let r = 0; r < 9; r++) {
        if (grid[r][col] === num) {
          return false;
        }
      }
      
      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (grid[boxRow + r][boxCol + c] === num) {
            return false;
          }
        }
      }
      
      return true;
    }
    
    /**
     * Remove numbers from the grid while ensuring it remains solvable
     * @param {number} count - Number of cells to remove
     */
    removeNumbers(count) {
      const cells = [];
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          cells.push([row, col]);
        }
      }
      
      // Shuffle the cells to remove numbers randomly
      this.shuffleArray(cells);
      
      let removed = 0;
      for (const [row, col] of cells) {
        if (removed >= count) break;
        
        const temp = this.grid[row][col];
        this.grid[row][col] = 0;
        
        // Make a copy of the grid
        const gridCopy = JSON.parse(JSON.stringify(this.grid));
        
        // Count solutions (we want exactly one)
        const solutions = this.countSolutions(gridCopy, 0, 2);
        
        if (solutions !== 1) {
          // If removing this number creates multiple solutions or no solution,
          // put it back
          this.grid[row][col] = temp;
        } else {
          removed++;
        }
      }
    }
    
    /**
     * Count the number of solutions for a grid
     * @param {Array} grid - The grid to check
     * @param {number} count - Current count of solutions
     * @param {number} limit - Maximum number of solutions to count
     * @returns {number} Number of solutions found (up to limit)
     */
    countSolutions(grid, count, limit) {
      // Find an empty cell
      let emptyCell = null;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === 0) {
            emptyCell = [row, col];
            break;
          }
        }
        if (emptyCell) break;
      }
      
      // If no empty cell, we found a solution
      if (!emptyCell) return count + 1;
      
      // If we've reached the solution limit, stop searching
      if (count >= limit) return count;
      
      const [row, col] = emptyCell;
      
      // Try each number
      for (let num = 1; num <= 9; num++) {
        if (this.isValidPlacement(grid, row, col, num)) {
          grid[row][col] = num;
          count = this.countSolutions(grid, count, limit);
          grid[row][col] = 0; // Backtrack
          
          if (count >= limit) return count;
        }
      }
      
      return count;
    }
    
    /**
     * Shuffle an array in place
     * @param {Array} array - The array to shuffle
     * @returns {Array} The shuffled array
     */
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    
    /**
     * Get the current grid
     * @returns {Array} The current grid
     */
    getGrid() {
      return this.grid;
    }
    
    /**
     * Get the initial grid
     * @returns {Array} The initial grid
     */
    getInitialGrid() {
      return this.initialGrid;
    }
    
    /**
     * Get the notes
     * @returns {Array} The notes
     */
    getNotes() {
      return this.notes;
    }
    
    /**
     * Get the move count
     * @returns {number} The move count
     */
    getMoveCount() {
      return this.moveCount;
    }
    
    // Add getter method
    getBombs() {
      return this.bombs;
    }

    // Add method to increment bombs
    addBomb() {
      this.bombs++;
      return this.bombs >= this.maxBombs; // Return true if game over
    }

    // Add method to reset bombs
    resetBombs() {
      this.bombs = 0;
    }

    /**
     * Check if the game is complete and all numbers are valid
     * @returns {boolean} True if the game is complete and valid
     */
    isComplete() {
        console.log('Checking if game is complete...');
        
        // Check if all cells are filled
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.grid[row][col] === 0) {
                    console.log(`Found empty cell at row ${row}, col ${col}`);
                    return false;
                }
            }
        }
        
        console.log('All cells filled, checking validity...');

        // Check rows
        for (let row = 0; row < 9; row++) {
            const rowNums = new Set();
            for (let col = 0; col < 9; col++) {
                rowNums.add(this.grid[row][col]);
            }
            if (rowNums.size !== 9) {
                console.log(`Invalid row ${row}`);
                return false;
            }
        }

        // Check columns
        for (let col = 0; col < 9; col++) {
            const colNums = new Set();
            for (let row = 0; row < 9; row++) {
                colNums.add(this.grid[row][col]);
            }
            if (colNums.size !== 9) {
                console.log(`Invalid column ${col}`);
                return false;
            }
        }

        // Check 3x3 boxes
        for (let boxRow = 0; boxRow < 9; boxRow += 3) {
            for (let boxCol = 0; boxCol < 9; boxCol += 3) {
                const boxNums = new Set();
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        boxNums.add(this.grid[boxRow + i][boxCol + j]);
                    }
                }
                if (boxNums.size !== 9) {
                    console.log(`Invalid box at ${boxRow},${boxCol}`);
                    return false;
                }
            }
        }

        console.log('Puzzle is complete and valid!');
        return true;
    }

    isInitialCell(row, col) {
        return this.initialGrid[row][col] !== 0;
    }

    // Add new method to load predefined puzzle
    loadPredefinedPuzzle(puzzleId) {
        const puzzle = PREDEFINED_PUZZLES[puzzleId];
        if (!puzzle) return false;

        this.grid = JSON.parse(JSON.stringify(puzzle.grid));
        this.initialGrid = JSON.parse(JSON.stringify(puzzle.grid));
        this.currentPuzzleId = puzzleId;
        this.moveHistory = [];
        this.redoStack = [];
        this.moveCount = 0;
        this.notes = Array(9).fill().map(() => Array(9).fill().map(() => new Set()));
        
        return true;
    }
}