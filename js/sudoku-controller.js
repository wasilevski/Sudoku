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
      
      // Store reference to number buttons
      this.numberButtons = Array.from(document.querySelectorAll('.number-btn'));
      
      // Add puzzle selector listener
      const puzzleSelect = document.getElementById('puzzle-select');
      if (puzzleSelect) {
          puzzleSelect.addEventListener('change', (e) => {
              this.loadPuzzle(e.target.value);
          });
      }
      
      // Add popup elements
      this.winPopup = document.getElementById('win-popup');
      this.nextPuzzleBtn = document.getElementById('next-puzzle-btn');
      
      // Add next puzzle button listener
      if (this.nextPuzzleBtn) {
          this.nextPuzzleBtn.addEventListener('click', () => {
              this.loadNextPuzzle();
          });
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
    handleCanvasClick(event) {
      // Add logging to debug click coordinates
      console.log('Click event:', event);
      
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Log calculated coordinates
      console.log('Calculated coordinates:', { x, y });
      
      // We need to account for the device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      const cellSize = this.boardRenderer.displaySize / 9;
      
      // Calculate row and col with DPR
      const row = Math.floor(y / cellSize);
      const col = Math.floor(x / cellSize);
      
      // Log calculated cell position
      console.log('Calculated cell:', { row, col });
      
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
        const conflicts = this.game.findConflicts(row, col, num);
        this.boardRenderer.updateConflicts(conflicts);
      } else {
        this.boardRenderer.checkAndClearConflicts();
      }
      
      this.boardRenderer.renderBoard();
      this.updateMoveCounter();
      
      // Add debug logging for completion check
      console.log('Checking for completion after move...');
      console.log('Current grid state:', this.game.getGrid());
      
      if (this.game.isComplete()) {
        console.log('Game is complete! Showing popup...');
        this.handleGameComplete();
      } else {
        console.log('Game is not complete yet');
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
        
        // Check if selected cell is an initial cell
        const isInitialCell = this.game.isInitialCell(row, col);
        
        // Disable/enable number buttons based on cell type
        this.numberButtons.forEach(button => {
          button.disabled = isInitialCell;
        });
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
      console.log('Handling game completion...');
      if (this.game.isComplete()) {
        // Stop the timer
        this.pauseTimer();
        
        // Show the win popup
        if (this.winPopup) {
          console.log('Showing win popup');
          console.log('Current puzzle ID:', this.game.currentPuzzleId);
          this.winPopup.classList.remove('hidden');
        } else {
          console.log('Win popup element not found!');
        }
      }
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

    loadPuzzle(puzzleId) {
        if (this.game.loadPredefinedPuzzle(puzzleId)) {
            this.boardRenderer.renderBoard();
            this.resetTimer();
            this.updateMoveCounter();
        }
    }

    // Add method to load next puzzle
    loadNextPuzzle() {
        const currentId = parseInt(this.game.currentPuzzleId);
        console.log('Loading next puzzle. Current ID:', currentId);
        const nextId = currentId + 1;
        console.log('Attempting to load puzzle ID:', nextId);
        
        // Check if next puzzle exists
        if (PREDEFINED_PUZZLES[nextId]) {
            console.log('Found next puzzle, loading puzzle:', nextId);
            this.winPopup.classList.add('hidden');
            this.loadPuzzle(nextId.toString());
        } else {
            console.log('No next puzzle found, returning to puzzle 1');
            this.winPopup.classList.add('hidden');
            this.loadPuzzle('1');
        }
    }
}