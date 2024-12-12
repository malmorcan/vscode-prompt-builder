import * as vscode from 'vscode';
import { FileTreeItem, OutgoingMessage } from '../messages/types';

export class PanelState {
    private readonly _webview: vscode.Webview;
    private selectedFiles: Set<string> = new Set();
    private fileContents: { [key: string]: string } = {};
    private treeContent: string = '';
    private cachedFileList: FileTreeItem[] = [];
    private fileListInitialized: boolean = false;

    constructor(webview: vscode.Webview) {
        this._webview = webview;
        this.setupMessageListener();
        // Removed setupEventListeners that handled searching
    }

    private setupMessageListener() {
        window.addEventListener('message', event => {
            const message = event.data as OutgoingMessage;
            
            switch (message.command) {
                case 'fileTree':
                    this.cachedFileList = message.data;
                    // We do not filter or update dropdown here. fileSelector handles it.
                    break;

                case 'fileContents':
                    if (message.data) {
                        this.fileContents = message.data;
                        this.updateSelectedFiles();
                    }
                    break;

                case 'codebaseTree':
                    this.treeContent = message.data;
                    this.updateCodebaseTree();
                    break;

                case 'promptList':
                    this.updatePromptList(message.data);
                    break;
            }
        });
    }

    // No search logic here now

    private updateSelectedFiles() {
        // If needed, update UI here. But fileSelector is responsible for UI of files.
        // This is optional if we rely on fileSelector for selected file display.
    }

    private updateCodebaseTree() {
        const contextArea = document.getElementById('contextArea');
        if (!contextArea || !this.treeContent) return;

        const existingTree = contextArea.querySelector('.context-tree');
        if (existingTree) {
            existingTree.textContent = this.treeContent;
        } else {
            const treeBlock = document.createElement('div');
            treeBlock.className = 'context-tree';
            treeBlock.textContent = this.treeContent;
            contextArea.appendChild(treeBlock);
        }
    }

    private updatePromptList(prompts: { [key: string]: { prompt: string; files: string[] } }) {
        const promptList = document.getElementById('promptList');
        if (!promptList) return;

        promptList.innerHTML = '';
        Object.entries(prompts).forEach(([name, data]) => {
            const li = document.createElement('li');
            li.textContent = name;
            li.onclick = () => {
                const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement;
                if (promptInput) {
                    promptInput.value = data.prompt;
                }
                this.selectedFiles = new Set(data.files);
                this.requestFileContents();
            };
            promptList.appendChild(li);
        });
    }

    private requestFileContents() {
        if (this.selectedFiles.size > 0) {
            this._webview.postMessage({ 
                command: 'getFileContent', 
                files: Array.from(this.selectedFiles)
            });
        }
    }

    public dispose() {
        // Cleanup if needed
    }
}
