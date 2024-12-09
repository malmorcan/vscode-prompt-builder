export class FileSelector {
    private selectedFiles: string[] = [];
    private allFiles: Array<{name: string, path: string}> = [];
    private fileSearch!: HTMLInputElement;
    private fileDropdown!: HTMLElement;
    private selectedFilesContainer!: HTMLElement;
    private onFilesChanged: (files: string[]) => void;

    constructor(
        onFilesChanged: (files: string[]) => void
    ) {
        this.onFilesChanged = onFilesChanged;
        this.initializeElements();
        this.setupEventListeners();
    }

    private initializeElements() {
        this.fileSearch = document.getElementById('fileSearch') as HTMLInputElement;
        this.fileDropdown = document.getElementById('fileDropdown') as HTMLElement;
        this.selectedFilesContainer = document.getElementById('selectedFiles') as HTMLElement;
    }

    private setupEventListeners() {
        this.fileSearch.addEventListener('input', this.handleSearchInput.bind(this));
        this.fileSearch.addEventListener('focus', this.handleSearchFocus.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    private handleSearchInput(e: Event) {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        const filteredFiles = this.allFiles.filter(file => 
            file.path.toLowerCase().includes(searchTerm)
        );
        this.renderFileDropdown(filteredFiles);
        this.fileDropdown.classList.add('show');
    }

    private handleSearchFocus() {
        this.renderFileDropdown(this.allFiles);
        this.fileDropdown.classList.add('show');
    }

    private handleClickOutside(e: MouseEvent) {
        if (!(e.target as HTMLElement).closest('.file-picker')) {
            this.fileDropdown.classList.remove('show');
        }
    }

    private renderFileDropdown(files: Array<{name: string, path: string}>) {
        this.fileDropdown.innerHTML = '';
        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            
            const iconSpan = document.createElement('span');
            iconSpan.className = 'icon';
            iconSpan.textContent = '📄';
            
            const pathSpan = document.createElement('span');
            pathSpan.textContent = file.path;
            
            item.appendChild(iconSpan);
            item.appendChild(pathSpan);
            
            item.addEventListener('click', () => this.addFile(file.path));
            this.fileDropdown.appendChild(item);
        });
    }

    private renderSelectedFiles() {
        this.selectedFilesContainer.innerHTML = '';
        this.selectedFiles.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'selected-file';
            
            const fileSpan = document.createElement('span');
            fileSpan.textContent = file;
            
            const removeSpan = document.createElement('span');
            removeSpan.className = 'remove';
            removeSpan.textContent = '×';
            removeSpan.addEventListener('click', () => this.removeFile(file));
            
            fileElement.appendChild(fileSpan);
            fileElement.appendChild(removeSpan);
            this.selectedFilesContainer.appendChild(fileElement);
        });
    }

    private addFile(path: string) {
        if (!this.selectedFiles.includes(path)) {
            this.selectedFiles.push(path);
            this.renderSelectedFiles();
            this.fileSearch.value = '';
            this.fileDropdown.classList.remove('show');
            this.onFilesChanged(this.selectedFiles);
        }
    }

    private removeFile(path: string) {
        this.selectedFiles = this.selectedFiles.filter(f => f !== path);
        this.renderSelectedFiles();
        this.onFilesChanged(this.selectedFiles);
    }

    public updateFileList(files: Array<{name: string, path: string}>) {
        this.allFiles = files;
    }

    public getSelectedFiles(): string[] {
        return this.selectedFiles;
    }

    public setSelectedFiles(files: string[]) {
        this.selectedFiles = files;
        this.renderSelectedFiles();
    }
} 