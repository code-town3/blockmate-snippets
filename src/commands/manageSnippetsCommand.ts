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
        case "getFolders":
          console.log("Handling getFolders command");
          await this.handleGetFolders();
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
        case "moveToFolder":
          console.log("Handling moveToFolder command");
          await this.handleMoveToFolder(message.snippetId);
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
            await this.handleGetFolders();
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
                    :root {
                        --primary-blue: #4a9eff;
                        --secondary-blue: #2d7dd2;
                        --dark-blue-bg: #0f1419;
                        --medium-blue-bg: #1a2332;
                        --light-blue-bg: #16213e;
                        --card-bg: #1e2a3a;
                        --card-border: #2a3f5f;
                        --text-primary: #ffffff;
                        --text-secondary: #b0c4de;
                    }
                    
                    [data-theme="light"] {
                        --primary-blue: #2563eb;
                        --secondary-blue: #1d4ed8;
                        --dark-blue-bg: #ffffff;
                        --medium-blue-bg: #f8fafc;
                        --light-blue-bg: #f1f5f9;
                        --card-bg: #ffffff;
                        --card-border: #e2e8f0;
                        --text-primary: #000000;
                        --text-secondary: #374151;
                    }
                    body {
                        font-family: var(--vscode-font-family);
                        color: var(--text-primary);
                        background: linear-gradient(135deg, var(--dark-blue-bg) 0%, var(--medium-blue-bg) 50%, var(--light-blue-bg) 100%);
                        margin: 0;
                        padding: 20px;
                        min-height: 100vh;
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
                        border-bottom: 1px solid var(--card-border);
                    }
                    .search-box {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    input, select {
                        padding: 10px 15px;
                        border: 1px solid var(--card-border);
                        background: var(--card-bg);
                        color: var(--text-primary);
                        border-radius: 8px;
                        font-size: 14px;
                        min-width: 120px;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(5px);
                    }
                    input:focus, select:focus {
                        outline: none;
                        border-color: var(--primary-blue);
                        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                        background: var(--card-bg);
                    }
                    
                    /* Placeholder styling */
                    input::placeholder {
                        color: var(--text-secondary) !important;
                        opacity: 0.8;
                    }
                    
                    input::-webkit-input-placeholder {
                        color: var(--text-secondary) !important;
                        opacity: 0.8;
                    }
                    
                    input::-moz-placeholder {
                        color: var(--text-secondary) !important;
                        opacity: 0.8;
                    }
                    
                    input:-ms-input-placeholder {
                        color: var(--text-secondary) !important;
                        opacity: 0.8;
                    }
                    
                    /* Select dropdown styling */
                    select option {
                        background: var(--card-bg) !important;
                        color: var(--text-primary) !important;
                        padding: 8px 12px;
                        border: none;
                        font-size: 14px;
                    }
                    
                    select option:hover {
                        background: var(--light-blue-bg) !important;
                        color: var(--text-primary) !important;
                    }
                    
                    select option:checked {
                        background: var(--primary-blue) !important;
                        color: #ffffff !important;
                        font-weight: 600;
                    }
                    
                    /* Force proper text on all select options */
                    select option,
                    select option:hover,
                    select option:focus,
                    select option:active,
                    select option:selected {
                        color: var(--text-primary) !important;
                        background-color: var(--card-bg) !important;
                    }
                    
                    /* Fix empty state background */
                    select:invalid,
                    select option[value=""] {
                        background: var(--card-bg) !important;
                        color: var(--text-primary) !important;
                    }
                    
                    /* Override any default browser styling */
                    select,
                    select * {
                        background-color: var(--card-bg) !important;
                        color: var(--text-primary) !important;
                    }
                    
                    /* Custom select dropdown arrow - Force single arrow */
                    select {
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        -moz-appearance: none !important;
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e") !important;
                        background-repeat: no-repeat !important;
                        background-position: right 10px center !important;
                        background-size: 16px !important;
                        padding-right: 35px !important;
                        transition: background-image 0.2s ease;
                    }
                    
                    [data-theme="dark"] select {
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234a9eff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e") !important;
                    }
                    
                    /* Select dropdown arrow animation */
                    select:focus {
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='18,15 12,9 6,15'%3e%3c/polyline%3e%3c/svg%3e") !important;
                    }
                    
                    [data-theme="dark"] select:focus {
                        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234a9eff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='18,15 12,9 6,15'%3e%3c/polyline%3e%3c/svg%3e") !important;
                    }
                    
                    /* Remove any default browser arrows completely */
                    select::-ms-expand {
                        display: none !important;
                    }
                    
                    select::-webkit-select-placeholder {
                        display: none !important;
                    }
                    button {
                        padding: 10px 20px;
                        background: linear-gradient(135deg, #4a9eff 0%, #2d7dd2 100%);
                        color: #ffffff;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(74, 158, 255, 0.3);
                    }
                    button:hover {
                        background: linear-gradient(135deg, #5aaeff 0%, #3d8de2 100%);
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(74, 158, 255, 0.4);
                    }
                    .snippet-list {
                        display: grid;
                        gap: 10px;
                    }
                    .snippet-item {
                        border: 1px solid var(--card-border);
                        border-radius: 12px;
                        padding: 20px;
                        background: var(--card-bg);
                        margin-bottom: 10px;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                    .snippet-item:hover {
                        border-color: var(--primary-blue);
                        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
                        transform: translateY(-2px);
                    }
                    
                    [data-theme="dark"] .snippet-item {
                        border: 1px solid #2a3f5f;
                        background: linear-gradient(145deg, #1e2a3a 0%, #2a3f5f 100%);
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    }
                    
                    [data-theme="dark"] .snippet-item:hover {
                        border-color: #4a9eff;
                        box-shadow: 0 8px 30px rgba(74, 158, 255, 0.25);
                        transform: translateY(-3px);
                        background: linear-gradient(145deg, #233a4a 0%, #2f4f7f 100%);
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
                        color: var(--text-primary);
                    }
                    .snippet-prefix {
                        background: linear-gradient(135deg, #4a9eff 0%, #2d7dd2 100%);
                        color: #ffffff;
                        padding: 6px 12px;
                        border-radius: 15px;
                        font-size: 12px;
                        font-weight: 600;
                        box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
                    }
                    .snippet-description {
                        color: var(--text-secondary);
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
                        background: var(--light-blue-bg);
                        color: var(--text-primary);
                        padding: 6px 10px;
                        border-radius: 10px;
                        font-size: 12px;
                        font-weight: 500;
                        margin-right: 5px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                        transition: all 0.2s ease;
                        border: 1px solid var(--card-border);
                    }
                    .tag:hover {
                        transform: translateY(-1px);
                        box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
                        background: var(--primary-blue);
                        color: #ffffff;
                    }
                    
                    [data-theme="dark"] .tag {
                        background: linear-gradient(135deg, var(--card-border) 0%, var(--primary-blue) 50%);
                        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
                    }
                    
                    [data-theme="dark"] .tag:hover {
                        box-shadow: 0 4px 10px rgba(74, 158, 255, 0.3);
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
                        background: var(--card-bg);
                        border: 1px solid var(--card-border);
                        border-radius: 12px;
                        padding: 25px;
                        text-align: center;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                    .stat-card:hover {
                        border-color: var(--primary-blue);
                        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
                        transform: translateY(-2px);
                    }
                    
                    [data-theme="dark"] .stat-card {
                        background: linear-gradient(145deg, var(--card-bg) 0%, var(--card-border) 100%);
                        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    }
                    
                    [data-theme="dark"] .stat-card:hover {
                        box-shadow: 0 8px 30px rgba(74, 158, 255, 0.25);
                        transform: translateY(-3px);
                        background: linear-gradient(145deg, #233a4a 0%, #2f4f7f 100%);
                    }
                    .stat-value {
                        font-size: 32px;
                        font-weight: bold;
                        color: var(--primary-blue);
                    }
                    
                    [data-theme="dark"] .stat-value {
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    }
                    .stat-label {
                        color: var(--text-secondary);
                        font-size: 14px;
                        margin-top: 8px;
                        font-weight: 500;
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
                        background: var(--card-bg);
                        border: 1px solid var(--card-border);
                        color: var(--text-primary);
                        cursor: pointer;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 14px;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(5px);
                    }
                    .tab-button:hover {
                        background: var(--light-blue-bg);
                        border-color: var(--primary-blue);
                        transform: translateY(-1px);
                    }
                    .tab-button.active {
                        background: var(--primary-blue);
                        color: #ffffff;
                        border-color: var(--primary-blue);
                        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
                        transform: translateY(-1px);
                    }
                    
                    [data-theme="dark"] .tab-button {
                        background: linear-gradient(145deg, var(--card-bg) 0%, var(--card-border) 100%);
                    }
                    
                    [data-theme="dark"] .tab-button:hover {
                        background: linear-gradient(145deg, #233a4a 0%, #2f4f7f 100%);
                    }
                    
                    [data-theme="dark"] .tab-button.active {
                        background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-blue) 100%);
                        box-shadow: 0 4px 15px rgba(74, 158, 255, 0.3);
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
                            <button onclick="toggleTheme()" style="margin-right: 10px;">🌙 Theme</button>
                            <button onclick="exportSnippets()">📤 Export</button>
                            <button onclick="importSnippets()">📥 Import</button>
                            <button onclick="refreshData()">🔄 Refresh</button>
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
                        <select id="folderFilter" onchange="searchSnippets()">
                            <option value="">All Folders</option>
                        </select>
                        <select id="tagFilter" onchange="searchSnippets()">
                            <option value="">All Tags</option>
                        </select>
                        <select id="fileTypeFilter" onchange="searchSnippets()">
                            <option value="">All File Types</option>
                        </select>

                    </div>
                    
                    <div class="tab-container">
                        <div class="tab-buttons">
                            <button class="tab-button active" onclick="switchTab('all')">📝 All Snippets</button>
                            <button class="tab-button" onclick="switchTab('favorites')">⭐ Favorites</button>
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
                        loadTheme();
                        loadSnippets();
                        loadStats();
                    });
                    
                    // Theme management
                    let currentTheme = 'dark';
                    
                    function toggleTheme() {
                        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
                        document.body.setAttribute('data-theme', currentTheme);
                        
                        // Update theme button text
                        const themeButton = document.querySelector('button[onclick="toggleTheme()"]');
                        if (themeButton) {
                            themeButton.innerHTML = currentTheme === 'dark' ? '🌙 Theme' : '☀️ Theme';
                        }
                        
                        // Save theme preference
                        localStorage.setItem('blockmate-theme', currentTheme);
                    }
                    
                    // Load saved theme preference
                    function loadTheme() {
                        const savedTheme = localStorage.getItem('blockmate-theme');
                        if (savedTheme) {
                            currentTheme = savedTheme;
                            document.body.setAttribute('data-theme', currentTheme);
                            
                            const themeButton = document.querySelector('button[onclick="toggleTheme()"]');
                            if (themeButton) {
                                themeButton.innerHTML = currentTheme === 'dark' ? '🌙 Theme' : '☀️ Theme';
                            }
                        }
                    }
                    
                    function loadSnippets() {
                        vscode.postMessage({ command: 'getSnippets' });
                    }
                    
                    function searchSnippets() {
                        const searchTerm = document.getElementById('searchInput').value;
                        const folderFilter = document.getElementById('folderFilter').value;
                        const tagFilter = document.getElementById('tagFilter').value;
                        const fileTypeFilter = document.getElementById('fileTypeFilter').value;
                        
                        const filters = {
                            folderId: folderFilter || undefined,
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
                    
                    function moveToFolder(snippetId) {
                        vscode.postMessage({ command: 'moveToFolder', snippetId });
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
                            case 'updateFolders':
                                updateFolderDropdown(message.folders);
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
                        
                        // Update folder filter dropdown
                        const folderFilter = document.getElementById('folderFilter');
                        const currentFolderValue = folderFilter.value;
                        folderFilter.innerHTML = '<option value="">All Folders</option>';
                        
                        // Load folders from extension
                        vscode.postMessage({ command: 'getFolders' });
                        
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
                        
                        // Create folder display
                        let folderDisplay = '';
                        if (snippet.folder) {
                            const folderIcon = snippet.folder.icon || '📁';
                            const folderColor = snippet.folder.color || '#6c757d';
                            const folderName = escapeHtml(snippet.folder.name);
                            folderDisplay = \`<div style="margin-bottom: 8px;"><span style="color: \${folderColor}; font-weight: 600;">\${folderIcon} \${folderName}</span></div>\`;
                        }
                        
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
                                    <button onclick="copySnippet('\${escapeHtml(snippet.id)}')" title="Copy to clipboard">📋 Copy</button>
                                    <button onclick="moveToFolder('\${escapeHtml(snippet.id)}')" title="Move to folder">📁 Move</button>
                                </div>
                            </div>
                            \${folderDisplay}
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
                    
                    function updateFolderDropdown(folders) {
                        const folderFilter = document.getElementById('folderFilter');
                        const currentFolderValue = folderFilter.value;
                        folderFilter.innerHTML = '<option value="">All Folders</option>';
                        
                        folders.forEach(folder => {
                            const option = document.createElement('option');
                            option.value = folder.id;
                            
                            // Create colored folder display
                            const folderIcon = folder.icon || '📁';
                            const folderColor = folder.color || '#6c757d';
                            const folderName = folder.name;
                            const snippetCount = folder.snippetCount;
                            
                            // Use CSS styling for colored text and icon
                            option.innerHTML = \`<span style="color: \${folderColor};">\${folderIcon} \${folderName}</span> (\${snippetCount})\`;
                            option.textContent = \`\${folderIcon} \${folderName} (\${snippetCount})\`;
                            
                            if (folder.id === currentFolderValue) {
                                option.selected = true;
                            }
                            folderFilter.appendChild(option);
                        });
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
      const folders = await this.snippetManager.getAllFolders();

      // Add folder information to snippets
      const snippetsWithFolders = snippets.map((snippet) => {
        const folder = snippet.folderId
          ? folders.find((f) => f.id === snippet.folderId)
          : null;
        return {
          ...snippet,
          folder: folder
            ? {
                id: folder.id,
                name: folder.name,
                icon: folder.icon,
                color: folder.color,
              }
            : null,
        };
      });

      this.panel?.webview.postMessage({
        command: "updateSnippets",
        snippets: snippetsWithFolders,
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
      const folders = await this.snippetManager.getAllFolders();

      // Add folder information to snippets
      const snippetsWithFolders = snippets.map((snippet) => {
        const folder = snippet.folderId
          ? folders.find((f) => f.id === snippet.folderId)
          : null;
        return {
          ...snippet,
          folder: folder
            ? {
                id: folder.id,
                name: folder.name,
                icon: folder.icon,
                color: folder.color,
              }
            : null,
        };
      });

      this.panel?.webview.postMessage({
        command: "updateSnippets",
        snippets: snippetsWithFolders,
      });
    } catch (error) {
      console.error("Failed to search snippets:", error);
    }
  }

  /**
   * Handle get folders request
   */
  private async handleGetFolders(): Promise<void> {
    try {
      const folders = await this.snippetManager.getAllFolders();
      this.panel?.webview.postMessage({
        command: "updateFolders",
        folders,
      });
    } catch (error) {
      console.error("Failed to get folders:", error);
    }
  }

  /**
   * Handle delete snippet request
   */
  private async handleDeleteSnippet(snippetId: string): Promise<void> {
    try {
      await this.snippetManager.deleteSnippet(snippetId);
      // Refresh both snippets and folders to update folder counts
      await this.handleGetSnippets();
      await this.handleGetFolders();
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

  /**
   * Handle move snippet to folder request
   */
  private async handleMoveToFolder(snippetId: string): Promise<void> {
    try {
      // Get the snippet to show its current name
      const snippet = await this.snippetManager.getSnippet(snippetId);
      if (!snippet) {
        vscode.window.showErrorMessage("Snippet not found");
        return;
      }

      // Get all available folders
      const folders = await this.snippetManager.getAllFolders();

      // Create folder options including "All Folders" (no folder)
      const folderOptions = [
        { label: "📁 All Folders (No Folder)", value: "" },
        ...folders.map((folder) => ({
          label: `${folder.icon || "📁"} ${folder.name} (${
            folder.snippetCount
          } snippets)`,
          value: folder.id,
          color: folder.color,
        })),
      ];

      // Show folder selection dialog
      const selected = await vscode.window.showQuickPick(
        folderOptions.map((option) => option.label),
        {
          placeHolder: `Select folder for snippet "${snippet.name}"`,
        }
      );

      if (!selected) return;

      // Find the selected folder
      const selectedFolder = folderOptions.find(
        (option) => option.label === selected
      );
      if (!selectedFolder) return;

      // Move snippet to selected folder
      await this.snippetManager.moveSnippetToFolder(
        snippetId,
        selectedFolder.value || undefined
      );

      // Refresh snippets and folders
      await this.handleGetSnippets();
      await this.handleGetFolders();

      // Show success message
      const folderName = selectedFolder.value
        ? folders.find((f) => f.id === selectedFolder.value)?.name
        : "All Folders";

      vscode.window.showInformationMessage(
        `✅ Snippet "${snippet.name}" moved to "${folderName}" successfully!`
      );
    } catch (error) {
      console.error("Failed to move snippet to folder:", error);
      vscode.window.showErrorMessage("Failed to move snippet to folder");
    }
  }
}
