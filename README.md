# Prompt Builder for Code Context

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A VS Code extension that helps you quickly assemble prompt inputs for large language models directly from your codebase.

## Features
- 🔍 File selection with a searchable dropdown
- 🔄 One-click refresh to re-fetch the codebase file tree
- 🗑️ "Clear all files" button to reset the prompt context
- 🌳 Codebase tree visualization to provide structural context
- ✏️ Integrated prompt editor with a live token count
- 📋 Copy-to-clipboard functionality for easy prompt usage in external tools

## Installation
Install this extension from the [Visual Studio Code Marketplace](marketplace-link-here).

## Usage
1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)
2. Run `Prompt Builder: Open Prompt Panel` or only `One Prompt Panel`
3. Search and select files from your codebase to add to context
4. Toggle codebase tree inclusion and adjust depth
5. Write or modify your prompt in the Prompt Editor
6. Copy the final prompt with a single click

## Configuration
- Files are read from the current workspace
- Respects `.gitignore` patterns for file exclusion
- Customizable depth for codebase tree visualization

## Troubleshooting
If you encounter any issues, please visit our [GitHub Issues](github-link-here) page.

## Contributing
We welcome contributions! Please see our contributing guidelines for more details.

## License
MIT
