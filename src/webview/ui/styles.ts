export function getStyles(): string {
    return `
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
        }

        .section {
            margin-bottom: 24px;
        }

        h2 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--vscode-foreground);
        }

        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 12px;
            cursor: pointer;
            font-size: 13px;
            border-radius: 2px;
        }

        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        input[type="text"] {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 4px 8px;
            font-size: 13px;
            border-radius: 2px;
            height: 24px;
        }

        #fileSearch {
            width: 100%;
            max-width: 300px;
        }

        #promptNameInput {
            width: 200px;
        }

        textarea {
            width: 100%;
            min-height: 100px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: 1px solid var(--vscode-widget-border);
            padding: 8px;
            resize: vertical;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: 1.4;
        }

        .token-count-container {
            margin: 8px 0;
            display: flex;
            justify-content: flex-end;
        }

        #tokenCount {
            font-size: 13px;
            color: var(--vscode-foreground);
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
        }

        #tokenCount.warning {
            color: var(--vscode-editorWarning-foreground);
            font-weight: bold;
            border-color: var(--vscode-editorWarning-border);
            background-color: var(--vscode-editorWarning-background);
        }

        #tokenCount.error {
            color: var(--vscode-editorError-foreground);
            font-weight: bold;
            border-color: var(--vscode-editorError-border);
            background-color: var(--vscode-editorError-background);
        }

        .file-picker {
            position: relative;
            margin-bottom: 12px;
        }

        .dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-width: 300px;
            background: var(--vscode-dropdown-background);
            border: 1px solid var(--vscode-dropdown-border);
            z-index: 1000;
            display: none;
        }

        .dropdown.show {
            display: block;
        }

        .dropdown-item {
            padding: 6px 8px;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .dropdown-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }

        .item-icon {
            flex-shrink: 0;
            width: 16px;
            text-align: center;
        }

        .select-all-btn {
            margin-left: auto;
            padding: 2px 6px;
            font-size: 11px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: none;
            border-radius: 2px;
            cursor: pointer;
        }

        .select-all-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }

        .selected-files {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .selected-file {
            display: flex;
            align-items: center;
            background: var(--vscode-editor-background);
            padding: 4px 8px;
            margin: 4px 0;
            border-radius: 2px;
            font-size: 13px;
        }

        .remove-file {
            margin-left: auto;
            color: var(--vscode-icon-foreground);
            cursor: pointer;
            opacity: 0.7;
        }

        .remove-file:hover {
            opacity: 1;
        }

        .toggle-container {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
        }

        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 40px;
            height: 20px;
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
            border: 1px solid var(--vscode-input-border);
        }

        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 14px;
            width: 14px;
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
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 8px;
        }

        .depth-control input {
            width: 60px;
            padding: 2px 4px;
            font-size: 13px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 2px;
        }

        .context-file {
            background: var(--vscode-editor-background);
            padding: 8px;
            margin: 4px 0;
            border-radius: 2px;
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            white-space: pre-wrap;
        }

        .context-tree {
            background: var(--vscode-editor-background);
            padding: 8px;
            margin: 4px 0;
            border-radius: 2px;
            font-family: var(--vscode-editor-font-family);
            font-size: 13px;
            white-space: pre;
        }

        .selected-file.refreshing {
            opacity: 0.7;
            position: relative;
        }

        .selected-file.refreshing::after {
            content: "Refreshing...";
            position: absolute;
            right: 8px;
            font-size: 12px;
            color: var(--vscode-textPreformat-foreground);
        }
    `;
} 