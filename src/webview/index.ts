// Initialize VSCode API
declare function acquireVsCodeApi(): any;

// Import components and handlers
import { PanelState } from './state/panelState';
import { FileSelector } from './ui/components/fileSelector';
import { CodebaseTree } from './ui/components/codebaseTree';
import { PromptEditor } from './ui/components/promptEditor';
import { PromptLibrary } from './ui/components/promptLibrary';
import { MessageHandler } from './messages/handlers';

// Initialize webview when DOM is ready
window.addEventListener('load', () => {
    try {
        console.log('Initializing webview...');

        // Get VSCode API instance
        const vscode = acquireVsCodeApi();
        
        // Verify DOM elements exist
        const promptInput = document.getElementById('promptInput');
        const contextArea = document.getElementById('contextArea');
        const tokenCount = document.getElementById('tokenCount');

        if (!promptInput || !contextArea || !tokenCount) {
            console.error('Required DOM elements not found:', {
                promptInput: !!promptInput,
                contextArea: !!contextArea,
                tokenCount: !!tokenCount
            });
            return;
        }

        console.log('DOM elements found, initializing components...');

        // Initialize components
        const fileSelector = new FileSelector((files) => {
            // Handle file selection
            console.log('Files selected:', files);
        });

        // First create CodebaseTree
        const codebaseTree = new CodebaseTree(
            (include, depth) => {
                // Handle tree config changes
                console.log('Tree config changed:', { include, depth });
            }
        );

        // Then create PromptEditor with CodebaseTree reference
        const promptEditor = new PromptEditor(
            (prompt) => {
                // Handle prompt changes
                console.log('Prompt changed:', prompt);
            },
            codebaseTree
        );

        // Update CodebaseTree with PromptEditor reference
        codebaseTree['promptEditor'] = promptEditor;

        const promptLibrary = new PromptLibrary({
            onLoad: () => console.log('Loading prompts...'),
            onSave: (name, prompt, files, depth) => console.log('Saving prompt:', name),
            onPromptSelected: (prompt) => console.log('Prompt selected:', prompt)
        });

        // Initialize message handler with components
        const messageHandler = new MessageHandler(
            vscode,
            fileSelector,
            codebaseTree,
            promptEditor,
            promptLibrary
        );

        // Create panel state
        const panelState = new PanelState(vscode);

        console.log('Components initialized successfully');

        // Initial file tree load
        messageHandler.sendMessage({ command: 'getFileTree' });

        // Initial prompts load
        messageHandler.sendMessage({ command: 'loadPrompts' });

    } catch (error) {
        console.error('Failed to initialize webview:', error);
    }
}); 