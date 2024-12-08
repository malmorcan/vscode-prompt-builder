import * as fs from 'fs';
import * as path from 'path';

export async function getFileTree(rootPath: string, depth: number): Promise<{name: string, path: string}[]> {
    return walkDirectory(rootPath, depth, 0);
}

async function walkDirectory(dir: string, maxDepth: number, currentDepth: number): Promise<{name:string, path:string}[]> {
    if(currentDepth > maxDepth) return [];
    const entries = fs.readdirSync(dir, {withFileTypes: true});
    let files: {name:string, path:string}[] = [];
    for(const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if(entry.isDirectory()) {
            files = files.concat(await walkDirectory(fullPath, maxDepth, currentDepth+1));
        } else {
            files.push({name: entry.name, path: fullPath});
        }
    }
    return files;
}

export async function getFileContent(files: string[]): Promise<{[key:string]: string}> {
    const result: {[key:string]: string} = {};
    for (const f of files) {
        try {
            const content = fs.readFileSync(f, 'utf-8');
            result[f] = content;
        } catch(e) {
            result[f] = '';
        }
    }
    return result;
}
