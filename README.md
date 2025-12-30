# Time Tracking Extension

VS Code extension for tracking time spent on tasks and projects.

## Features

- ⏱️ **Timer**: Start### Switching Storage Scopes

1. Open the Time Tracking sidebar in the activity bar
2. Click on the "Storage Scope" item at the top
3. Confirm the switch when prompted
4. Tasks and timer data will be completely separate between global and workspace scopes

**Important**: Switching storage scopes does not migrate data. Each scope maintains its own separate set of tasks and timer entries. When you switch scopes, you'll see only the data that exists in that specific scope.and pause the timer

- 📋 **Task Management**: Create and view tasks
- 💾 **Data Saving**: Automatic saving of time and tasks between sessions
- 📊 **View Logs**: View history of spent time
- 🔄 **Status Bar Integration**: Minimalist interface in VS Code status bar - one control when timer is not active, extended control buttons when timer is running
- 📱 **Activity Bar**: Centralized interface for all functions in VS Code activity bar
- 🗂️ **Storage Scope**: Choose between global tasks (shared across workspaces) or workspace-specific tasks

## Installation

1. Install the extension from VS Code Marketplace or build from source:

   ```bash
   npm install
   npm run compile
   ```

2. Reload VS Code or use the "Developer: Reload Window" command

## Usage

### Status Bar

The extension adds elements to the VS Code status bar for convenient timer management:

- **When timer is not running**: Only one element is shown **$(play) Start Timer**
- **When timer is running**: Shows **$(clock) Task Name - MM:SS** (task name limited to 80 characters), as well as **$(debug-pause) Pause** and **$(stop) Stop** buttons
- **When timer is paused**: Shows active task with time and control buttons

All status bar elements are clickable and allow timer control without opening additional panels.

### Activity Bar

The extension provides a "Time Tracking" icon in the VS Code activity bar (left sidebar), which combines all main controls in a tree view:

- **Storage Scope**: Toggle between global and workspace-specific task storage
- **Timer**: Next to the item, control icons are displayed ▶️ (Start), ⏹️ (Stop), ⏸️ (Pause); expand to view session history
- **Tasks**: List of tasks with the ability to select for the timer

**How to use:**

1. In the activity bar, find the clock icon and open the tree
2. Use the "Storage Scope" item to choose between global or workspace-specific tasks
3. Use the icons next to "Timer" to control the timer
4. Expand "Timer" to view recent sessions

### Commands

All commands are available through the command palette (`Ctrl+Shift+P`) or through the context menu.

#### Timer Management

- **Start Timer** (`tracking-extension.startTimer`)
  - Starts a new timer
  - Offers to select a task from the list (optional)
  - Shows a notification about starting

- **Stop Timer** (`tracking-extension.stopTimer`)
  - Stops the active timer
  - Saves time to log
  - Shows session duration

- **Pause Timer** (`tracking-extension.pauseTimer`)
  - Pauses the active timer
  - Time is not counted while timer is paused

#### Task Management

- **Create Task** (`tracking-extension.createTask`)
  - Creates a new task
  - Requests name and description
  - Tasks are saved between sessions

- **View Tasks** (`tracking-extension.viewTasks`)
  - Shows list of all tasks
  - Displays name and description of each task

#### Data Viewing

- **View Time Logs** (`tracking-extension.viewLogs`)
  - Shows history of all timer sessions
  - Includes duration, date, and associated task

- **Toggle Storage Scope** (`tracking-extension.toggleStorageScope`)
  - Switches between global and workspace-specific task storage
  - Migrates existing tasks to the new storage location

## Workflow

### Basic Usage

1. **Create a task** (optional):
   - `Ctrl+Shift+P` → "Create Task"
   - Enter name and description

2. **Start the timer**:
   - Click on the status bar or use "Start Timer" command
   - Select a task from the list (if created)

3. **Work on the task**

4. **Stop the timer**:
   - Use "Stop Timer" command
   - Time will be saved automatically

### Advanced Workflow

- **Pause**: Use "Pause Timer" for breaks
- **Multiple tasks**: Create separate tasks for different projects
- **View progress**: Regularly check time logs via "View Time Logs"

## Storage Scope Migration Guide

### Upgrading from Previous Versions

If you're upgrading from a version that only supported global storage:

1. **Default Behavior**: The extension defaults to global storage for backward compatibility
2. **Workspace-Specific Tasks**: To use workspace-specific tasks, toggle the storage scope in the sidebar
3. **Data Migration**: When switching scopes, your existing tasks are automatically migrated
4. **Per-Workspace Settings**: Each workspace can have its own storage scope preference

### Choosing the Right Storage Scope

- **Use Global Storage** when you want tasks shared across multiple projects/workspaces
- **Use Workspace Storage** when you want tasks specific to individual projects

### Switching Between Scopes

1. Open the Time Tracking sidebar in the activity bar
2. Click on the "Storage Scope" item at the top
3. Confirm the migration when prompted
4. Your tasks will be moved to the new storage location

Note: Timer entries always follow the same storage scope as their associated tasks.

## Hotkeys

By default, no hotkeys are assigned. You can configure them in VS Code settings:

1. `Ctrl+Shift+P` → "Preferences: Open Keyboard Shortcuts"
2. Find commands with prefix "tracking-extension."
3. Assign convenient key combinations

## Data and Storage

The extension supports two storage scopes for tasks and timer data:

### Storage Scopes

- **Global Storage** (default): Tasks and timer data are shared across all VS Code workspaces
- **Workspace Storage**: Tasks and timer data are specific to each workspace

### Switching Storage Scopes

You can switch between storage scopes using:

1. The "Storage Scope" item in the activity bar sidebar
2. The "Toggle Storage Scope" command from the command palette
3. VS Code settings: `tracking-extension.storageScope`

When switching scopes, existing tasks are automatically migrated to the new storage location.

### Data Persistence

- **Tasks**: Saved in the selected storage scope (global or workspace)
- **Time Logs**: Saved in the same scope as their associated tasks
- **Settings**: Use standard VS Code settings for storage scope preference

**Important**: Global and workspace storage scopes are completely separate. Tasks created in global scope are not visible in workspace scope, and vice versa. Switching between scopes does not transfer or migrate data.

All data is saved between VS Code restarts and synchronized with VS Code settings.

## Troubleshooting

### Timer doesn't start

- Make sure the extension is activated (check status bar)
- Try reloading VS Code window

### Data not saved

- Check that you have write permissions to VS Code settings folder
- Try restarting VS Code

### Commands not displayed

- Make sure the extension is installed and activated
- Try "Developer: Reload Window" command

## Development

For extension development:

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch for changes
npm run watch

# Linting
npm run lint

# Code formatting
npm run format

# Run tests
npm run test
```

## License

MIT

## Other

<a href="https://www.flaticon.com/ru/free-icons/">Logo from pancaza - Flaticon</a>
