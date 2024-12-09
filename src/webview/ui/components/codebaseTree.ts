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
    }

    private setupEventListeners() {
        this.includeTreeToggle.addEventListener('change', this.handleToggleChange.bind(this));
        this.treeDepthInput.addEventListener('change', this.handleDepthChange.bind(this));
    }

    private handleToggleChange() {
        this.includeTree = this.includeTreeToggle.checked;
        this.depthControl.style.display = this.includeTree ? 'flex' : 'none';
        if (this.includeTree) {
            this.onTreeConfigChanged(true, this.treeDepth);
        }
        if (this.promptEditor) {
            this.promptEditor.updateTokenCount();
        }
    }

    private handleDepthChange() {
        if (this.includeTree) {
            this.treeDepth = parseInt(this.treeDepthInput.value, 10);
            this.onTreeConfigChanged(true, this.treeDepth);
            if (this.promptEditor) {
                this.promptEditor.updateTokenCount();
            }
        }
    }

    public updateTreeStructure(structure: string) {
        this.treeStructure = structure;
        if (this.promptEditor) {
            this.promptEditor.updateTokenCount();
        }
    }

    public getTreeStructure(): string {
        return this.includeTree ? this.treeStructure : '';
    }

    public setConfig(include: boolean, depth: number) {
        this.includeTree = include;
        this.treeDepth = depth;
        this.includeTreeToggle.checked = include;
        this.treeDepthInput.value = depth.toString();
        this.depthControl.style.display = include ? 'flex' : 'none';
    }

    public isEnabled(): boolean {
        return this.includeTree;
    }

    public getDepth(): number {
        return this.treeDepth;
    }
} 