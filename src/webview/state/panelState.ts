import { IncomingMessage, OutgoingMessage, FileTreeItem } from '../messages/types';

export class PanelState {
    private vscode: any;
    private fileContents: { [key: string]: string } = {};
    private treeContent: string = '';

    constructor(vscode: any) {
        this.vscode = vscode;
        this.setupEventListeners();
        this.setupMessageHandler();
    }

    private setupMessageHandler() {
        window.addEventListener('message', (event) => {
            const message = event.data as OutgoingMessage;
            switch (message.command) {
                case 'fileTree':
                    this.updateFileList(message.data);
                    break;
                case 'codebaseTree':
                    this.treeContent = message.data;
                    this.updateCodebaseTree(message.data);
                    break;
                case 'fileContents':
                    this.fileContents = message.data;
                    this.updateFileContents(message.data);
                    break;
                case 'promptList':
                    this.updatePromptList(message.data);
                    break;
                case 'promptSaved':
                    if (message.data) {
                        // Clear input after successful save
                        const nameInput = document.getElementById('promptNameInput') as HTMLInputElement;
                        if (nameInput) nameInput.value = '';
                    }
                    break;
            }
        });
    }

    private buildFinalPrompt(): string {
        const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement;
        let finalPrompt = promptInput?.value || '';

        // Add selected files content
        const selectedFiles = Array.from(document.querySelectorAll('.selected-file'))
            .map(el => el.getAttribute('data-path'))
            .filter((path): path is string => path !== null);

        if (selectedFiles.length > 0) {
            finalPrompt += '\n\n[Selected Files]\n';
            selectedFiles.forEach(path => {
                if (this.fileContents[path]) {
                    finalPrompt += `\nFile: ${path}\nContent:\n${this.fileContents[path]}\n`;
                }
            });
        }

        // Add codebase tree if enabled
        const treeToggle = document.getElementById('includeTreeToggle') as HTMLInputElement;
        if (treeToggle?.checked && this.treeContent) {
            finalPrompt += '\n\n[Codebase Tree]\n' + this.treeContent;
        }

        return finalPrompt;
    }

    private updateFileList(files: FileTreeItem[]) {
        const dropdown = document.getElementById('fileDropdown');
        const searchInput = document.getElementById('fileSearch') as HTMLInputElement;
        if (!dropdown || !searchInput) return;

        const searchTerm = searchInput.value.toLowerCase();
        const filteredFiles = files.filter(file => 
            file.name.toLowerCase().includes(searchTerm) || 
            file.path.toLowerCase().includes(searchTerm)
        );

        dropdown.innerHTML = '';
        filteredFiles.forEach(file => {
            const div = document.createElement('div');
            div.className = 'file-item';
            div.textContent = file.path;
            div.addEventListener('click', () => this.addSelectedFile(file));
            dropdown.appendChild(div);
        });

        // Only show dropdown if input is focused and we have results
        if (document.activeElement === searchInput && filteredFiles.length > 0) {
            dropdown.style.display = 'block';
        } else {
            dropdown.style.display = 'none';
        }
    }

    private addSelectedFile(file: FileTreeItem) {
        const selectedFiles = document.getElementById('selectedFiles');
        const dropdown = document.getElementById('fileDropdown');
        if (!selectedFiles || !dropdown) return;

        // Check if file is already selected
        if (!selectedFiles.querySelector(`[data-path="${file.path}"]`)) {
            const div = document.createElement('div');
            div.className = 'selected-file';
            div.setAttribute('data-path', file.path);
            
            const span = document.createElement('span');
            span.textContent = file.path;
            div.appendChild(span);

            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.className = 'remove-file';
            removeBtn.addEventListener('click', () => {
                div.remove();
                // Request updated file contents when removing a file
                this.requestSelectedFilesContent();
            });
            div.appendChild(removeBtn);

            selectedFiles.appendChild(div);
            // Request file contents when adding a file
            this.requestSelectedFilesContent();
        }

        // Clear search and hide dropdown
        const searchInput = document.getElementById('fileSearch') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        dropdown.style.display = 'none';
    }

    private requestSelectedFilesContent() {
        const selectedFiles = Array.from(document.querySelectorAll('.selected-file'))
            .map(el => el.getAttribute('data-path'))
            .filter((path): path is string => path !== null);
        
        if (selectedFiles.length > 0) {
            this.vscode.postMessage({ command: 'getFileContent', files: selectedFiles });
        }
    }

