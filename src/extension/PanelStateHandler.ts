import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import ignore from 'ignore';

export class PanelStateHandler {
    private ig: ReturnType<typeof ignore> | null = null;

    constructor(private readonly webview: vscode.Webview) {
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
                case 'expandDirectory':
                    await this.handleExpandDirectory(message.directoryPath);
                    break;
                case 'getFileContent':
                    await this.handleGetFileContent(message.files);
                    break;
                case 'getCodebaseTree':
                    await this.handleGetCodebaseTree(message.depth);
                    break;
                case 'copyToClipboard':
                    await vscode.env.clipboard.writeText(message.text);
                    break;
                // Removed 'savePrompt' and 'loadPrompts' commands entirely
            }
        } catch (error) {
            console.error('Error handling message:', error);
            vscode.window.showErrorMessage(`Error handling message: ${error}`);
        }
    }

    private async handleGetFileTree() {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            this.setupIgnoreFilter(workspaceRoot);

            // Build a full recursive file tree structure
            const tree = await this.buildFullFileTree(workspaceRoot, '');
            
            // Send the complete tree to the webview
            await this.webview.postMessage({
                command: 'fileTree',
                data: tree
            });
        } catch (error) {
            console.error('Error getting file tree:', error);
            vscode.window.showErrorMessage(`Error getting file tree: ${error}`);
        }
    }

    private async handleExpandDirectory(directoryPath: string) {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            // directoryPath is relative. Construct absolute path
            const fullDirPath = path.join(workspaceRoot, directoryPath);

            // Build the file list for this directory only (not recursive)
            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(fullDirPath));
            const items = await this.convertEntriesToItems(entries, directoryPath, workspaceRoot);

            // Send the partial expansion
            await this.webview.postMessage({
                command: 'expandDirectory',
                data: {
                    items,
                    parentPath: directoryPath
                }
            });

        } catch (error) {
            console.error('Error expanding directory:', error);
            vscode.window.showErrorMessage(`Error expanding directory: ${error}`);
        }
    }

    private async convertEntriesToItems(entries: [string, vscode.FileType][], basePath: string, workspaceRoot: string): Promise<any[]> {
        let items: any[] = [];
        for (const [name, type] of entries) {
            const itemPath = path.join(basePath, name);
            const fullPath = path.join(workspaceRoot, itemPath);

            const relativePathForIgnore = path.relative(workspaceRoot, fullPath);
            if (this.ig && this.ig.ignores(relativePathForIgnore)) {
                continue;
            }

            if (['node_modules', '.git', 'dist', '.vscode'].some(ignored => itemPath.includes(ignored))) {
                continue;
            }

            const isDirectory = (type & vscode.FileType.Directory) !== 0;
            const fileItem: any = {
                name,
                path: itemPath,
                type: isDirectory ? 'directory' : 'file',
                hasChildren: isDirectory
            };

            items.push(fileItem);
        }

        // Sort directories first, then files
        items.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });

        return items;
    }

    private setupIgnoreFilter(workspaceRoot: string) {
        const igInst = ignore();
        try {
            const gitignorePath = path.join(workspaceRoot, '.promptignore');
            if (fs.existsSync(gitignorePath)) {
                const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
                igInst.add(gitignoreContent);
            }
        } catch (error) {
            console.error('Error reading .gitignore:', error);
        }
        this.ig = igInst;
    }

    private async buildFullFileTree(dirPath: string, relativePath: string): Promise<any[]> {
        const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(dirPath));
        let items: any[] = [];
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';

        for (const [name, type] of entries) {
            const itemPath = path.join(relativePath, name);
            const fullPath = path.join(dirPath, name);
            const relativePathForIgnore = path.relative(workspaceRoot, fullPath);

            if (this.ig && this.ig.ignores(relativePathForIgnore)) {
                continue;
            }

            if (['node_modules', '.git', 'dist', '.vscode'].some(ignored => itemPath.includes(ignored))) {
                continue;
            }

            const isDirectory = (type & vscode.FileType.Directory) !== 0;
            const fileItem: any = {
                name,
                path: itemPath,
                type: isDirectory ? 'directory' : 'file',
                hasChildren: isDirectory
            };

            if (isDirectory) {
                fileItem.children = await this.buildFullFileTree(path.join(dirPath, name), itemPath);
            }

            items.push(fileItem);
        }

        // Sort directories first, then files
        items.sort((a, b) => {
            if (a.type === b.type) return a.name.localeCompare(b.name);
            return a.type === 'directory' ? -1 : 1;
        });

        return items;
    }

    private async handleGetFileContent(files: string[]) {
        try {
            const contents: { [key: string]: string } = {};
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            for (const filePath of files) {
                try {
                    const fullPath = path.join(workspaceRoot, filePath);
                    const stat = await vscode.workspace.fs.stat(vscode.Uri.file(fullPath));
                    
                    // Skip if it's a directory
                    if ((stat.type & vscode.FileType.Directory) !== 0) {
                        console.log(`Skipping directory: ${filePath}`);
                        continue;
                    }

                    const content = await vscode.workspace.fs.readFile(vscode.Uri.file(fullPath));
                    contents[filePath] = content.toString();
                } catch (err) {
                    const error = err as Error;
                    console.error(`Error reading file ${filePath}:`, error);
                    
                    if (error.message.includes('EISDIR')) {
                        console.log(`Skipping directory: ${filePath}`);
                        continue;
                    }
                    
                    contents[filePath] = `Error reading file: ${error.message}`;
                }
            }

            await this.webview.postMessage({
                command: 'fileContents',
                data: contents
            });
        } catch (err) {
            const error = err as Error;
            console.error('Error getting file contents:', error);
            vscode.window.showErrorMessage(`Error getting file contents: ${error.message}`);
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

    public dispose() {
        // Clean up resources if needed
    }
}
