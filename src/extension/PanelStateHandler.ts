import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import ignore from 'ignore';

// Define the FileTreeItem interface
interface FileTreeItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    hasChildren?: boolean;
    children?: FileTreeItem[];
}

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
                case 'getIgnoreInfo':
                    await this.handleGetIgnoreInfo();
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
            // First try .promptignore (takes precedence)
            const promptignorePath = path.join(workspaceRoot, '.promptignore');
            if (fs.existsSync(promptignorePath)) {
                const promptignoreContent = fs.readFileSync(promptignorePath, 'utf8');
                igInst.add(promptignoreContent);
                console.log('Using .promptignore for file filtering');
            } 
            // Fall back to .gitignore if .promptignore doesn't exist
            else {
                const gitignorePath = path.join(workspaceRoot, '.gitignore');
                if (fs.existsSync(gitignorePath)) {
                    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
                    igInst.add(gitignoreContent);
                    console.log('Using .gitignore for file filtering (no .promptignore found)');
                }
            }

            // Always add common exclusions regardless of .promptignore or .gitignore
            igInst.add([
                'node_modules',
                '.git',
                'dist',
                'out',
                'build',
                '.vscode',
                '.idea',
                '*.log'
            ]);
        } catch (error) {
            console.error('Error reading ignore file:', error);
        }
        this.ig = igInst;
    }

    private async buildFullFileTree(dirPath: string, relativePath: string): Promise<FileTreeItem[]> {
        try {
            const result: FileTreeItem[] = [];
            const files = await fs.promises.readdir(dirPath);
            
            for (const file of files) {
                const fullPath = path.join(dirPath, file);
                // Use relative path from workspace root for ignore checking
                const itemRelPath = path.join(relativePath, file).replace(/\\/g, '/');
                
                // Skip if this path should be ignored
                if (this.ig && this.ig.ignores(itemRelPath)) {
                    continue;
                }
                
                const stats = await fs.promises.stat(fullPath);
                
                if (stats.isDirectory()) {
                    const children = await this.buildFullFileTree(fullPath, itemRelPath);
                    result.push({
                        name: file,
                        path: itemRelPath,
                        type: 'directory',
                        hasChildren: children.length > 0,
                        children: children
                    });
                } else {
                    result.push({
                        name: file,
                        path: itemRelPath,
                        type: 'file'
                    });
                }
            }
            
            return result;
        } catch (error) {
            console.error(`Error building file tree for ${dirPath}:`, error);
            return [];
        }
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

            // Make sure ignore filter is set up
            this.setupIgnoreFilter(workspaceRoot);

            // Generate a tree structure with proper ignore filtering
            const tree = await this.generateCodebaseTree(workspaceRoot, '', depth);
            
            await this.webview.postMessage({
                command: 'codebaseTree',
                data: tree
            });
        } catch (error) {
            console.error('Error generating codebase tree:', error);
            vscode.window.showErrorMessage(`Error generating codebase tree: ${error}`);
        }
    }

    private async generateCodebaseTree(dirPath: string, relativePath: string, maxDepth: number, currentDepth: number = 0): Promise<string> {
        if (currentDepth > maxDepth) {
            return '';
        }

        try {
            const files = await fs.promises.readdir(dirPath);
            const items: string[] = [];
            
            for (const file of files) {
                const fullPath = path.join(dirPath, file);
                // Use relative path from workspace root for ignore checking
                const itemRelPath = path.join(relativePath, file).replace(/\\/g, '/');
                
                // Skip if this path should be ignored
                if (this.ig && this.ig.ignores(itemRelPath)) {
                    continue; // Skip ignored files/directories
                }
                
                try {
                    const stats = await fs.promises.stat(fullPath);
                    
                    if (stats.isDirectory()) {
                        if (currentDepth < maxDepth) {
                            const subTree = await this.generateCodebaseTree(
                                fullPath, 
                                itemRelPath, 
                                maxDepth, 
                                currentDepth + 1
                            );
                            
                            if (subTree) {
                                items.push(`${file}/\n${subTree.split('\n').map(line => `  ${line}`).join('\n')}`);
                            } else {
                                items.push(`${file}/`);
                            }
                        } else {
                            items.push(`${file}/`);
                        }
                    } else {
                        items.push(file);
                    }
                } catch (error) {
                    console.error(`Error accessing ${fullPath}:`, error);
                }
            }
            
            // Sort items alphabetically, but with directories first
            items.sort((a, b) => {
                const aIsDir = a.endsWith('/');
                const bIsDir = b.endsWith('/');
                
                if (aIsDir && !bIsDir) return -1;
                if (!aIsDir && bIsDir) return 1;
                return a.localeCompare(b);
            });
            
            return items.join('\n');
        } catch (error) {
            console.error(`Error generating tree for ${dirPath}:`, error);
            return '';
        }
    }

    private async handleGetIgnoreInfo() {
        try {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }

            const promptignorePath = path.join(workspaceRoot, '.promptignore');
            const gitignorePath = path.join(workspaceRoot, '.gitignore');
            
            let message = '';
            if (fs.existsSync(promptignorePath)) {
                message = 'Using .promptignore for file filtering';
            } else if (fs.existsSync(gitignorePath)) {
                message = 'Using .gitignore for file filtering (no .promptignore found)';
            } else {
                message = 'No .promptignore or .gitignore found, using default exclusions only';
            }

            vscode.window.showInformationMessage(message);
        } catch (error) {
            console.error('Error getting ignore info:', error);
        }
    }

    public dispose() {
        // Clean up resources if needed
    }
}
