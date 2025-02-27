import { encode } from 'gpt-tokenizer';
import { CodebaseTree } from './codebaseTree';

export interface PromptContext {
    files: { [key: string]: string };
    treeStructure?: string;
}

export class PromptEditor {
    private promptInput: HTMLTextAreaElement;
    private contextArea: HTMLElement;
    private tokenCount: HTMLElement;
    private onPromptChanged: (prompt: string) => void;
    private currentContext: PromptContext = { files: {} };
    private codebaseTree?: CodebaseTree;
    private vscode: any;

    constructor(
        onPromptChanged: (prompt: string) => void,
        codebaseTree?: CodebaseTree,
        vscode?: any
    ) {
        const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement;
        const contextArea = document.getElementById('contextArea') as HTMLElement;
        const tokenCount = document.getElementById('tokenCount') as HTMLElement;

        if (!promptInput || !contextArea || !tokenCount) {
            throw new Error('Required DOM elements not found for PromptEditor');
        }

        this.promptInput = promptInput;
        this.contextArea = contextArea;
        this.tokenCount = tokenCount;
        this.onPromptChanged = onPromptChanged;
        this.codebaseTree = codebaseTree;
        this.vscode = vscode;

        this.setupEventListeners();
        this.updateTokenCount();
    }

    private setupEventListeners() {
        this.promptInput.addEventListener('input', (event) => {
            const value = (event.target as HTMLTextAreaElement).value;
            this.onPromptChanged(value);
            this.updateTokenCount();
        });

        const copyPromptBtn = document.getElementById('copyPromptBtn');
        if (copyPromptBtn) {
            copyPromptBtn.addEventListener('click', () => {
                const finalPrompt = this.buildFinalPrompt();
                if (this.vscode) {
                    this.vscode.postMessage({ 
                        command: 'copyToClipboard', 
                        text: finalPrompt 
                    });
                }
                // Show ephemeral notification in the webview
                const notification = document.getElementById('copyNotification');
                if (notification) {
                    notification.style.display = 'block';
                    // Hide the notification after 2 seconds
                    setTimeout(() => {
                        notification.style.display = 'none';
                    }, 2000);
                }
            });
        }
    }

    private buildFinalPrompt(): string {
        const mainPrompt = this.promptInput.value;
        let finalPrompt = `\n${mainPrompt}\n\n## Related files\n\n`;

        // Add selected files
        const fileEntries = Object.entries(this.currentContext.files);
        for (const [filePath, content] of fileEntries) {
            finalPrompt += `${filePath}:\n\`\`\`\n${content}\n\`\`\`\n\n`;
        }

        // Add codebase tree only if it exists and is enabled
        const includeTreeToggle = document.getElementById('includeTreeToggle') as HTMLInputElement;
        if (includeTreeToggle?.checked && this.currentContext.treeStructure) {
            finalPrompt += `- Codebase Tree:\n${this.currentContext.treeStructure}\n\n`;
        }

        finalPrompt += `\n`;

        return finalPrompt;
    }

    public getPrompt(): string {
        return this.buildFinalPrompt();
    }

    public setPrompt(prompt: string) {
        this.promptInput.value = prompt;
        this.updateTokenCount();
    }

    public updateContext(context: PromptContext) {
        // Preserve existing files but update tree structure
        this.currentContext = {
            files: context.files || this.currentContext.files,
            treeStructure: context.treeStructure // Can be undefined when tree is toggled off
        };
        
        this.updateContextDisplay();
        this.updateTokenCount();
    }

    private updateContextDisplay() {
        this.contextArea.innerHTML = '';
        const fragment = document.createDocumentFragment();

        const fileEntries = Object.entries(this.currentContext.files);
        const maxVisible = 10; // Show first 10 files by default
        let visibleFiles = fileEntries;
        let showMoreBtn: HTMLButtonElement | null = null;

        if (fileEntries.length > maxVisible) {
            visibleFiles = fileEntries.slice(0, maxVisible);

            showMoreBtn = document.createElement('button');
            showMoreBtn.textContent = 'Show More Files';
            showMoreBtn.style.margin = '8px 0';
            showMoreBtn.onclick = () => {
                // Remove old displayed files
                this.contextArea.innerHTML = '';
                const expandedFragment = document.createDocumentFragment();
                fileEntries.forEach(([path, content]) => {
                    expandedFragment.appendChild(this.createFileBlock(path, content));
                });
                if (this.currentContext.treeStructure) {
                    expandedFragment.appendChild(this.createTreeBlock(this.currentContext.treeStructure));
                }
                this.contextArea.appendChild(expandedFragment);
            };
        }

        // Append the visible files first
        visibleFiles.forEach(([path, content]) => {
            fragment.appendChild(this.createFileBlock(path, content));
        });

        // If there's a tree, append it
        if (this.currentContext.treeStructure) {
            fragment.appendChild(this.createTreeBlock(this.currentContext.treeStructure));
        }

        if (showMoreBtn) fragment.appendChild(showMoreBtn);
        this.contextArea.appendChild(fragment);
    }

    private createFileBlock(path: string, content: string): HTMLElement {
        const block = document.createElement('div');
        block.className = 'context-file';

        const header = document.createElement('div');
        header.className = 'file-header';
        header.innerHTML = `<span class="file-icon">📄</span> ${path}`;
        block.appendChild(header);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'file-content';
        // Wrap code in triple backticks
        contentDiv.textContent = `\`\`\`\n${content}\n\`\`\``;
        block.appendChild(contentDiv);
        return block;
    }

    private createTreeBlock(treeContent: string): HTMLElement {
        const treeBlock = document.createElement('div');
        treeBlock.className = 'context-tree';
        
        const header = document.createElement('div');
        header.className = 'tree-header';
        header.innerHTML = '## Codebase Tree';
        treeBlock.appendChild(header);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'tree-content';
        contentDiv.textContent = treeContent;
        treeBlock.appendChild(contentDiv);

        return treeBlock;
    }

    private updateTokenCount() {
        try {
            const fullPrompt = this.buildFinalPrompt();
            const count = encode(fullPrompt).length;
            this.tokenCount.textContent = `${count} tokens`;

            this.tokenCount.classList.remove('warning', 'error');
            if (count > 32000) {
                this.tokenCount.classList.add('error');
            } else if (count > 14000) {
                this.tokenCount.classList.add('warning');
            }
        } catch (error) {
            console.error('Error counting tokens:', error);
            this.tokenCount.textContent = 'Error counting tokens';
            this.tokenCount.classList.add('error');
        }
    }

    public getCurrentContext(): PromptContext {
        return this.currentContext;
    }
}
