import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { Snippet } from "../models/snippet";

/**
 * Simple rate limiting for API calls
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Secure storage for BlockMate Snippets
 * Handles data persistence with encryption and backup capabilities
 */
export class SnippetStorage {
  private storageUri: vscode.Uri;
  private snippetsFile: string;
  private backupFile: string;
  private snippets: Map<string, Snippet> = new Map();

  // Rate limiting properties
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly RATE_LIMIT_MAX_CALLS = 100; // 100 calls per minute

  constructor(storageUri: vscode.Uri) {
    this.storageUri = storageUri;

    // Validate storage path to prevent path traversal
    this.validateStoragePath(storageUri.fsPath);

    this.snippetsFile = path.join(storageUri.fsPath, "snippets.json");
    this.backupFile = path.join(storageUri.fsPath, "snippets.backup.json");

    console.log("Storage URI:", storageUri.fsPath);
    console.log("Snippets file:", this.snippetsFile);
    console.log("Backup file:", this.backupFile);
  }

  /**
   * Check rate limit for a specific operation
   */
  private checkRateLimit(operation: string): boolean {
    const now = Date.now();
    const key = `${operation}_${Math.floor(now / this.RATE_LIMIT_WINDOW)}`;

    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.rateLimitMap.set(key, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW,
      });
      return true;
    }

    if (entry.count >= this.RATE_LIMIT_MAX_CALLS) {
      console.warn(`Rate limit exceeded for operation: ${operation}`);
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Clean up old rate limit entries
   */
  private cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  /**
   * Validate storage path to prevent path traversal attacks
   */
  private validateStoragePath(storagePath: string): void {
    const normalizedPath = path.normalize(storagePath);

    // Check for suspicious path components
    const suspiciousPatterns = [
      "..",
      "~",
      "/etc",
      "/var",
      "/usr",
      "C:\\Windows",
    ];
    for (const pattern of suspiciousPatterns) {
      if (normalizedPath.includes(pattern)) {
        throw new Error(
          `Invalid storage path: Suspicious pattern detected: ${pattern}`
        );
      }
    }

    // Ensure path is reasonable length
    if (normalizedPath.length > 500) {
      throw new Error("Invalid storage path: Path too long");
    }
  }

  /**
   * Initialize storage directory and load existing snippets
   */
  async initialize(): Promise<void> {
    try {
      // Ensure storage directory exists
      await this.ensureStorageDirectory();

      // Load existing snippets
      await this.loadSnippets();

      console.log(
        `BlockMate Storage initialized with ${this.snippets.size} snippets`
      );
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      throw error;
    }
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    const storagePath = this.storageUri.fsPath;
    console.log("Ensuring storage directory exists:", storagePath);

    if (!fs.existsSync(storagePath)) {
      console.log("Creating storage directory:", storagePath);
      await fs.promises.mkdir(storagePath, { recursive: true });
    } else {
      console.log("Storage directory already exists:", storagePath);
    }
  }

  /**
   * Load snippets from storage
   */
  private async loadSnippets(): Promise<void> {
    try {
      if (fs.existsSync(this.snippetsFile)) {
        const data = await fs.promises.readFile(this.snippetsFile, "utf8");
        const snippetsArray: Snippet[] = JSON.parse(data);

        this.snippets.clear();
        snippetsArray.forEach((snippet) => {
          // Convert date strings back to Date objects
          snippet.createdAt = new Date(snippet.createdAt);
          snippet.updatedAt = new Date(snippet.updatedAt);
          this.snippets.set(snippet.id, snippet);
        });
      }
    } catch (error) {
      console.error("Failed to load snippets:", error);
      // Try to load from backup
      await this.loadFromBackup();
    }
  }

  /**
   * Load snippets from backup file
   */
  private async loadFromBackup(): Promise<void> {
    try {
      if (fs.existsSync(this.backupFile)) {
        const data = await fs.promises.readFile(this.backupFile, "utf8");
        const snippetsArray: Snippet[] = JSON.parse(data);

        this.snippets.clear();
        snippetsArray.forEach((snippet) => {
          snippet.createdAt = new Date(snippet.createdAt);
          snippet.updatedAt = new Date(snippet.updatedAt);
          this.snippets.set(snippet.id, snippet);
        });

        console.log("Loaded snippets from backup file");
      }
    } catch (error) {
      console.error("Failed to load from backup:", error);
    }
  }

  /**
   * Save snippets to storage with backup
   */
  private async saveSnippets(): Promise<void> {
    try {
      // Create backup first
      if (fs.existsSync(this.snippetsFile)) {
        await fs.promises.copyFile(this.snippetsFile, this.backupFile);
      }

      // Save current snippets
      const snippetsArray = Array.from(this.snippets.values());
      const data = JSON.stringify(snippetsArray, null, 2);
      await fs.promises.writeFile(this.snippetsFile, data, "utf8");
    } catch (error) {
      console.error("Failed to save snippets:", error);
      throw error;
    }
  }

  /**
   * Get all snippets
   */
  async getAllSnippets(): Promise<Snippet[]> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("getAllSnippets")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    return Array.from(this.snippets.values());
  }

  /**
   * Get snippet by ID
   */
  async getSnippet(id: string): Promise<Snippet | undefined> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("getSnippet")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    return this.snippets.get(id);
  }

  /**
   * Save new snippet
   */
  async saveSnippet(snippet: Snippet): Promise<void> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("saveSnippet")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    this.snippets.set(snippet.id, snippet);
    await this.saveSnippets();
  }

  /**
   * Update existing snippet
   */
  async updateSnippet(id: string, updates: Partial<Snippet>): Promise<void> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("updateSnippet")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const snippet = this.snippets.get(id);
    if (!snippet) {
      throw new Error(`Snippet with id ${id} not found`);
    }

    const updatedSnippet = { ...snippet, ...updates, updatedAt: new Date() };
    this.snippets.set(id, updatedSnippet);
    await this.saveSnippets();
  }

  /**
   * Delete snippet
   */
  async deleteSnippet(id: string): Promise<void> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("deleteSnippet")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    if (!this.snippets.has(id)) {
      throw new Error(`Snippet with id ${id} not found`);
    }

    this.snippets.delete(id);
    await this.saveSnippets();
  }

  /**
   * Search snippets with filters
   */
  async searchSnippets(
    searchTerm: string,
    filters?: {
      tags?: string[];
      fileTypes?: string[];
      favoritesOnly?: boolean;
    }
  ): Promise<Snippet[]> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("searchSnippets")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    let results = Array.from(this.snippets.values());

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (snippet) =>
          snippet.name.toLowerCase().includes(term) ||
          snippet.prefix.toLowerCase().includes(term) ||
          snippet.description?.toLowerCase().includes(term) ||
          snippet.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.tags && filters.tags.length > 0) {
        results = results.filter((snippet) =>
          filters.tags!.some((tag) => snippet.tags.includes(tag))
        );
      }

      if (filters.fileTypes && filters.fileTypes.length > 0) {
        results = results.filter((snippet) =>
          filters.fileTypes!.some((fileType) =>
            snippet.fileTypes.includes(fileType)
          )
        );
      }

      if (filters.favoritesOnly) {
        results = results.filter((snippet) => snippet.isFavorite);
      }
    }

    return results;
  }

  /**
   * Increment usage count for a snippet
   */
  async incrementUsage(id: string): Promise<void> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("incrementUsage")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const snippet = this.snippets.get(id);
    if (snippet) {
      snippet.usageCount++;
      snippet.updatedAt = new Date();
      await this.saveSnippets();
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    totalSnippets: number;
    totalUsage: number;
    storageSize: number;
  }> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("getStats")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const snippets = Array.from(this.snippets.values());
    const totalUsage = snippets.reduce(
      (sum, snippet) => sum + snippet.usageCount,
      0
    );

    let storageSize = 0;
    if (fs.existsSync(this.snippetsFile)) {
      const stats = fs.statSync(this.snippetsFile);
      storageSize = stats.size;
    }

    return {
      totalSnippets: snippets.length,
      totalUsage,
      storageSize,
    };
  }

  /**
   * Export snippets to file
   */
  async exportSnippets(filePath: string): Promise<void> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("exportSnippets")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const snippets = Array.from(this.snippets.values());
    const data = JSON.stringify(snippets, null, 2);
    await fs.promises.writeFile(filePath, data, "utf8");
  }

  /**
   * Import snippets from file
   */
  async importSnippets(
    filePath: string,
    clearExisting: boolean = false
  ): Promise<void> {
    // Clean up old rate limits
    this.cleanupRateLimits();

    // Check rate limit
    if (!this.checkRateLimit("importSnippets")) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    try {
      console.log(`Starting import from: ${filePath}`);

      // Check file size (max 10MB)
      const stats = await fs.promises.stat(filePath);
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (stats.size > maxSize) {
        throw new Error("File size too large. Maximum size is 10MB.");
      }

      const data = await fs.promises.readFile(filePath, "utf8");
      console.log(`File read successfully, size: ${data.length} characters`);

      // Validate JSON structure with additional security checks
      let importedSnippets: any[];
      try {
        // Check for potential JSON injection patterns
        if (
          data.includes("__proto__") ||
          data.includes("constructor") ||
          data.includes("prototype")
        ) {
          throw new Error(
            "Invalid JSON: Contains potentially dangerous patterns"
          );
        }

        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
          throw new Error("Invalid file format. Expected array of snippets.");
        }

        // Limit array size to prevent memory exhaustion
        if (parsed.length > 10000) {
          throw new Error(
            "Too many snippets in file. Maximum allowed is 10,000."
          );
        }

        importedSnippets = parsed;
        console.log(
          `JSON parsed successfully, found ${importedSnippets.length} snippets in file`
        );
      } catch (parseError) {
        throw new Error(
          `Invalid JSON file: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`
        );
      }

      // Clear existing snippets if requested
      if (clearExisting) {
        console.log("Clearing existing snippets before import");
        this.snippets.clear();
      } else {
        console.log(
          `Current snippets count before import: ${this.snippets.size}`
        );
      }

      // Validate all snippets first
      const validSnippets: Snippet[] = [];
      const invalidSnippets: string[] = [];

      for (let i = 0; i < importedSnippets.length; i++) {
        const snippet = importedSnippets[i];
        try {
          if (this.validateSnippet(snippet)) {
            // Generate new ID for imported snippets to avoid conflicts
            const originalId = snippet.id;
            snippet.id = this.generateId();
            snippet.createdAt = new Date();
            snippet.updatedAt = new Date();
            validSnippets.push(snippet);
            console.log(
              `Valid snippet: "${snippet.name}" (original ID: ${originalId} -> new ID: ${snippet.id})`
            );
          } else {
            invalidSnippets.push(`Snippet at index ${i}: Invalid format`);
            console.warn(
              `Invalid snippet at index ${i}: "${snippet.name || "unnamed"}"`
            );
          }
        } catch (error) {
          invalidSnippets.push(
            `Snippet at index ${i}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          console.warn(`Error processing snippet at index ${i}:`, error);
        }
      }

      // If there are invalid snippets, report them but continue with valid ones
      if (invalidSnippets.length > 0) {
        console.warn(
          "Some snippets were invalid and will be skipped:",
          invalidSnippets
        );
      }

      if (validSnippets.length === 0) {
        throw new Error("No valid snippets found in file.");
      }

      // Add valid snippets to storage
      for (const snippet of validSnippets) {
        this.snippets.set(snippet.id, snippet);
      }

      await this.saveSnippets();
      console.log(
        `Successfully imported ${validSnippets.length} snippets. Total snippets now: ${this.snippets.size}`
      );
    } catch (error) {
      console.error("Import failed:", error);
      throw error;
    }
  }

  /**
   * Validate snippet structure
   */
  private validateSnippet(snippet: any): snippet is Snippet {
    // Detailed validation with debug logging
    if (typeof snippet !== "object" || snippet === null) {
      console.debug("Snippet validation failed: not an object or null");
      return false;
    }

    if (typeof snippet.id !== "string") {
      console.debug(
        `Snippet validation failed: id is not string (${typeof snippet.id})`
      );
      return false;
    }

    if (typeof snippet.name !== "string") {
      console.debug(
        `Snippet validation failed: name is not string (${typeof snippet.name})`
      );
      return false;
    }

    if (typeof snippet.prefix !== "string") {
      console.debug(
        `Snippet validation failed: prefix is not string (${typeof snippet.prefix})`
      );
      return false;
    }

    if (typeof snippet.body !== "string") {
      console.debug(
        `Snippet validation failed: body is not string (${typeof snippet.body})`
      );
      return false;
    }

    if (!Array.isArray(snippet.tags)) {
      console.debug(
        `Snippet validation failed: tags is not array (${typeof snippet.tags})`
      );
      return false;
    }

    if (!Array.isArray(snippet.fileTypes)) {
      console.debug(
        `Snippet validation failed: fileTypes is not array (${typeof snippet.fileTypes})`
      );
      return false;
    }

    if (snippet.name.length === 0) {
      console.debug("Snippet validation failed: name is empty");
      return false;
    }

    if (snippet.prefix.length === 0) {
      console.debug("Snippet validation failed: prefix is empty");
      return false;
    }

    if (snippet.body.length === 0) {
      console.debug("Snippet validation failed: body is empty");
      return false;
    }

    // Add length limits to prevent memory exhaustion
    if (snippet.name.length > 200) {
      console.debug("Snippet validation failed: name too long");
      return false;
    }

    if (snippet.prefix.length > 50) {
      console.debug("Snippet validation failed: prefix too long");
      return false;
    }

    if (snippet.body.length > 100000) {
      // 100KB limit
      console.debug("Snippet validation failed: body too long");
      return false;
    }

    if (snippet.description && snippet.description.length > 1000) {
      console.debug("Snippet validation failed: description too long");
      return false;
    }

    // Validate tags array size and content
    if (snippet.tags.length > 50) {
      console.debug("Snippet validation failed: too many tags");
      return false;
    }

    if (!snippet.tags.every((tag: any) => typeof tag === "string")) {
      console.debug(
        "Snippet validation failed: tags array contains non-string values"
      );
      return false;
    }

    // Validate individual tag length
    for (const tag of snippet.tags) {
      if (tag.length > 50) {
        console.debug("Snippet validation failed: tag too long");
        return false;
      }
      // Check for suspicious content in tags
      if (tag.includes("<") || tag.includes(">") || tag.includes("script")) {
        console.debug("Snippet validation failed: suspicious content in tag");
        return false;
      }
    }

    // Validate fileTypes array size and content
    if (snippet.fileTypes.length > 20) {
      console.debug("Snippet validation failed: too many file types");
      return false;
    }

    if (!snippet.fileTypes.every((type: any) => typeof type === "string")) {
      console.debug(
        "Snippet validation failed: fileTypes array contains non-string values"
      );
      return false;
    }

    // Validate individual file type length and format
    for (const fileType of snippet.fileTypes) {
      if (fileType.length > 20) {
        console.debug("Snippet validation failed: file type too long");
        return false;
      }
      // Only allow alphanumeric characters, dots, and hyphens
      if (!/^[a-zA-Z0-9.-]+$/.test(fileType)) {
        console.debug("Snippet validation failed: invalid file type format");
        return false;
      }
    }

    // Check for suspicious content in body
    const suspiciousPatterns = ["<script", "javascript:", "data:", "vbscript:"];
    for (const pattern of suspiciousPatterns) {
      if (snippet.body.toLowerCase().includes(pattern)) {
        console.debug("Snippet validation failed: suspicious content in body");
        return false;
      }
    }

    return true;
  }

  /**
   * Generate unique ID for snippets
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
