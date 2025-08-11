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

- **AES-256 Encryption**: Enterprise-grade encryption for all snippet data
- **XSS Protection**: HTML escaping prevents malicious code injection
- **Path Traversal Protection**: Secure file path validation
- **Input Validation**: Length limits and dangerous pattern detection
- **Content Security Policy**: CSP headers for webview protection
- **Rate Limiting**: Prevents abuse of extension features
- **Secure Key Management**: Automatic encryption key generation and storage
- **🔍 Audit Logging**: Comprehensive security event tracking and monitoring

### 📊 Modern Management Interface

- **Dark Theme UI**: Modern, eye-friendly interface
- **Real-time Statistics**: Live usage and storage statistics
- **Export/Import**: Backup and share your snippet collections
- **Responsive Design**: Works on all screen sizes
- **Hover Effects**: Interactive UI elements with smooth animations

### 📁 Smart Folder Organization

- **📂 Folder System**: Organize snippets into custom folders by project, language, or purpose
- **🎯 Folder Preview**: Visual sidebar showing all folders with snippet counts
- **🔄 Quick Access**: Click folders to manage snippets, add new ones, or view contents
- **🏷️ Smart Categorization**: Automatically suggest folders based on snippet content
- **📊 Folder Statistics**: Track snippet counts and usage per folder

### ⚡ Auto-Completion

- **Intelligent Suggestions**: Get snippet suggestions as you type
- **Usage-based Sorting**: Most used snippets appear first
- **Rich Documentation**: See snippet details and tags in suggestions
- **Multi-language Support**: Works with all programming languages

## 🛠️ Installation

### From VSIX File (Recommended)

