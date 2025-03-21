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
        const renderer = new SudokuBoardRenderer(container, game);
        
        // Ensure canvas is created before initializing controller
        if (!renderer.canvas) {
            throw new Error('Canvas was not properly initialized');
        }
        
        // Initialize controller
        const controller = new SudokuController(game, renderer);
        
        // Initialize Rive managers and connect them to the controller
        const riveButtonManager = new RiveButtonManager(game, controller);
        const headboardManager = new RiveHeadboardManager(game);
        controller.setRiveButtonManager(riveButtonManager);
        controller.setRiveHeadboardManager(headboardManager);
        
        // Load initial puzzle
        const defaultPuzzleId = '1';
        controller.loadPuzzle(defaultPuzzleId);
        
        // Initial render
        renderer.renderBoard();
        
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});