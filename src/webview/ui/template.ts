import { getStyles } from './styles';

export function getWebviewContent(nonce: string): string {
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

        <script nonce="${nonce}" src="\${scriptUri}"></script>
    </body>
    </html>`;
} 