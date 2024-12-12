// Initialize VSCode API
declare function acquireVsCodeApi(): any;

import { PanelState } from './state/panelState';
import { FileSelector } from './ui/components/fileSelector';
import { CodebaseTree } from './ui/components/codebaseTree';
import { PromptEditor } from './ui/components/promptEditor';
import { PromptLibrary } from './ui/components/promptLibrary';
import { MessageHandler } from './messages/handlers';

window.addEventListener('load', () => {
    try {
        console.log('Initializing webview...');
        const vscode = acquireVsCodeApi();

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

        const fileSelector = new FileSelector(
            vscode,
            (files: string[]) => {
                console.log('Files selected:', files);
                // When files change, request their content and update prompt editor
                if (files.length > 0) {
                    vscode.postMessage({ 
                        command: 'getFileContent', 
                        files 
                    });
                } else {
                    // If no files selected, clear the context
                    promptEditor.updateContext({
                        files: {},
                        treeStructure: codebaseTree.getTreeStructure()
                    });
                }
            }
        );

        // When tree config changes, we now request the codebase tree from backend
        const codebaseTree = new CodebaseTree(
            (include, depth) => {
                console.log('Tree config changed:', { include, depth });
                if (include) {
                    vscode.postMessage({ command: 'getCodebaseTree', depth });
                }
            }
        );

        const promptEditor = new PromptEditor(
            (prompt) => {
                console.log('Prompt changed:', prompt);
            },
            codebaseTree,
            vscode
        );

        codebaseTree['promptEditor'] = promptEditor;

        const promptLibrary = new PromptLibrary({
            onLoad: () => console.log('Loading prompts...'),
            onSave: (name, prompt, files, depth) => console.log('Saving prompt:', name),
            onPromptSelected: (prompt) => console.log('Prompt selected:', prompt)
        });

        const messageHandler = new MessageHandler(
            vscode,
            fileSelector,
            codebaseTree,
            promptEditor,
            promptLibrary
        );

        const panelState = new PanelState(vscode);

        console.log('Components initialized successfully');

        messageHandler.sendMessage({ command: 'getFileTree' });
        messageHandler.sendMessage({ command: 'loadPrompts' });

        const refreshBtn = document.getElementById('reloadFilesBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // First refresh the file tree
                vscode.postMessage({ command: 'getFileTree' });
                
                // Then refresh content of currently selected files
                const selectedFiles = fileSelector.getSelectedFiles();
                if (selectedFiles.length > 0) {
                    vscode.postMessage({
                        command: 'getFileContent',
                        files: selectedFiles
                    });
                }
            });
        }

    } catch (error) {
        console.error('Failed to initialize webview:', error);
    }
});
