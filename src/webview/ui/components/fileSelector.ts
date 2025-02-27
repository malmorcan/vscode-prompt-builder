export interface FileTreeItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    hasChildren?: boolean;
    children?: FileTreeItem[];
    expanded?: boolean;
}

export class FileSelector {
    private fileSearch!: HTMLInputElement;
    private fileDropdown!: HTMLElement;
    private selectedFiles!: HTMLElement;
    private onFilesChanged: (files: string[]) => void;
    private fileList: { [key: string]: FileTreeItem[] } = {};
    private selectedFilePaths: Set<string> = new Set();
    private expandedDirectories: Set<string> = new Set();
    private vscode: any;

    private lastQuery: string = '';
    private lastResults: FileTreeItem[] = [];
    private MAX_RESULTS = 500;

    // To handle async loading of directories
    private loadingPromises: Map<string, Promise<void>> = new Map();
    private loadingResolvers: Map<string, () => void> = new Map();
    
    constructor(vscode: any, onFilesChanged: (files: string[]) => void) {
        this.vscode = vscode;
        this.onFilesChanged = onFilesChanged;
        this.initializeElements();
        this.setupEventListeners();

        const state = this.vscode.getState() || {};
        if (state.selectedFilePaths) {
            this.selectedFilePaths = new Set(state.selectedFilePaths);
            this.updateSelectedFiles();
        }
    }

    private initializeElements() {
        this.fileSearch = document.getElementById('fileSearch') as HTMLInputElement;
        this.fileDropdown = document.getElementById('fileDropdown') as HTMLElement;
        this.selectedFiles = document.getElementById('selectedFiles') as HTMLElement;

        if (!this.fileSearch || !this.fileDropdown || !this.selectedFiles) {
            throw new Error('Required DOM elements not found for FileSelector');
        }

        // Add a close button and a loader container to the dropdown
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.padding = '4px';
        headerDiv.style.borderBottom = '1px solid var(--vscode-dropdown-border)';

        // Add expand/collapse toggle button
        const toggleExpandButton = document.createElement('button');
        toggleExpandButton.id = 'toggleExpandBtn';
        toggleExpandButton.textContent = '📂 Collapse All';
        toggleExpandButton.style.fontSize = '12px';
        toggleExpandButton.style.padding = '2px 6px';
        toggleExpandButton.style.marginRight = '5px';
        
        // By default, everything is expanded, so button starts in "Collapse All" mode
        let allExpanded = true;
        
        toggleExpandButton.onclick = () => {
            if (allExpanded) {
                this.collapseAllDirectories();
                toggleExpandButton.textContent = '📁 Expand All';
            } else {
                this.expandAllDirectories();
                toggleExpandButton.textContent = '📂 Collapse All';
            }
            allExpanded = !allExpanded;
        };

        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.fontSize = '12px';
        closeButton.style.padding = '2px 6px';
        closeButton.onclick = () => {
            this.hideDropdown();
        };

        const loaderSpan = document.createElement('span');
        loaderSpan.id = 'dropdownLoader';
        loaderSpan.style.display = 'none';
        loaderSpan.style.fontSize = '12px';
        loaderSpan.style.color = 'var(--vscode-foreground)';
        loaderSpan.textContent = 'Loading...';

        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.appendChild(toggleExpandButton);
        buttonGroup.appendChild(closeButton);

        headerDiv.appendChild(loaderSpan);
        headerDiv.appendChild(buttonGroup);
        this.fileDropdown.appendChild(headerDiv);
    }

    private setupEventListeners() {
        this.fileSearch.addEventListener('input', () => {
            this.lastQuery = this.fileSearch.value;
            this.lastResults = this.filterFiles(this.lastQuery);
            this.updateDropdown(this.lastResults);
        });

        this.fileSearch.addEventListener('focus', () => {
            if (this.lastQuery === this.fileSearch.value) {
                this.updateDropdown(this.lastResults);
            } else {
                this.lastQuery = this.fileSearch.value;
                this.lastResults = this.filterFiles(this.lastQuery);
                this.updateDropdown(this.lastResults);
            }
            this.showDropdown();
        });
    }

