import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import { SnippetStorage } from "./storage/snippetStorage";
import { FolderStorage } from "./storage/folderStorage";
import { Snippet, SnippetRequest } from "./models/snippet";
import { Folder } from "./models/folder";
import { PinProtectionService } from "./services/pinProtectionService";

/**
 * Main snippet management class for BlockMate Snippets
 * Handles all snippet operations and business logic
 */

export class SnippetManager {
  private storage: SnippetStorage;
  private folderStorage: FolderStorage;
  private pinProtectionService: PinProtectionService;
  private isPinVerified: boolean = false;
  private pinVerificationTime: number = 0;
  private readonly PIN_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
  private pinSessionTimer: NodeJS.Timeout | undefined;

  constructor(storage: SnippetStorage, secretStorage?: vscode.SecretStorage) {
    this.storage = storage;
    this.folderStorage = new FolderStorage();
    this.pinProtectionService = new PinProtectionService(secretStorage);
  }

  /**
   * Initialize the snippet manager
   */
  async initialize(): Promise<void> {
    // Initialize PIN protection service
    await this.pinProtectionService.initialize();

    // Start PIN session monitoring
    this.startPinSessionMonitoring();
  }

  /**
   * Start monitoring PIN session expiration
   */
  private startPinSessionMonitoring(): void {
    // Clear any existing timer
    if (this.pinSessionTimer) {
      clearInterval(this.pinSessionTimer);
    }

    // Check every minute if PIN session has expired
    this.pinSessionTimer = setInterval(() => {
      this.checkPinSessionExpiration();
    }, 60 * 1000); // Check every minute
  }

  /**
   * Check if PIN session has expired and force re-verification if needed
   */
  private async checkPinSessionExpiration(): Promise<void> {
    const status = this.pinProtectionService.getPinProtectionStatus();

    // Only check if PIN protection is enabled and PIN is currently verified
    if (!status.enabled || !this.isPinVerified) {
      return;
    }

    // Check if session has expired
    if (Date.now() - this.pinVerificationTime >= this.PIN_SESSION_DURATION) {
      console.log("PIN session expired, forcing re-verification");

      // Reset PIN session
      this.isPinVerified = false;
      this.pinVerificationTime = 0;

      // Show notification to user with more prominent display
      const action = await vscode.window.showWarningMessage(
        "🔒 PIN session expired. Please re-enter your PIN to continue using snippets.",
        { modal: true },
        "Enter PIN",
        "Cancel"
      );

      if (action === "Enter PIN") {
        // Force PIN verification by calling checkPinVerification
        await this.checkPinVerification();
      }
    }
  }

  /**
   * Dispose of the snippet manager and clean up resources
   */
  public dispose(): void {
    if (this.pinSessionTimer) {
      clearInterval(this.pinSessionTimer);
      this.pinSessionTimer = undefined;
    }
  }

  /**
   * Check if PIN verification is required and handle it
   */
  private async checkPinVerification(): Promise<boolean> {
    const status = this.pinProtectionService.getPinProtectionStatus();

    if (!status.enabled) {
      return true; // No PIN protection enabled
    }

    if (status.locked) {
      vscode.window.showErrorMessage(
        `Account is locked. Try again in ${status.remainingLockoutTime} minutes.`
      );
      return false;
    }

    // Check if PIN is already verified and session is still valid
    if (
      this.isPinVerified &&
      Date.now() - this.pinVerificationTime < this.PIN_SESSION_DURATION
    ) {
      return true; // PIN already verified and session is valid
    }

    // Show PIN input dialog
    const pin = await vscode.window.showInputBox({
      prompt: "Enter PIN to access snippets",
      password: true,
    });

    if (!pin) {
      return false;
    }

    try {
      const isValid = await this.pinProtectionService.verifyPin(pin);

      if (isValid) {
        this.isPinVerified = true;
        this.pinVerificationTime = Date.now();
        vscode.window.showInformationMessage("✅ PIN verified successfully!");
        return true;
      } else {
        // Show "Forgot PIN?" option when invalid PIN is entered
        const action = await vscode.window.showErrorMessage(
          "❌ Invalid PIN",
          "Try Again",
          "Forgot PIN?"
        );

        if (action === "Forgot PIN?") {
          return await this.handleForgotPin();
        }

        return false;
      }
    } catch (error) {
      console.error("PIN verification failed:", error);
      vscode.window.showErrorMessage(`PIN verification failed: ${error}`);
      return false;
    }
  }

