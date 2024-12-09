export type IncomingMessage = 
    | { command: 'getFileTree' }
    | { command: 'getCodebaseTree'; depth: number }
    | { command: 'getFileContent'; files: string[] }
    | { command: 'savePrompt'; name: string; prompt: string; files: string[] }
    | { command: 'loadPrompts' }
    | { command: 'copyToClipboard'; text: string };

export type FileTreeItem = {
    name: string;
    path: string;
};

export type OutgoingMessage = 
    | { command: 'fileTree'; data: FileTreeItem[] }
    | { command: 'codebaseTree'; data: string }
    | { command: 'fileContents'; data: { [key: string]: string } }
    | { command: 'promptList'; data: { [key: string]: { prompt: string; files: string[] } } }
    | { command: 'promptSaved'; data: boolean }; 