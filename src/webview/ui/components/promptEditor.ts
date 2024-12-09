export interface PromptContext {
    files: { [key: string]: string };
    treeStructure?: string;
}

export class PromptEditor {
    private promptInput!: HTMLTextAreaElement;
    private contextArea!: HTMLElement;
    private tokenCount!: HTMLElement;
    private onPromptChanged: (prompt: string) => void;

    constructor(onPromptChanged: (prompt: string) => void) {
        this.onPromptChanged = onPromptChanged;
        this.initializeElements();
        this.setupEventListeners();
    }

    private initializeElements() {
        this.promptInput = document.getElementById('promptInput') as HTMLTextAreaElement;
        this.contextArea = document.getElementById('contextArea') as HTMLElement;
        this.tokenCount = document.getElementById('tokenCount') as HTMLElement;
    }

    private setupEventListeners() {
        this.promptInput.addEventListener('input', () => {
            this.onPromptChanged(this.promptInput.value);
            this.updateTokenCount();
        });
    }

    public getPrompt(): string {
        return this.promptInput.value;
    }

    public setPrompt(prompt: string) {
        this.promptInput.value = prompt;
        this.updateTokenCount();
    }

    public updateContext(context: PromptContext) {
        this.contextArea.innerHTML = '';
        
        // Add file contents
        Object.entries(context.files).forEach(([path, content]) => {
            const block = document.createElement('div');
            block.className = 'context-file';
            block.textContent = `File: ${path}\n${content.slice(0, 200)}${content.length > 200 ? '...' : ''}`;
            this.contextArea.appendChild(block);
        });

        this.updateTokenCount();
    }

    public buildFinalPrompt(context: PromptContext): string {
        let finalPrompt = this.promptInput.value + '\\n\\n[Context]\\n';
        
        // Add file contents
        Object.entries(context.files).forEach(([path, content]) => {
            finalPrompt += `\\nFile: ${path}\\nContent:\\n${content}\\n`;
        });
        
        // Add tree structure if available
        if (context.treeStructure) {
            finalPrompt += '\\n[Codebase Tree]\\n' + context.treeStructure + '\\n';
        }
        
        finalPrompt += '\\n[End of Context]';
        
        return finalPrompt;
    }

    private updateTokenCount() {
        // Simple token approximation
        const text = this.promptInput.value;
        const tokens = text.split(/\\s+/).length;
        this.tokenCount.textContent = tokens.toString();
    }
} 