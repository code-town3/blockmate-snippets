import * as vscode from 'vscode';
import { SnippetManager } from '../snippetManager';
import { Snippet } from '../models/snippet';

/**
 * Completion provider for BlockMate Snippets
 * Provides auto-completion suggestions for snippets
 */
export class SnippetProvider implements vscode.CompletionItemProvider {
    private snippetManager: SnippetManager;

    constructor(snippetManager: SnippetManager) {
        this.snippetManager = snippetManager;
    }

    /**
     * Provide completion items
     */
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[]> {
        const completionItems: vscode.CompletionItem[] = [];

        try {
            // Get current file type
            const fileType = this.getFileType(document.fileName);

            // Get snippets for current file type
            const snippets = await this.snippetManager.getSnippetsForFileType(fileType);

            // Create completion items for each snippet
            for (const snippet of snippets) {
                const completionItem = this.createCompletionItem(snippet, position);
                completionItems.push(completionItem);
            }

            // Sort by usage count (most used first)
            completionItems.sort((a, b) => {
                const aUsage = (a.detail as string)?.match(/Usage: (\d+)/)?.[1] || '0';
                const bUsage = (b.detail as string)?.match(/Usage: (\d+)/)?.[1] || '0';
                return parseInt(bUsage) - parseInt(aUsage);
            });

        } catch (error) {
            console.error('Failed to provide completion items:', error);
        }

        return completionItems;
    }

    /**
     * Create completion item from snippet
     */
    private createCompletionItem(snippet: Snippet, position: vscode.Position): vscode.CompletionItem {
        const completionItem = new vscode.CompletionItem(
            snippet.prefix,
            vscode.CompletionItemKind.Snippet
        );

        completionItem.detail = `${snippet.name} | Usage: ${snippet.usageCount}`;
        completionItem.documentation = snippet.description || snippet.body.substring(0, 100) + '...';
        
        // Add tags as additional information
        if (snippet.tags.length > 0) {
            completionItem.documentation = new vscode.MarkdownString(
                `${snippet.description || ''}\n\n**Tags:** ${snippet.tags.join(', ')}\n\n**Code:**\n\`\`\`\n${snippet.body}\n\`\`\``
            );
        }

        // Set insert text
        completionItem.insertText = snippet.body;

        // Add snippet to manager for usage tracking
        completionItem.command = {
            command: 'blockmate.trackSnippetUsage',
            title: 'Track Usage',
            arguments: [snippet.id]
        };

        return completionItem;
    }

    /**
     * Get trigger characters for completion
     */
    getTriggerCharacters(): string[] {
        return ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    }

    /**
     * Get file type from file name
     */
    private getFileType(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return extension || 'txt';
    }
} 
