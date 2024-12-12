export class CodebaseTree {
    private includeTree: boolean = false;
    private treeDepth: number = 1;
    private treeStructure: string = '';
    private includeTreeToggle!: HTMLInputElement;
    private depthControl!: HTMLElement;
    private treeDepthInput!: HTMLInputElement;
    private onTreeConfigChanged: (include: boolean, depth: number) => void;
    private promptEditor: any;

    constructor(
        onTreeConfigChanged: (include: boolean, depth: number) => void,
        promptEditor?: any
    ) {
        this.onTreeConfigChanged = onTreeConfigChanged;
        this.promptEditor = promptEditor;
        this.initializeElements();
        this.setupEventListeners();
    }

    private initializeElements() {
        this.includeTreeToggle = document.getElementById('includeTreeToggle') as HTMLInputElement;
        this.depthControl = document.getElementById('depthControl') as HTMLElement;
        this.treeDepthInput = document.getElementById('treeDepth') as HTMLInputElement;

        if (!this.includeTreeToggle || !this.depthControl || !this.treeDepthInput) {
            throw new Error('Required DOM elements not found for CodebaseTree');
        }
    }

    private setupEventListeners() {
        this.includeTreeToggle.addEventListener('change', () => {
            this.includeTree = this.includeTreeToggle.checked;
            this.depthControl.style.display = this.includeTree ? 'flex' : 'none';
            
            if (this.includeTree) {
                this.onTreeConfigChanged(true, this.treeDepth);
            } else {
                if (this.promptEditor) {
                    this.promptEditor.updateContext({
                        files: this.promptEditor.currentContext.files,
                        treeStructure: undefined
                    });
                }
            }
        });

        this.treeDepthInput.addEventListener('change', () => {
            this.treeDepth = parseInt(this.treeDepthInput.value) || 1;
            if (this.includeTree) {
                this.onTreeConfigChanged(true, this.treeDepth);
            }
        });
    }

    public updateTreeStructure(structure: string) {
        console.log('Updating tree structure');
        this.treeStructure = structure;
        
        // If we have a promptEditor reference, trigger a context update
        if (this.promptEditor) {
            this.promptEditor.updateContext({
                files: this.promptEditor.currentContext.files,
                treeStructure: this.includeTree ? structure : undefined
            });
        }
    }

    public getTreeStructure(): string | undefined {
        return this.includeTree ? this.treeStructure : undefined;
    }

    public isTreeIncluded(): boolean {
        return this.includeTree;
    }

    public getTreeDepth(): number {
        return this.treeDepth;
    }
} 