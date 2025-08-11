import * as vscode from "vscode";
import { SnippetManager } from "./snippetManager";
import { SnippetStorage } from "./storage/snippetStorage";
import { SnippetProvider } from "./providers/snippetProvider";
import { SaveSnippetCommand } from "./commands/saveSnippetCommand";
import { ManageSnippetsCommand } from "./commands/manageSnippetsCommand";
import { InsertSnippetCommand } from "./commands/insertSnippetCommand";
import { EncryptionCommand } from "./commands/encryptionCommand";
import { EncryptionService } from "./services/encryptionService";
import { PinProtectionCommand } from "./commands/pinProtectionCommand";
import { PinProtectionService } from "./services/pinProtectionService";
import { ManageFoldersCommand } from "./commands/manageFoldersCommand";
import { AuditService } from "./services/auditService";
import { TestAuditCommand } from "./commands/testAuditCommand";
import { FolderPreviewProvider } from "./providers/folderPreviewProvider";
import { DragDropProvider } from "./providers/dragDropProvider";
import { SecurityTestCommand } from "./commands/securityTestCommand";

/**
 * BlockMate Snippets Extension
 * Advanced code snippets management with smart organization and tagging
 */
export async function activate(context: vscode.ExtensionContext) {
  // Create output channel for debugging
  const outputChannel = vscode.window.createOutputChannel("BlockMate Snippets");

  try {
    outputChannel.appendLine("BlockMate Snippets extension is now active!");
    console.log("BlockMate Snippets extension is now active!");

    // Check if storage URI is available
    if (!context.globalStorageUri) {
      throw new Error("Global storage URI is not available");
    }

    vscode.window.showInformationMessage("BlockMate Snippets is now active!");

    // Initialize core services
    const storage = new SnippetStorage(
      context.globalStorageUri,
      context.secrets
    );
    const snippetManager = new SnippetManager(storage, context.secrets);
    const snippetProvider = new SnippetProvider(snippetManager);
    const encryptionService = new EncryptionService(context.secrets);
    const auditService = new AuditService(context.globalStorageUri);
    const pinProtectionService = new PinProtectionService(
      context.secrets,
      auditService
    );

    // Initialize webview providers
    const folderPreviewProvider = new FolderPreviewProvider(
      context.extensionUri,
      snippetManager
    );

    // Initialize drag & drop provider
    const dragDropProvider = new DragDropProvider(snippetManager);

    // Store services in context for disposal
    context.subscriptions.push({
      dispose: async () => {
        snippetManager.dispose();
        await auditService.dispose();
      },
    });

    // Initialize snippet manager (which includes PIN protection service)
    await snippetManager.initialize();

    // Register commands
    const saveSnippetCommand = new SaveSnippetCommand(snippetManager);
    const manageSnippetsCommand = new ManageSnippetsCommand(
      snippetManager,
      snippetProvider
    );
    const insertSnippetCommand = new InsertSnippetCommand(snippetManager);
    const encryptionCommand = new EncryptionCommand(encryptionService);
    const pinProtectionCommand = new PinProtectionCommand(
      pinProtectionService,
      snippetManager
    );
    const manageFoldersCommand = new ManageFoldersCommand(snippetManager);
    const testAuditCommand = new TestAuditCommand(auditService);
    const securityTestCommand = new SecurityTestCommand(
      snippetManager,
      encryptionService,
      pinProtectionService,
      auditService
    );

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

    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.manageEncryption", () => {
        outputChannel.appendLine("Manage encryption command executed");
        console.log("Manage encryption command executed");
        encryptionCommand.execute();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.managePinProtection", () => {
        outputChannel.appendLine("Manage PIN protection command executed");
        console.log("Manage PIN protection command executed");
        pinProtectionCommand.execute();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.manageFolders", () => {
        outputChannel.appendLine("Manage folders command executed");
        console.log("Manage folders command executed");
        manageFoldersCommand.execute();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.testAudit", () => {
        outputChannel.appendLine("Test audit command executed");
        console.log("Test audit command executed");
        testAuditCommand.execute();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand("blockmate.securityTest", () => {
        outputChannel.appendLine("Security test command executed");
        console.log("Security test command executed");
        securityTestCommand.execute();
      })
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        "blockmate.quickCreateSnippet",
        async () => {
          outputChannel.appendLine("Quick create snippet command executed");
          console.log("Quick create snippet command executed");

          const editor = vscode.window.activeTextEditor;
          if (editor && editor.selection) {
            const selectedText = editor.document.getText(editor.selection);
            if (selectedText.trim()) {
              const folder = await dragDropProvider.selectFolder();
              if (folder) {
                await dragDropProvider.createSnippetFromCode(
                  selectedText,
                  folder
                );
                vscode.window.showInformationMessage(
                  `✅ Snippet created in "${folder.name}" folder!`
                );
              }
            } else {
              vscode.window.showWarningMessage(
                "Please select some code first!"
              );
            }
          } else {
            vscode.window.showWarningMessage("Please select some code first!");
          }
        }
      )
    );

    // Register completion provider for auto-completion
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { scheme: "file" },
        snippetProvider,
        ...snippetProvider.getTriggerCharacters()
      )
    );

    // Register webview providers
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        FolderPreviewProvider.viewType,
        folderPreviewProvider
      )
    );

    // Register drag & drop provider
    dragDropProvider.register();
    context.subscriptions.push(dragDropProvider);

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
