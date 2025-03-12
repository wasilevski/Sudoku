class RiveHeadboardManager {
    constructor(game) {
        this.game = game;
        
        // Initialize Rive
        this.initializeRive();
        
        // Bind to game events
        this.bindGameEvents();
    }

    async initializeRive() {
        try {
            const canvas = document.getElementById('headboard-canvas');
            if (!canvas) {
                console.error('Headboard canvas not found');
                return;
            }

            console.log('Initializing Rive headboard...');
            
            this.rive = new rive.Rive({
                src: 'assets/headboard_a1.riv',
                canvas: canvas,
                artboard: 'Artboard_Headboard',
                stateMachines: ['SM_Headboard'],
                autoplay: true,
                layout: new rive.Layout({
                    fit: rive.Fit.Cover,
                    alignment: rive.Alignment.Center
                }),
                onLoad: () => {
                    console.log('Headboard Rive loaded');
                    
                    // Get the state machine inputs
                    this.inputs = this.rive.stateMachineInputs('SM_Headboard');
                    console.log('Raw inputs array:', this.inputs);
                    
                    // Log detailed input information
                    console.log('Available inputs:');
                    if (this.inputs && this.inputs.length > 0) {
                        this.inputs.forEach((input, index) => {
                            console.log(`Input ${index}:`, {
                                name: input.name,
                                type: input.type,
                                toString: input.toString(),
                                properties: Object.keys(input)
                            });
                        });
                    } else {
                        console.warn('No inputs found in state machine');
                    }

                    // Get triggers with detailed logging
                    console.log('Looking for Normal trigger...');
                    this.normalTrigger = this.inputs.find(input => {
                        const found = input.name === 'Normal';
                        console.log('Checking input:', input.name, 'Found:', found);
                        return found;
                    });
                    
                    console.log('Looking for Happy trigger...');
                    this.happyTrigger = this.inputs.find(input => {
                        const found = input.name === 'Happy';
                        console.log('Checking input:', input.name, 'Found:', found);
                        return found;
                    });
                    
                    console.log('Looking for Confused trigger...');
                    this.confusedTrigger = this.inputs.find(input => {
                        const found = input.name === 'Confused';
                        console.log('Checking input:', input.name, 'Found:', found);
                        return found;
                    });
                    
                    console.log('Looking for Shocked trigger...');
                    this.shockedTrigger = this.inputs.find(input => {
                        const found = input.name === 'Shocked';
                        console.log('Checking input:', input.name, 'Found:', found);
                        return found;
                    });
                    
                    console.log('Final trigger state:', {
                        normal: this.normalTrigger ? 'found' : 'not found',
                        happy: this.happyTrigger ? 'found' : 'not found',
                        confused: this.confusedTrigger ? 'found' : 'not found',
                        shocked: this.shockedTrigger ? 'found' : 'not found'
                    });
                    
                    // Set initial state
                    if (this.normalTrigger) {
                        console.log('Setting initial state to Normal');
                        this.normalTrigger.fire();
                    } else {
                        console.warn('Could not set initial state - Normal trigger not found');
                    }

                    // Get initial values from the current puzzle
                    const currentPuzzle = PREDEFINED_PUZZLES[this.game.currentPuzzleId];
                    if (currentPuzzle) {
                        // Update text fields with initial values
                        this.updateTextFields({
                            moves: currentPuzzle.goalMoves,
                            conflicts: currentPuzzle.goalConflicts
                        });
                    } else {
                        console.warn('No current puzzle found for initial values');
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing Rive:', error);
        }
    }

    bindGameEvents() {
        // Listen for number placements
        this.game.addEventListener('numberPlaced', (event) => {
            console.log('Number placed event:', event);
            
            if (event.detail.isValid) {
                console.log('Valid move detected, attempting to fire happy trigger');
                if (this.happyTrigger) {
                    try {
                        console.log('Firing happy trigger');
                        this.happyTrigger.fire();
                        console.log('Happy trigger fired successfully');
                    } catch (error) {
                        console.error('Error firing happy trigger:', error);
                    }
                } else {
                    console.warn('Happy trigger not found or not initialized');
                }
            } else {
                console.log('Invalid move detected, attempting to fire shocked trigger');
                if (this.shockedTrigger) {
                    try {
                        console.log('Firing shocked trigger');
                        this.shockedTrigger.fire();
                        console.log('Shocked trigger fired successfully');
                    } catch (error) {
                        console.error('Error firing shocked trigger:', error);
                    }
                } else {
                    console.warn('Shocked trigger not found or not initialized');
                }
            }
        });

        // Listen for cell selection
        this.game.addEventListener('cellSelected', (event) => {
            console.log('Cell selection event:', {
                event,
                triggers: {
                    normal: !!this.normalTrigger,
                    confused: !!this.confusedTrigger,
                    happy: !!this.happyTrigger,
                    shocked: !!this.shockedTrigger
                }
            });

            const { row, col } = event.detail;
            const value = this.game.grid[row][col];
            
            console.log('Cell state:', {
                row,
                col,
                value,
                isEmpty: value === 0,
                confusedTriggerAvailable: !!this.confusedTrigger
            });
            
            // Check if the selected cell is empty
            if (value === 0) {
                console.log('Empty cell detected, attempting to fire confused trigger');
                if (this.confusedTrigger) {
                    try {
                        console.log('Firing confused trigger');
                        this.confusedTrigger.fire();
                        console.log('Confused trigger fired successfully');
                    } catch (error) {
                        console.error('Error firing confused trigger:', error);
                    }
                } else {
                    console.warn('Confused trigger not found or not initialized');
                }
            } else {
                console.log('Cell not empty, attempting to fire normal trigger');
                if (this.normalTrigger) {
                    try {
                        console.log('Firing normal trigger');
                        this.normalTrigger.fire();
                        console.log('Normal trigger fired successfully');
                    } catch (error) {
                        console.error('Error firing normal trigger:', error);
                    }
                } else {
                    console.warn('Normal trigger not found or not initialized');
                }
            }
        });
    }

    updateTextFields(data) {
        if (!this.rive) {
            console.log('Rive not ready');
            return;
        }

        try {
            // Update conflicts counter
            const conflicts = data ? data.conflicts.toString() : '0';
            console.log('Setting TextBox1 value to:', conflicts);
            this.rive.setTextRunValue('TextBox1', conflicts);
            
            // Verify text was set
            try {
                const verifyText1 = this.rive.getTextRunValue('TextBox1');
                console.log('Verified TextBox1 value is now:', verifyText1);
            } catch (e) {
                console.error('Error verifying TextBox1 value:', e.message);
            }
            
            // Update moves counter
            const moves = data ? data.moves.toString() : '0';
            console.log('Setting TextBox2 value to:', moves);
            this.rive.setTextRunValue('TextBox2', moves);
            
            // Verify text was set
            try {
                const verifyText2 = this.rive.getTextRunValue('TextBox2');
                console.log('Verified TextBox2 value is now:', verifyText2);
            } catch (e) {
                console.error('Error verifying TextBox2 value:', e.message);
            }
        } catch (error) {
            console.error('Error updating text fields:', error);
        }
    }

    onValidMove() {
        if (this.happyTrigger) {
            console.log('Firing happy trigger');
            this.happyTrigger.fire();
        }
    }

    onConflictMove() {
        if (this.shockedTrigger) {
            console.log('Firing shocked trigger');
            this.shockedTrigger.fire();
        }
    }
} 