    private filterFiles(query: string): FileTreeItem[] {
        if (!query) {
            return this.fileList[''] || [];
        }

        const lowerQuery = query.toLowerCase();
        const results: FileTreeItem[] = [];
        const selectedPaths = this.selectedFilePaths;

        let count = 0;
        const searchItems = (items: FileTreeItem[]) => {
            for (const item of items) {
                if (count >= this.MAX_RESULTS) return;
                if (item.type === 'file' && selectedPaths.has(item.path)) {
                    continue;
                }
                if (item.path.toLowerCase().includes(lowerQuery)) {
                    results.push(item);
                    count++;
                    if (count >= this.MAX_RESULTS) return;
                }
                if (item.children && item.children.length > 0) {
                    searchItems(item.children);
                    if (count >= this.MAX_RESULTS) return;
                }
            }
        };

        searchItems(this.fileList[''] || []);
        return results;
    }

    private showDropdown() {
        this.fileDropdown.style.display = 'block';
    }

    private hideDropdown() {
        this.fileDropdown.style.display = 'none';
    }

    private updateDropdown(items: FileTreeItem[]) {
        // Clear existing items except header
        const children = Array.from(this.fileDropdown.children).slice(1);
        for (const child of children) {
            child.remove();
        }

        const fragment = document.createDocumentFragment();
        
        items.forEach(item => {
            const div = this.createFileListItem(item);
            fragment.appendChild(div);
            
            // If directory is expanded, also add its children
            if (item.type === 'directory' && 
                this.expandedDirectories.has(item.path) && 
                this.fileList[item.path]) {
                
                const childrenFragment = this.createChildrenElements(
                    this.fileList[item.path], 
                    item.path
                );
                fragment.appendChild(childrenFragment);
            }
        });
        
        this.fileDropdown.appendChild(fragment);

        if (items.length > 0) {
            this.showDropdown();
        } else {
            this.hideDropdown();
        }
    }

    private createChildrenElements(items: FileTreeItem[], parentPath: string): DocumentFragment {
        const fragment = document.createDocumentFragment();
        
        items.forEach(item => {
            // Ensure each item correctly knows its position in the hierarchy
            const div = this.createFileListItem(item);
            fragment.appendChild(div);
            
            // Recursively add children of expanded directories
            if (item.type === 'directory' && 
                this.expandedDirectories.has(item.path) && 
                this.fileList[item.path]) {
                
                const childrenFragment = this.createChildrenElements(
                    this.fileList[item.path], 
                    item.path
                );
                fragment.appendChild(childrenFragment);
            }
        });
        
        return fragment;
    }

    private createFileListItem(item: FileTreeItem): HTMLElement {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
        div.dataset.path = item.path;
        div.dataset.type = item.type;

        // Fix depth calculation by handling both '/' and '\' path separators
        const pathParts = item.path.split(/[/\\]/);
        const depth = pathParts.length - (pathParts[0] === '' ? 0 : 1);
        
        // Apply indentation based on depth
        div.style.paddingLeft = `${(depth + 1) * 16}px`; // Slightly reduced indent for more items

        const icon = document.createElement('span');
        icon.className = 'item-icon';
        icon.textContent = item.type === 'directory'
            ? (this.expandedDirectories.has(item.path) ? '📂 ' : '📁 ')
            : '📄 ';
        div.appendChild(icon);

        const name = document.createElement('span');
        name.textContent = item.name;
        div.appendChild(name);

        // Add tooltip indicating action
        div.title = item.type === 'directory' ? 'Click to expand directory' : 'Click to select file';

        // Remaining code for directory/file click handlers...
        if (item.type === 'directory') {
            // Directory click handlers...
            div.onclick = async (e) => {
                e.stopPropagation();
                await this.handleDirectoryClick(item);
            };

            if (item.hasChildren) {
                const selectAll = document.createElement('button');
                selectAll.className = 'select-all-btn';
                selectAll.textContent = 'Select All';
                selectAll.onclick = async (e) => {
                    e.stopPropagation();
                    await this.startSelectAllDirectory(item.path);
                };
                div.appendChild(selectAll);
            }
        } else {
            div.onclick = (e) => {
                e.stopPropagation();
                this.selectFile(item.path);
            };

            if (this.selectedFilePaths.has(item.path)) {
                div.classList.add('selected');
            }
        }

        return div;
    }

