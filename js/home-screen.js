import puzzles from './puzzle-data.js';

export default class HomeScreen {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.currentPuzzleId = 1;
        
        // Get DOM elements
        this.goldDisplay = document.getElementById('gold-display');
        this.puzzleImage = document.getElementById('puzzle-image');
        this.progressBar = document.getElementById('progress-bar');
        this.levelButton = document.getElementById('level-button');
        this.levelPopup = document.getElementById('level-popup');
        this.levelPopupTitle = document.getElementById('level-popup-title');
        this.playButton = document.getElementById('play-button');
        
        this.setupEventListeners();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Level button click shows popup
        this.levelButton.addEventListener('click', () => this.showLevelPopup());
        
        // Play button in popup starts the game
        this.playButton.addEventListener('click', () => this.startLevel());
        
        // Close popup when clicking outside
        this.levelPopup.addEventListener('click', (e) => {
            if (e.target === this.levelPopup) {
                this.levelPopup.classList.add('hidden');
            }
        });

        // Add gold on click (temporary feature)
        const goldContainer = document.getElementById('gold-container');
        if (goldContainer) {
            goldContainer.addEventListener('click', () => {
                this.stateManager.addGold(1000);
                this.updateDisplay();
            });
            goldContainer.style.cursor = 'pointer'; // Make it look clickable
        }
    }

    updateDisplay() {
        // Update gold display
        this.goldDisplay.textContent = this.stateManager.getGold().toLocaleString();
        
        // Update puzzle image
        this.puzzleImage.src = this.stateManager.getCurrentPuzzleImage();
        
        // Update progress bar
        const completedCount = this.stateManager.completedPuzzles.size;
        const totalPuzzles = puzzles.length;
        const progress = (completedCount / totalPuzzles) * 100;
        this.progressBar.style.width = `${progress}%`;
        
        // Update level button text
        const nextPuzzle = puzzles[this.currentPuzzleId - 1];
        if (nextPuzzle) {
            this.levelButton.textContent = `Level ${nextPuzzle.puzzleNumber}`;
        }
    }

    showLevelPopup() {
        const puzzle = puzzles[this.currentPuzzleId - 1];
        if (!puzzle) return;

        this.levelPopupTitle.textContent = `Level ${puzzle.puzzleNumber}`;
        this.playButton.textContent = `Play ${puzzle.goldCost.toLocaleString()} Gold`;
        this.levelPopup.classList.remove('hidden');
    }

    startLevel() {
        const puzzle = puzzles[this.currentPuzzleId - 1];
        if (!puzzle) return;

        if (this.stateManager.subtractGold(puzzle.goldCost)) {
            this.levelPopup.classList.add('hidden');
            // Trigger game start
            document.dispatchEvent(new CustomEvent('startGame', { 
                detail: { puzzleId: this.currentPuzzleId }
            }));
            this.updateDisplay();
        } else {
            alert('Not enough gold!');
        }
    }

    show() {
        document.getElementById('home-screen').classList.remove('hidden');
        this.updateDisplay();
    }

    hide() {
        document.getElementById('home-screen').classList.add('hidden');
    }

    onPuzzleCompleted(puzzleId) {
        const puzzle = puzzles[puzzleId - 1];
        if (puzzle) {
            this.stateManager.addGold(puzzle.goldReward);
            this.stateManager.markPuzzleCompleted(puzzle.puzzleNumber);
            this.currentPuzzleId = Math.min(puzzleId + 1, puzzles.length);
            this.updateDisplay();
        }
    }
} 