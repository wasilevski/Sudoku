import SudokuGame from './sudoku-game.js';
import SudokuBoardRenderer from './sudoku-board-renderer.js';
import SudokuController from './sudoku-controller.js';
import RiveButtonManager from './rive-button-manager.js';
import RiveHeadboardManager from './rive-headboard-manager.js';
import HomeScreen from './home-screen.js';

export default class App {
    constructor() {
        this.homeScreen = null;
        this.game = null;
        this.boardRenderer = null;
        this.controller = null;
        this.initialize();
    }

    initialize() {
        // Initialize home screen first
        this.homeScreen = new HomeScreen();
        
        // Initialize game components but keep them hidden
        this.initializeGameComponents();
        
        // Listen for play button click
        this.homeScreen.onPlay((puzzleId) => {
            this.startGame(puzzleId);
        });
    }

    initializeGameComponents() {
        const gameScreen = document.getElementById('game-screen');
        
        // Initialize game components
        this.game = new SudokuGame();
        this.boardRenderer = new SudokuBoardRenderer(document.getElementById('sudoku-board-container'), this.game);
        this.controller = new SudokuController(this.game, this.boardRenderer, this.homeScreen);
        
        // Initialize Rive managers with proper dependencies
        this.riveButtonManager = new RiveButtonManager(this.game, this.controller);
        this.riveHeadboardManager = new RiveHeadboardManager(this.game);
        
        // Set Rive managers in controller using individual setters
        this.controller.setRiveButtonManager(this.riveButtonManager);
        this.controller.setRiveHeadboardManager(this.riveHeadboardManager);
    }

    startGame(puzzleId) {
        // Show game screen and load puzzle
        const gameScreen = document.getElementById('game-screen');
        gameScreen.classList.remove('hidden');
        this.controller.loadPuzzle(puzzleId);
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.initialize();
});