    private async startSelectAllDirectory(directoryPath: string) {
        const loaderSpan = document.getElementById('dropdownLoader');
        if (loaderSpan) {
            loaderSpan.style.display = 'inline';  // Show loading indicator
        }

        await this.fullyLoadDirectory(directoryPath); 
        this.doSelectAllDirectory(directoryPath);

        if (loaderSpan) {
            loaderSpan.style.display = 'none'; // Hide loading indicator
        }
    }

    private doSelectAllDirectory(directoryPath: string) {
        const allFiles = this.getAllFilesInDirectory(directoryPath);
        for (const file of allFiles) {
            this.selectFile(file, false);
        }
        this.updateSelectedFiles();
        this.vscode.postMessage({
            command: 'getFileContent',
            files: Array.from(this.selectedFilePaths)
        });
    }

    // Fully load a directory and all its subdirectories
    private async fullyLoadDirectory(directoryPath: string): Promise<void> {
        // If directory not loaded, load it
        if (!this.fileList[directoryPath]) {
            await this.loadDirectory(directoryPath);
        }

        // Now load all child directories recursively
        const items = this.fileList[directoryPath] || [];
        const subdirs = items.filter(i => i.type === 'directory' && i.hasChildren);
        for (const dirItem of subdirs) {
            // If not loaded, load it
            await this.fullyLoadDirectory(dirItem.path);
        }
    }

    private async loadDirectory(directoryPath: string): Promise<void> {
        // If we already loaded this directory, no need to load again
        if (this.fileList[directoryPath]) return;

        // If there's already a loading promise, wait for it
        if (this.loadingPromises.has(directoryPath)) {
            return this.loadingPromises.get(directoryPath)!;
        }

        // Create a new promise that resolves when directory is expanded
        const promise = new Promise<void>((resolve) => {
            this.loadingResolvers.set(directoryPath, resolve);
        });
        this.loadingPromises.set(directoryPath, promise);

        // Request directory expansion
        this.expandedDirectories.add(directoryPath);
        this.vscode.postMessage({
            command: 'expandDirectory',
            directoryPath
        });

        // Wait for resolution in updateFileList
        return promise;
    }

    private async handleDirectoryClick(directory: FileTreeItem) {
        const isExpanded = this.expandedDirectories.has(directory.path);
        
        if (isExpanded) {
            this.expandedDirectories.delete(directory.path);
            // If we collapse, we do not remove from fileList to avoid losing data, just show fewer results
        } else {
            if (!this.fileList[directory.path]) {
                await this.loadDirectory(directory.path);
            } else {
                this.expandedDirectories.add(directory.path);
            }
        }

        if (this.lastQuery) {
            this.lastResults = this.filterFiles(this.lastQuery);
            this.updateDropdown(this.lastResults);
        } else {
            this.updateDropdown(this.fileList[''] || []);
        }
    }

    private selectFile(path: string, updateUI: boolean = true) {
        if (!this.selectedFilePaths.has(path)) {
            this.selectedFilePaths.add(path);
            if (updateUI) {
                this.updateSelectedFiles();
                this.vscode.postMessage({
                    command: 'getFileContent',
                    files: Array.from(this.selectedFilePaths)
                });
            }
            this.saveState();
        }
    }

