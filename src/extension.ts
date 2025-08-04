import * as vscode from "vscode";
import { SnippetManager } from "./snippetManager";
import { SnippetStorage } from "./storage/snippetStorage";
import { SnippetProvider } from "./providers/snippetProvider";
import { SaveSnippetCommand } from "./commands/saveSnippetCommand";
import { ManageSnippetsCommand } from "./commands/manageSnippetsCommand";
import { InsertSnippetCommand } from "./commands/insertSnippetCommand";

/**
 * BlockMate Snippets Extension
 * Advanced code snippets management with smart organization and tagging
 */
export function activate(context: vscode.ExtensionContext) {
  // Create output channel for debugging
  const outputChannel = vscode.window.createOutputChannel("BlockMate Snippets");

  outputChannel.appendLine("BlockMate Snippets extension is now active!");
  console.log("BlockMate Snippets extension is now active!");
  vscode.window.showInformationMessage("BlockMate Snippets is now active!");

  try {
    // Initialize core services
    const storage = new SnippetStorage(context.globalStorageUri);
    const snippetManager = new SnippetManager(storage);
    const snippetProvider = new SnippetProvider(snippetManager);

    // Register commands
    const saveSnippetCommand = new SaveSnippetCommand(snippetManager);
    const manageSnippetsCommand = new ManageSnippetsCommand(
      snippetManager,
      snippetProvider
    );
    const insertSnippetCommand = new InsertSnippetCommand(snippetManager);

    // Register command handlers
    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.saveSnippet", () => {
        outputChannel.appendLine("Save snippet command executed");
        console.log("Save snippet command executed");
        saveSnippetCommand.execute();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.manageSnippets", () => {
        outputChannel.appendLine("Manage snippets command executed");
        console.log("Manage snippets command executed");
        manageSnippetsCommand.execute();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.insertSnippet", () => {
        outputChannel.appendLine("Insert snippet command executed");
        console.log("Insert snippet command executed");
        insertSnippetCommand.execute();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.deleteSnippet", () => {
        outputChannel.appendLine("Delete snippet command executed");
        console.log("Delete snippet command executed");
        manageSnippetsCommand.deleteSnippetWithQuickPick();
      })
    );

    // Register completion provider for auto-completion
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { scheme: "file" },
        snippetProvider,
        ...snippetProvider.getTriggerCharacters()
      )
    );

    // Initialize storage
    storage
      .initialize()
      .then(() => {
        outputChannel.appendLine(
          "BlockMate Snippets storage initialized successfully"
        );
        console.log("BlockMate Snippets storage initialized successfully");
        vscode.window.showInformationMessage(
          "BlockMate Snippets storage initialized successfully"
        );
      })
      .catch((error) => {
        outputChannel.appendLine(`Failed to initialize storage: ${error}`);
        console.error(
          "Failed to initialize BlockMate Snippets storage:",
          error
        );
        vscode.window.showErrorMessage(
          "Failed to initialize BlockMate Snippets storage"
        );
      });

    outputChannel.appendLine("All commands registered successfully");
    console.log("All commands registered successfully");

    // Show output channel
    outputChannel.show();
  } catch (error) {
    outputChannel.appendLine(`Error during extension activation: ${error}`);
    console.error("Error during extension activation:", error);
    vscode.window.showErrorMessage(
      "Error during extension activation: " + error
    );
  }
}

export function deactivate() {
  console.log("BlockMate Snippets extension is now deactivated!");
}
