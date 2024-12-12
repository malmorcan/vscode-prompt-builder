import { Webview } from "vscode";
import { IncomingMessage, OutgoingMessage } from "./types";
import { FileSelector } from "../ui/components/fileSelector";
import { CodebaseTree } from "../ui/components/codebaseTree";
import { PromptEditor } from "../ui/components/promptEditor";
import { PromptLibrary, SavedPrompt } from "../ui/components/promptLibrary";

export class MessageHandler {
    private vscode: Webview;
    private fileSelector: FileSelector;
    private codebaseTree: CodebaseTree;
    private promptEditor: PromptEditor;
    private promptLibrary: PromptLibrary;

    constructor(
        vscode: Webview,
        fileSelector: FileSelector,
        codebaseTree: CodebaseTree,
        promptEditor: PromptEditor,
        promptLibrary: PromptLibrary
    ) {
        this.vscode = vscode;
        this.fileSelector = fileSelector;
        this.codebaseTree = codebaseTree;
        this.promptEditor = promptEditor;
        this.promptLibrary = promptLibrary;

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
                    break;
                    
                case 'fileContents':
                    this.promptEditor.updateContext({
                        files: message.data,
                        treeStructure: this.codebaseTree.getTreeStructure()
                    });
                    break;
                    
                case 'promptList':
                    this.promptLibrary.updatePromptList(message.data as { [key: string]: SavedPrompt });
                    break;
                    
                case 'promptSaved':
                    if (message.data) {
                        // Could show a success message
                    }
                    break;
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