import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import { SnippetStorage } from "./storage/snippetStorage";
import { Snippet, SnippetRequest } from "./models/snippet";

/**
 * Main snippet management class for BlockMate Snippets
 * Handles all snippet operations and business logic
 */
export class SnippetManager {
  private storage: SnippetStorage;

  constructor(storage: SnippetStorage) {
    this.storage = storage;
  }

  /**
   * Create a new snippet from selected text
   */
  async createSnippetFromSelection(
    editor: vscode.TextEditor
  ): Promise<Snippet | null> {
    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage(
        "Please select some text to create a snippet"
      );
      return null;
    }

    const selectedText = editor.document.getText(selection);
    const fileType = this.getFileType(editor.document.fileName);

    // Validate selected text (snippet body)
    if (!selectedText || selectedText.trim().length === 0) {
      vscode.window.showErrorMessage("Selected text cannot be empty");
      return null;
    }

    // Check snippet body length
    if (selectedText.length > 10000) {
      vscode.window.showErrorMessage(
        "Selected text is too long. Maximum 10,000 characters allowed."
      );
      return null;
    }

    // Check for dangerous patterns in snippet body
    const dangerousPatterns = [
      "javascript:alert(",
      "data:text/html,<script>",
      "vbscript:msgbox(",
      "onload=alert(",
      "onerror=alert(",
      "msgbox(",
      "../../../",
      "../.././",
      "../../../../",
      "../",
      "..\\",
      "%3Cscript%3E",
      "%3C/script%3E",
      "etc/passwd",
      "etc/shadow",
      "windows/system32",
      "c:\\windows",
    ];

    for (const pattern of dangerousPatterns) {
      if (selectedText.toLowerCase().includes(pattern.toLowerCase())) {
        vscode.window.showErrorMessage(
          `Selected text contains dangerous pattern: ${pattern}`
        );
        return null;
      }
    }

    // Show input dialog for snippet details
    const snippetData = await this.showSnippetInputDialog(
      selectedText,
      fileType
    );
    if (!snippetData) {
      return null;
    }

    // Additional security validation before creating snippet
    const outputChannel =
      vscode.window.createOutputChannel("BlockMate Snippets");
    outputChannel.appendLine(
      "🔍 DEBUG: Validating snippet data: " + JSON.stringify(snippetData)
    );
    const finalValidation = this.validateSnippetData(snippetData);
    outputChannel.appendLine(
      "🔍 DEBUG: Final validation result: " + finalValidation
    );
    if (finalValidation) {
      outputChannel.appendLine(
        "🚨 DEBUG: Validation failed, showing error: " + finalValidation
      );
      vscode.window.showErrorMessage(finalValidation);
      return null;
    }
    outputChannel.appendLine("✅ DEBUG: Validation passed, creating snippet");

    // Create snippet object
    const snippet: Snippet = {
      id: uuidv4(),
      name: snippetData.name,
      prefix: snippetData.prefix,
      description: snippetData.description,
      body: selectedText,
      tags: snippetData.tags || [],
      fileTypes: snippetData.fileTypes || [fileType],
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isFavorite: false,
      scope: snippetData.scope || "global",
    };

    // Save to storage
    await this.storage.saveSnippet(snippet);

