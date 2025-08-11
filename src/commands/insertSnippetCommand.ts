import * as vscode from "vscode";
import { SnippetManager } from "../snippetManager";

/**
 * Command to insert a snippet into the current editor
 */
export class InsertSnippetCommand {
  private snippetManager: SnippetManager;

  constructor(snippetManager: SnippetManager) {
    this.snippetManager = snippetManager;
  }

  /**
   * Execute the insert snippet command
   */
  async execute(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found");
      return;
    }

    // Get current file type
    const fileType = this.getFileType(editor.document.fileName);

    // Get snippets for current file type
    const snippets = await this.snippetManager.getSnippetsForFileType(fileType);

    if (snippets.length === 0) {
      vscode.window.showInformationMessage(
        "No snippets available for this file type"
      );
      return;
    }

    // Show snippet picker
    const selectedSnippet = await this.showSnippetPicker(snippets);
    if (selectedSnippet) {
      await this.snippetManager.insertSnippet(selectedSnippet, editor);
    }
  }

  /**
   * Show snippet picker with quick pick
   */
  private async showSnippetPicker(snippets: any[]): Promise<any | undefined> {
    const items = snippets.map((snippet) => ({
      label: snippet.name,
      description: snippet.description || "",
      detail: `Prefix: ${snippet.prefix} | Tags: ${snippet.tags.join(
        ", "
      )} | Usage: ${snippet.usageCount}`,
      snippet: snippet,
    }));

    // Sort by usage count (most used first)
    items.sort((a, b) => b.snippet.usageCount - a.snippet.usageCount);

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: "Select a snippet to insert",
      matchOnDescription: true,
      matchOnDetail: true,
    });

    return selected?.snippet;
  }

  /**
   * Get file type from file name
   */
  private getFileType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension || "txt";
  }
}
