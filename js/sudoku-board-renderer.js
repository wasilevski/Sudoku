/**
 * SudokuBoardRenderer class
 * Handles the canvas-based rendering of the Sudoku board
 */
class SudokuBoardRenderer {
  /**
   * Create a new Sudoku controller
   * @param {HTMLElement} container - The container element for the canvas
   * @param {SudokuGame} game - The Sudoku game instance
   */
  constructor(container, game) {
    this.container = container;
    this.game = game;
    this.selectedCell = null;
    this.conflicts = [];
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Get the device pixel ratio
    this.dpr = window.devicePixelRatio || 1;
    
    // Set fixed display size
    this.displaySize = 349;  // This matches our CSS
    
    // Set the display size (css pixels)
    this.canvas.style.width = `${this.displaySize}px`;
    this.canvas.style.height = `${this.displaySize}px`;
    
    // Set actual size in memory (scaled for device pixel ratio)
    this.canvas.width = this.displaySize * this.dpr;
    this.canvas.height = this.displaySize * this.dpr;
    
    // Scale all drawing operations by the dpr
    this.ctx.scale(this.dpr, this.dpr);
    
    this.container.appendChild(this.canvas);
    
    // Add click event listener to the canvas
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) * this.dpr);
      const y = ((e.clientY - rect.top) * this.dpr);
      
      const cell = this.getCellFromCoordinates(x, y);
      if (cell) {
        this.selectCell(cell.row, cell.col);
      }
    });
    
    // Initial render
    this.renderBoard();
    
    // Get CSS variables for colors
    const styles = getComputedStyle(document.documentElement);
    this.COLOR_NORMAL = styles.getPropertyValue('--color-normal').trim();
    this.COLOR_PLAYER = styles.getPropertyValue('--color-player').trim();
    this.COLOR_CONFLICT = styles.getPropertyValue('--color-conflict').trim();
    this.BG_SELECTED = styles.getPropertyValue('--bg-selected').trim();
    this.BG_CONFLICT = styles.getPropertyValue('--bg-conflict').trim();
    this.BG_ROW_COL = styles.getPropertyValue('--bg-row-col').trim();
    this.BG_INITIAL = styles.getPropertyValue('--bg-initial').trim();
    this.BG_NORMAL = styles.getPropertyValue('--bg-normal').trim();
  }
  
  /**
   * Render the Sudoku board
   */
  renderBoard() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const cellSize = this.displaySize / 9;

    // Draw cells
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        // Draw cell background
        this.ctx.fillStyle = this.getCellBackgroundColor(row, col);
        this.ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

        // Draw cell value or notes
        const value = this.game.grid[row][col];
        if (value !== 0) {
          this.drawNumber(value, row, col, this.game.initialGrid[row][col] !== 0);
        } else {
          this.drawNotes(row, col);
        }
      }
    }

    // Draw grid lines
    this.drawGridLines();
  }
  
  /**
   * Get the cell coordinates from canvas coordinates
   */
  getCellFromCoordinates(x, y) {
    const cellSize = (this.canvas.width / 9);
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    
    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      return { row, col };
    }
    
    return null;
  }
  
  /**
   * Select a cell
   * @param {number} row - Row index (0-8)
   * @param {number} col - Column index (0-8)
   */
  selectCell(row, col) {
    this.selectedCell = { row, col };
    this.renderBoard();
  }
  
  /**
   * Show a conflict in a cell
   * @param {number} row - Row index (0-8)
   * @param {number} col - Column index (0-8)
   */
  showConflict(row, col) {
    this.conflicts.push({ row, col });
    this.renderBoard();
    
    setTimeout(() => {
      this.conflicts = this.conflicts.filter(c => c.row !== row || c.col !== col);
      this.renderBoard();
    }, 500);
  }
  
  /**
   * Update the conflicts list
   * @param {Array} newConflicts - Array of conflict objects
   */
  updateConflicts(newConflicts) {
    console.log('Updating renderer conflicts:', newConflicts);
    this.conflicts = newConflicts;
    this.renderBoard();
  }
  
  /**
   * Check and clear resolved conflicts
   */
  checkAndClearConflicts() {
    this.conflicts = [];
    this.renderBoard();
  }

  getCellBackgroundColor(row, col) {
    // Check if cell is selected
    if (this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col) {
        return this.BG_SELECTED; // Selected cell color
    }
    
    // Check if cell is in conflict
    const isConflict = this.conflicts.some(conflict => 
        conflict.row === row && conflict.col === col
    );
    if (isConflict) {
        return this.BG_CONFLICT; // Conflict color
    }
    
    // Check if cell is in the same row or column as selected cell (cross selection)
    if (this.selectedCell) {
        if (this.selectedCell.row === row || this.selectedCell.col === col) {
            return this.BG_ROW_COL; // Row/Column highlight color
        }
    }
    
    // Check if cell is in the same box as selected cell
    if (this.selectedCell) {
        const selectedBox = {
            row: Math.floor(this.selectedCell.row / 3),
            col: Math.floor(this.selectedCell.col / 3)
        };
        const currentBox = {
            row: Math.floor(row / 3),
            col: Math.floor(col / 3)
        };
        if (selectedBox.row === currentBox.row && selectedBox.col === currentBox.col) {
            return this.BG_ROW_COL; // Same box color
        }
    }
    
    // Check if it's an initial cell
    if (this.game.isInitialCell(row, col)) {
        return this.BG_INITIAL; // Initial cell color
    }
    
    return this.BG_NORMAL; // Normal cell color
  }

  drawNumber(num, row, col, isInitial) {
    const cellSize = this.displaySize / 9;
    this.ctx.font = `${cellSize * 0.6}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Set color based on whether it's an initial number or not
    this.ctx.fillStyle = isInitial ? '#000000' : '#2196f3';
    
    // Check if this number is in conflict
    const isConflict = this.conflicts.some(conflict => 
      conflict.row === row && conflict.col === col
    );
    if (isConflict) {
      this.ctx.fillStyle = '#f44336'; // Red for conflicts
    }
    
    this.ctx.fillText(
      num.toString(),
      (col + 0.5) * cellSize,
      (row + 0.5) * cellSize
    );
  }

  drawNotes(row, col) {
    const cellSize = this.displaySize / 9;
    const noteSize = cellSize / 3;
    this.ctx.font = `${noteSize * 0.8}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#757575';

    const notes = this.game.notes[row][col];
    notes.forEach(num => {
      const noteRow = Math.floor((num - 1) / 3);
      const noteCol = (num - 1) % 3;
      this.ctx.fillText(
        num.toString(),
        (col + (noteCol + 1) / 3) * cellSize,
        (row + (noteRow + 1) / 3) * cellSize
      );
    });
  }

  drawGridLines() {
    const cellSize = this.displaySize / 9;
    this.ctx.strokeStyle = '#000000';

    // Draw thin lines
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 9; i++) {
      if (i % 3 !== 0) {
        // Vertical lines
        this.ctx.beginPath();
        this.ctx.moveTo(i * cellSize, 0);
        this.ctx.lineTo(i * cellSize, this.displaySize);
        this.ctx.stroke();

        // Horizontal lines
        this.ctx.beginPath();
        this.ctx.moveTo(0, i * cellSize);
        this.ctx.lineTo(this.displaySize, i * cellSize);
        this.ctx.stroke();
      }
    }

    // Draw thick lines
    this.ctx.lineWidth = 2;
    for (let i = 0; i <= 9; i += 3) {
      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(i * cellSize, 0);
      this.ctx.lineTo(i * cellSize, this.displaySize);
      this.ctx.stroke();

      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * cellSize);
      this.ctx.lineTo(this.displaySize, i * cellSize);
      this.ctx.stroke();
    }
  }
}

