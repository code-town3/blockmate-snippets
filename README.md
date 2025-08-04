# BlockMate Snippets

Advanced code snippets management with smart organization, tagging, and security features for Visual Studio Code.

## 🚀 Features

### ✨ Smart Snippet Management

- **Easy Creation**: Select code and save as snippet with `Ctrl+Shift+S`
- **Smart Organization**: Tag and categorize snippets for easy discovery
- **File Type Support**: Specify which file types each snippet works with
- **Usage Tracking**: Monitor how often snippets are used
- **Favorites System**: Mark and organize your most-used snippets

### 🔍 Advanced Search & Filtering

- **Real-time Search**: Search snippets by name, prefix, or description
- **Dynamic Tag Filtering**: Filter by tags with auto-populated dropdown
- **File Type Filtering**: Show only snippets for specific file types
- **Favorites Tab**: Dedicated view for your favorite snippets
- **Combined Filters**: Use multiple filters simultaneously

### 🛡️ Security Features

- **XSS Protection**: HTML escaping prevents malicious code injection
- **Path Traversal Protection**: Secure file path validation
- **Input Validation**: Length limits and dangerous pattern detection
- **Content Security Policy**: CSP headers for webview protection
- **Rate Limiting**: Prevents abuse of extension features

### 📊 Modern Management Interface

- **Dark Theme UI**: Modern, eye-friendly interface
- **Real-time Statistics**: Live usage and storage statistics
- **Export/Import**: Backup and share your snippet collections
- **Responsive Design**: Works on all screen sizes
- **Hover Effects**: Interactive UI elements with smooth animations

### ⚡ Auto-Completion

- **Intelligent Suggestions**: Get snippet suggestions as you type
- **Usage-based Sorting**: Most used snippets appear first
- **Rich Documentation**: See snippet details and tags in suggestions
- **Multi-language Support**: Works with all programming languages

## 🛠️ Installation

### From VSIX File (Recommended)

1. **Download VSIX**: Download `blockmate-snippets-0.0.6.vsix` from [Releases](https://github.com/code-town3/blockmate-snippets/releases)
2. **Open VS Code**
3. **Go to Extensions** (`Ctrl+Shift+X`)
4. **Click "..." menu** and select "Install from VSIX..."
5. **Select the downloaded .vsix file**
6. **Restart VS Code**

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for "BlockMate Snippets"
4. Click "Install"

### From Source

```bash
git clone https://github.com/code-town3/blockmate-snippets.git
cd blockmate-snippets
npm install
npm run compile
npx vsce package
```

## 📖 Usage

### Creating Snippets

1. **Select Code**: Highlight the code you want to save as a snippet
2. **Save Snippet**:
   - Right-click and select "Save as Code Snippet"
   - Or use `Ctrl+Shift+S` (Windows/Linux) / `Cmd+Shift+S` (Mac)
3. **Configure Snippet**:
   - Enter a name (e.g., "React Functional Component")
   - Set a prefix (e.g., "rfc")
   - Add description (optional)
   - Add tags (e.g., "react, frontend, component")
   - Specify file types (e.g., "js, jsx, ts, tsx")

### Using Snippets

#### Method 1: Auto-Completion

- Start typing in any supported file type
- VS Code will suggest your snippets
- Select and insert the snippet

#### Method 2: Quick Pick

- Use `Ctrl+Shift+I` to open snippet picker
- Search and select from available snippets

#### Method 3: Direct Prefix

- Type the snippet prefix (e.g., "rfc")
- Press `Tab` or `Enter` to insert

### Managing Snippets

1. **Open Manager**:

   - Use `Ctrl+Shift+M` (Windows/Linux) / `Cmd+Shift+M` (Mac)
   - Or run "BlockMate: Manage Snippets" command

2. **Features Available**:
   - **Search**: Real-time search across all snippets
   - **Tag Filtering**: Dropdown with all available tags
   - **File Type Filtering**: Filter by specific file types
   - **Favorites Tab**: Dedicated view for favorite snippets
   - **Statistics**: Live usage and storage statistics
   - **Export/Import**: Backup and share collections
   - **Copy to Clipboard**: One-click snippet copying

## ⚙️ Configuration

### Settings

Add these to your VS Code settings:

```json
{
  "blockmate.snippets.storagePath": "",
  "blockmate.snippets.autoBackup": true,
  "blockmate.snippets.maxSnippets": 1000
}
```

### Keybindings

Default keybindings (can be customized):

```json
{
  "key": "ctrl+shift+s",
  "command": "blockmate.saveSnippet",
  "when": "editorHasSelection"
},
{
  "key": "ctrl+shift+m",
  "command": "blockmate.manageSnippets"
},
{
  "key": "ctrl+shift+i",
  "command": "blockmate.insertSnippet"
}
```

## 🔒 Security Features

### Input Validation

- **Length Limits**: Names (200 chars), descriptions (500 chars), tags (50 chars)
- **Dangerous Pattern Detection**: Blocks XSS, path traversal, and injection attempts
- **Character Validation**: Ensures safe input characters
- **File Type Validation**: Validates file type specifications

### Data Protection

- **Local Storage**: All data stored securely on your machine
- **Automatic Backups**: Configurable backup system with versioning
- **Error Handling**: Graceful error handling with user feedback

### Webview Security

- **Content Security Policy**: CSP headers prevent malicious code execution
- **HTML Escaping**: All user content is properly escaped
- **Sandboxed Environment**: Webview runs in isolated environment

## 📞 Support

- **Contact**: Reach out to the development team
- **Documentation**: See this README for usage instructions
- **Feedback**: Share your experience and suggestions

---

**Made with ❤️ by Lielisk Team**
