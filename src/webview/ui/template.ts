import { getStyles } from './styles';

export function getWebviewContent(nonce: string, scriptUri: string): string {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval';">
        <title>Prompt Builder</title>
        <style>
            ${getStyles()}
        </style>
    </head>
    <body>
        <div class="section">
            <h2>File Selection</h2>
            <div class="file-picker">
                <input type="text" id="fileSearch" placeholder="Search files by name" autocomplete="off">
                <button id="reloadFilesBtn">Refresh Files</button>
                <button id="clearFilesBtn">Clear all files</button>
                <div class="dropdown" id="fileDropdown"></div>
            </div>
            <div class="selected-files" id="selectedFiles"></div>
        </div>

        <div class="section">
            <h2>Codebase Tree</h2>
            <div class="toggle-container">
                <label class="toggle-switch">
                    <input type="checkbox" id="includeTreeToggle">
                    <span class="toggle-slider"></span>
                </label>
                <span class="toggle-label">Include codebase tree in context</span>
            </div>
            <div class="depth-control" id="depthControl" style="display: none;">
                <label for="treeDepth">Tree depth:</label>
                <input type="number" id="treeDepth" value="1" min="1" max="10">
            </div>
        </div>

        <div class="section">
            <h2>Prompt Editor</h2>
            <textarea id="promptInput" rows="10" placeholder="Enter your prompt here..."></textarea>
            <div class="token-count-container">
                <span id="tokenCount">0 tokens</span>
            </div>
            <div style="margin-top: 8px;">
                <button id="copyPromptBtn">Copy Prompt</button>
            </div>
        </div>

        <div class="section">
            <h2>Preview</h2>
            <div id="contextArea"></div>
            <div id="copyNotification" style="display:none; color: var(--vscode-editorInfo-foreground); margin-top:8px;">Prompt copied!</div>
        </div>

        <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
}

