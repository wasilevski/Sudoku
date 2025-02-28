/**
 * SudokuController class
 * Manages user interactions and game flow
 */
class SudokuController {
    /**
     * Create a new Sudoku controller
     * @param {SudokuGame} game - The Sudoku game instance
     * @param {SudokuRenderer} renderer - The Sudoku renderer instance
     */
    constructor(game, renderer) {
      this.game = game;
      this.renderer = renderer;
      this.isNoteMode = false;
      this.timer = null;
      this.secondsElapsed = 0;
      this.isPaused = false;
      
      this.setupEventListeners();
      this.startTimer();
      this.updateMoveCounter();
    }
    
    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners() {
      // Canvas click for cell selection
      this.renderer.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
      
      // Keyboard input
      document.addEventListener('keydown', (e) => this.handleKeyDown(e));
      
      // Number buttons
      document.querySelectorAll('.number-button').forEach(button => {
        button.addEventListener('click', () => {
          const value = parseInt(button.dataset.value);
          this.handleNumberInput(value);
        });
      });
      
      // Note toggle button
      const noteToggle = document.getElementById('note-toggle');
      noteToggle.addEventListener('click', () => this.toggleNoteMode());
      
      // Undo button
      document.getElementById('undo-button').addEventListener('click', () => this.undo());
      
      // Redo button
      document.getElementById('redo-button').addEventListener('click', () => this.redo());
      
      // Hint button
      document.getElementById('hint-button').addEventListener('click', () => this.requestHint());
      
      // New game button
      document.getElementById('new-game').addEventListener('click', () => this.newGame());
      
      // Theme selector
      document.getElementById('theme-select').addEventListener('change', (e) => {
        const themeName = e.target.value;
        if (themes[themeName]) {
          themes[themeName].apply();
          this.renderer.render();
        }
      });
    }
    
    /**
     * Handle canvas click event
     * @param {Event} e - The click event
     */
    handleCanvasClick(e) {
      const rect = this.renderer.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const cell = this.renderer.getCellFromCoordinates(x, y);
      if (cell) {
        this.selectCell(cell.row, cell.col);
      }
    }
    
    /**
     * Handle keyboard input
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleKeyDown(e) {
      if (!this.renderer.selectedCell) return;
      
      if (e.key >= '1' && e.key <= '9') {
        this.handleNumberInput(parseInt(e.key));
      } else if (e.key === '0' || e.key === 'Backspace' || e.key === 'Delete') {
        this.handleNumberInput(0); // Clear cell
      } else if (e.key === 'n') {
        this.toggleNoteMode();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        this.undo();
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        this.redo();
      } else if (e.key === 'h' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); // Prevent browser history
        this.requestHint();
      } else if (e.key === 'ArrowUp') {
        this.moveSelection(0, -1);
      } else if (e.key === 'ArrowDown') {
        this.moveSelection(0, 1);
      } else if (e.key === 'ArrowLeft') {
        this.moveSelection(-1, 0);
      } else if (e.key === 'ArrowRight') {
        this.moveSelection(1, 0);
      }
    }
    
    /**
     * Move the selection in the specified direction
     * @param {number} dx - Horizontal movement (-1, 0, 1)
     * @param {number} dy - Vertical movement (-1, 0, 1)
     */
    moveSelection(dx, dy) {
      if (!this.renderer.selectedCell) return;
      
      const { row, col } = this.renderer.selectedCell;
      const newRow = Math.max(0, Math.min(8, row + dy));
      const newCol = Math.max(0, Math.min(8, col + dx));
      
      if (newRow !== row || newCol !== col) {
        this.selectCell(newRow, newCol);
      }
    }
    
    /**
     * Handle number input
     * @param {number} value - The number value (0-9)
     */
    handleNumberInput(value) {
      if (!this.renderer.selectedCell) return;
      
      const { row, col } = this.renderer.selectedCell;
      
      if (this.isNoteMode && value !== 0) {
        // Toggle note
        if (this.game.toggleNote(row, col, value)) {
          this.updateMoveCounter();
          this.renderer.render();
        }
      } else {
        // Place number (now allows invalid moves)
        if (this.game.makeMove(row, col, value)) {
          this.updateMoveCounter();
          
          // Find conflicts after making the move
          const conflicts = this.game.findConflicts();
          this.renderer.conflicts = conflicts;
          
          this.renderer.render();
          
          // Check win condition
          if (this.game.checkWinCondition()) {
            this.handleWin();
          }
        }
      }
    }
    
    /**
     * Select a cell
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     */
    selectCell(row, col) {
      this.renderer.selectedCell = { row, col };
      this.renderer.render();
    }
    
    /**
     * Toggle note mode
     */
    toggleNoteMode() {
      this.isNoteMode = !this.isNoteMode;
      
      // Update UI
      const noteToggle = document.getElementById('note-toggle');
      if (this.isNoteMode) {
        noteToggle.classList.add('active');
      } else {
        noteToggle.classList.remove('active');
      }
    }
    
    /**
     * Undo the last move
     */
    undo() {
      if (this.game.undo()) {
        this.updateMoveCounter();
        this.renderer.render();
      }
    }
    
    /**
     * Redo the last undone move
     */
    redo() {
      if (this.game.redo()) {
        this.updateMoveCounter();
        this.renderer.render();
      }
    }
    
    /**
     * Request a hint
     */
    requestHint() {
      const hint = this.game.getHint();
      if (hint) {
        this.selectCell(hint.row, hint.col);
        
        // Highlight the hint cell
        setTimeout(() => {
          if (this.game.makeMove(hint.row, hint.col, hint.value)) {
            this.updateMoveCounter();
            this.renderer.render();
            
            // Check win condition
            if (this.game.checkWinCondition()) {
              this.handleWin();
            }
          }
        }, 500);
      }
    }
    
    /**
     * Start a new game
     */
    newGame() {
      this.game.generatePuzzle();
      this.renderer.selectedCell = null;
      this.resetTimer();
      this.updateMoveCounter();
      this.renderer.render();
    }
    
    /**
     * Start the timer
     */
    startTimer() {
      this.timer = setInterval(() => {
        if (!this.isPaused) {
          this.secondsElapsed++;
          this.updateTimerDisplay();
        }
      }, 1000);
    }
    
    /**
     * Pause the timer
     */
    pauseTimer() {
      this.isPaused = true;
    }
    
    /**
     * Resume the timer
     */
    resumeTimer() {
      this.isPaused = false;
    }
    
    /**
     * Reset the timer
     */
    resetTimer() {
      this.secondsElapsed = 0;
      this.isPaused = false;
      this.updateTimerDisplay();
    }
    
    /**
     * Update the timer display
     */
    updateTimerDisplay() {
      const minutes = Math.floor(this.secondsElapsed / 60);
      const seconds = this.secondsElapsed % 60;
      document.getElementById('timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Update the move counter display
     */
    updateMoveCounter() {
      document.getElementById('move-counter').textContent = this.game.getMoveCount();
    }
    
    /**
     * Handle win condition
     */
    handleWin() {
      // Stop the timer
      this.pauseTimer();
      
      const minutes = Math.floor(this.secondsElapsed / 60);
      const seconds = this.secondsElapsed % 60;
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      const moves = this.game.getMoveCount();
      
      // Show win message
      setTimeout(() => {
        alert(`Congratulations! You solved the puzzle in ${timeString} with ${moves} moves!`);
      }, 300);
    }
  }