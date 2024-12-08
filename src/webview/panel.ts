import * as vscode from 'vscode';
import { getNonce } from './tokenCounter';
import { IncomingMessage, OutgoingMessage } from './messageTypes';
import { getFileContent, getFileTree } from './promptLibrary';

export class PromptPanel {
    public static currentPanel: PromptPanel | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _context: vscode.ExtensionContext;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (PromptPanel.currentPanel) {
            PromptPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'myPromptBuilder',
            'Prompt Builder',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        PromptPanel.currentPanel = new PromptPanel(panel, extensionUri, context);
    }

    constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._context = context;

        this._panel.iconPath = vscode.Uri.joinPath(this._extensionUri, 'resources', 'icon.png');
        this._panel.webview.html = this._getHtmlForWebview();

        this._setWebviewMessageListener(this._panel.webview);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        PromptPanel.currentPanel = undefined;
        while (this._disposables.length) {
            const d = this._disposables.pop();
            d && d.dispose();
        }
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(async (message: IncomingMessage) => {
            switch (message.command) {
                case 'getFileTree':
                    {
                        const tree = await getFileTree(vscode.workspace.workspaceFolders?.[0].uri.fsPath || '', message.depth);
                        this._panel.webview.postMessage(<OutgoingMessage>{ command: 'fileTree', data: tree });
                    }
                    break;
                case 'getFileContent':
                    {
                        const contents = await getFileContent(message.files);
                        this._panel.webview.postMessage(<OutgoingMessage>{ command: 'fileContents', data: contents });
                    }
                    break;
                case 'savePrompt':
                    {
                        const currentPrompts = this._context.globalState.get<{ [key: string]: any }>('promptLibrary', {});
                        currentPrompts[message.name] = {
                            prompt: message.prompt,
                            files: message.files,
                            depth: message.depth
                        };
                        await this._context.globalState.update('promptLibrary', currentPrompts);
                        this._panel.webview.postMessage(<OutgoingMessage>{ command: 'promptSaved', data: true });
                    }
                    break;
                case 'loadPrompts':
                    {
                        const currentPrompts = this._context.globalState.get<{ [key: string]: any }>('promptLibrary', {});
                        this._panel.webview.postMessage(<OutgoingMessage>{ command: 'promptList', data: currentPrompts });
                    }
                    break;
                case 'copyToClipboard':
                    {
                        await vscode.env.clipboard.writeText(message.prompt);
                        vscode.window.showInformationMessage('Prompt copied to clipboard!');
                    }
                    break;
            }
        });
    }

    private _getHtmlForWebview(): string {
        const nonce = getNonce();
        const scriptUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js')
        );
        // For simplicity, we inline the UI in ui.html file.
        // You can load from a separate file if desired.
        return getWebviewContent(nonce);
    }
}

