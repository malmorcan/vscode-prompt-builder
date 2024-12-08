import * as vscode from 'vscode';
import { PromptPanel } from './webview/panel';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('myPromptExtension.openPanel', () => {
        PromptPanel.createOrShow(context.extensionUri, context);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
