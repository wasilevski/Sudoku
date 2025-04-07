class StateManager {
    constructor() {
        console.log('StateManager initialized');
        this.currentScreen = null;
        this.screens = {};
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
}

// Create a singleton instance
console.log('Creating StateManager singleton');
const stateManager = new StateManager();
export default stateManager; 