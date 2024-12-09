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

    constructor(
        onPromptChanged: (prompt: string) => void,
        codebaseTree?: CodebaseTree
    ) {
        console.log('Initializing PromptEditor...');
        
        // Get DOM elements
        const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement;
        const contextArea = document.getElementById('contextArea') as HTMLElement;
        const tokenCount = document.getElementById('tokenCount') as HTMLElement;

        // Validate DOM elements
        if (!promptInput || !contextArea || !tokenCount) {
            throw new Error('Required DOM elements not found for PromptEditor');
        }

        this.promptInput = promptInput;
        this.contextArea = contextArea;
        this.tokenCount = tokenCount;
        this.onPromptChanged = onPromptChanged;
        this.codebaseTree = codebaseTree;

        console.log('PromptEditor elements initialized');
        
        this.setupEventListeners();
        this.updateTokenCount(); // Initial token count
    }

    private setupEventListeners() {
        console.log('Setting up PromptEditor event listeners');
        
        this.promptInput.addEventListener('input', (event) => {
            const value = (event.target as HTMLTextAreaElement).value;
            console.log('Prompt input changed:', value.slice(0, 50) + '...');
            this.onPromptChanged(value);
            this.updateTokenCount();
        });
    }

    public getPrompt(): string {
        return this.promptInput.value;
    }

    public setPrompt(prompt: string) {
        console.log('Setting prompt:', prompt.slice(0, 50) + '...');
        this.promptInput.value = prompt;
        this.updateTokenCount();
    }

    public updateContext(context: PromptContext) {
        console.log('Updating context:', {
            fileCount: Object.keys(context.files).length,
            hasTree: !!context.treeStructure
        });

        // Store the current context
        this.currentContext = { ...context };
        
        this.contextArea.innerHTML = '';
        
        // Add file contents
        Object.entries(context.files).forEach(([path, content]) => {
            const block = document.createElement('div');
            block.className = 'context-file';
            block.textContent = `File: ${path}\n${content.slice(0, 200)}${content.length > 200 ? '...' : ''}`;
            this.contextArea.appendChild(block);
        });

        // Get tree structure from CodebaseTree if available
        const treeStructure = this.codebaseTree?.getTreeStructure();
        if (treeStructure) {
            const treeBlock = document.createElement('div');
            treeBlock.className = 'context-tree';
            treeBlock.textContent = treeStructure;
            this.contextArea.appendChild(treeBlock);
        }

        this.updateTokenCount();
    }

    public buildFinalPrompt(context: PromptContext): string {
        let finalPrompt = this.promptInput.value;
        const hasFiles = Object.keys(context.files).length > 0;
        const treeStructure = this.codebaseTree?.getTreeStructure();
        
        if (hasFiles || treeStructure) {
            finalPrompt += '\n\n[Context]\n';
            
            // Add file contents
            Object.entries(context.files).forEach(([path, content]) => {
                finalPrompt += `\nFile: ${path}\nContent:\n${content}\n`;
            });
            
            // Add tree structure if available and enabled
            if (treeStructure) {
                finalPrompt += '\n[Codebase Tree]\n' + treeStructure + '\n';
            }
            
            finalPrompt += '\n[End of Context]';
        }
        
        return finalPrompt;
    }

    private updateTokenCount() {
        try {
            // Get the complete prompt with current context
            const finalPrompt = this.buildFinalPrompt(this.currentContext);
            console.log('Updating token count for prompt:', finalPrompt.slice(0, 50) + '...');

            // Count tokens using gpt-tokenizer
            const tokens = encode(finalPrompt);
            const tokenCount = tokens.length;
            console.log('Token count:', tokenCount);

            // Update token count display with more detail
            this.tokenCount.textContent = `${tokenCount.toLocaleString()} tokens`;

            // Remove existing classes
            this.tokenCount.classList.remove('warning', 'error');

            // Add appropriate class based on token count
            // GPT-4 limits: warning at 14k, error at 32k
            if (tokenCount > 32000) {
                this.tokenCount.classList.add('error');
            } else if (tokenCount > 14000) {
                this.tokenCount.classList.add('warning');
            }
        } catch (error) {
            console.error('Error counting tokens:', error);
            this.tokenCount.textContent = 'Error counting tokens';
            this.tokenCount.classList.add('error');
        }
    }
} 