  /**
   * Handle "Forgot PIN?" scenario using emergency code
   */
  private async handleForgotPin(): Promise<boolean> {
    const emergencyCode = await vscode.window.showInputBox({
      prompt: "Enter your emergency code to reset PIN",
      password: true,
    });

    if (!emergencyCode) {
      return false;
    }

    try {
      const isValid = await this.pinProtectionService.verifyEmergencyCode(
        emergencyCode
      );

      if (isValid) {
        vscode.window.showInformationMessage("✅ Emergency code verified!");

        // Ask user to set a new PIN
        const newPin = await vscode.window.showInputBox({
          prompt: "Enter new PIN (4-8 digits)",
          password: true,
        });

        if (!newPin) {
          return false;
        }

        // Validate new PIN format
        if (!/^\d{4,8}$/.test(newPin)) {
          vscode.window.showErrorMessage("PIN must be 4-8 digits");
          return false;
        }

        // Generate new emergency code
        const newEmergencyCode = Math.random()
          .toString(36)
          .substring(2, 10)
          .toUpperCase();

        // Update PIN and emergency code
        await this.pinProtectionService.enablePinProtection(
          newPin,
          newEmergencyCode
        );

        vscode.window.showInformationMessage(
          `✅ PIN reset successfully!\n\n🔑 New Emergency Code: ${newEmergencyCode}\n\n⚠️ Please save this emergency code in a secure location!`
        );

        // Set PIN as verified for current session
        this.isPinVerified = true;
        this.pinVerificationTime = Date.now();

        return true;
      } else {
        vscode.window.showErrorMessage("❌ Invalid emergency code");
        return false;
      }
    } catch (error) {
      console.error("Emergency code verification failed:", error);
      vscode.window.showErrorMessage(
        `Emergency code verification failed: ${error}`
      );
      return false;
    }
  }

  /**
   * Reset PIN session (for testing purposes)
   */
  public resetPinSession(): void {
    this.isPinVerified = false;
    this.pinVerificationTime = 0;
    console.log("PIN session reset");

    // Restart PIN session monitoring
    this.startPinSessionMonitoring();
  }

  /**
   * Refresh PIN protection state
   * This should be called after PIN protection settings are changed
   */
  public async refreshPinProtectionState(): Promise<void> {
    await this.pinProtectionService.refreshPinProtectionState();
    // Reset PIN session when PIN protection state changes
    this.resetPinSession();

    // Restart PIN session monitoring
    this.startPinSessionMonitoring();
  }

