export function getStyles(): string {
    return `
        body {
            padding: 15px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }

        .section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
        }

        h2 {
            margin-top: 0;
            margin-bottom: 15px;
            color: var(--vscode-foreground);
        }

        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        input[type="text"], textarea {
            width: 100%;
            padding: 8px;
            margin-bottom: 10px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
        }

        .file-picker {
            position: relative;
        }

        .dropdown {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            background-color: var(--vscode-dropdown-background);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 3px;
            z-index: 1000;
        }

        .file-item {
            padding: 8px 12px;
            cursor: pointer;
            color: var(--vscode-dropdown-foreground);
        }

        .file-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .selected-files {
            margin-top: 10px;
        }

        .selected-file {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            margin-bottom: 5px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
        }

        .remove-file {
            padding: 2px 6px;
            margin-left: 8px;
            background-color: transparent;
            color: var(--vscode-errorForeground);
            border: 1px solid var(--vscode-errorForeground);
            border-radius: 3px;
            cursor: pointer;
        }

        .remove-file:hover {
            background-color: var(--vscode-errorForeground);
            color: var(--vscode-editor-background);
        }

        .toggle-container {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 20px;
            margin-right: 10px;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--vscode-input-background);
            transition: .4s;
            border-radius: 20px;
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 2px;
            bottom: 2px;
            background-color: var(--vscode-input-foreground);
            transition: .4s;
            border-radius: 50%;
        }

        input:checked + .toggle-slider {
            background-color: var(--vscode-button-background);
        }

        input:checked + .toggle-slider:before {
            transform: translateX(20px);
        }

        .depth-control {
            display: none;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
        }

        .depth-control input {
            width: 60px;
        }

        .tree-section {
            margin-top: 15px;
            padding: 10px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
        }

        .file-content {
            margin-top: 15px;
            padding: 10px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
        }

        .file-content h3 {
            margin-top: 0;
            margin-bottom: 10px;
            color: var(--vscode-foreground);
        }

        pre {
            margin: 0;
            padding: 10px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            overflow-x: auto;
            font-family: 'Courier New', Courier, monospace;
        }

        #promptList {
            list-style: none;
            padding: 0;
            margin: 10px 0;
        }

        #promptList li {
            padding: 8px 12px;
            margin-bottom: 5px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 3px;
            cursor: pointer;
        }

        #promptList li:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
    `;
} 