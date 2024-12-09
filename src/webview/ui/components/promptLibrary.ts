export interface SavedPrompt {
    prompt: string;
    files: string[];
    depth: number;
}

export interface PromptLibraryCallbacks {
    onLoad: () => void;
    onSave: (name: string, prompt: string, files: string[], depth: number) => void;
    onPromptSelected: (prompt: SavedPrompt) => void;
}

export class PromptLibrary {
    private loadButton!: HTMLButtonElement;
    private saveButton!: HTMLButtonElement;
    private nameInput!: HTMLInputElement;
    private promptList!: HTMLElement;
    private callbacks: PromptLibraryCallbacks;

    constructor(callbacks: PromptLibraryCallbacks) {
        this.callbacks = callbacks;
        this.initializeElements();
        this.setupEventListeners();
    }

    private initializeElements() {
        this.loadButton = document.getElementById('loadPromptsBtn') as HTMLButtonElement;
        this.saveButton = document.getElementById('savePromptBtn') as HTMLButtonElement;
        this.nameInput = document.getElementById('promptNameInput') as HTMLInputElement;
        this.promptList = document.getElementById('promptList') as HTMLElement;
    }

    private setupEventListeners() {
        this.loadButton.addEventListener('click', () => {
            this.callbacks.onLoad();
        });

        this.saveButton.addEventListener('click', () => {
            const name = this.nameInput.value.trim();
            if (!name) return;
            
            this.callbacks.onSave(
                name,
                (document.getElementById('promptInput') as HTMLTextAreaElement)?.value || '',
                [], // This will be filled by the main component
                parseInt((document.getElementById('treeDepth') as HTMLInputElement)?.value || '1', 10)
            );
            
            this.nameInput.value = '';
        });
    }

    public updatePromptList(prompts: { [key: string]: SavedPrompt }) {
        this.promptList.innerHTML = '';
        
        Object.entries(prompts).forEach(([name, prompt]) => {
            const li = document.createElement('li');
            li.textContent = name;
            li.addEventListener('click', () => {
                this.callbacks.onPromptSelected(prompt);
            });
            this.promptList.appendChild(li);
        });
    }
} 