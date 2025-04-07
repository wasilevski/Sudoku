import puzzles from './puzzle-data.js';

export default class HomeScreen {
    constructor() {
        this.element = document.getElementById('home-screen');
        this.playButton = document.getElementById('play-button');
        this.puzzleNumberElement = document.getElementById('puzzle-number');
        this.puzzleNameElement = document.getElementById('puzzle-name');
        this.onPlayCallbacks = new Set();
        this.currentPuzzleId = 1;
        
        // Set initial puzzle info
        this.updatePuzzleInfo(this.currentPuzzleId);
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.playButton.addEventListener('click', () => {
            this.hide();
            // Notify listeners that play was clicked with current puzzle ID
            this.onPlayCallbacks.forEach(callback => callback(this.currentPuzzleId));
        });
    }

    onPlay(callback) {
        this.onPlayCallbacks.add(callback);
    }

    show() {
        this.element.classList.remove('hidden');
    }

    hide() {
        this.element.classList.add('hidden');
    }

    updatePuzzleInfo(puzzleId) {
        const puzzle = puzzles[puzzleId - 1];
        if (puzzle) {
            this.currentPuzzleId = puzzleId;
            if (this.puzzleNumberElement) {
                this.puzzleNumberElement.textContent = `Level ${puzzle.puzzleNumber}`;
            }
            if (this.puzzleNameElement) {
                this.puzzleNameElement.textContent = puzzle.name;
            }
        }
    }

    progressToNextPuzzle() {
        const nextPuzzleId = this.currentPuzzleId + 1;
        if (nextPuzzleId <= puzzles.length) {
            this.updatePuzzleInfo(nextPuzzleId);
            return true;
        }
        return false;
    }
} 