import SudokuGame from './sudoku-game.js';
import SudokuBoardRenderer from './sudoku-board-renderer.js';
import SudokuController from './sudoku-controller.js';
import HomeScreen from './home-screen.js';
import RiveButtonManager from './rive-button-manager.js';
import RiveHeadboardManager from './rive-headboard-manager.js';
import StateManager from './state-manager.js';

class App {
    constructor() {
        // Initialize state manager
        this.stateManager = new StateManager();
        
        // Initialize screens
        this.homeScreen = new HomeScreen(this.stateManager);
        
        // Initialize game components (hidden initially)
        this.initializeGameComponents();
        
        // Show home screen by default
        this.showHomeScreen();
        
        // Listen for game start event
        document.addEventListener('startGame', (event) => {
            this.startGame(event.detail.puzzleId);
        });
    }
    
    initializeGameComponents() {
        // Create game instance
        this.game = new SudokuGame();
        
        // Create board renderer with container and game instance
        const boardContainer = document.getElementById('sudoku-board-container');
        if (!boardContainer) {
            console.error('Sudoku board container not found!');
            return;
        }
        this.boardRenderer = new SudokuBoardRenderer(boardContainer, this.game);
        
        // Create game controller
        this.controller = new SudokuController(this.game, this.boardRenderer, this.homeScreen);
        
        // Initialize Rive managers
        this.riveButtonManager = new RiveButtonManager(this.game, this.controller);
        this.riveHeadboardManager = new RiveHeadboardManager(this.game);
        
        // Set Rive managers in controller
        this.controller.riveButtonManager = this.riveButtonManager;
        this.controller.riveHeadboardManager = this.riveHeadboardManager;
    }
    
    showHomeScreen() {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('home-screen').classList.remove('hidden');
        document.getElementById('gold-container').classList.remove('hidden');
        this.homeScreen.show();
    }
    
    startGame(puzzleId) {
        document.getElementById('home-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('gold-container').classList.add('hidden');
        
        this.game.loadPredefinedPuzzle(puzzleId);
        this.controller.loadPuzzle(puzzleId);

        // Listen for puzzle completion and game over
        this.game.addEventListener('puzzleCompleted', () => {
            setTimeout(() => this.showHomeScreen(), 1500);
        });

        this.game.addEventListener('gameOver', () => {
            setTimeout(() => this.showHomeScreen(), 1500);
        });
    }
}

// Create and initialize the app
const app = new App();