import puzzles from './puzzle-data.js';

export default class RiveHeadboardManager {
    constructor(game) {
        this.game = game;
        this.pendingUpdate = null;
        
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
                    
                    // Set up triggers
                    this.normalTrigger = this.inputs.find(input => input.name === 'Normal');
                    this.happyTrigger = this.inputs.find(input => input.name === 'Happy');
                    this.confusedTrigger = this.inputs.find(input => input.name === 'Confused');
                    this.shockedTrigger = this.inputs.find(input => input.name === 'Shocked');
                    this.largeTextTrigger = this.inputs.find(input => input.name === 'LargeText');
                    
                    // Set initial state
                    if (this.normalTrigger) {
                        this.normalTrigger.fire();
                    }

                    // Apply any pending updates
                    if (this.pendingUpdate) {
                        this.updateTextFields(this.pendingUpdate);
                        this.pendingUpdate = null;
                    } else {
                        // Set initial values if no pending update
                        this.updateTextFields({
                            moves: this.game.moveCount,
                            conflicts: this.game.conflicts
                        });
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
            
            // Update text fields with current values
            this.updateTextFields({
                moves: this.game.moveCount,
                conflicts: this.game.conflicts
            });
            
            if (event.detail.isValid) {
                if (this.happyTrigger) {
                    this.happyTrigger.fire();
                }
            } else {
                if (this.shockedTrigger) {
                    this.shockedTrigger.fire();
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
        // If Rive is not initialized yet, store the update for later
        if (!this.rive) {
            this.pendingUpdate = { moves, conflicts };
            return;
        }

        try {
            // Ensure values are numbers and convert to strings
            const movesText = (moves || 0).toString();
            const conflictsText = (conflicts || 0).toString();
            
            console.log('Setting text values:', { moves: movesText, conflicts: conflictsText });
            
            // Update moves counter
            this.rive.setTextRunValue('TextBox2', movesText);
            
            // Update conflicts counter
            this.rive.setTextRunValue('TextBox1', conflictsText);
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