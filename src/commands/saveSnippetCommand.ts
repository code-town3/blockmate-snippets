import * as vscode from 'vscode';
import { SnippetManager } from '../snippetManager';

/**
 * Command to save selected text as a snippet
 */
export class SaveSnippetCommand {
    private snippetManager: SnippetManager;

    constructor(snippetManager: SnippetManager) {
        this.snippetManager = snippetManager;
    }

    /**
     * Execute the save snippet command
     */
    async execute(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('Please select some text to create a snippet');
            return;
        }

        try {
            const snippet = await this.snippetManager.createSnippetFromSelection(editor);
            if (snippet) {
                console.log(`Snippet "${snippet.name}" created successfully`);
            }
        } catch (error) {
            console.error('Failed to create snippet:', error);
            vscode.window.showErrorMessage('Failed to create snippet');
        }
    }
} 
