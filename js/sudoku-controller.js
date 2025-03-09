/**
 * SudokuController class
 * Manages user interactions and game flow
 */
class SudokuController {
    /**
     * Create a new Sudoku controller
     * @param {SudokuGame} game - The Sudoku game instance
     * @param {SudokuBoardRenderer} boardRenderer - The Sudoku board renderer
     */
    constructor(game, boardRenderer) {
      this.game = game;
      this.boardRenderer = boardRenderer;
      this.isNoteMode = false;
      this.timer = null;
      this.secondsElapsed = 0;
      this.isPaused = false;
      this.selectedCell = null;
      
      this.setupEventListeners();
      this.startTimer();
      this.updateMoveCounter();
      
      // Ensure the board is rendered - use renderBoard instead of render
      if (typeof this.boardRenderer.renderBoard === 'function') {
        this.boardRenderer.renderBoard();
      } else {
        console.error('renderBoard method not found on boardRenderer');
      }
    }
    
    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners() {
      try {
        // Ensure canvas exists before adding listener
        if (!this.boardRenderer || !this.boardRenderer.canvas) {
          throw new Error('Board renderer or canvas not properly initialized');
        }
        
        // Add canvas click listener
        this.boardRenderer.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Add number button listeners
        document.querySelectorAll('.number-btn').forEach(button => {
          button.addEventListener('click', () => {
            const num = parseInt(button.dataset.number);
            this.handleNumberInput(num);
          });
        });
        
        // Keyboard input for numbers
        document.addEventListener('keydown', (e) => {
          if (e.key >= '0' && e.key <= '9') {
            this.handleNumberInput(parseInt(e.key));
          }
        });
        
        // Control buttons
        const notesBtn = document.getElementById('notes-btn');
        const hintBtn = document.getElementById('hint-btn');
        const undoBtn = document.getElementById('undo-btn');
        
        if (notesBtn) {
          notesBtn.addEventListener('click', () => {
            this.isNoteMode = !this.isNoteMode;
            notesBtn.classList.toggle('active');
          });
        }
        
        if (hintBtn) {
          hintBtn.addEventListener('click', () => this.handleHint());
        }
        
        if (undoBtn) {
          undoBtn.addEventListener('click', () => this.handleUndo());
        }
        
        console.log('Event listeners set up successfully');
      } catch (error) {
        console.error('Error setting up event listeners:', error);
      }
    }
    
    /**
     * Handle canvas click
     * @param {MouseEvent} e - The mouse event
     */
    handleCanvasClick(e) {
      const rect = this.boardRenderer.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.boardRenderer.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.boardRenderer.canvas.height / rect.height);
      
      const cellSize = this.boardRenderer.displaySize / 9;
      const row = Math.floor(y / cellSize);
      const col = Math.floor(x / cellSize);
      
      this.selectCell(row, col);
    }
    
    /**
     * Handle number input
     * @param {number} num - The number pressed (1-9, 0 to clear)
     */
    handleNumberInput(num) {
      console.log('Handling input:', num, 'for cell', 
        this.boardRenderer.selectedCell ? 
        `${this.boardRenderer.selectedCell.row},${this.boardRenderer.selectedCell.col}` : 
        'none selected'
      );
      
      if (num >= 0 && num <= 9) {
        this.handleNumberPress(num);
      }
    }
    
    /**
     * Handle number key or button press
     * @param {number} num - The number pressed (1-9, 0 to clear)
     */
    handleNumberPress(num) {
      const cell = this.boardRenderer.selectedCell;
      if (!cell) return;
      
      const { row, col } = cell;
      
      if (this.isNoteMode && num !== 0) {
        this.game.toggleNote(row, col, num);
        this.boardRenderer.renderBoard();
        return;
      }
      
      // Make the move
      this.game.makeMove(row, col, num);
      
      // Check for conflicts and update the display
      if (!this.game.isValidMove(row, col, num)) {
        // Get all cells that conflict with this move
        const conflicts = this.game.findConflicts(row, col, num);
        this.boardRenderer.updateConflicts(conflicts);
      } else {
        // If the move is valid, clear any existing conflicts
        this.boardRenderer.checkAndClearConflicts();
      }
      
      this.boardRenderer.renderBoard();
      this.updateMoveCounter();
      
      if (this.game.isComplete()) {
        this.handleGameComplete();
      }
    }
    
    /**
     * Select a cell
     * @param {number} row - Row index (0-8)
     * @param {number} col - Column index (0-8)
     */
    selectCell(row, col) {
      if (row >= 0 && row < 9 && col >= 0 && col < 9) {
        this.boardRenderer.selectedCell = { row, col };
        this.boardRenderer.renderBoard();
      }
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
      const counter = document.getElementById('move-counter');
      if (counter) {
        counter.textContent = `Moves: ${this.game.getMoveCount()}`;
      }
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
    
    /**
     * Handle loss condition
     */
    handleLoss() {
      // Stop the timer
      this.pauseTimer();
      
      // Show loss message
      setTimeout(() => {
        alert('BOOOOOM! Game Over! You collected 3 bombs! 💣💣💣');
        // Optionally restart the game
        this.newGame();
      }, 300);
    }
    
    /**
     * Start a new game
     */
    newGame() {
      this.game.generatePuzzle();
      this.game.resetBombs();
      this.selectedCell = null;
      this.boardRenderer.renderFullBoard();
      this.resetTimer();
      this.updateMoveCounter();
    }

    /**
     * Handle game completion
     */
    handleGameComplete() {
      // Implement game completion handling logic
      console.log('Game completed');
    }

    /**
     * Handle hint
     */
    handleHint() {
      const hint = this.game.getHint();
      if (hint) {
        this.boardRenderer.selectedCell = { row: hint.row, col: hint.col };
        this.game.makeMove(hint.row, hint.col, hint.value);
        this.updateMoveCounter();
        this.boardRenderer.render();
        console.log(`Hint provided: ${hint.value} at ${hint.row},${hint.col}`);
      }
    }

    /**
     * Handle undo
     */
    handleUndo() {
      if (this.game.undo()) {
        this.updateMoveCounter();
        this.boardRenderer.conflicts = this.game.findConflicts();
        this.boardRenderer.render();
        console.log('Undo performed');
      }
    }
}