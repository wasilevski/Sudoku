export default class RiveButtonManager {
    constructor(game, controller) {
        this.game = game;
        this.controller = controller;
        this.riveInstances = new Map();
        // Wait for next frame to ensure DOM is ready
        requestAnimationFrame(() => this.initializeRiveButtons());
    }

    async initializeRiveButtons() {
        const buttons = document.querySelectorAll('.rive-button');
        
        // Wait for Rive to be available
        while (typeof rive === 'undefined') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const initPromises = [];
        
        for (const button of buttons) {
            const number = parseInt(button.dataset.number);
            try {
                // Create canvas element with WebGL context
                const canvas = document.createElement('canvas');
                
                // Set exact size
                const width = 38;
                const height = 80;
                
                // Set actual size in memory (scaled for device pixel ratio)
                const dpr = window.devicePixelRatio || 1;
                canvas.width = width * dpr;
                canvas.height = height * dpr;
                
                // Clear any existing content and append canvas
                button.innerHTML = '';
                button.appendChild(canvas);
                
                console.log(`Creating Rive instance for button ${number} with canvas size:`, canvas.width, canvas.height);

                // Create initialization promise
                const initPromise = new Promise((resolve) => {
                    // Create a new Rive instance
                    const riveInstance = new rive.Rive({
                        canvas: canvas,
                        src: 'assets/input__button.riv',
                        stateMachines: ['SM_InputButton'],
                        autoplay: true,
                        layout: new rive.Layout({
                            fit: rive.Fit.Contain,
                            alignment: rive.Alignment.Center
                        }),
                        useOffscreenRenderer: true,
                        onLoad: () => {
                            console.log(`Rive instance loaded for button ${number}`);
                            
                            try {
                                // Log all available inputs
                                const inputs = riveInstance.stateMachineInputs('SM_InputButton');
                                console.log(`Available inputs for button ${number}:`, 
                                    inputs.map(i => ({name: i.name, type: i.type, value: i.value})));

                                // Set initial text value
                                console.log(`Setting text run value for button ${number} to:`, number);
                                riveInstance.setTextRunValue('inputNumber', String(number));
                                
                                // Verify text was set
                                try {
                                    const verifyText = riveInstance.getTextRunValue('inputNumber');
                                    console.log(`Verified text run value for button ${number} is now:`, verifyText);
                                } catch (e) {
                                    console.error(`Error verifying text run value for button ${number}:`, e.message);
                                }
                                
                                // Handle stack count input
                                const stackInput = inputs.find(input => input.name === 'StackCount');
                                
                                if (stackInput) {
                                    console.log(`Found stack input for button ${number}. Type: ${stackInput.type}, Current value: ${stackInput.value}`);
                                    stackInput.value = 0;  // Initialize to 0
                                } else {
                                    console.error(`No stack input found for button ${number}. Available inputs:`, 
                                        inputs.map(i => i.name).join(', '));
                                }
                                
                                resolve();
                            } catch (error) {
                                console.error(`Error setting up button ${number}:`, error);
                                resolve();
                            }
                        }
                    });

                    // Store the instance
                    this.riveInstances.set(number, riveInstance);
                });

                initPromises.push(initPromise);

                // Add click handler
                button.addEventListener('click', () => {
                    this.handleButtonClick(number);
                });

            } catch (error) {
                console.error(`Error initializing Rive button ${number}:`, error);
            }
        }
        
        // Wait for all instances to initialize
        await Promise.all(initPromises);
        console.log('All Rive instances initialized');
        
        // Wait a bit more to ensure everything is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Update all button states
        await this.updateButtonStates();
    }

    handleButtonClick(number) {
        // Forward the click to the controller's handleNumberPress
        this.controller.handleNumberPress(number);
    }

    async updateButtonState(number) {
        const riveInstance = this.riveInstances.get(number);
        if (!riveInstance) {
            console.log(`No Rive instance found for button ${number}`);
            return;
        }

        try {
            const count = this.game.numberCounts[number];
            const isMaxed = this.game.isNumberMaxed(number);
            console.log(`Updating button ${number} state. Count: ${count}, IsMaxed: ${isMaxed}`);
            
            const inputs = riveInstance.stateMachineInputs('SM_InputButton');
            const stackInput = inputs.find(input => input.name === 'StackCount');
            
            if (stackInput) {
                const oldValue = stackInput.value;
                const newValue = isMaxed ? 9 : count;
                console.log(`Setting stack count for button ${number}:`, {
                    oldValue,
                    newValue,
                    count,
                    isMaxed,
                    inputType: stackInput.type
                });
                
                stackInput.value = newValue;
                
                // Verify the value was set
                console.log(`Verified stack count for button ${number} is now:`, stackInput.value);

                // Re-verify text value after stack update
                try {
                    const textValue = riveInstance.getTextRunValue('inputNumber');
                    console.log(`Text run value for button ${number} after stack update:`, textValue);
                    if (textValue !== String(number)) {
                        console.log(`Re-setting text run value for button ${number} to:`, number);
                        riveInstance.setTextRunValue('inputNumber', String(number));
                    }
                } catch (e) {
                    console.error(`Error checking text run value for button ${number}:`, e.message);
                }
            } else {
                console.error(`No stack input found for button ${number} during state update. Available inputs:`, 
                    inputs.map(i => ({name: i.name, type: i.type})));
            }
        } catch (error) {
            console.error(`Error updating button state for number ${number}:`, error);
        }
    }

    async updateButtonStates() {
        console.log('Updating all button states');
        for (const number of this.riveInstances.keys()) {
            await this.updateButtonState(number);
            // Wait a frame between updates
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    }
} 