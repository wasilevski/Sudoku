/**
 * SudokuController class
 * Manages user interactions and game flow
 */
class SudokuController {
    /**
     * Create a new Sudoku controller
     * @param {SudokuGame} game - The Sudoku game instance
     * @param {SudokuRiveController} riveController - The Sudoku Rive controller
     */
    constructor(game, riveController) {
      this.game = game;
      this.riveController = riveController;
      this.isNoteMode = false;
      this.timer = null;
      this.secondsElapsed = 0;
      this.isPaused = false;
      this.selectedCell = null;
      
      this.setupEventListeners();
      this.startTimer();
      this.updateMoveCounter();
      
      // Ensure the board is rendered - use renderBoard instead of render
      if (typeof this.riveController.renderBoard === 'function') {
        this.riveController.renderBoard();
      } else {
        console.error('renderBoard method not found on riveController');
      }
    }
    
    /**
     * Set up event listeners for user interactions
     */
    setupEventListeners() {
      // Canvas click
      this.riveController.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
      
      // Number buttons
      document.querySelectorAll('.number-btn').forEach(button => {
        button.addEventListener('click', () => {
          const num = parseInt(button.dataset.number);
          this.handleNumberInput(num);
        });
      });
      
      // Note toggle
      document.getElementById('notes-btn').addEventListener('click', () => {
        this.isNoteMode = !this.isNoteMode;
        document.getElementById('notes-btn').classList.toggle('active', this.isNoteMode);
        console.log(`Note mode ${this.isNoteMode ? 'enabled' : 'disabled'}`);
      });
      
      // Undo button
      document.getElementById('undo-btn').addEventListener('click', () => {
        if (this.game.undo()) {
          this.updateMoveCounter();
          this.riveController.conflicts = this.game.findConflicts();
          this.riveController.render();
          console.log('Undo performed');
        }
      });
      
      // Redo button
      document.getElementById('redo-button').addEventListener('click', () => {
        if (this.game.redo()) {
          this.updateMoveCounter();
          this.riveController.conflicts = this.game.findConflicts();
          this.riveController.render();
          console.log('Redo performed');
        }
      });
      
      // Hint button
      document.getElementById('hint-btn').addEventListener('click', () => {
        const hint = this.game.getHint();
        if (hint) {
          this.riveController.selectedCell = { row: hint.row, col: hint.col };
          this.game.makeMove(hint.row, hint.col, hint.value);
          this.updateMoveCounter();
          this.riveController.render();
          console.log(`Hint provided: ${hint.value} at ${hint.row},${hint.col}`);
        }
      });
      
      // New game button
      document.getElementById('new-game').addEventListener('click', () => {
        this.newGame();
        console.log('New game started');
      });
      
      // Theme selector
      document.getElementById('theme-select').addEventListener('change', (e) => {
        setTheme(e.target.value);
        console.log(`Theme changed to ${e.target.value}`);
      });
      
      // Keyboard input
      document.addEventListener('keydown', (e) => {
        if (!this.riveController.selectedCell) return;
        
        if (e.key >= '0' && e.key <= '9') {
          this.handleNumberInput(parseInt(e.key));
        } else if (e.key === 'n') {
          // Toggle note mode
          this.isNoteMode = !this.isNoteMode;
          document.getElementById('notes-btn').classList.toggle('active', this.isNoteMode);
          console.log(`Note mode ${this.isNoteMode ? 'enabled' : 'disabled'}`);
        } else if (e.key === 'ArrowUp' && this.riveController.selectedCell.row > 0) {
          this.selectCell(this.riveController.selectedCell.row - 1, this.riveController.selectedCell.col);
        } else if (e.key === 'ArrowDown' && this.riveController.selectedCell.row < 8) {
          this.selectCell(this.riveController.selectedCell.row + 1, this.riveController.selectedCell.col);
        } else if (e.key === 'ArrowLeft' && this.riveController.selectedCell.col > 0) {
          this.selectCell(this.riveController.selectedCell.row, this.riveController.selectedCell.col - 1);
        } else if (e.key === 'ArrowRight' && this.riveController.selectedCell.col < 8) {
          this.selectCell(this.riveController.selectedCell.row, this.riveController.selectedCell.col + 1);
        }
      });
    }
    
    /**
     * Handle canvas click
     * @param {MouseEvent} e - The mouse event
     */
    handleCanvasClick(e) {
      const rect = this.riveController.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.riveController.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.riveController.canvas.height / rect.height);
      
      const cell = this.riveController.getCellFromCoordinates(x, y);
      if (cell) {
        this.selectCell(cell.row, cell.col);
      }
    }
    
    /**
     * Handle number input
     * @param {number} num - The number pressed (1-9, 0 to clear)
     */
    handleNumberInput(num) {
      console.log('Handling input:', num, 'for cell', 
        this.riveController.selectedCell ? 
        `${this.riveController.selectedCell.row},${this.riveController.selectedCell.col}` : 
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
      const cell = this.riveController.selectedCell;
      if (!cell) return;
      
      const { row, col } = cell;
      
      if (this.isNoteMode && num !== 0) {
        this.game.toggleNote(row, col, num);
        this.riveController.renderBoard();
        return;
      }
      
      // Make the move
      this.game.makeMove(row, col, num);
      
      // Check for conflicts and update the display
      if (!this.game.isValidMove(row, col, num)) {
        // Get all cells that conflict with this move
        const conflicts = this.game.findConflicts(row, col, num);
        this.riveController.updateConflicts(conflicts);
      } else {
        // If the move is valid, clear any existing conflicts
        this.riveController.checkAndClearConflicts();
      }
      
      this.riveController.renderBoard();
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
      // Allow selecting any cell, but only allow input for non-initial cells
      this.riveController.selectedCell = { row, col };
      console.log(`Selected cell: ${row},${col}`);
      this.riveController.render();
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
      this.riveController.renderFullBoard();
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
}