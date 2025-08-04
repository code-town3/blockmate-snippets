import * as vscode from "vscode";
import { SnippetManager } from "../snippetManager";
import { SnippetProvider } from "../providers/snippetProvider";
import { Snippet } from "../models/snippet";

/**
 * Command to manage snippets through a webview panel
 */
export class ManageSnippetsCommand {
  private snippetManager: SnippetManager;
  private snippetProvider: SnippetProvider;
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    snippetManager: SnippetManager,
    snippetProvider: SnippetProvider
  ) {
    this.snippetManager = snippetManager;
    this.snippetProvider = snippetProvider;
  }

  /**
   * Execute the manage snippets command
   */
  async execute(): Promise<void> {
    // Create and show panel
    this.panel = vscode.window.createWebviewPanel(
      "blockmateSnippets",
      "BlockMate Snippets Manager",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(__dirname)],
        enableCommandUris: true,
      }
    );

    // Set the HTML content with security headers
    this.panel.webview.html = this.getWebviewContent();

    // Set additional security headers
    // Note: Webview options are set during creation, cannot be modified after

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(async (message) => {
      console.log("Received message from webview:", message);
      switch (message.command) {
        case "getSnippets":
          console.log("Handling getSnippets command");
          await this.handleGetSnippets();
          break;
        case "searchSnippets":
          console.log("Handling searchSnippets command");
          await this.handleSearchSnippets(message.searchTerm, message.filters);
          break;

        case "toggleFavorite":
          console.log("Handling toggleFavorite command");
          await this.handleToggleFavorite(message.snippetId);
          break;
        case "exportSnippets":
          console.log("Handling exportSnippets command");
          await this.handleExportSnippets();
          break;
        case "importSnippets":
          console.log("Handling importSnippets command");
          await this.handleImportSnippets();
          break;
        case "getStats":
          console.log("Handling getStats command");
          await this.handleGetStats();
          break;
        case "copySnippet":
          console.log("Handling copySnippet command");
          await this.handleCopySnippet(message.snippetId);
          break;
        default:
          console.log("Unknown command received:", message.command);
      }
    });

    // Handle panel disposal
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  /**
   * Alternative delete method using QuickPick
   */
  async deleteSnippetWithQuickPick(): Promise<void> {
    try {
      const snippets = await this.snippetManager.getAllSnippets();

      if (snippets.length === 0) {
        vscode.window.showInformationMessage("No snippets to delete");
        return;
      }

      const items = snippets.map((snippet) => ({
        label: snippet.name,
        description: snippet.prefix,
        detail: snippet.description || "",
        snippetId: snippet.id,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a snippet to delete",
      });

      if (selected) {
        const confirmed = await vscode.window.showWarningMessage(
          `Are you sure you want to delete "${selected.label}"?`,
          { modal: true },
          "Yes"
        );

        if (confirmed === "Yes") {
          await this.snippetManager.deleteSnippet(selected.snippetId);
          vscode.window.showInformationMessage("Snippet deleted successfully");

          // Refresh the webview if it's open
          if (this.panel) {
            await this.handleGetSnippets();
            await this.handleGetStats();
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete snippet:", error);
      vscode.window.showErrorMessage("Failed to delete snippet");
    }
  }

  /**
   * Get webview HTML content
   */
  private getWebviewContent(): string {
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: https:; connect-src 'none';">
                <title>BlockMate Snippets Manager</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        color: #ffffff;
                        background-color: #1e1e1e;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                        border-bottom: 1px solid #404040;
                    }
                    .search-box {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    input, select {
                        padding: 8px 12px;
                        border: 1px solid #404040;
                        background-color: #2d2d2d;
                        color: #ffffff;
                        border-radius: 6px;
                        font-size: 14px;
                        min-width: 120px;
                    }
                    input:focus, select:focus {
                        outline: none;
                        border-color: #007acc;
                        box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
                    }
                    button {
                        padding: 8px 16px;
                        background-color: #007acc;
                        color: #ffffff;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: all 0.2s ease;
                    }
                    button:hover {
                        background-color: #005a9e;
                        transform: translateY(-1px);
                        box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
                    }
                    .snippet-list {
                        display: grid;
                        gap: 10px;
                    }
                    .snippet-item {
                        border: 1px solid #404040;
                        border-radius: 8px;
                        padding: 20px;
                        background-color: #2d2d2d;
                        margin-bottom: 10px;
                        transition: all 0.2s ease;
                    }
                    .snippet-item:hover {
                        border-color: #007acc;
                        box-shadow: 0 4px 12px rgba(0, 122, 204, 0.15);
                        transform: translateY(-2px);
                    }
                    .snippet-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }
                    .snippet-name {
                        font-weight: bold;
                        font-size: 18px;
                        color: #ffffff;
                    }
                    .snippet-prefix {
                        background-color: #007acc;
                        color: #ffffff;
                        padding: 4px 10px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 500;
                    }
                    .snippet-description {
                        color: #cccccc;
                        margin-bottom: 15px;
                        font-size: 14px;
                        line-height: 1.5;
                    }
                    .snippet-tags {
                        display: flex;
                        gap: 5px;
                        margin-bottom: 10px;
                    }
                    .tag {
                        background-color: #404040;
                        color: #ffffff;
                        padding: 4px 8px;
                        border-radius: 8px;
                        font-size: 12px;
                        font-weight: 500;
                        margin-right: 5px;
                    }
                    .snippet-actions {
                        display: flex;
                        gap: 5px;
                    }
                    .stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    .stat-card {
                        background-color: #2d2d2d;
                        border: 1px solid #404040;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        transition: all 0.2s ease;
                    }
                    .stat-card:hover {
                        border-color: #007acc;
                        box-shadow: 0 4px 12px rgba(0, 122, 204, 0.15);
                    }
                    .stat-value {
                        font-size: 28px;
                        font-weight: bold;
                        color: #007acc;
                    }
                    .stat-label {
                        color: #cccccc;
                        font-size: 14px;
                        margin-top: 5px;
                    }
                    .tab-container {
                        margin-bottom: 20px;
                    }
                    .tab-buttons {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .tab-button {
                        padding: 12px 24px;
                        background-color: #2d2d2d;
                        border: 1px solid #404040;
                        color: #ffffff;
                        cursor: pointer;
                        border-radius: 6px;
                        font-weight: 500;
                        font-size: 14px;
                        transition: all 0.2s ease;
                    }
                    .tab-button:hover {
                        background-color: #404040;
                        border-color: #007acc;
                    }
                    .tab-button.active {
                        background-color: #007acc;
                        color: #ffffff;
                        border-color: #007acc;
                        box-shadow: 0 2px 8px rgba(0, 122, 204, 0.3);
                    }
                    .tab-content {
                        display: none;
                    }
                    .tab-content.active {
                        display: block;
                    }
                    /* Error message styling for better visibility */
                    .error-message {
                        background-color: #d32f2f !important;
                        color: #ffffff !important;
                        padding: 10px;
                        border-radius: 4px;
                        margin: 10px 0;
                        font-weight: bold;
                        text-align: center;
                        font-size: 14px;
                        line-height: 1.4;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                    .warning-message {
                        background-color: #f57c00 !important;
                        color: #ffffff !important;
                        padding: 10px;
                        border-radius: 4px;
                        margin: 10px 0;
                        font-weight: bold;
                        text-align: center;
                        font-size: 14px;
                        line-height: 1.4;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                    /* Override VS Code's default error styling */
                    .monaco-editor .monaco-editor-overlaymessage {
                        background-color: #d32f2f !important;
                        color: #ffffff !important;
                        border: 2px solid #ffffff !important;
                    }
                    /* Force white text on any error background */
                    [style*="background-color: #d32f2f"],
                    [style*="background-color: #f57c00"],
                    [style*="background-color: red"] {
                        color: #ffffff !important;
                        font-weight: bold !important;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>BlockMate Snippets Manager</h1>
                                                 <div>
                             <button onclick="exportSnippets()">Export</button>
                             <button onclick="importSnippets()">Import</button>
                             <button onclick="refreshData()">Refresh</button>
                         </div>
                    </div>
                    
                    <div style="background-color: var(--vscode-notificationsInfoIcon-background); color: var(--vscode-notificationsInfoIcon-foreground); padding: 10px; border-radius: 4px; margin-bottom: 15px;">
                        💡 <strong>Delete Snippets:</strong> Use <code>Ctrl+Shift+P</code> → "BlockMate: Delete Snippet" to delete snippets
                    </div>
                    
                    <div class="stats" id="stats">
                        <!-- Stats will be loaded here -->
                    </div>
                    
                    <div class="search-box">
                        <input type="text" id="searchInput" placeholder="Search snippets..." oninput="searchSnippets()">
                        <select id="tagFilter" onchange="searchSnippets()">
                            <option value="">All Tags</option>
                        </select>
                        <select id="fileTypeFilter" onchange="searchSnippets()">
                            <option value="">All File Types</option>
                        </select>

                    </div>
                    
                    <div class="tab-container">
                        <div class="tab-buttons">
                            <button class="tab-button active" onclick="switchTab('all')">All Snippets</button>
                            <button class="tab-button" onclick="switchTab('favorites')">Favorites ⭐</button>
                        </div>
                        
                        <div id="allSnippetsTab" class="tab-content active">
                            <div class="snippet-list" id="snippetList">
                                <!-- All snippets will be loaded here -->
                            </div>
                        </div>
                        
                        <div id="favoritesTab" class="tab-content">
                            <div class="snippet-list" id="favoritesList">
                                <!-- Favorite snippets will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
                
                <script>
                    console.log('Script loaded');
                    const vscode = acquireVsCodeApi();
                    console.log('VS Code API acquired');
                    
                    // Load snippets on page load
                    window.addEventListener('load', () => {
                        console.log('Page loaded, loading snippets and stats');
                        loadSnippets();
                        loadStats();
                    });
                    
                    function loadSnippets() {
                        vscode.postMessage({ command: 'getSnippets' });
                    }
                    
                    function searchSnippets() {
                        const searchTerm = document.getElementById('searchInput').value;
                        const tagFilter = document.getElementById('tagFilter').value;
                        const fileTypeFilter = document.getElementById('fileTypeFilter').value;
                        
                        const filters = {
                            tags: tagFilter ? [tagFilter] : undefined,
                            fileTypes: fileTypeFilter ? [fileTypeFilter] : undefined
                        };
                        
                        vscode.postMessage({ 
                            command: 'searchSnippets', 
                            searchTerm, 
                            filters 
                        });
                    }
                    

                    
                    function toggleFavorite(snippetId) {
                        vscode.postMessage({ command: 'toggleFavorite', snippetId });
                        // Auto refresh stats after a short delay
                        setTimeout(() => {
                            loadStats();
                        }, 100);
                    }
                    
                    function exportSnippets() {
                        vscode.postMessage({ command: 'exportSnippets' });
                    }
                    
                    function importSnippets() {
                        vscode.postMessage({ command: 'importSnippets' });
                    }
                    
                                         function loadStats() {
                         vscode.postMessage({ command: 'getStats' });
                     }
                     
                                         function refreshData() {
                        loadSnippets();
                        loadStats();
                    }
                    
                    function switchTab(tabName) {
                        // Update tab buttons
                        document.querySelectorAll('.tab-button').forEach(btn => {
                            btn.classList.remove('active');
                        });
                        event.target.classList.add('active');
                        
                        // Update tab content
                        document.querySelectorAll('.tab-content').forEach(content => {
                            content.classList.remove('active');
                        });
                        
                        if (tabName === 'all') {
                            document.getElementById('allSnippetsTab').classList.add('active');
                            loadSnippets();
                        } else if (tabName === 'favorites') {
                            document.getElementById('favoritesTab').classList.add('active');
                            loadFavorites();
                        }
                    }
                    
                    function loadFavorites() {
                        const filters = { favoritesOnly: true };
                        vscode.postMessage({ 
                            command: 'searchSnippets', 
                            searchTerm: '', 
                            filters 
                        });
                    }
                    
                    function copySnippet(snippetId) {
                        vscode.postMessage({ command: 'copySnippet', snippetId });
                    }
                    
                    // Handle messages from extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'updateSnippets':
                                updateSnippetList(message.snippets);
                                break;
                            case 'updateStats':
                                updateStats(message.stats);
                                break;
                        }
                    });
                    
                    function updateSnippetList(snippets) {
                        const snippetList = document.getElementById('snippetList');
                        const favoritesList = document.getElementById('favoritesList');
                        
                        // Clear both lists
                        snippetList.innerHTML = '';
                        favoritesList.innerHTML = '';
                        
                        // Separate favorites and all snippets
                        const favoriteSnippets = snippets.filter(snippet => snippet.isFavorite);
                        const allSnippets = snippets;
                        
                        // Update all snippets list
                        allSnippets.forEach(snippet => {
                            const snippetElement = createSnippetElement(snippet);
                            snippetList.appendChild(snippetElement);
                        });
                        
                        // Update favorites list
                        favoriteSnippets.forEach(snippet => {
                            const snippetElement = createSnippetElement(snippet);
                            favoritesList.appendChild(snippetElement);
                        });
                        
                        // Update filter dropdowns with available options
                        updateFilterDropdowns(snippets);
                        
                        // Auto refresh stats when snippets are updated
                        loadStats();
                    }
                    
                    function updateFilterDropdowns(snippets) {
                        // Get all unique tags
                        const allTags = new Set();
                        snippets.forEach(snippet => {
                            if (snippet.tags) {
                                snippet.tags.forEach(tag => allTags.add(tag));
                            }
                        });
                        
                        // Get all unique file types
                        const allFileTypes = new Set();
                        snippets.forEach(snippet => {
                            if (snippet.fileTypes) {
                                snippet.fileTypes.forEach(type => allFileTypes.add(type));
                            }
                        });
                        
                        // Update tag filter dropdown
                        const tagFilter = document.getElementById('tagFilter');
                        const currentTagValue = tagFilter.value;
                        tagFilter.innerHTML = '<option value="">All Tags</option>';
                        allTags.forEach(tag => {
                            const option = document.createElement('option');
                            option.value = tag;
                            option.textContent = tag;
                            if (tag === currentTagValue) {
                                option.selected = true;
                            }
                            tagFilter.appendChild(option);
                        });
                        
                        // Update file type filter dropdown
                        const fileTypeFilter = document.getElementById('fileTypeFilter');
                        const currentFileTypeValue = fileTypeFilter.value;
                        fileTypeFilter.innerHTML = '<option value="">All File Types</option>';
                        allFileTypes.forEach(type => {
                            const option = document.createElement('option');
                            option.value = type;
                            option.textContent = type;
                            if (type === currentFileTypeValue) {
                                option.selected = true;
                            }
                            fileTypeFilter.appendChild(option);
                        });
                    }
                    
                    function createSnippetElement(snippet) {
                        const div = document.createElement('div');
                        div.className = 'snippet-item';
                        
                        // Escape HTML to prevent XSS
                        const escapeHtml = (text) => {
                            const div = document.createElement('div');
                            div.textContent = text;
                            return div.innerHTML;
                        };
                        
                        div.innerHTML = \`
                            <div class="snippet-header">
                                <div>
                                    <span class="snippet-name">\${escapeHtml(snippet.name)}</span>
                                    <span class="snippet-prefix">\${escapeHtml(snippet.prefix)}</span>
                                </div>
                                <div class="snippet-actions">
                                    <button onclick="toggleFavorite('\${escapeHtml(snippet.id)}')">
                                        \${snippet.isFavorite ? '★' : '☆'}
                                    </button>
                                    <button onclick="copySnippet('\${escapeHtml(snippet.id)}')" title="Copy to clipboard">📋</button>
                                </div>
                            </div>
                            <div class="snippet-description">\${escapeHtml(snippet.description || '')}</div>
                            <div class="snippet-tags">
                                \${snippet.tags.map(tag => \`<span class="tag">\${escapeHtml(tag)}</span>\`).join('')}
                            </div>
                            <div>File Types: \${snippet.fileTypes.map(type => escapeHtml(type)).join(', ')}</div>
                            <div>Usage: \${snippet.usageCount} times</div>
                        \`;
                        return div;
                    }
                    
                    function updateStats(stats) {
                        const statsDiv = document.getElementById('stats');
                        statsDiv.innerHTML = \`
                            <div class="stat-card">
                                <div class="stat-value">\${stats.totalSnippets}</div>
                                <div class="stat-label">Total Snippets</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">\${stats.totalUsage}</div>
                                <div class="stat-label">Total Usage</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">\${(stats.storageSize / 1024).toFixed(1)} KB</div>
                                <div class="stat-label">Storage Size</div>
                            </div>
                        \`;
                    }
                </script>
            </body>
            </html>
        `;
  }

  /**
   * Handle get snippets request
   */
  private async handleGetSnippets(): Promise<void> {
    try {
      const snippets = await this.snippetManager.getAllSnippets();
      this.panel?.webview.postMessage({
        command: "updateSnippets",
        snippets,
      });
    } catch (error) {
      console.error("Failed to get snippets:", error);
    }
  }

  /**
   * Handle search snippets request
   */
  private async handleSearchSnippets(
    searchTerm: string,
    filters: any
  ): Promise<void> {
    try {
      const snippets = await this.snippetManager.searchSnippets(
        searchTerm,
        filters
      );
      this.panel?.webview.postMessage({
        command: "updateSnippets",
        snippets,
      });
    } catch (error) {
      console.error("Failed to search snippets:", error);
    }
  }

  /**
   * Handle delete snippet request
   */
  private async handleDeleteSnippet(snippetId: string): Promise<void> {
    try {
      await this.snippetManager.deleteSnippet(snippetId);
      await this.handleGetSnippets();
      vscode.window.showInformationMessage("Snippet deleted successfully");
    } catch (error) {
      console.error("Failed to delete snippet:", error);
      vscode.window.showErrorMessage("Failed to delete snippet");
    }
  }

  /**
   * Handle toggle favorite request
   */
  private async handleToggleFavorite(snippetId: string): Promise<void> {
    try {
      await this.snippetManager.toggleFavorite(snippetId);
      // Refresh both snippets and stats
      await this.handleGetSnippets();
      await this.handleGetStats();
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  }

  /**
   * Handle export snippets request
   */
  private async handleExportSnippets(): Promise<void> {
    try {
      await this.snippetManager.exportSnippets();
    } catch (error) {
      console.error("Failed to export snippets:", error);
    }
  }

  /**
   * Handle import snippets request
   */
  private async handleImportSnippets(): Promise<void> {
    try {
      await this.snippetManager.importSnippets();
      // Refresh both snippets and stats
      await this.handleGetSnippets();
      await this.handleGetStats();
    } catch (error) {
      console.error("Failed to import snippets:", error);
    }
  }

  /**
   * Handle get stats request
   */
  private async handleGetStats(): Promise<void> {
    try {
      const stats = await this.snippetManager.getStats();
      this.panel?.webview.postMessage({
        command: "updateStats",
        stats,
      });
    } catch (error) {
      console.error("Failed to get stats:", error);
    }
  }

  /**
   * Handle copy snippet request
   */
  private async handleCopySnippet(snippetId: string): Promise<void> {
    try {
      const snippet = await this.snippetManager.getSnippet(snippetId);
      if (snippet) {
        await vscode.env.clipboard.writeText(snippet.body);
        vscode.window.showInformationMessage(
          `Snippet "${snippet.name}" copied to clipboard!`
        );
      }
    } catch (error) {
      console.error("Failed to copy snippet:", error);
      vscode.window.showErrorMessage("Failed to copy snippet");
    }
  }
}