    private updateSelectedFiles() {
        this.selectedFiles.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const selectedArray = Array.from(this.selectedFilePaths);
        const maxVisible = 10;
        let visibleFiles = selectedArray;
        let showMoreBtn: HTMLButtonElement | null = null;

        if (selectedArray.length > maxVisible) {
            visibleFiles = selectedArray.slice(0, maxVisible);
            showMoreBtn = document.createElement('button');
            showMoreBtn.textContent = 'Show More Selected Files';
            showMoreBtn.style.margin = '8px 0';
            showMoreBtn.onclick = () => {
                this.selectedFiles.innerHTML = '';
                const expandedFragment = document.createDocumentFragment();
                selectedArray.forEach(path => expandedFragment.appendChild(this.createSelectedFileElement(path)));
                this.selectedFiles.appendChild(expandedFragment);
            };
        }

        visibleFiles.forEach(path => fragment.appendChild(this.createSelectedFileElement(path)));

        if (showMoreBtn) fragment.appendChild(showMoreBtn);
        this.selectedFiles.appendChild(fragment);
    }

    private createSelectedFileElement(path: string): HTMLElement {
        const div = document.createElement('div');
        div.className = 'selected-file';
        
        const icon = document.createElement('span');
        icon.className = 'item-icon';
        icon.textContent = '📄 ';
        div.appendChild(icon);
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = path;
        div.appendChild(nameSpan);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file';
        removeBtn.textContent = '✕';
        removeBtn.onclick = () => {
            this.selectedFilePaths.delete(path);
            this.updateSelectedFiles();
            // Important: Notify that files have changed
            this.onFilesChanged(Array.from(this.selectedFilePaths));
            this.saveState();
        };
        div.appendChild(removeBtn);

        return div;
    }

    private getAllFilesInDirectory(directoryPath: string): string[] {
        const files: string[] = [];
        const items = this.fileList[directoryPath] || [];
        
        for (const item of items) {
            if (item.type === 'file') {
                files.push(item.path);
            } else if (item.type === 'directory' && this.fileList[item.path]) {
                files.push(...this.getAllFilesInDirectory(item.path));
            }
        }
        
        return files;
    }

    private saveState() {
        const state = this.vscode.getState() || {};
        this.vscode.setState({ ...state, selectedFilePaths: Array.from(this.selectedFilePaths) });
    }

    public updateFileList(data: { items: FileTreeItem[], parentPath: string }) {
        // Store current selection
        const currentSelection = new Set(this.selectedFilePaths);
        
        // Update the directory children
        const parentPath = data.parentPath;
        if (!this.fileList[parentPath]) {
            this.fileList[parentPath] = data.items;
        } else {
            // Merge or replace existing data
            this.fileList[parentPath] = data.items;
        }

        if (this.lastQuery) {
            this.lastResults = this.filterFiles(this.lastQuery);
            this.updateDropdown(this.lastResults);
        } else {
            this.updateDropdown(this.fileList[''] || []);
        }

        // Restore selection
        this.selectedFilePaths = currentSelection;
        this.updateSelectedFiles();

        // If we were waiting on a directory load, resolve it now
        const resolver = this.loadingResolvers.get(parentPath);
        if (resolver) {
            resolver();
            this.loadingResolvers.delete(parentPath);
            this.loadingPromises.delete(parentPath);
        }
    }

    public clearAllSelectedFiles() {
    this.selectedFilePaths.clear();
    this.updateSelectedFiles();
    this.onFilesChanged(Array.from(this.selectedFilePaths));
    this.saveState();
    }

    // Add new method to get selected files
    public getSelectedFiles(): string[] {
        return Array.from(this.selectedFilePaths);
    }

    private renderFileTree(files: any[]) {
        const dropdown = document.getElementById('fileDropdown');
        if (!dropdown) return;
        
        dropdown.innerHTML = '';
        
        // Render each file in the tree with all directories expanded
        files.forEach(file => {
            this.renderFileItem(file, dropdown, 0, true); // Set the last parameter to true to expand all
        });
    }

