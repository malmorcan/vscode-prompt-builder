# VS Code Prompt Builder Extension Architecture

## Overview

The VS Code Prompt Builder Extension is designed to help users create and manage prompts with context from their codebase. The extension follows a dual-context architecture typical of VS Code extensions, with clear separation between extension-side (Node.js) and webview-side (Browser) functionality.

## Architecture

### 1. Core Components

```
src/
├── extension/
│   ├── extension.ts         # Extension activation and command registration
│   └── PanelStateHandler.ts # Extension-side state and message handling
│
├── webview/
│   ├── index.ts            # Webview entry point
│   ├── panel.ts            # Webview panel creation and lifecycle
│   ├── messages/
│   │   ├── types.ts        # Message type definitions
│   │   └── handlers.ts     # Message handling logic
│   ├── state/
│   │   └── panelState.ts   # Webview-side state management
│   └── ui/
│       ├── template.ts     # HTML template
│       ├── styles.ts       # CSS styles
│       └── components/     # UI components
```

### 2. Contexts

#### A. Extension Context (Node.js)
- Runs in Node.js environment
- Handles VS Code API interactions
- Manages file system operations
- Controls webview lifecycle
- Processes extension commands

#### B. Webview Context (Browser)
- Runs in a sandboxed browser environment
- Manages UI state and interactions
- Handles DOM manipulation
- Communicates with extension via messages

### 3. Communication Pattern

The extension uses a message-passing architecture for communication between contexts:

#### Message Types
```typescript
// Incoming Messages (Webview to Extension)
type IncomingMessage = 
    | { command: 'getFileTree' }
    | { command: 'getCodebaseTree'; depth: number }
    | { command: 'getFileContent'; files: string[] }
    | { command: 'savePrompt'; name: string; prompt: string; files: string[] }
    | { command: 'loadPrompts' }
    | { command: 'copyToClipboard'; text: string };

// Outgoing Messages (Extension to Webview)
type OutgoingMessage = 
    | { command: 'fileTree'; data: FileTreeItem[] }
    | { command: 'codebaseTree'; data: string }
    | { command: 'fileContents'; data: { [key: string]: string } }
    | { command: 'promptList'; data: { [key: string]: { prompt: string; files: string[] } } }
    | { command: 'promptSaved'; data: boolean };
```

### 4. State Management

#### Extension State (`PanelStateHandler`)
- Manages file system operations
- Handles VS Code API interactions
- Processes incoming messages
- Maintains extension-side state
- Manages prompt storage and retrieval

#### Webview State (`PanelState`)
- Manages UI component state
- Handles user interactions
- Processes DOM updates
- Maintains file selection state
- Manages prompt building state

### 5. Key Features

#### A. File Selection
```typescript
// User interaction -> Message -> File System -> UI Update
interface FileTreeItem {
    name: string;
    path: string;
}

// Extension-side handling
async handleGetFileTree() {
    const files = await vscode.workspace.findFiles('**/*.*');
    return files.map(file => ({
        name: path.basename(file.fsPath),
        path: workspace.asRelativePath(file.fsPath)
    }));
}

// Webview-side handling
updateFileList(files: FileTreeItem[]) {
    // Update dropdown UI
    // Handle file selection
    // Manage selected files state
}
```

#### B. Prompt Building
```typescript
// Combines multiple contexts into a single prompt
buildFinalPrompt(): string {
    // 1. Base prompt text
    let finalPrompt = promptInput.value;
    
    // 2. Selected files context
    if (hasSelectedFiles) {
        finalPrompt += '\n\n[Selected Files]\n';
        // Add file contents
    }
    
    // 3. Codebase structure
    if (includeCodebaseTree) {
        finalPrompt += '\n\n[Codebase Tree]\n';
        // Add tree structure
    }
    
    return finalPrompt;
}
```

### 6. Security Considerations

1. **Content Security Policy**
   - Strict CSP implementation
   - Nonce-based script execution
   - Limited resource access

2. **File System Access**
   - Controlled through VS Code API
   - Workspace-scoped operations
   - Sanitized file paths

3. **Message Validation**
   - Type-safe message passing
   - Input validation
   - Error handling

### 7. Best Practices

1. **Code Organization**
   - Clear separation of concerns
   - Modular component structure
   - TypeScript for type safety

2. **Performance**
   - Lazy loading where appropriate
   - Efficient DOM updates
   - Debounced user inputs

3. **Error Handling**
   - Comprehensive error catching
   - User-friendly error messages
   - Graceful degradation

### 8. Future Enhancements

1. **Functionality**
   - Prompt templates system
   - Enhanced file filtering
   - Advanced tree visualization
   - Prompt history management

2. **Performance**
   - File content caching
   - Virtual scrolling
   - Optimized tree rendering

3. **UI/UX**
   - Keyboard shortcuts
   - Drag-and-drop support
   - Theme customization
   - Accessibility improvements

## Development Guidelines

1. **Adding New Features**
   - Maintain context separation
   - Follow message-passing pattern
   - Update type definitions
   - Add error handling

2. **Testing**
   - Unit tests for core functionality
   - Integration tests for messaging
   - UI component testing
   - End-to-end testing

3. **Code Style**
   - Follow TypeScript best practices
   - Document public APIs
   - Maintain consistent formatting
   - Use meaningful naming

## Conclusion

This architecture provides a robust foundation for the VS Code Prompt Builder Extension, with clear separation of concerns, type-safe communication, and extensible component structure. The design prioritizes maintainability, security, and user experience while providing flexibility for future enhancements. 