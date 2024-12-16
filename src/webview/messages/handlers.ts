import { Webview } from "vscode";
import { IncomingMessage, OutgoingMessage } from "./types";
import { FileSelector } from "../ui/components/fileSelector";
import { CodebaseTree } from "../ui/components/codebaseTree";
import { PromptEditor } from "../ui/components/promptEditor";

export class MessageHandler {
    private vscode: Webview;
    private fileSelector: FileSelector;
    private codebaseTree: CodebaseTree;
    private promptEditor: PromptEditor;

    constructor(
        vscode: Webview,
        fileSelector: FileSelector,
        codebaseTree: CodebaseTree,
        promptEditor: PromptEditor,
    ) {
        this.vscode = vscode;
        this.fileSelector = fileSelector;
        this.codebaseTree = codebaseTree;
        this.promptEditor = promptEditor;

        this.setupMessageListener();
    }

    private setupMessageListener() {
        window.addEventListener('message', event => {
            const message = event.data as OutgoingMessage;
            
            switch (message.command) {
                case 'fileTree': {
                    const fileTreeData = {
                        items: message.data,
                        parentPath: ''
                    };
                    this.fileSelector.updateFileList(fileTreeData);
                    break;
                }
                    
                case 'expandDirectory': {
                    const directoryData = {
                        items: message.data.items,
                        parentPath: message.data.parentPath
                    };
                    this.fileSelector.updateFileList(directoryData);
                    break;
                }
                    
                case 'codebaseTree':
                    this.codebaseTree.updateTreeStructure(message.data);
                    if ((document.getElementById('includeTreeToggle') as HTMLInputElement)?.checked) {
                        this.promptEditor.updateContext({
                            files: this.promptEditor.getCurrentContext().files,
                            treeStructure: message.data
                        });
                    }
                    break;
                    
                case 'fileContents': {
                    // Add loading indicators to files being refreshed
                    const selectedFiles = this.fileSelector.getSelectedFiles();
                    selectedFiles.forEach(file => {
                        const fileElement = document.querySelector(`[data-path="${file}"]`);
                        if (fileElement) {
                            fileElement.classList.add('refreshing');
                        }
                    });

                    this.promptEditor.updateContext({
                        files: message.data,
                        treeStructure: this.codebaseTree.getTreeStructure()
                    });

                    // Remove loading indicators
                    selectedFiles.forEach(file => {
                        const fileElement = document.querySelector(`[data-path="${file}"]`);
                        if (fileElement) {
                            fileElement.classList.remove('refreshing');
                        }
                    });
                    break;
                }
            }
        });
    }

    public sendMessage(message: IncomingMessage) {
        this.vscode.postMessage(message);
    }

    public handleDirectoryExpansion(directoryPath: string) {
        this.vscode.postMessage({
            command: 'expandDirectory',
            directoryPath
        });
    }
} 