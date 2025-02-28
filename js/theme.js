/**
 * Theme class for managing the visual appearance of the game
 */
class Theme {
    constructor(name, colors) {
      this.name = name;
      this.colors = {
        background: colors.background || '#f5f5f5',
        surface: colors.surface || '#ffffff',
        primary: colors.primary || '#3498db',
        primaryDark: colors.primaryDark || '#2980b9',
        accent: colors.accent || '#4caf50',
        text: colors.text || '#333333',
        textLight: colors.textLight || '#666666',
        border: colors.border || '#dddddd',
        grid: colors.grid || '#000000',
        gridMinor: colors.gridMinor || '#aaaaaa',
        textInitial: colors.textInitial || '#000000',
        textUser: colors.textUser || '#0000aa',
        notes: colors.notes || '#666666',
        highlight: colors.highlight || 'rgba(173, 216, 230, 0.5)',
        conflict: colors.conflict || 'rgba(255, 0, 0, 0.3)',
        button: colors.button || '#f0f0f0',
        buttonText: colors.buttonText || '#333333',
        buttonActive: colors.buttonActive || '#4caf50',
        buttonActiveText: colors.buttonActiveText || '#ffffff'
      };
    }
    
    /**
     * Apply this theme to the document
     */
    apply() {
      document.documentElement.style.setProperty('--color-background', this.colors.background);
      document.documentElement.style.setProperty('--color-surface', this.colors.surface);
      document.documentElement.style.setProperty('--color-primary', this.colors.primary);
      document.documentElement.style.setProperty('--color-primary-dark', this.colors.primaryDark);
      document.documentElement.style.setProperty('--color-accent', this.colors.accent);
      document.documentElement.style.setProperty('--color-text', this.colors.text);
      document.documentElement.style.setProperty('--color-text-light', this.colors.textLight);
      document.documentElement.style.setProperty('--color-border', this.colors.border);
      document.documentElement.style.setProperty('--color-grid', this.colors.grid);
      document.documentElement.style.setProperty('--color-grid-minor', this.colors.gridMinor);
      document.documentElement.style.setProperty('--color-text-initial', this.colors.textInitial);
      document.documentElement.style.setProperty('--color-text-user', this.colors.textUser);
      document.documentElement.style.setProperty('--color-notes', this.colors.notes);
      document.documentElement.style.setProperty('--color-highlight', this.colors.highlight);
      document.documentElement.style.setProperty('--color-conflict', this.colors.conflict);
      document.documentElement.style.setProperty('--color-button', this.colors.button);
      document.documentElement.style.setProperty('--color-button-text', this.colors.buttonText);
      document.documentElement.style.setProperty('--color-button-active', this.colors.buttonActive);
      document.documentElement.style.setProperty('--color-button-active-text', this.colors.buttonActiveText);
    }
  }
  
  /**
   * Move class for tracking game history
   */
  class Move {
    constructor(row, col, oldValue, newValue, oldNotes) {
      this.row = row;
      this.col = col;
      this.oldValue = oldValue;
      this.newValue = newValue;
      this.oldNotes = new Set(oldNotes);
      this.type = oldValue === 0 && newValue === 0 ? 'note' : 'value';
    }
  }
  
  // Define available themes
  const themes = {
    default: new Theme('Default', {
      // Default theme uses the CSS variables as defined
    }),
    dark: new Theme('Dark', {
      background: '#121212',
      surface: '#1e1e1e',
      primary: '#bb86fc',
      primaryDark: '#9966cc',
      accent: '#03dac6',
      text: '#ffffff',
      textLight: '#bbbbbb',
      border: '#333333',
      grid: '#ffffff',
      gridMinor: '#666666',
      textInitial: '#ffffff',
      textUser: '#bb86fc',
      notes: '#999999',
      highlight: 'rgba(187, 134, 252, 0.3)',
      conflict: 'rgba(255, 0, 0, 0.3)',
      button: '#333333',
      buttonText: '#ffffff',
      buttonActive: '#03dac6',
      buttonActiveText: '#000000'
    })
  };
  
  // Apply default theme
  themes.default.apply();