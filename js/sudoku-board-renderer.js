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
    const ctx = this.canvas.getContext('2d');
    
    // Reset transform and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Scale everything for retina display
    ctx.scale(this.dpr, this.dpr);
    
    const cellSize = this.displaySize / 9;
    
    // Font definitions
    const FONT_NORMAL = '21px Inter';
    const FONT_SELECTED = '30px Inter';
    
    // Draw the background using CSS variable
    ctx.fillStyle = this.BG_INITIAL;
    ctx.fillRect(0, 0, this.displaySize, this.displaySize);
    
    // First: Draw initial cell backgrounds
    const grid = this.game.getGrid();
    const initialGrid = this.game.getInitialGrid();
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const isInitial = initialGrid[row][col] !== 0;
        if (isInitial) {
          ctx.fillStyle = this.BG_INITIAL;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        } else {
          ctx.fillStyle = this.BG_NORMAL;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    
    // Second: Draw row and column highlighting for selected cell
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      ctx.fillStyle = this.BG_ROW_COL;
      ctx.fillRect(0, row * cellSize, this.displaySize, cellSize);
      ctx.fillRect(col * cellSize, 0, cellSize, this.displaySize);
    }
    
    // Third: Draw conflict and selected cell backgrounds on top
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const isInConflict = this.conflicts.some(c => c.row === row && c.col === col);
        const isSelected = this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col;
        
        if (isSelected) {
          ctx.fillStyle = isInConflict ? this.BG_CONFLICT : this.BG_SELECTED;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        } else if (isInConflict) {
          ctx.fillStyle = this.BG_CONFLICT;
          ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        }
      }
    }
    
    // Fourth: Draw numbers
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = grid[row][col];
        const isInitial = initialGrid[row][col] !== 0;
        const isInConflict = this.conflicts.some(c => c.row === row && c.col === col);
        const isSelected = this.selectedCell && this.selectedCell.row === row && this.selectedCell.col === col;
        
        if (value !== 0) {
          ctx.font = isSelected ? FONT_SELECTED : FONT_NORMAL;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Different offsets for selected vs normal state
          const verticalOffset = isSelected ? 1 : 0;  // Adjust these values as needed
          
          if (isSelected) {
            ctx.fillStyle = isInConflict ? this.COLOR_CONFLICT : this.COLOR_PLAYER;
          } else if (isInitial) {
            ctx.fillStyle = this.COLOR_NORMAL;
          } else if (isInConflict) {
            ctx.fillStyle = this.COLOR_CONFLICT;
          } else {
            ctx.fillStyle = this.COLOR_PLAYER;
          }
          
          ctx.fillText(
            value.toString(),
            col * cellSize + cellSize / 2,
            row * cellSize + cellSize / 2 + verticalOffset
          );
        } else {
          // Draw notes if cell is empty
          const notes = this.game.getNotes()[row][col];
          if (notes.size > 0) {
            ctx.font = `${cellSize * 0.2}px Inter`;
            ctx.fillStyle = '#666666';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const noteSize = cellSize / 3;
            notes.forEach(num => {
              const noteRow = Math.floor((num - 1) / 3);
              const noteCol = (num - 1) % 3;
              const x = col * cellSize + noteCol * noteSize + noteSize / 2;
              const y = row * cellSize + noteRow * noteSize + noteSize / 2;
              ctx.fillText(num.toString(), x, y);
            });
          }
        }
      }
    }
    
    // Finally: Draw grid lines
    ctx.strokeStyle = '#5B5B5B';
    ctx.lineWidth = 1;
    
    // Draw minor grid lines
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 9; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, this.displaySize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(this.displaySize, i * cellSize);
      ctx.stroke();
    }
    
    // Draw major grid lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * (cellSize * 3), 0);
      ctx.lineTo(i * (cellSize * 3), this.displaySize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * (cellSize * 3));
      ctx.lineTo(this.displaySize, i * (cellSize * 3));
      ctx.stroke();
    }
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
    // Clear all existing conflicts when adding new ones
    this.conflicts = [];
    
    // Add the new conflicts including the selected cell
    if (this.selectedCell) {
      this.conflicts.push({
        row: this.selectedCell.row,
        col: this.selectedCell.col
      });
    }
    
    // Add all conflicting cells
    newConflicts.forEach(conflict => {
      if (!this.conflicts.some(c => c.row === conflict.row && c.col === conflict.col)) {
        this.conflicts.push(conflict);
      }
    });
    
    this.renderBoard();
  }
  
  /**
   * Check and clear resolved conflicts
   */
  checkAndClearConflicts() {
    this.conflicts = [];
    this.renderBoard();
  }
}

