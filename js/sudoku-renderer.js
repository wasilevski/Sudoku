/**
 * SudokuRenderer class
 * Handles the visualization of the Sudoku puzzle
 */
class SudokuRenderer {
  /**
   * Create a new Sudoku renderer
   * @param {string} canvasId - The ID of the canvas element
   * @param {SudokuGame} game - The Sudoku game instance
   */
  constructor(canvasId, game) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.game = game;
    this.cellSize = 0;
    this.selectedCell = null;
    this.highlightedCells = new Set();
    this.conflictCells = new Set();
    this.conflicts = [];
    
    this.setupCanvas();
  }
  
  /**
   * Set up the canvas properties
   */
  setupCanvas() {
    // Make canvas responsive
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Set up canvas properties
    this.ctx.lineWidth = 1;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }
  
  /**
   * Resize the canvas to fit its container
   */
  resizeCanvas() {
    // Make canvas fill its container while maintaining aspect ratio
    const container = this.canvas.parentElement;
    const size = Math.min(container.clientWidth, container.clientHeight);
    this.canvas.width = size;
    this.canvas.height = size;
    this.cellSize = size / 9;
    
    // Update font size after resize
    this.ctx.font = `bold ${this.cellSize * 0.6}px Arial`;
    
    // Re-render
    this.render();
  }
  
  /**
   * Render the Sudoku grid
   */
  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.drawGrid();
    
    // Draw numbers and notes
    this.drawCells();
    
    // Highlight conflicts if any
    const conflicts = this.game.findConflicts();
    if (conflicts.length > 0) {
      this.highlightConflicts(conflicts);
    }
    
    // Highlight selected cell if any
    if (this.selectedCell) {
      this.highlightCell(this.selectedCell.row, this.selectedCell.col);
    }
  }
  
  /**
   * Draw the Sudoku grid
   */
  drawGrid() {
    const { ctx, canvas, cellSize } = this;
    
    // Draw thin lines
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-grid-minor').trim();
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 9; i++) {
      // Draw thicker lines for box boundaries
      if (i % 3 === 0) {
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-grid').trim();
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-grid-minor').trim();
        ctx.lineWidth = 1;
      }
      
      // Draw horizontal line
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
      
      // Draw vertical line
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
    }
  }
  
  /**
   * Draw the numbers and notes in the cells
   */
  drawCells() {
    const { ctx, cellSize, game } = this;
    const grid = game.getGrid();
    const initialGrid = game.getInitialGrid();
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = grid[row][col];
        const cellX = col * cellSize;
        const cellY = row * cellSize;
        const centerX = cellX + cellSize / 2;
        const centerY = cellY + cellSize / 2;
        
        // Check if this cell is in conflict
        const isConflict = this.conflicts.some(conflict => 
          conflict.row === row && conflict.col === col);
        
        if (isConflict) {
          // Fill with conflict background color
          ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-conflict').trim();
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
          
          // Add a red border to conflict cells
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2);
        }
        
        if (value !== 0) {
          // Draw the number
          if (initialGrid[row][col] !== 0) {
            // Initial numbers (given)
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text-initial').trim();
            ctx.font = `bold ${cellSize * 0.6}px Arial`;
          } else {
            // User-entered numbers
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-text-user').trim();
            ctx.font = `${cellSize * 0.6}px Arial`;
          }
          ctx.fillText(value.toString(), centerX, centerY);
        } else {
          // Draw notes
          this.drawNotes(row, col);
        }
      }
    }
  }
  
  /**
   * Draw the notes in a cell
   * @param {number} row - Row index (0-8)
   * @param {number} col - Column index (0-8)
   */
  drawNotes(row, col) {
    const { ctx, cellSize, game } = this;
    const notes = game.getNotes()[row][col];
    if (notes.size === 0) return;
    
    ctx.font = `${cellSize * 0.2}px Arial`;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-notes').trim();
    
    const noteSize = cellSize / 3;
    
    for (let num = 1; num <= 9; num++) {
      if (notes.has(num)) {
        // Calculate position within the cell (3x3 grid of notes)
        const noteRow = Math.floor((num - 1) / 3);
        const noteCol = (num - 1) % 3;
        
        const x = col * cellSize + noteCol * noteSize + noteSize / 2;
        const y = row * cellSize + noteRow * noteSize + noteSize / 2;
        
        ctx.fillText(num.toString(), x, y);
      }
    }
  }
  
  /**
   * Highlight a cell
   * @param {number} row - Row index (0-8)
   * @param {number} col - Column index (0-8)
   */
  highlightCell(row, col) {
    const { ctx, cellSize } = this;
    
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-highlight').trim();
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
  }
  
  /**
   * Highlight conflicting cells
   * @param {Array} conflicts - Array of conflicting cells
   */
  highlightConflicts(conflicts) {
    const { ctx, cellSize } = this;
    
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-conflict').trim();
    
    for (const { row, col } of conflicts) {
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
  
  /**
   * Get the cell coordinates from canvas coordinates
   * @param {number} x - X coordinate on the canvas
   * @param {number} y - Y coordinate on the canvas
   * @returns {Object|null} The cell coordinates {row, col} or null if outside the grid
   */
  getCellFromCoordinates(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    
    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      return { row, col };
    }
    
    return null;
  }
  
  /**
   * Animate an invalid move
   * @param {number} row - Row index (0-8)
   * @param {number} col - Column index (0-8)
   */
  animateInvalidMove(row, col) {
    const { ctx, cellSize } = this;
    const originalFill = ctx.fillStyle;
    
    // Flash red
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-conflict').trim();
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    
    // Reset after animation
    setTimeout(() => {
      this.render();
    }, 300);
  }
}
