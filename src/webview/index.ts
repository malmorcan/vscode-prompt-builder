// Initialize VSCode API
declare function acquireVsCodeApi(): any;

// Import panel state
import { PanelState } from './state/panelState';

// Initialize webview when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Get VSCode API instance
        const vscode = acquireVsCodeApi();
        
        // Create panel state
        const panelState = new PanelState(vscode);

        // Initial file tree load
        vscode.postMessage({ command: 'getFileTree' });

        // Initial prompts load
        vscode.postMessage({ command: 'loadPrompts' });
    } catch (error) {
        console.error('Failed to initialize webview:', error);
    }
}); 