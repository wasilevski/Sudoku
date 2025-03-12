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
      this.winPopup = document.getElementById('win-popup');
      this.conflicts = new Map(); // Track conflicts by value
      this.riveButtonManager = null; // Will be set by app.js
      this.riveHeadboardManager = null; // Will be set by app.js
      this.remainingMoves = 0; // Track remaining moves
      this.remainingConflicts = 0; // Track remaining conflicts
      this.gameOverPopup = document.createElement('div');
      this.setupGameOverPopup();
      
      this.setupEventListeners();
      this.startTimer();
      
      // Ensure the board is rendered
      if (typeof this.boardRenderer.renderBoard === 'function') {
        this.boardRenderer.renderBoard();
      } else {
        console.error('renderBoard method not found on boardRenderer');
      }
      
      // Store reference to number buttons
      this.numberButtons = Array.from(document.querySelectorAll('.number-btn'));
      
      // Initial button state update
      this.updateNumberButtonStates();
      
      // Add puzzle selector listener
      const puzzleSelect = document.getElementById('puzzle-select');
      if (puzzleSelect) {
          puzzleSelect.addEventListener('change', (e) => {
              this.loadPuzzle(e.target.value);
          });
      }
      
      // Add popup elements
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
        if (!cell || this.remainingMoves <= 0) return;
        
        const { row, col } = cell;
        console.log(`Handling number press: ${num} for cell ${row},${col}`);
        
        if (this.isNoteMode && num !== 0) {
            this.game.toggleNote(row, col, num);
            this.boardRenderer.renderBoard();
            return;
        }
        
        // Get current value in the cell
        const currentValue = this.game.grid[row][col];
        
        // If the cell is an initial cell (part of the puzzle), don't allow changes
        if (this.game.isInitialCell(row, col)) {
            return;
        }
        
        // If pressing the same number that's already in the cell, clear it
        const isClearingCell = currentValue === num;
        if (isClearingCell) {
            num = 0; // Set to 0 to clear the cell
        }
        
        // Store old value and check if it was in conflict
        const oldValue = currentValue;
        const oldConflicts = this.findConflictsForNumber(oldValue);
        const hadConflict = oldConflicts.length > 0;
        
        if (!this.game.makeMove(row, col, num)) {
            return;
        }

        // Decrement remaining moves only if not clearing a cell
        if (!isClearingCell) {
            this.remainingMoves--;
        }

        console.log(`Old value: ${oldValue}, New value: ${num}`);
        
        // Remove old value's conflicts
        if (oldValue !== 0) {
            console.log(`Removing conflicts for old value: ${oldValue}`);
            this.conflicts.delete(oldValue);
            this.updateConflictsForNumber(oldValue);
        }
        
        // Update conflicts for new value
        let newConflicts = [];
        if (num !== 0) {
            console.log(`Checking conflicts for new value: ${num}`);
            this.updateConflictsForNumber(num);
            newConflicts = this.findConflictsForNumber(num);
        }
        const hasNewConflict = newConflicts.length > 0;
        
        // Update Rive button states
        if (this.riveButtonManager) {
            this.riveButtonManager.updateButtonStates();
        }
        
        // Update number button states
        this.updateNumberButtonStates();
        
        // Clear all current visual conflicts
        this.boardRenderer.updateConflicts([]);
        
        // Update display with actual conflicts
        const allConflicts = this.getAllConflicts();
        console.log('All current conflicts:', allConflicts);
        this.boardRenderer.updateConflicts(allConflicts);

        // Update remaining conflicts only if:
        // 1. We're not clearing a cell (num !== 0)
        // 2. We have a new conflict
        // 3. The previous value wasn't already in conflict OR we're replacing with a different conflicting number
        if (num !== 0 && hasNewConflict && (!hadConflict || (hadConflict && !isClearingCell))) {
            this.remainingConflicts = Math.max(0, this.remainingConflicts - 1);
            console.log('Decremented remaining conflicts to:', this.remainingConflicts);
        }
        
        // Ensure board is fully updated
        this.boardRenderer.renderBoard();
        this.updateMoveCounter();
        
        // Check for game over conditions
        if (this.remainingMoves <= 0 || this.remainingConflicts <= 0) {
            this.handleGameOver();
        } else if (this.game.isComplete()) {
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
            console.log('Selecting cell:', row, col);
            this.boardRenderer.selectedCell = { row, col };
            this.boardRenderer.renderBoard();
            
            // Dispatch cellSelected event
            const event = new CustomEvent('cellSelected', { 
                detail: { row, col }
            });
            console.log('Dispatching cellSelected event:', event);
            this.game.dispatchEvent(event);
            
            // Only enable/disable buttons based on whether they're maxed out
            this.numberButtons.forEach(button => {
                const num = parseInt(button.dataset.number);
                const isMaxed = this.game.isNumberMaxed(num);
                button.disabled = isMaxed;
                button.classList.toggle('maxed', isMaxed);
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
    }
    
    /**
     * Update the move counter
     */
    updateMoveCounter() {
      // Update the move counter in the Rive headboard
      if (this.riveHeadboardManager) {
        // Pass the remaining moves and conflicts to update the display
        const data = {
          moves: this.remainingMoves,
          conflicts: this.remainingConflicts
        };
        this.riveHeadboardManager.updateTextFields(data);
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
            // Reset counters based on puzzle goals
            const puzzle = PREDEFINED_PUZZLES[puzzleId];
            this.remainingMoves = puzzle.goalMoves;
            this.remainingConflicts = puzzle.goalConflicts;
            
            this.boardRenderer.renderBoard();
            this.resetTimer();
            
            // Clear existing conflicts
            this.conflicts.clear();
            this.boardRenderer.updateConflicts([]);
            
            // Update Rive button states for the new puzzle
            if (this.riveButtonManager) {
                this.riveButtonManager.updateButtonStates();
            }
            
            // Update regular button states
            this.updateNumberButtonStates();

            // Update counters display immediately
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
        
        // Clear board selection
        this.boardRenderer.clearSelection();
        
        // Ensure button states are updated after puzzle load
        if (this.riveButtonManager) {
            this.riveButtonManager.updateButtonStates();
        }
        this.updateNumberButtonStates();
    }

    findConflictsForNumber(num) {
        const conflicts = new Set();
        
        // Check each cell for the specific number
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.game.grid[row][col] !== num) continue;
                
                // Check row
                for (let c = 0; c < 9; c++) {
                    if (c !== col && this.game.grid[row][c] === num) {
                        conflicts.add(JSON.stringify({row, col}));
                        conflicts.add(JSON.stringify({row, col: c}));
                    }
                }
                
                // Check column
                for (let r = 0; r < 9; r++) {
                    if (r !== row && this.game.grid[r][col] === num) {
                        conflicts.add(JSON.stringify({row, col}));
                        conflicts.add(JSON.stringify({row: r, col}));
                    }
                }
                
                // Check 3x3 box
                const boxRow = Math.floor(row / 3) * 3;
                const boxCol = Math.floor(col / 3) * 3;
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const currentRow = boxRow + r;
                        const currentCol = boxCol + c;
                        if ((currentRow !== row || currentCol !== col) && 
                            this.game.grid[currentRow][currentCol] === num) {
                            conflicts.add(JSON.stringify({row, col}));
                            conflicts.add(JSON.stringify({row: currentRow, col: currentCol}));
                        }
                    }
                }
            }
        }
        
        return Array.from(conflicts).map(str => JSON.parse(str));
    }

    getAllConflicts() {
        const allConflicts = new Set();
        for (const [num, conflicts] of this.conflicts.entries()) {
            console.log(`Getting conflicts for number ${num}:`, conflicts);
            conflicts.forEach(conflict => {
                allConflicts.add(JSON.stringify(conflict));
            });
        }
        const result = Array.from(allConflicts).map(str => JSON.parse(str));
        console.log('Final conflicts list:', result);
        return result;
    }

    updateConflictsForNumber(num) {
        const conflicts = this.findConflictsForNumber(num);
        if (conflicts.length > 0) {
            console.log(`Found conflicts for ${num}:`, conflicts);
            this.conflicts.set(num, conflicts);
        } else {
            console.log(`No conflicts for ${num}, removing from conflict map`);
            this.conflicts.delete(num);
        }
    }

    /**
     * Update states of all number buttons based on their counts
     */
    updateNumberButtonStates() {
        this.numberButtons.forEach(button => {
            const num = parseInt(button.dataset.number);
            const isMaxed = this.game.isNumberMaxed(num);
            button.disabled = isMaxed;
            button.classList.toggle('maxed', isMaxed);
            if (isMaxed) {
                console.log(`Button ${num} disabled - max occurrences reached`);
            }
        });
    }

    /**
     * Set the RiveButtonManager instance
     * @param {RiveButtonManager} manager - The RiveButtonManager instance
     */
    setRiveButtonManager(manager) {
        this.riveButtonManager = manager;
    }

    /**
     * Set the RiveHeadboardManager instance
     * @param {RiveHeadboardManager} manager - The RiveHeadboardManager instance
     */
    setRiveHeadboardManager(manager) {
        this.riveHeadboardManager = manager;
    }

    setupGameOverPopup() {
        this.gameOverPopup.className = 'popup hidden';
        this.gameOverPopup.innerHTML = `
            <div class="popup-content">
                <h2>Oops, too bad!</h2>
                <p>You've run out of moves or conflicts.</p>
                <div class="popup-actions">
                    <button id="try-again-btn">Try Again</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.gameOverPopup);

        const tryAgainBtn = this.gameOverPopup.querySelector('#try-again-btn');
        tryAgainBtn.addEventListener('click', () => {
            this.gameOverPopup.classList.add('hidden');
            this.loadPuzzle(this.game.currentPuzzleId);
        });
    }

    handleGameOver() {
        this.pauseTimer();
        this.gameOverPopup.classList.remove('hidden');
    }
}