1. **Download VSIX**: Download `blockmate-snippets-0.0.8.vsix` from [Releases](https://github.com/code-town3/blockmate-snippets/releases)
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

### 🚀 Getting Started with Folders

#### Step 1: Access the Folder Preview

1. **Open VS Code**
2. **Look for BlockMate Icon**: Find the blue "B" icon in the left activity bar
3. **Click the Icon**: This opens the folder preview sidebar
4. **View Your Folders**: See all existing folders with snippet counts

#### Step 2: Create Your First Folder

1. **Open Command Palette**: `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
2. **Type**: "BlockMate: Manage Folders"
3. **Select the Command**
4. **Click "Create New Folder"**
5. **Enter Folder Name**: e.g., "React Components", "Database Queries", "Utility Functions"
6. **Add Description** (optional): e.g., "Common React component templates"
7. **Save the Folder**

#### Step 3: Add Snippets to Folders

1. **Select Code**: Highlight code you want to save
2. **Quick Create**: Press `Ctrl+Shift+Q`
3. **Fill Details**:
   - **Name**: "React Button Component"
   - **Prefix**: "rbtn" (auto-generated if left empty)
   - **Description**: "Reusable button component with props"
   - **Tags**: "react, component, button"
4. **Select Folder**: Choose your newly created folder
5. **Save Snippet**

#### Step 4: Organize and Manage

1. **Click Folder in Sidebar**: See folder options
2. **Choose Action**:
   - "Open Folder Manager" - Full management
   - "View Snippets" - See all snippets in folder
   - "Add Snippet" - Quick add to this folder

### Creating Snippets

#### Method 1: Standard Creation

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
   - **Select Folder**: Choose which folder to save the snippet in

#### Method 2: Quick Create Snippet (Drag & Drop Style)

1. **Select Code**: Highlight the code you want to save
2. **Quick Create**: Use `Ctrl+Shift+Q` (Windows/Linux) / `Cmd+Shift+Q` (Mac)
3. **Configure Snippet**:
   - Enter snippet name
   - Set prefix (auto-generated from name if not specified)
   - Add description
   - Add tags
   - **Select Folder**: Choose from available folders or create new one

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

### 📁 Managing Folders

#### Accessing Folder Management

1. **Command Palette Method**:

   - Press `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
   - Type "BlockMate: Manage Folders"
   - Select the command

2. **Sidebar Method**:
   - Click the BlockMate icon in the activity bar (left sidebar)
   - Click on any folder in the preview
   - Select "Open Folder Manager" from the options

#### Folder Management Features

**📂 Creating Folders**:

- Click "Create New Folder" in the folder manager
- Enter folder name (e.g., "React Components", "Database Queries")
- Add optional description
- Choose folder color/icon (if available)

**🔄 Managing Existing Folders**:

- **Rename**: Change folder name and description
- **Delete**: Remove folder (snippets moved to "Uncategorized")
- **Move Snippets**: Transfer snippets between folders
- **View Statistics**: See snippet count and usage per folder

**📊 Folder Preview Sidebar**:

- **Visual Overview**: See all folders with snippet counts
- **Quick Actions**: Click folders for instant access to:
  - "Open Folder Manager" - Full folder management
  - "View Snippets" - See all snippets in that folder
  - "Add Snippet" - Quick snippet creation in that folder

#### Folder Organization Tips

**🏷️ Best Practices**:

- **Project-based**: Create folders for each project (e.g., "E-commerce App", "Blog System")
- **Language-based**: Organize by programming language (e.g., "JavaScript", "Python", "SQL")
- **Function-based**: Group by purpose (e.g., "Authentication", "Database", "UI Components")
- **Frequency-based**: Separate commonly used vs. specialized snippets

**📈 Folder Statistics**:

- Track how many snippets are in each folder
- Monitor usage patterns per folder
- Identify which folders need more organization

### 🔐 Managing Encryption

1. **Open Encryption Manager**:

   - Use `Ctrl+Shift+P` to open command palette
   - Run "BlockMate: Manage Encryption" command

2. **Available Actions**:

   - **🔓 Enable Encryption**: Enable AES-256 encryption for all snippets
   - **🔒 Disable Encryption**: Disable encryption (snippets stored in plain text)
   - **🔑 Change Encryption Key**: Generate new key and re-encrypt all snippets
   - **📊 Encryption Status**: View current encryption status and key information

3. **Encryption Process**:
   - When enabled, all snippet data (body, description) is automatically encrypted
   - Encryption keys are securely stored in VS Code's secure storage
   - Snippets are automatically decrypted when viewed in the interface
   - Key changes trigger automatic re-encryption of all existing snippets

## ⚙️ Configuration

### Settings

Add these to your VS Code settings:

```json
{
  "blockmate.snippets.storagePath": "",
  "blockmate.snippets.autoBackup": true,
  "blockmate.snippets.maxSnippets": 1000,
  "blockmate.snippets.enableEncryption": false,
  "blockmate.snippets.encryptionKey": ""
}
```

### 🔐 Encryption Management

BlockMate Snippets includes enterprise-grade AES-256 encryption for your snippet data. You can manage encryption settings through the VS Code command palette.

#### Enabling Encryption

1. **Open Command Palette**: `Ctrl+Shift+P`
2. **Run Command**: "BlockMate: Manage Encryption"
3. **Select**: "🔓 Enable Encryption"
4. **Confirm**: Click "Yes" to enable AES-256 encryption

#### Managing Encryption

Available encryption commands:

- **🔓 Enable Encryption**: Enable AES-256 encryption for all snippets
- **🔒 Disable Encryption**: Disable encryption (snippets stored in plain text)
- **🔑 Change Encryption Key**: Generate a new encryption key and re-encrypt all snippets
- **📊 Encryption Status**: View current encryption status and key information

#### Encryption Features

- **AES-256-CBC**: Military-grade encryption algorithm
- **PBKDF2**: 10,000 iterations for key derivation
- **Random Salt + IV**: Unique salt and initialization vector for each encryption
- **Secure Storage**: Keys stored in VS Code's secure storage
- **Automatic Re-encryption**: All snippets automatically re-encrypted when key changes

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
},
{
  "key": "ctrl+shift+q",
  "command": "blockmate.quickCreateSnippet",
  "when": "editorHasSelection"
}
```

### 📁 Folder Commands

Available folder management commands:

```json
{
  "command": "blockmate.manageFolders",
  "title": "Manage Folders",
  "category": "BlockMate"
}
```

#### Encryption Commands

Encryption commands are available through the command palette:

```json
{
  "command": "blockmate.manageEncryption",
  "title": "Manage Encryption",
  "category": "BlockMate"
}
```

## 🔐 PIN Protection

BlockMate Snippets includes optional PIN protection for enhanced security. **PIN protection is disabled by default** - you can enable it anytime through the command palette.

### 🔒 How PIN Protection Works

- **Optional Security**: PIN protection is completely optional and disabled by default
- **Snippet Access Control**: When enabled, requires PIN to access, save, or manage snippets
- **30-Minute Sessions**: Once verified, PIN remains valid for 30 minutes
- **Emergency Recovery**: Use emergency code to reset PIN if forgotten
- **VS Code Unaffected**: PIN protection only affects snippet access, not VS Code functionality

### 🚀 Getting Started

**For users who don't want PIN protection:**

- Simply use the extension normally - no PIN required
- All snippet features work without any security prompts
- PIN protection remains disabled until you choose to enable it

**For users who want PIN protection:**

1. **Open Command Palette**: `Ctrl+Shift+P`
2. **Run Command**: "BlockMate: Manage PIN Protection"
3. **Select**: "🔐 Enable PIN Protection"
4. **Set PIN**: Enter a 4-8 digit PIN
5. **Set Emergency Code**: Enter an 8-12 digit emergency code

### 🔑 PIN Protection Features

#### Available Commands

- **🔐 Enable PIN Protection**: Set up PIN protection for snippets
- **🔓 Disable PIN Protection**: Remove PIN protection (requires current PIN or emergency code)
- **🔢 Change PIN**: Update your PIN (requires current PIN)
- **🔑 Change Emergency Code**: Update emergency code (requires current PIN)
- **📊 PIN Protection Status**: View current protection status

#### Security Features

- **PIN Verification**: 4-8 digit PIN for snippet access
- **Emergency Code**: 8-12 digit backup code for PIN recovery
- **Session Management**: 30-minute PIN sessions to avoid frequent prompts
- **Lockout Protection**: Temporary lockout after multiple failed attempts
- **Secure Storage**: PIN and emergency codes stored using VS Code's secure storage
- **Forgot PIN Recovery**: Reset PIN using emergency code

#### PIN Recovery Process

If you forget your PIN:

1. **Access Snippets**: Try to access snippets (will show PIN prompt)
2. **Click "Forgot PIN?"**: When invalid PIN is entered
3. **Enter Emergency Code**: Provide your emergency code
4. **Set New PIN**: Create a new PIN and emergency code
5. **Save New Emergency Code**: Note down the new emergency code

### ⚙️ PIN Protection Commands

PIN protection commands are available through the command palette:

```json
{
  "command": "blockmate.managePinProtection",
  "title": "Manage PIN Protection",
  "category": "BlockMate"
}
```

## 🔒 Security Features

### 🔐 AES-256 Encryption

BlockMate Snippets provides enterprise-grade encryption for your snippet data:

- **AES-256-CBC Algorithm**: Military-grade encryption standard
- **PBKDF2 Key Derivation**: 10,000 iterations for enhanced security
- **Random Salt + IV**: Unique salt and initialization vector for each encryption
- **Secure Key Storage**: Encryption keys stored in VS Code's secure storage
- **Automatic Encryption**: All snippet data (body, description) automatically encrypted
- **Key Rotation**: Easy encryption key change with automatic re-encryption

### Input Validation

- **Length Limits**: Names (200 chars), descriptions (500 chars), tags (50 chars)
- **Dangerous Pattern Detection**: Blocks XSS, path traversal, and injection attempts
- **Character Validation**: Ensures safe input characters
- **File Type Validation**: Validates file type specifications

### Data Protection

- **Local Storage**: All data stored securely on your machine
- **Automatic Backups**: Configurable backup system with versioning
- **Error Handling**: Graceful error handling with user feedback
- **Encrypted Storage**: Snippet data encrypted at rest using AES-256

### Webview Security

- **Content Security Policy**: CSP headers prevent malicious code execution
- **HTML Escaping**: All user content is properly escaped
- **Sandboxed Environment**: Webview runs in isolated environment

### 🔍 Audit Logging

BlockMate Snippets includes comprehensive audit logging to track security events and user actions:

#### **Event Types Tracked**

- **PIN Protection Events**: PIN attempts, successes, failures, changes, resets
- **Snippet Access Events**: Create, update, delete, copy, search operations
- **Folder Management Events**: Create, update, delete, move operations
- **Security Events**: Encryption changes, rate limit violations, suspicious activity
- **System Events**: Extension start/stop, configuration changes, errors

#### **Severity Levels**

- **LOW**: Normal operations (snippet access, successful PIN verification)
- **MEDIUM**: Important changes (PIN changes, snippet deletion, encryption disable)
- **HIGH**: Security concerns (PIN failures, account lockouts, rate limit violations)
- **CRITICAL**: System errors and suspicious activity

#### **Audit Features**

- **Real-time Logging**: All events logged immediately with timestamps
- **Event Filtering**: Filter events by type, severity, date range, or user
- **Statistics Dashboard**: View event counts and trends
- **Export Capability**: Export audit logs for analysis
- **Privacy Controls**: Clear audit logs when needed
- **Automatic Cleanup**: Maintains last 10,000 events for performance

#### **Security Monitoring**

- **Suspicious Activity Detection**: Automatic flagging of high/critical events
- **Console Alerts**: High-severity events logged to console with warnings
- **User Tracking**: Track events by machine ID for multi-user environments
- **Metadata Storage**: Additional context stored with each event

#### **Audit Log Structure**

Each audit event includes:

- **Unique ID**: UUID for event identification
- **Timestamp**: Precise date and time of event
- **Event Type**: Categorized event classification
- **User ID**: Machine identifier for user tracking
- **Details**: Human-readable event description
- **Severity**: Security level assessment
- **Metadata**: Additional contextual information
- **IP Address**: Client location (localhost for VS Code)
- **User Agent**: Extension version information

#### **🧪 Testing Audit Logging**

You can test the audit logging functionality using the built-in test command:

1. **Open Command Palette**: `Ctrl+Shift+P`
2. **Run Command**: "BlockMate: Test Audit Logging"
3. **View Results**: Check the output channel for detailed test results

The test will:

- Generate various test events (PIN attempts, snippet operations, security events)
- Display real-time audit alerts for high/critical severity events
- Show comprehensive statistics and event breakdown
- Save test results for analysis

**Test Command Available**:

```json
{
  "command": "blockmate.testAudit",
  "title": "Test Audit Logging",
  "category": "BlockMate"
}
```

## 🎯 Quick Reference Guide

### 📁 Folder Management Commands

| Command                  | Shortcut                                     | Description                                 |
| ------------------------ | -------------------------------------------- | ------------------------------------------- |
| **Manage Folders**       | `Ctrl+Shift+P` → "BlockMate: Manage Folders" | Full folder management interface            |
| **Quick Create Snippet** | `Ctrl+Shift+Q`                               | Fast snippet creation with folder selection |
| **Save Snippet**         | `Ctrl+Shift+S`                               | Standard snippet creation                   |
| **Manage Snippets**      | `Ctrl+Shift+M`                               | Complete snippet management                 |
| **Insert Snippet**       | `Ctrl+Shift+I`                               | Insert existing snippets                    |

### 🔧 Folder Workflow

#### **Daily Usage**:

1. **Select Code** → `Ctrl+Shift+Q` → **Choose Folder** → **Save**
2. **Click Folder in Sidebar** → **"Add Snippet"** → **Quick Add**
3. **Click Folder in Sidebar** → **"View Snippets"** → **Browse & Use**

#### **Organization**:

1. **`Ctrl+Shift+P`** → **"Manage Folders"** → **Create/Organize**
2. **Sidebar** → **Click Folder** → **"Open Folder Manager"**
3. **Move snippets between folders** → **Clean up organization**

### 🎨 Folder Organization Examples

#### **Project-Based Structure**:

```
📁 E-commerce App
├── 🗂️ Authentication (5 snippets)
├── 🗂️ Product Management (12 snippets)
├── 🗂️ Shopping Cart (8 snippets)
└── 🗂️ Payment Processing (6 snippets)
```

#### **Language-Based Structure**:

```
📁 JavaScript
├── 🗂️ React Components (15 snippets)
├── 🗂️ Node.js Utils (10 snippets)
├── 🗂️ ES6 Features (8 snippets)
└── 🗂️ DOM Manipulation (6 snippets)
```

#### **Function-Based Structure**:

```
📁 Database
├── 🗂️ SQL Queries (20 snippets)
├── 🗂️ MongoDB (12 snippets)
├── 🗂️ Redis (5 snippets)
└── 🗂️ Database Utils (8 snippets)
```

## 📞 Support

- **Contact**: Reach out to the development team
- **Documentation**: See this README for usage instructions
- **Feedback**: Share your experience and suggestions

---

**Made with ❤️ by Lielisk Team**
