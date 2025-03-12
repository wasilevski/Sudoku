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
        
        // Initialize Rive button manager and connect it to the controller
        const riveManager = new RiveButtonManager(game, controller);
        controller.setRiveManager(riveManager);
        
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