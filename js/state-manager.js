class StateManager {
    constructor() {
        console.log('StateManager initialized');
        this.currentScreen = null;
        this.screens = {};
        this.loadState();
    }

    registerScreen(name, element) {
        console.log(`Registering screen: ${name}`, element);
        if (!element) {
            console.error(`Element for screen ${name} is null or undefined`);
            return;
        }
        this.screens[name] = element;
        console.log('Current registered screens:', Object.keys(this.screens));
    }

    showScreen(name) {
        console.log(`Showing screen: ${name}`);
        console.log('Current screen:', this.currentScreen);
        console.log('Available screens:', Object.keys(this.screens));

        // Hide current screen if exists
        if (this.currentScreen && this.screens[this.currentScreen]) {
            console.log(`Hiding current screen: ${this.currentScreen}`);
            this.screens[this.currentScreen].classList.remove('active');
        }

        // Show new screen
        if (this.screens[name]) {
            console.log(`Activating screen: ${name}`);
            this.screens[name].classList.add('active');
            this.currentScreen = name;
        } else {
            console.error(`Screen ${name} not found in:`, this.screens);
        }
    }

    loadState() {
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.gold = typeof state.gold === 'number' ? state.gold : 5000;
                this.completedPuzzles = new Set(state.completedPuzzles || []);
            } catch (error) {
                console.error('Error parsing saved state:', error);
                this.initializeDefaultState();
            }
        } else {
            this.initializeDefaultState();
        }
    }

    initializeDefaultState() {
        this.gold = 5000; // Starting gold
        this.completedPuzzles = new Set();
        this.saveState();
    }

    saveState() {
        const state = {
            gold: this.gold,
            completedPuzzles: Array.from(this.completedPuzzles)
        };
        try {
            localStorage.setItem('gameState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    addGold(amount) {
        this.gold = (this.gold || 0) + amount;
        this.saveState();
    }

    subtractGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.saveState();
            return true;
        }
        return false;
    }

    markPuzzleCompleted(puzzleNumber) {
        this.completedPuzzles.add(puzzleNumber);
        this.saveState();
    }

    isPuzzleCompleted(puzzleNumber) {
        return this.completedPuzzles.has(puzzleNumber);
    }

    getGold() {
        return this.gold || 0;
    }

    getCurrentPuzzleImage() {
        const completedCount = this.completedPuzzles.size;
        if (completedCount === 0) {
            return 'assets/numberPuzzleStart.png';
        }
        return `assets/numberPuzzle${completedCount}.png`;
    }
}

export default StateManager; 