  /**
   * Create a new snippet from selected text
   */
  /**
   * Create a new snippet from drag & drop
   */
  async createSnippetFromDragDrop(
    name: string,
    content: string,
    folderId: string,
    fileType: string,
    tags: string[],
    description: string,
    prefix?: string
  ): Promise<Snippet | null> {
    // Check PIN verification first
    const pinVerified = await this.checkPinVerification();
    if (!pinVerified) {
      return null;
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      vscode.window.showErrorMessage("Content cannot be empty");
      return null;
    }

    // Check content length
    if (content.length > 10000) {
      vscode.window.showErrorMessage(
        "Content is too long. Maximum 10,000 characters allowed."
      );
      return null;
    }

    // Check for dangerous patterns
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
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        vscode.window.showErrorMessage(
          `Content contains dangerous pattern: ${pattern}`
        );
        return null;
      }
    }

    // Create snippet object
    const snippet: Snippet = {
      id: uuidv4(),
      name: name.trim(),
      prefix: prefix || name.toLowerCase().replace(/\s+/g, "-"),
      description: description,
      body: content,
      fileTypes: [fileType],
      tags: tags,
      folderId: folderId,
      usageCount: 0,
      isFavorite: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Validate snippet data
    const validation = this.validateSnippetData({
      name: snippet.name,
      prefix: snippet.prefix,
      description: snippet.description,
      body: snippet.body,
      fileTypes: snippet.fileTypes,
      tags: snippet.tags,
    });

    if (validation) {
      vscode.window.showErrorMessage(validation);
      return null;
    }

    // Save snippet
    await this.storage.saveSnippet(snippet);
    await this.updateFolderSnippetCounts();

    // Log audit event (simplified)
    console.log(
      `Snippet "${snippet.name}" created via drag & drop in folder ${folderId}`
    );

    return snippet;
  }

  /**
   * Create a new snippet from selected text
   */
  async createSnippetFromSelection(
    editor: vscode.TextEditor
  ): Promise<Snippet | null> {
    // Check PIN verification first
    const pinVerified = await this.checkPinVerification();
    if (!pinVerified) {
      return null;
    }

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
    // Check PIN verification first
    const pinVerified = await this.checkPinVerification();
    if (!pinVerified) {
      return [];
    }

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
      folderId?: string;
    }
  ): Promise<Snippet[]> {
    // Check PIN verification first
    const pinVerified = await this.checkPinVerification();
    if (!pinVerified) {
      return [];
    }

    let snippets = await this.storage.searchSnippets(searchTerm, filters);

    // Apply folder filter if specified
    if (filters?.folderId) {
      snippets = snippets.filter(
        (snippet) => snippet.folderId === filters.folderId
      );
    }

    return snippets;
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
    // Get the snippet before deleting to know which folder it belongs to
    const snippet = await this.storage.getSnippet(id);

    // Delete the snippet
    await this.storage.deleteSnippet(id);

    // Update folder snippet counts after deletion
    await this.updateFolderSnippetCounts();
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
    // Check PIN verification first
    const pinVerified = await this.checkPinVerification();
    if (!pinVerified) {
      return [];
    }

    return await this.storage.getAllSnippets();
  }

  /**
   * Get snippet by ID
   */
  async getSnippet(id: string): Promise<Snippet | undefined> {
    // Check PIN verification first
    const pinVerified = await this.checkPinVerification();
    if (!pinVerified) {
      return undefined;
    }

    return await this.storage.getSnippet(id);
  }

  /**
   * Get snippets by folder
   */
  async getSnippetsByFolder(folderId?: string): Promise<Snippet[]> {
    await this.checkPinVerification();

    try {
      const snippets = await this.storage.getAllSnippets();

      if (!folderId) {
        // Return snippets without folder (legacy snippets)
        return snippets.filter((snippet) => !snippet.folderId);
      }

      return snippets.filter((snippet) => snippet.folderId === folderId);
    } catch (error) {
      console.error("Failed to get snippets by folder:", error);
      return [];
    }
  }

  /**
   * Move snippet to folder
   */
  async moveSnippetToFolder(
    snippetId: string,
    folderId?: string
  ): Promise<void> {
    await this.checkPinVerification();

    try {
      const snippet = await this.getSnippet(snippetId);
      if (!snippet) {
        throw new Error("Snippet not found");
      }

      // Update snippet with new folder
      await this.updateSnippet(snippetId, { folderId });

      // Update folder snippet counts
      await this.updateFolderSnippetCounts();
    } catch (error) {
      console.error("Failed to move snippet to folder:", error);
      throw error;
    }
  }

  /**
   * Get all folders
   */
  async getAllFolders(): Promise<Folder[]> {
    await this.checkPinVerification();

    try {
      return await this.folderStorage.getAllFolders();
    } catch (error) {
      console.error("Failed to get folders:", error);
      return [];
    }
  }

  /**
   * Create a new folder
   */
  async createFolder(
    name: string,
    parentId?: string,
    color?: string,
    icon?: string
  ): Promise<Folder> {
    await this.checkPinVerification();

    try {
      return await this.folderStorage.createFolder({
        name,
        parentId,
        color,
        icon,
      });
    } catch (error) {
      console.error("Failed to create folder:", error);
      throw error;
    }
  }

  /**
   * Update an existing folder
   */
  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder> {
    await this.checkPinVerification();

    try {
      const updatedFolder = await this.folderStorage.updateFolder(id, updates);
      if (!updatedFolder) {
        throw new Error(`Folder with id ${id} not found`);
      }
      await this.updateFolderSnippetCounts();
      return updatedFolder;
    } catch (error) {
      console.error("Failed to update folder:", error);
      throw error;
    }
  }

  /**
   * Delete a folder
   */
  async deleteFolder(id: string): Promise<boolean> {
    await this.checkPinVerification();

    try {
      // First, move all snippets from this folder to no folder (set folderId to undefined)
      const snippets = await this.storage.getAllSnippets();
      const folderSnippets = snippets.filter(
        (snippet) => snippet.folderId === id
      );

      for (const snippet of folderSnippets) {
        await this.storage.updateSnippet(snippet.id, { folderId: undefined });
      }

      // Then delete the folder
      const deleted = await this.folderStorage.deleteFolder(id);

      if (deleted) {
        await this.updateFolderSnippetCounts();
      }

      return deleted;
    } catch (error) {
      console.error("Failed to delete folder:", error);
      throw error;
    }
  }

  /**
   * Update folder snippet counts
   */
  private async updateFolderSnippetCounts(): Promise<void> {
    try {
      const folders = await this.folderStorage.getAllFolders();
      const snippets = await this.storage.getAllSnippets();

      for (const folder of folders) {
        const count = snippets.filter(
          (snippet) => snippet.folderId === folder.id
        ).length;
        await this.folderStorage.updateSnippetCount(folder.id, count);
      }
    } catch (error) {
      console.error("Failed to update folder snippet counts:", error);
    }
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
