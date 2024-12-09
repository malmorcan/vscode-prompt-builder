import * as vscode from 'vscode';
import * as path from 'path';

export class PanelStateHandler {
    constructor(private readonly webview: vscode.Webview) {
        // Set up message handling
        this.webview.onDidReceiveMessage(
            message => {
                this.handleMessage(message);
            },
            undefined,
            []
        );
    }

    private async handleMessage(message: any) {
        try {
            switch (message.command) {
                case 'getFileTree':
                    await this.handleGetFileTree();
                    break;
                case 'getFileContent':
                    await this.handleGetFileContent(message.files);
                    break;
                case 'getCodebaseTree':
                    await this.handleGetCodebaseTree(message.depth);
                    break;
                case 'savePrompt':
                    await this.handleSavePrompt(message.name, message.prompt, message.files);
                    break;
                case 'loadPrompts':
                    await this.handleLoadPrompts();
                    break;
                case 'copyToClipboard':
                    await this.handleCopyToClipboard(message.text);
                    break;
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error handling message: ${error}`);
        }
    }

    private async handleGetFileTree() {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            const files = await vscode.workspace.findFiles('**/*.*', '**/node_modules/**');
            const fileList = files.map(file => ({
                name: path.basename(file.fsPath),
                path: vscode.workspace.asRelativePath(file.fsPath)
            }));

            await this.webview.postMessage({
                command: 'fileTree',
                data: fileList
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error getting file tree: ${error}`);
        }
    }

    private async handleGetFileContent(files: string[]) {
        try {
            const contents: { [key: string]: string } = {};
            
            for (const filePath of files) {
                const uri = vscode.Uri.file(
                    path.join(vscode.workspace.workspaceFolders![0].uri.fsPath, filePath)
                );
                const content = await vscode.workspace.fs.readFile(uri);
                contents[filePath] = content.toString();
            }

            await this.webview.postMessage({
                command: 'fileContents',
                data: contents
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error getting file contents: ${error}`);
        }
    }

    private async handleGetCodebaseTree(depth: number) {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            const tree = await this.buildDirectoryTree(workspaceRoot, depth);
            await this.webview.postMessage({
                command: 'codebaseTree',
                data: tree
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error getting codebase tree: ${error}`);
        }
    }

    private async buildDirectoryTree(dir: string, depth: number, currentDepth = 0): Promise<string> {
        if (currentDepth >= depth) {
            return '';
        }

        let result = '';
        const indent = '  '.repeat(currentDepth);
        const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dir));

        for (const [name, type] of files) {
            if (name === 'node_modules' || name === '.git') {
                continue;
            }

            const fullPath = path.join(dir, name);
            if (type === vscode.FileType.Directory) {
                result += `${indent}📁 ${name}/\n`;
                result += await this.buildDirectoryTree(fullPath, depth, currentDepth + 1);
            } else {
                result += `${indent}📄 ${name}\n`;
            }
        }

        return result;
    }

    private async handleSavePrompt(name: string, prompt: string, files: string[]) {
        try {
            // Get global storage path
            const storageUri = this.getStoragePath();
            const promptsFile = vscode.Uri.joinPath(storageUri, 'prompts.json');

            // Read existing prompts
            let prompts: { [key: string]: any } = {};
            try {
                const content = await vscode.workspace.fs.readFile(promptsFile);
                prompts = JSON.parse(content.toString());
            } catch (error) {
                // File doesn't exist yet, that's ok
            }

            // Save new prompt
            prompts[name] = { prompt, files };
            await vscode.workspace.fs.writeFile(
                promptsFile,
                Buffer.from(JSON.stringify(prompts, null, 2))
            );

            await this.webview.postMessage({
                command: 'promptSaved',
                data: true
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Error saving prompt: ${error}`);
        }
    }

    private async handleLoadPrompts() {
        try {
            const storageUri = this.getStoragePath();
            const promptsFile = vscode.Uri.joinPath(storageUri, 'prompts.json');

            try {
                const content = await vscode.workspace.fs.readFile(promptsFile);
                const prompts = JSON.parse(content.toString());

                await this.webview.postMessage({
                    command: 'promptList',
                    data: prompts
                });
            } catch (error) {
                // File doesn't exist yet, send empty list
                await this.webview.postMessage({
                    command: 'promptList',
                    data: {}
                });
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error loading prompts: ${error}`);
        }
    }

    private async handleCopyToClipboard(text: string) {
        try {
            await vscode.env.clipboard.writeText(text);
            vscode.window.showInformationMessage('Copied to clipboard!');
        } catch (error) {
            vscode.window.showErrorMessage(`Error copying to clipboard: ${error}`);
        }
    }

    private getStoragePath(): vscode.Uri {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri;
        if (!workspaceRoot) {
            throw new Error('No workspace folder found');
        }
        return vscode.Uri.joinPath(workspaceRoot, '.vscode');
    }

    public dispose() {
        // Clean up resources if needed
    }
} 