    private updateCodebaseTree(treeContent: string) {
        const contextArea = document.getElementById('contextArea');
        if (!contextArea) return;

        const treeSection = document.createElement('div');
        treeSection.className = 'tree-section';
        treeSection.innerHTML = `<pre>${treeContent}</pre>`;

        // Replace existing tree section or add new one
        const existingTree = contextArea.querySelector('.tree-section');
        if (existingTree) {
            contextArea.replaceChild(treeSection, existingTree);
        } else {
            contextArea.appendChild(treeSection);
        }
    }

    private updateFileContents(contents: { [key: string]: string }) {
        const contextArea = document.getElementById('contextArea');
        if (!contextArea) return;

        // Remove existing file contents
        const existingContents = contextArea.querySelectorAll('.file-content');
        existingContents.forEach(el => el.remove());

        // Add new file contents
        Object.entries(contents).forEach(([path, content]) => {
            const div = document.createElement('div');
            div.className = 'file-content';
            div.innerHTML = `
                <h3>${path}</h3>
                <pre>${this.escapeHtml(content)}</pre>
            `;
            contextArea.appendChild(div);
        });
    }

    private updatePromptList(prompts: { [key: string]: { prompt: string; files: string[] } }) {
        const promptList = document.getElementById('promptList');
        if (!promptList) return;

        promptList.innerHTML = '';
        Object.entries(prompts).forEach(([name, data]) => {
            const li = document.createElement('li');
            li.textContent = name;
            li.addEventListener('click', () => {
                const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement;
                if (promptInput) promptInput.value = data.prompt;

                // Clear and re-add selected files
                const selectedFiles = document.getElementById('selectedFiles');
                if (selectedFiles) {
                    selectedFiles.innerHTML = '';
                    data.files.forEach(path => {
                        this.addSelectedFile({ name: path.split('/').pop() || '', path });
                    });
                }
            });
            promptList.appendChild(li);
        });
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    private setupEventListeners() {
        // File selection
        const fileSearch = document.getElementById('fileSearch');
        const fileDropdown = document.getElementById('fileDropdown');
        
        if (fileSearch && fileDropdown) {
            // Hide dropdown initially
            fileDropdown.style.display = 'none';

            // Show dropdown on focus
            fileSearch.addEventListener('focus', () => {
                this.vscode.postMessage({ command: 'getFileTree' });
            });

            // Handle input changes
            fileSearch.addEventListener('input', (e) => {
                const searchTerm = (e.target as HTMLInputElement).value;
                this.vscode.postMessage({ command: 'getFileTree' });
            });

            // Hide dropdown when clicking outside
            document.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                if (!fileSearch.contains(target) && !fileDropdown.contains(target)) {
                    fileDropdown.style.display = 'none';
                }
            });
        }

        // Tree toggle
        document.getElementById('includeTreeToggle')?.addEventListener('change', (e) => {
            const isChecked = (e.target as HTMLInputElement).checked;
            const depthControl = document.getElementById('depthControl');
            if (depthControl) {
                depthControl.style.display = isChecked ? 'flex' : 'none';
            }
            if (isChecked) {
                const depth = parseInt((document.getElementById('treeDepth') as HTMLInputElement)?.value || '1');
                this.vscode.postMessage({ command: 'getCodebaseTree', depth });
            }
        });

        // Tree depth change
        document.getElementById('treeDepth')?.addEventListener('change', (e) => {
            const depth = parseInt((e.target as HTMLInputElement).value);
            this.vscode.postMessage({ command: 'getCodebaseTree', depth });
        });

        // Get selected files
        document.getElementById('getSelectedBtn')?.addEventListener('click', () => {
            this.requestSelectedFilesContent();
        });

        // Copy prompt
        document.getElementById('copyPromptBtn')?.addEventListener('click', () => {
            const finalPrompt = this.buildFinalPrompt();
            if (finalPrompt) {
                this.vscode.postMessage({ command: 'copyToClipboard', text: finalPrompt });
            }
        });

        // Save prompt
        document.getElementById('savePromptBtn')?.addEventListener('click', () => {
            const name = (document.getElementById('promptNameInput') as HTMLInputElement)?.value;
            const prompt = (document.getElementById('promptInput') as HTMLTextAreaElement)?.value;
            const selectedFiles = Array.from(document.querySelectorAll('.selected-file'))
                .map(el => el.getAttribute('data-path'))
                .filter((path): path is string => path !== null);

            if (name && prompt) {
                this.vscode.postMessage({
                    command: 'savePrompt',
                    name,
                    prompt,
                    files: selectedFiles
                });
            }
        });

        // Load prompts
        document.getElementById('loadPromptsBtn')?.addEventListener('click', () => {
            this.vscode.postMessage({ command: 'loadPrompts' });
        });
    }
} 