    private renderFileItem(file: any, container: HTMLElement, level: number, expandAll: boolean = false) {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.style.paddingLeft = `${level * 20}px`;
        
        // Create the file item content
        const content = document.createElement('div');
        content.className = 'file-content';
        
        if (file.type === 'directory') {
            // For directories, add expand/collapse functionality
            const icon = document.createElement('span');
            icon.className = expandAll ? 'folder-icon expanded' : 'folder-icon';
            icon.innerText = expandAll ? '📂' : '📁';
            content.appendChild(icon);
            
            const name = document.createElement('span');
            name.className = 'file-name';
            name.innerText = file.name;
            content.appendChild(name);
            
            item.appendChild(content);
            container.appendChild(item);
            
            // Create a container for children
            const childContainer = document.createElement('div');
            childContainer.className = 'file-children';
            childContainer.style.display = expandAll ? 'block' : 'none';
            
            // Recursively render children if they exist
            if (file.children && file.children.length > 0) {
                file.children.forEach((child: any) => {
                    this.renderFileItem(child, childContainer, level + 1, expandAll);
                });
            }
            
            // Add click handler to toggle visibility
            content.addEventListener('click', () => {
                // Toggle expanded state
                const isExpanded = icon.classList.contains('expanded');
                icon.classList.toggle('expanded');
                icon.innerText = isExpanded ? '📁' : '📂';
                childContainer.style.display = isExpanded ? 'none' : 'block';
            });
            
            container.appendChild(childContainer);
        } else {
            // For files, add selection functionality
            const icon = document.createElement('span');
            icon.className = 'file-icon';
            icon.innerText = '📄';
            content.appendChild(icon);
            
            const name = document.createElement('span');
            name.className = 'file-name';
            name.innerText = file.name;
            content.appendChild(name);
            
            // Add click handler to select file
            item.addEventListener('click', () => {
                // Use selectFile method instead of toggleFileSelection
                this.selectFile(file.path);
            });
            
            // Mark as selected if it's in the selectedFilePaths
            if (this.selectedFilePaths.has(file.path)) {
                item.classList.add('selected');
            }
            
            item.appendChild(content);
            container.appendChild(item);
        }
    }

    // Add a method to load the initial file tree with all directories expanded
    public loadInitialFileTree(files: FileTreeItem[]) {
        // Store the full file tree in the root level
        this.fileList[''] = files;
        
        // Pre-populate the expanded directories set with all directory paths
        const populateExpanded = (items: FileTreeItem[], parentPath: string = '') => {
            for (const item of items) {
                if (item.type === 'directory') {
                    this.expandedDirectories.add(item.path);
                    // Also create an entry in the fileList for this directory
                    if (item.children) {
                        this.fileList[item.path] = item.children;
                        populateExpanded(item.children, item.path);
                    }
                }
            }
        };
        
        populateExpanded(files);
        
        // Update the dropdown with the root level files
        this.updateDropdown(files);
        this.showDropdown();
    }

    // Add methods to expand and collapse all directories
    private expandAllDirectories() {
        // Pre-populate the expanded directories set with all directory paths
        const populateExpanded = (items: FileTreeItem[]) => {
            for (const item of items) {
                if (item.type === 'directory') {
                    this.expandedDirectories.add(item.path);
                    if (item.children) {
                        populateExpanded(item.children);
                    }
                }
            }
        };
        
        populateExpanded(this.fileList[''] || []);
        
        // Refresh the current view
        if (this.lastQuery) {
            this.lastResults = this.filterFiles(this.lastQuery);
            this.updateDropdown(this.lastResults);
        } else {
            this.updateDropdown(this.fileList[''] || []);
        }
    }

    private collapseAllDirectories() {
        // Clear all expanded directories except the root
        this.expandedDirectories.clear();
        
        // Refresh the current view
        if (this.lastQuery) {
            this.lastResults = this.filterFiles(this.lastQuery);
            this.updateDropdown(this.lastResults);
        } else {
            this.updateDropdown(this.fileList[''] || []);
        }
    }
}