function getWebviewContent(nonce: string) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prompt Builder</title>
        <style nonce="${nonce}">
            :root {
                --vscode-bg: #1e1e1e;
                --vscode-bg-light: #252526;
                --vscode-bg-lighter: #2d2d2d;
                --vscode-text: #cccccc;
                --vscode-text-light: #e0e0e0;
                --vscode-accent: #0e639c;
                --vscode-accent-hover: #1177bb;
                --vscode-border: #454545;
                --vscode-input-bg: #3c3c3c;
                --vscode-button-bg: #0e639c;
                --vscode-button-hover: #1177bb;
                --vscode-button-text: #ffffff;
                --vscode-scrollbar: #424242;
            }

            body {
                background-color: var(--vscode-bg);
                color: var(--vscode-text);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                padding: 20px;
                margin: 0;
            }

            h2 {
                color: var(--vscode-text-light);
                border-bottom: 1px solid var(--vscode-border);
                padding-bottom: 8px;
                margin-top: 24px;
            }

            textarea, input[type="text"], input[type="number"] {
                background-color: var(--vscode-input-bg);
                border: 1px solid var(--vscode-border);
                color: var(--vscode-text);
                padding: 8px;
                border-radius: 4px;
                width: 100%;
                box-sizing: border-box;
                font-family: inherit;
            }

            textarea:focus, input:focus {
                outline: 1px solid var(--vscode-accent);
                border-color: var(--vscode-accent);
            }

            button {
                background-color: var(--vscode-button-bg);
                color: var(--vscode-button-text);
                border: none;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                margin: 4px;
                transition: background-color 0.2s;
            }

            button:hover {
                background-color: var(--vscode-button-hover);
            }

            #fileTree {
                background-color: var(--vscode-bg-light);
                border: 1px solid var(--vscode-border);
                border-radius: 4px;
                padding: 12px;
                margin-top: 8px;
                max-height: 300px;
                overflow-y: auto;
            }

            #fileTree::-webkit-scrollbar {
                width: 10px;
            }

            #fileTree::-webkit-scrollbar-track {
                background: var(--vscode-bg-light);
            }

            #fileTree::-webkit-scrollbar-thumb {
                background: var(--vscode-scrollbar);
                border-radius: 5px;
            }

            #contextArea {
                background-color: var(--vscode-bg-light);
                border: 1px solid var(--vscode-border);
                border-radius: 4px;
                padding: 12px;
                margin-top: 8px;
                max-height: 200px;
                overflow-y: auto;
            }

            #promptList {
                list-style: none;
                padding: 0;
                margin: 8px 0;
            }

            #promptList li {
                padding: 8px;
                margin: 4px 0;
                background-color: var(--vscode-bg-lighter);
                border-radius: 4px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            #promptList li:hover {
                background-color: var(--vscode-accent);
                color: var(--vscode-button-text);
            }

            .section {
                margin-bottom: 24px;
                padding: 16px;
                background-color: var(--vscode-bg-light);
                border-radius: 6px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }

            .token-count {
                color: #888;
                font-size: 0.9em;
                margin-top: 8px;
            }

            .file-item {
                padding: 4px 8px;
                margin: 2px 0;
                cursor: pointer;
                border-radius: 3px;
                transition: background-color 0.2s;
            }

            .file-item:hover {
                background-color: var(--vscode-bg-lighter);
            }

            .file-item.selected {
                background-color: var(--vscode-accent);
                color: var(--vscode-button-text);
            }

            .file-picker {
                position: relative;
                width: 100%;
                margin-bottom: 16px;
            }

            .file-picker input {
                width: 100%;
                padding: 8px 12px;
                background-color: var(--vscode-input-bg);
                color: var(--vscode-text);
                border: 1px solid var(--vscode-border);
                border-radius: 4px;
                cursor: pointer;
            }

            .file-picker .dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                max-height: 200px;
                overflow-y: auto;
                background-color: var(--vscode-input-bg);
                border: 1px solid var(--vscode-border);
                border-radius: 4px;
                z-index: 1000;
                display: none;
            }

            .file-picker .dropdown.show {
                display: block;
            }

            .file-picker .dropdown-item {
                padding: 8px 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .file-picker .dropdown-item:hover {
                background-color: var(--vscode-button-bg);
                color: var(--vscode-button-text);
            }

            .file-picker .dropdown-item .icon {
                width: 16px;
                height: 16px;
                display: inline-block;
            }

            .selected-files {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 8px;
            }

            .selected-file {
                background-color: var(--vscode-button-bg);
                color: var(--vscode-button-text);
                padding: 4px 8px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .selected-file .remove {
                cursor: pointer;
                opacity: 0.8;
            }

            .selected-file .remove:hover {
                opacity: 1;
            }
        </style>
    </head>
    <body>
        <div class="section">
            <h2>Prompt Library</h2>
            <button id="loadPromptsBtn">Load Prompts</button>
            <ul id="promptList"></ul>
        </div>

        <div class="section">
            <h2>File Selection</h2>
            <div class="file-picker">
                <input type="text" id="fileSearch" placeholder="Search files by name" autocomplete="off">
                <div class="dropdown" id="fileDropdown"></div>
            </div>
            <div class="selected-files" id="selectedFiles"></div>
        </div>

        <div class="section">
            <h2>Prompt Editor</h2>
            <textarea id="promptInput" rows="10" placeholder="Enter your prompt here..."></textarea>
            <div style="margin-top: 8px;">
                <button id="getSelectedBtn">Get Selected Files</button>
                <button id="copyPromptBtn">Copy Prompt</button>
            </div>
        </div>

        <div class="section">
            <h2>Context</h2>
            <div id="contextArea"></div>
            <div class="token-count">Token Count: <span id="tokenCount">0</span></div>
        </div>

        <div class="section">
            <div style="display: flex; align-items: center; gap: 8px;">
                <button id="savePromptBtn">Save Current Prompt</button>
                <input type="text" id="promptNameInput" placeholder="Prompt name">
            </div>
        </div>

        <script nonce="${nonce}">
            const vscode = acquireVsCodeApi();
            let selectedFiles = [];
            let fileContents = {};
            let allFiles = [];

            // Initialize file search functionality
            const fileSearch = document.getElementById('fileSearch');
            const fileDropdown = document.getElementById('fileDropdown');
            const selectedFilesContainer = document.getElementById('selectedFiles');

            // Get initial file list
            vscode.postMessage({ command: 'getFileTree', depth: 99 });

            // Handle file search input
            fileSearch.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredFiles = allFiles.filter(file => 
                    file.path.toLowerCase().includes(searchTerm)
                );
                renderFileDropdown(filteredFiles);
                fileDropdown.classList.add('show');
            });

            fileSearch.addEventListener('focus', () => {
                renderFileDropdown(allFiles);
                fileDropdown.classList.add('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.file-picker')) {
                    fileDropdown.classList.remove('show');
                }
            });

            function renderFileDropdown(files) {
                fileDropdown.innerHTML = '';
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
                    
                    item.addEventListener('click', () => {
                        if (!selectedFiles.includes(file.path)) {
                            selectedFiles.push(file.path);
                            renderSelectedFiles();
                            fileSearch.value = '';
                            fileDropdown.classList.remove('show');
                        }
                    });
                    fileDropdown.appendChild(item);
                });
            }

            function renderSelectedFiles() {
                selectedFilesContainer.innerHTML = '';
                selectedFiles.forEach(file => {
                    const fileElement = document.createElement('div');
                    fileElement.className = 'selected-file';
                    
                    const fileSpan = document.createElement('span');
                    fileSpan.textContent = file;
                    
                    const removeSpan = document.createElement('span');
                    removeSpan.className = 'remove';
                    removeSpan.textContent = '×';
                    
                    removeSpan.addEventListener('click', () => {
                        selectedFiles = selectedFiles.filter(f => f !== file);
                        renderSelectedFiles();
                    });
                    
                    fileElement.appendChild(fileSpan);
                    fileElement.appendChild(removeSpan);
                    selectedFilesContainer.appendChild(fileElement);
                });
            }

            // Handle messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'fileTree':
                        allFiles = message.data;
                        break;
                    case 'fileContents':
                        fileContents = message.data;
                        renderContext();
                        updateTokenCount();
                        break;
                    case 'promptList':
                        renderPromptList(message.data);
                        break;
                    case 'promptSaved':
                        if(message.data) {
                            document.getElementById('promptNameInput').value = '';
                        }
                        break;
                }
            });

            document.getElementById('getSelectedBtn').addEventListener('click', () => {
                vscode.postMessage({ command: 'getFileContent', files: selectedFiles });
            });

            document.getElementById('copyPromptBtn').addEventListener('click', () => {
                const finalPrompt = buildFinalPrompt();
                vscode.postMessage({ command: 'copyToClipboard', prompt: finalPrompt });
            });

            document.getElementById('savePromptBtn').addEventListener('click', () => {
                const name = document.getElementById('promptNameInput').value.trim();
                if(!name) return;
                vscode.postMessage({ command: 'savePrompt', name, prompt: buildFinalPrompt(), files: selectedFiles, depth: parseInt(document.getElementById('depthInput').value,10) });
            });

            document.getElementById('promptInput').addEventListener('input', (e) => {
                promptText = e.target.value;
                updateTokenCount();
            });

            function buildFinalPrompt() {
                let base = promptText.trim();
                base += "\\n\\n[Context]\\n";
                for(const [path, content] of Object.entries(fileContents)) {
                    base += "- File: " + path + "\\n";
                    base += "Content:\\n" + content + "\\n\\n";
                }
                return base;
            }

            function updateTokenCount() {
                // Simple token approx: split by whitespace
                const text = buildFinalPrompt();
                const tokens = text.split(/\\s+/).length;
                document.getElementById('tokenCount').textContent = tokens;
            }

            function renderContext() {
                const ctxDiv = document.getElementById('contextArea');
                ctxDiv.textContent = '';
                for(const [path, content] of Object.entries(fileContents)) {
                    const block = document.createElement('div');
                    block.textContent = "File: " + path + "\\n" + content.slice(0,200) + (content.length>200?"...":"");
                    ctxDiv.appendChild(block);
                }
            }

            function renderPromptList(prompts) {
                const ul = document.getElementById('promptList');
                ul.innerHTML = '';
                for (const name in prompts) {
                    const li = document.createElement('li');
                    li.textContent = name;
                    li.addEventListener('click', () => {
                        document.getElementById('promptInput').value = prompts[name].prompt;
                        promptText = prompts[name].prompt;
                        selectedFiles = prompts[name].files || [];
                        document.getElementById('depthInput').value = prompts[name].depth || 1;
                        updateTokenCount();
                    });
                    ul.appendChild(li);
                }
            }
        </script>
    </body>
    </html>`;
}