    vscode.window.showInformationMessage(
      `Snippet "${snippet.name}" created successfully!`
    );
    return snippet;
  }

  /**
   * Show input dialog for snippet details
   */
  private async showSnippetInputDialog(
    selectedText: string,
    fileType: string
  ): Promise<SnippetRequest | null> {
    // Get snippet name
    const name = await vscode.window.showInputBox({
      prompt: "Enter snippet name",
      placeHolder: "e.g., React Functional Component",
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return "Name is required";
        }

        // Security validation for snippet name
        const trimmedValue = value.trim();

        // Check for dangerous patterns
        const dangerousPatterns = [
          "<script",
          "<iframe",
          "<object",
          "<embed",
          "<form",
          "javascript:",
          "data:",
          "vbscript:",
          "onload",
          "onerror",
          "alert(",
          "confirm(",
          "prompt(",
          "eval(",
          "Function(",
          // Test 4 için eklenen yeni pattern'lar
          "javascript:alert(",
          "data:text/html,<script>",
          "vbscript:msgbox(",
          "onload=alert(",
          "onerror=alert(",
          "msgbox(",
          // Test 5 için eklenen HTML/XML tag pattern'ları
          "<iframe src=",
          "<object data=",
          "<embed src=",
          "<form action=",
          // Test 8 için eklenen özel karakterler ve path traversal pattern'ları
          "../../../",
          "../.././",
          "../../../../",
          "../",
          "..\\",
          "%3Cscript%3E",
          "%3C/script%3E",
          "etc/passwd",
          "etc/shadow",
          "windows/system32",
          "c:\\windows",
        ];

        for (const pattern of dangerousPatterns) {
          if (trimmedValue.toLowerCase().includes(pattern.toLowerCase())) {
            return `Name contains dangerous pattern: ${pattern}`;
          }
        }

        // Check for HTML/XML tags
        if (/<[^>]*>/.test(trimmedValue)) {
          return "Name contains HTML/XML tags which are not allowed";
        }

        // Check length limit
        if (trimmedValue.length > 200) {
          return "Name is too long. Maximum 200 characters allowed.";
        }

        return null;
      },
    });

    if (!name) return null;

    // Get snippet prefix
    const prefix = await vscode.window.showInputBox({
      prompt: "Enter snippet prefix (shortcut)",
      placeHolder: "e.g., rfc",
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return "Prefix is required";
        }

        // Security validation for snippet prefix
        const trimmedValue = value.trim();

        // Check for dangerous patterns
        const dangerousPatterns = [
          "<script",
          "<iframe",
          "<object",
          "<embed",
          "<form",
          "javascript:",
          "data:",
          "vbscript:",
          "onload",
          "onerror",
          "alert(",
          "confirm(",
          "prompt(",
          "eval(",
          "Function(",
          // Test 4 için eklenen yeni pattern'lar
          "javascript:alert(",
          "data:text/html,<script>",
          "vbscript:msgbox(",
          "onload=alert(",
          "onerror=alert(",
          "msgbox(",
          // Test 5 için eklenen HTML/XML tag pattern'ları
          "<iframe src=",
          "<object data=",
          "<embed src=",
          "<form action=",
          // Test 8 için eklenen özel karakterler ve path traversal pattern'ları
          "../../../",
          "../.././",
          "../../../../",
          "../",
          "..\\",
          "%3Cscript%3E",
          "%3C/script%3E",
          "etc/passwd",
          "etc/shadow",
          "windows/system32",
          "c:\\windows",
        ];

        for (const pattern of dangerousPatterns) {
          if (trimmedValue.toLowerCase().includes(pattern.toLowerCase())) {
            return `Prefix contains dangerous pattern: ${pattern}`;
          }
        }

        // Check for HTML/XML tags
        if (/<[^>]*>/.test(trimmedValue)) {
          return "Prefix contains HTML/XML tags which are not allowed";
        }

        // Check length limit
        if (trimmedValue.length > 50) {
          return "Prefix is too long. Maximum 50 characters allowed.";
        }

        // Check for valid characters only
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedValue)) {
          return "Prefix can only contain letters, numbers, hyphens and underscores";
        }

        return null;
      },
    });

    if (!prefix) return null;

    // Get description (optional)
    const description = await vscode.window.showInputBox({
      prompt: "Enter description (optional)",
      placeHolder: "e.g., Creates a React functional component",
      validateInput: (value) => {
        if (!value) return null; // Optional field

        const trimmedValue = value.trim();

        // Check for dangerous patterns
        const dangerousPatterns = [
          "<script",
          "<iframe",
          "<object",
          "<embed",
          "<form",
          "javascript:",
          "data:",
          "vbscript:",
          "onload",
          "onerror",
          "alert(",
          "confirm(",
          "prompt(",
          "eval(",
          "Function(",
          // Test 4 için eklenen yeni pattern'lar
          "javascript:alert(",
          "data:text/html,<script>",
          "vbscript:msgbox(",
          "onload=alert(",
          "onerror=alert(",
          "msgbox(",
          // Test 5 için eklenen HTML/XML tag pattern'ları
          "<iframe src=",
          "<object data=",
          "<embed src=",
          "<form action=",
          // Test 8 için eklenen özel karakterler ve path traversal pattern'ları
          "../../../",
          "../.././",
          "../../../../",
          "../",
          "..\\",
          "%3Cscript%3E",
          "%3C/script%3E",
          "etc/passwd",
          "etc/shadow",
          "windows/system32",
          "c:\\windows",
        ];

        for (const pattern of dangerousPatterns) {
          if (trimmedValue.toLowerCase().includes(pattern.toLowerCase())) {
            return `Description contains dangerous pattern: ${pattern}`;
          }
        }

        // Check for HTML/XML tags
        if (/<[^>]*>/.test(trimmedValue)) {
          return "Description contains HTML/XML tags which are not allowed";
        }

        // Check length limit
        if (trimmedValue.length > 1000) {
          return "Description is too long. Maximum 1000 characters allowed.";
        }

        return null;
      },
    });

    // Get tags
    const tagsInput = await vscode.window.showInputBox({
      prompt: "Enter tags (comma-separated)",
      placeHolder: "e.g., react, frontend, component",
      validateInput: (value) => {
        if (!value) return null; // Optional field

        const tags = value
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        // Check for dangerous patterns in tags
        const dangerousPatterns = [
          "<script",
          "<iframe",
          "<object",
          "<embed",
          "<form",
          "javascript:",
          "data:",
          "vbscript:",
          "onload",
          "onerror",
          "alert(",
          "confirm(",
          "prompt(",
          "eval(",
          "Function(",
          "../../../",
          "../.././",
          "../../../../",
          "../",
          "..\\",
          "%3Cscript%3E",
          "%3C/script%3E",
          "etc/passwd",
          "etc/shadow",
          "windows/system32",
          "c:\\windows",
        ];

        for (const tag of tags) {
          for (const pattern of dangerousPatterns) {
            if (tag.toLowerCase().includes(pattern.toLowerCase())) {
              return `Tag contains dangerous pattern: ${pattern}`;
            }
          }

          // Check for HTML/XML tags
          if (/<[^>]*>/.test(tag)) {
            return "Tags cannot contain HTML/XML tags";
          }

          // Check length limit
          if (tag.length > 50) {
            return "Tag is too long. Maximum 50 characters allowed.";
          }
        }

        // Check total number of tags
        if (tags.length > 20) {
          return "Too many tags. Maximum 20 tags allowed.";
        }

        return null;
      },
    });

    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : [];

    // Get file types
    const fileTypesInput = await vscode.window.showInputBox({
      prompt: "Enter file types (comma-separated)",
      placeHolder: `e.g., ${fileType}, js, jsx, ts, tsx`,
      value: fileType,
      validateInput: (value) => {
        if (!value) return "File types are required";

        const fileTypes = value
          .split(",")
          .map((type) => type.trim())
          .filter((type) => type.length > 0);

        // Check for dangerous patterns in file types
        const dangerousPatterns = [
          "<script",
          "<iframe",
          "<object",
          "<embed",
          "<form",
          "javascript:",
          "data:",
          "vbscript:",
          "onload",
          "onerror",
          "alert(",
          "confirm(",
          "prompt(",
          "eval(",
          "Function(",
          "../../../",
          "../.././",
          "../../../../",
          "../",
          "..\\",
          "%3Cscript%3E",
          "%3C/script%3E",
          "etc/passwd",
          "etc/shadow",
          "windows/system32",
          "c:\\windows",
        ];

        for (const fileType of fileTypes) {
          for (const pattern of dangerousPatterns) {
            if (fileType.toLowerCase().includes(pattern.toLowerCase())) {
              return `File type contains dangerous pattern: ${pattern}`;
            }
          }

          // Check for HTML/XML tags
          if (/<[^>]*>/.test(fileType)) {
            return "File types cannot contain HTML/XML tags";
          }

          // Check length limit
          if (fileType.length > 20) {
            return "File type is too long. Maximum 20 characters allowed.";
          }

          // Check for valid file type format (alphanumeric, dots, hyphens)
          if (!/^[a-zA-Z0-9._-]+$/.test(fileType)) {
            return "File type can only contain letters, numbers, dots, hyphens and underscores";
          }
        }

        // Check total number of file types
        if (fileTypes.length > 10) {
          return "Too many file types. Maximum 10 file types allowed.";
        }

        return null;
      },
    });

    const fileTypes = fileTypesInput
      ? fileTypesInput
          .split(",")
          .map((type) => type.trim())
          .filter((type) => type.length > 0)
      : [fileType];

    return {
      name: name.trim(),
      prefix: prefix.trim(),
      description: description?.trim(),
      body: selectedText,
      tags,
      fileTypes,
      scope: "global",
    };
  }

  /**
   * Insert snippet into current editor
   */
  async insertSnippet(
    snippet: Snippet,
    editor: vscode.TextEditor
  ): Promise<void> {
    try {
      // Replace selection with snippet body
      await editor.edit((editBuilder) => {
        editBuilder.replace(editor.selection, snippet.body);
      });

      // Increment usage count
      await this.storage.incrementUsage(snippet.id);

      // Show success message
      vscode.window.showInformationMessage(
        `Snippet "${snippet.name}" inserted successfully!`
      );
    } catch (error) {
      console.error("Failed to insert snippet:", error);
      vscode.window.showErrorMessage("Failed to insert snippet");
    }
  }

  /**
   * Get snippets for current file type
   */
  async getSnippetsForFileType(fileType: string): Promise<Snippet[]> {
    const allSnippets = await this.storage.getAllSnippets();
    return allSnippets.filter(
      (snippet) =>
        snippet.fileTypes.includes(fileType) || snippet.fileTypes.includes("*")
    );
  }

  /**
   * Search snippets
   */
  async searchSnippets(
    searchTerm: string,
    filters?: {
      tags?: string[];
      fileTypes?: string[];
      favoritesOnly?: boolean;
    }
  ): Promise<Snippet[]> {
    return await this.storage.searchSnippets(searchTerm, filters);
  }

  /**
   * Update snippet
   */
  async updateSnippet(id: string, updates: Partial<Snippet>): Promise<void> {
    await this.storage.updateSnippet(id, updates);
  }

  /**
   * Delete snippet
   */
  async deleteSnippet(id: string): Promise<void> {
    await this.storage.deleteSnippet(id);
  }

  /**
   * Toggle favorite status
   */
  async toggleFavorite(id: string): Promise<void> {
    const snippet = await this.storage.getSnippet(id);
    if (snippet) {
      await this.storage.updateSnippet(id, { isFavorite: !snippet.isFavorite });
    }
  }

  /**
   * Get snippet statistics
   */
  async getStats(): Promise<{
    totalSnippets: number;
    totalUsage: number;
    storageSize: number;
  }> {
    return await this.storage.getStats();
  }

  /**
   * Export snippets
   */
  async exportSnippets(): Promise<void> {
    const options: vscode.SaveDialogOptions = {
      saveLabel: "Export Snippets",
      filters: {
        "JSON files": ["json"],
      },
    };

    const fileUri = await vscode.window.showSaveDialog(options);
    if (fileUri) {
      await this.storage.exportSnippets(fileUri.fsPath);
      vscode.window.showInformationMessage("Snippets exported successfully!");
    }
  }

  /**
   * Import snippets
   */
  async importSnippets(): Promise<void> {
    const options: vscode.OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Import Snippets",
      filters: {
        "JSON files": ["json"],
      },
    };

    const fileUri = await vscode.window.showOpenDialog(options);
    if (fileUri && fileUri.length > 0) {
      try {
        // Ask user whether to clear existing snippets
        const clearExisting = await vscode.window.showWarningMessage(
          "Do you want to clear existing snippets before importing?",
          { modal: true },
          "Yes, Clear All",
          "No, Add to Existing"
        );

        const shouldClear = clearExisting === "Yes, Clear All";

        await this.storage.importSnippets(fileUri[0].fsPath, shouldClear);

        const action = shouldClear ? "replaced" : "added to";
        vscode.window.showInformationMessage(
          `Snippets imported successfully and ${action} existing snippets!`
        );
      } catch (error) {
        console.error("Import error:", error);
        vscode.window.showErrorMessage(
          `Import failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }

  /**
   * Get file type from file name
   */
  private getFileType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();
    return extension || "txt";
  }

  /**
   * Get all snippets
   */
  async getAllSnippets(): Promise<Snippet[]> {
    return await this.storage.getAllSnippets();
  }

  /**
   * Get snippet by ID
   */
  async getSnippet(id: string): Promise<Snippet | undefined> {
    return await this.storage.getSnippet(id);
  }

  /**
   * Validate snippet data before creation
   */
  private validateSnippetData(data: SnippetRequest): string | null {
    const outputChannel =
      vscode.window.createOutputChannel("BlockMate Snippets");
    outputChannel.appendLine(
      "🔍 DEBUG: validateSnippetData called with: " + JSON.stringify(data)
    );

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      outputChannel.appendLine("🚨 DEBUG: Name is empty");
      return "Name is required";
    }

    const trimmedName = data.name.trim();
    outputChannel.appendLine("🔍 DEBUG: Trimmed name: " + trimmedName);

    // Check for dangerous patterns
    const dangerousPatterns = [
      "<script",
      "<iframe",
      "<object",
      "<embed",
      "<form",
      "javascript:",
      "data:",
      "vbscript:",
      "onload",
      "onerror",
      "alert(",
      "confirm(",
      "prompt(",
      "eval(",
      "Function(",
      // Test 4 için eklenen yeni pattern'lar
      "javascript:alert(",
      "data:text/html,<script>",
      "vbscript:msgbox(",
      "onload=alert(",
      "onerror=alert(",
      "msgbox(",
      // Test 5 için eklenen HTML/XML tag pattern'ları
      "<iframe src=",
      "<object data=",
      "<embed src=",
      "<form action=",
      // Test 8 için eklenen özel karakterler ve path traversal pattern'ları
      "../../../",
      "../.././",
      "../../../../",
      "../",
      "..\\",
      "%3Cscript%3E",
      "%3C/script%3E",
      "etc/passwd",
      "etc/shadow",
      "windows/system32",
      "c:\\windows",
    ];

    for (const pattern of dangerousPatterns) {
      if (trimmedName.toLowerCase().includes(pattern.toLowerCase())) {
        outputChannel.appendLine(
          "🚨 DEBUG: Dangerous pattern found: " + pattern
        );
        return `Name contains dangerous pattern: ${pattern}`;
      }
    }

    // Check for HTML/XML tags
    if (/<[^>]*>/.test(trimmedName)) {
      outputChannel.appendLine("🚨 DEBUG: HTML/XML tags found");
      return "Name contains HTML/XML tags which are not allowed";
    }

    // Check length limit
    if (trimmedName.length > 200) {
      outputChannel.appendLine(
        "🚨 DEBUG: Name too long: " + trimmedName.length + " characters"
      );
      return "Name is too long. Maximum 200 characters allowed.";
    }

    // Validate prefix
    if (!data.prefix || data.prefix.trim().length === 0) {
      return "Prefix is required";
    }

    const trimmedPrefix = data.prefix.trim();

    // Check prefix for dangerous patterns
    for (const pattern of dangerousPatterns) {
      if (trimmedPrefix.toLowerCase().includes(pattern.toLowerCase())) {
        return `Prefix contains dangerous pattern: ${pattern}`;
      }
    }

    // Check prefix length
    if (trimmedPrefix.length > 50) {
      return "Prefix is too long. Maximum 50 characters allowed.";
    }

    // Check prefix format
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedPrefix)) {
      return "Prefix can only contain letters, numbers, hyphens and underscores";
    }

    outputChannel.appendLine("✅ DEBUG: All validations passed");
    return null;
  }
}
