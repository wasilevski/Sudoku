// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing game...');
        
        // Get the container
        const container = document.getElementById('sudoku-board-container');
        if (!container) {
            throw new Error('Could not find sudoku-board-container');
        }
        
        // Initialize game components
        const game = new SudokuGame();
        const boardRenderer = new SudokuBoardRenderer(container, game);
        
        // Ensure canvas is created before initializing controller
        if (!boardRenderer.canvas) {
            throw new Error('Canvas was not properly initialized');
        }
        
        // Initialize controller
        const controller = new SudokuController(game, boardRenderer);
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});