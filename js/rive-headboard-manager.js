import puzzles from './puzzle-data.js';

export default class RiveHeadboardManager {
    constructor(game) {
        this.game = game;
        
        // Initialize Rive
        this.initializeRive();
        
        // Bind to game events
        this.bindGameEvents();
        
        // Add resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    handleResize() {
        const canvas = document.getElementById('headboard-canvas');
        if (!canvas || !this.rive) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    }

    async initializeRive() {
        try {
            const canvas = document.getElementById('headboard-canvas');
            if (!canvas) {
                console.error('Headboard canvas not found');
                return;
            }

            // Get the device pixel ratio and canvas dimensions
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            
            // Set the canvas size accounting for DPR
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            
            // Scale the canvas CSS dimensions
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

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
                    
                    // Get the text size trigger
                    console.log('Looking for LargeText trigger...');
                    this.largeTextTrigger = this.inputs.find(input => {
                        const found = input.name === 'LargeText';
                        console.log('Checking input:', input.name, 'Found:', found);
                        return found;
                    });
                    
                    console.log('Final trigger state:', {
                        normal: this.normalTrigger ? 'found' : 'not found',
                        happy: this.happyTrigger ? 'found' : 'not found',
                        confused: this.confusedTrigger ? 'found' : 'not found',
                        shocked: this.shockedTrigger ? 'found' : 'not found',
                        largeText: this.largeTextTrigger ? 'found' : 'not found'
                    });
                    
                    // Set initial state
                    if (this.normalTrigger) {
                        console.log('Setting initial state to Normal');
                        this.normalTrigger.fire();
                    } else {
                        console.warn('Could not set initial state - Normal trigger not found');
                    }

                    // Set initial text values
                    this.updateTextFields({
                        moves: this.game.moveCount,
                        conflicts: this.game.bombs
                    });
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
            
            // Update text fields with current values
            this.updateTextFields({
                moves: this.game.moveCount,
                conflicts: this.game.bombs
            });
            
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

    updateTextFields({ moves, conflicts }) {
        if (!this.rive) {
            console.warn('Rive not initialized, cannot update text fields');
            return;
        }

        try {
            // Update moves counter
            const movesText = moves.toString();
            console.log('Setting moves text to:', movesText);
            this.rive.setTextRunValue('TextBox2', movesText);
            
            // Update conflicts counter
            const conflictsText = conflicts.toString();
            console.log('Setting conflicts text to:', conflictsText);
            this.rive.setTextRunValue('TextBox1', conflictsText);
            
            // Verify text was set
            try {
                const verifyMoves = this.rive.getTextRunValue('TextBox2');
                const verifyConflicts = this.rive.getTextRunValue('TextBox1');
                console.log('Verified text values:', {
                    moves: verifyMoves,
                    conflicts: verifyConflicts
                });
            } catch (e) {
                console.error('Error verifying text values:', e.message);
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