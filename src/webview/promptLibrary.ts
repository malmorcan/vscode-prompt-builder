import * as fs from 'fs';
import * as path from 'path';
import * as ignore from 'ignore';
import { workspace } from 'vscode';

// Common directories and files to ignore
const DEFAULT_IGNORE = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'out',
    '.DS_Store',
    '*.log',
    'coverage',
    '.env',
    '.vscode',
    '*.map'
];

export async function getFileTree(rootPath: string, depth: number): Promise<{name: string, path: string}[]> {
    // Initialize ignore instance
    const ig = ignore.default();
    
    // Add default ignores
    ig.add(DEFAULT_IGNORE);
    
    // Try to read .gitignore
    try {
        const gitignorePath = path.join(rootPath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ig.add(gitignoreContent);
        }
    } catch (error) {
        console.error('Error reading .gitignore:', error);
    }
    
    return walkDirectory(rootPath, depth, 0, ig);
}

export async function getCodebaseTreeStructure(rootPath: string, depth: number): Promise<string> {
    const ig = ignore.default();
    ig.add(DEFAULT_IGNORE);
    
    try {
        const gitignorePath = path.join(rootPath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
            ig.add(gitignoreContent);
        }
    } catch (error) {
        console.error('Error reading .gitignore:', error);
    }

    const projectName = path.basename(rootPath).toUpperCase();
    let treeStructure = `/${projectName}\n`;
    
    function buildTree(dir: string, prefix: string = '', currentDepth: number = 0): string {
        if (currentDepth > depth) return '';
        
        let result = '';
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const items = entries.filter(entry => {
            const relativePath = path.relative(
                workspace.workspaceFolders?.[0].uri.fsPath || '',
                path.join(dir, entry.name)
            );
            return !ig.ignores(relativePath);
        });

        items.forEach((entry, index) => {
            const isLast = index === items.length - 1;
            const newPrefix = prefix + (isLast ? '  ' : '│ ');
            const entryPrefix = prefix + (isLast ? '└──' : '├──');
            
            result += `${entryPrefix} ${entry.name}\n`;
            
            if (entry.isDirectory() && currentDepth < depth) {
                result += buildTree(
                    path.join(dir, entry.name),
                    newPrefix,
                    currentDepth + 1
                );
            }
        });
        
        return result;
    }
    
    return treeStructure + buildTree(rootPath);
}

async function walkDirectory(
    dir: string, 
    maxDepth: number, 
    currentDepth: number,
    ig: ignore.Ignore
): Promise<{name: string, path: string}[]> {
    if (currentDepth > maxDepth) return [];
    
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let files: {name: string, path: string}[] = [];
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(workspace.workspaceFolders?.[0].uri.fsPath || '', fullPath);
            
            // Skip if path matches ignore patterns
            if (ig.ignores(relativePath)) {
                continue;
            }
            
            if (entry.isDirectory()) {
                files = files.concat(await walkDirectory(fullPath, maxDepth, currentDepth + 1, ig));
            } else {
                files.push({
                    name: entry.name,
                    path: fullPath
                });
            }
        }
        
        return files;
    } catch (error) {
        console.error(`Error reading directory ${dir}:`, error);
        return [];
    }
}

export async function getFileContent(files: string[]): Promise<{[key: string]: string}> {
    const result: {[key: string]: string} = {};
    for (const f of files) {
        try {
            const content = fs.readFileSync(f, 'utf-8');
            result[f] = content;
        } catch(e) {
            console.error(`Error reading file ${f}:`, e);
            result[f] = '';
        }
    }
    return result;
}
