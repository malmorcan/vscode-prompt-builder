export type IncomingMessage = 
    | { command: 'getFileTree' }
    | { command: 'expandDirectory'; directoryPath: string }
    | { command: 'getCodebaseTree'; depth: number }
    | { command: 'getFileContent'; files: string[] }
    | { command: 'savePrompt'; name: string; prompt: string; files: string[] }
    | { command: 'loadPrompts' }
    | { command: 'copyToClipboard'; text: string };

export interface FileTreeItem {
    name: string;
    path: string;
    type: 'file' | 'directory';
    hasChildren?: boolean;
    expanded?: boolean;
    children?: FileTreeItem[];
}

export interface FileTreeData {
    items: FileTreeItem[];
    parentPath: string;
}

export type OutgoingMessage = 
    | { command: 'fileTree'; data: FileTreeItem[] }
    | { command: 'expandDirectory'; data: FileTreeData }
    | { command: 'codebaseTree'; data: string }
    | { command: 'fileContents'; data: { [key: string]: string } }
    | { command: 'promptList'; data: { [key: string]: { prompt: string; files: string[] } } }
    | { command: 'promptSaved'; data: boolean }; 