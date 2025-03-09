# Sudoku Game Terminology

## Game Elements

### Board Elements
- **Cell**: A single square in the Sudoku grid that can contain a number from 1-9
- **Initial Cell**: A pre-filled cell that cannot be modified (shown with grey background)
- **Player Cell**: A cell filled in by the player (shown with blue numbers)
- **Selected Cell**: The currently active cell highlighted by the player (shown with light blue background)
- **Conflict Cell**: A cell that violates Sudoku rules (shown with red background)
- **Empty Cell**: A cell that hasn't been filled yet
- **Notes**: Small numbers in a cell indicating possible values (up to 9 per cell)

### Interface Elements
- **Game Container**: The white rectangular container holding all game elements
- **Input Numbers**: The row of buttons (1-9) for entering numbers
- **Control Buttons**: The row of action buttons (Notes, Hint, Undo)
- **Game Stats**: The area showing Timer and Move Counter

### Game States
- **Note Mode**: When active, clicking a number adds/removes it as a note in the selected cell
- **Normal Mode**: When active, clicking a number fills the selected cell with that number
- **Conflict State**: When a number placement violates Sudoku rules
- **Complete State**: When all cells are filled correctly according to Sudoku rules

## Technical Terms

### Components
- **Board Renderer**: The component responsible for drawing the Sudoku board on canvas
- **Game Controller**: The component handling user interactions and game flow
- **Game Logic**: The component managing game rules and state

### Visual Elements
- **Grid Lines**: The lines separating cells (thin) and blocks (thick) on the board
- **Block**: A 3x3 section of the board (9 cells)
- **Row**: A horizontal line of 9 cells
- **Column**: A vertical line of 9 cells

### Interactions
- **Cell Selection**: The action of clicking/tapping a cell to make it active
- **Number Input**: The action of entering a number (via buttons or keyboard)
- **Note Taking**: The action of adding small numbers as possible values
- **Hint Request**: The action of asking for a correct number suggestion
- **Undo Action**: The action of reverting the last move

## CSS Variables
- `--container-width`: Width of the game container (375px)
- `--board-size`: Size of the Sudoku board (349px)
- `--spacing-md`: Standard padding (13px)
- `--color-game-container`: Game container background color
- `--color-background`: Page background color

## File Structure
- `index.html`: Main HTML file
- `styles.css`: All game styles
- `sudoku-game.js`: Game logic implementation
- `sudoku-board-renderer.js`: Canvas rendering logic
- `sudoku-controller.js`: User interaction handling
- `app.js`: Application initialization