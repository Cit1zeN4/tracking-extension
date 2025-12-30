import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { TaskService, Task } from './taskService';
import { SidebarProvider } from './sidebarProvider';
import { TaskDetailsProvider } from './taskDetailsProvider';
import { StorageScope } from './types';

let timerService: TimerService;
let taskService: TaskService;
let statusBarTaskDisplay: vscode.StatusBarItem;
let statusBarStartButton: vscode.StatusBarItem;
let statusBarPauseButton: vscode.StatusBarItem;
let statusBarStopButton: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Time Tracking Extension activated');

  // Read storage scope configuration
  const config = vscode.workspace.getConfiguration('tracking-extension');
  const storageScope = config.get('storageScope', 'global') as StorageScope;

  timerService = new TimerService(context, storageScope);
  taskService = new TaskService(context, timerService, storageScope);

  // Register sidebar
  const sidebarProvider = new SidebarProvider(timerService, taskService);
  context.subscriptions.push(vscode.window.registerTreeDataProvider(SidebarProvider.viewType, sidebarProvider));

  // Create task details provider
  const taskDetailsProvider = new TaskDetailsProvider(context, taskService, timerService);

  // Create status bar items
  statusBarTaskDisplay = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarTaskDisplay.command = 'tracking-extension.startTimer';

  statusBarStartButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  statusBarStartButton.command = 'tracking-extension.startTimer';
  statusBarStartButton.text = '$(play)';
  statusBarStartButton.tooltip = 'Start Timer';

  statusBarPauseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  statusBarPauseButton.command = 'tracking-extension.pauseTimer';
  statusBarPauseButton.text = '$(debug-pause)';
  statusBarPauseButton.tooltip = 'Pause Timer';

  statusBarStopButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
  statusBarStopButton.command = 'tracking-extension.stopTimer';
  statusBarStopButton.text = '$(stop)';
  statusBarStopButton.tooltip = 'Stop Timer';

  updateStatusBar();

  // Show initial state - only task display is visible when no timer is running
  statusBarTaskDisplay.show();
  // All buttons are hidden initially by updateStatusBar()

  context.subscriptions.push(statusBarTaskDisplay, statusBarStartButton, statusBarPauseButton, statusBarStopButton);

  // Update status bar every second
  const statusBarUpdater = setInterval(updateStatusBar, 1000);
  context.subscriptions.push({ dispose: () => clearInterval(statusBarUpdater) });

  // Register commands
  const startTimerCommand = vscode.commands.registerCommand(
    'tracking-extension.startTimer',
    async (arg?: string | vscode.TreeItem) => {
      try {
        const state = timerService.getState();

        // If timer is paused (not running but has current entry), resume it
        if (!state.isRunning && state.currentEntry) {
          timerService.resumeTimer();
          vscode.window.showInformationMessage('Timer resumed!');
          return;
        }

        // Check if arg is a task ID string, tree item, or undefined
        let taskId: string | undefined;
        if (typeof arg === 'string') {
          taskId = arg;
        } else if (arg && typeof arg === 'object' && 'id' in arg && arg.id?.startsWith('task-')) {
          // Tree item with task ID in format "task-{taskId}"
          taskId = arg.id.substring(5); // Remove "task-" prefix
        }

        // If taskId is provided, use it; otherwise select a task
        let task: Task | undefined;
        if (taskId) {
          task = taskService.getTaskById(taskId);
        } else {
          task = await selectTask();
        }

        timerService.startTimer(task?.id);
        vscode.window.showInformationMessage(`Timer started${task ? ` for task: ${task.title}` : ''}!`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to start timer: ${error}`);
      }
    }
  );

  const stopTimerCommand = vscode.commands.registerCommand('tracking-extension.stopTimer', () => {
    const entry = timerService.stopTimer();
    if (entry) {
      vscode.window.showInformationMessage(`Timer stopped! Duration: ${Math.round(entry.duration / 1000)}s`);
    } else {
      vscode.window.showWarningMessage('No active timer to stop');
    }
  });

  const pauseTimerCommand = vscode.commands.registerCommand('tracking-extension.pauseTimer', () => {
    timerService.pauseTimer();
    vscode.window.showInformationMessage('Timer paused!');
  });

  const createTaskCommand = vscode.commands.registerCommand('tracking-extension.createTask', async () => {
    const title = await vscode.window.showInputBox({
      prompt: 'Enter task title',
      placeHolder: 'My Task',
    });

    if (title) {
      const description = await vscode.window.showInputBox({
        prompt: 'Enter task description (optional)',
        placeHolder: 'Description',
      });

      const task = taskService.createTask(title, description);
      vscode.window.showInformationMessage(`Task created: ${task.title}`);
    }
  });

  const viewLogsCommand = vscode.commands.registerCommand('tracking-extension.viewLogs', () => {
    const entries = timerService.getCompletedEntries();
    if (entries.length === 0) {
      vscode.window.showInformationMessage('No time entries found');
      return;
    }

    const logText = entries
      .map((entry) => {
        const duration = Math.round(entry.duration / 1000);
        const task = entry.taskId ? taskService.getTaskById(entry.taskId) : null;
        return `${entry.startTime.toLocaleString()} - ${duration}s${task ? ` (${task.title})` : ''}`;
      })
      .join('\n');

    vscode.window.showInformationMessage(`Time Entries:\n${logText}`);
  });

  const viewTasksCommand = vscode.commands.registerCommand('tracking-extension.viewTasks', () => {
    const tasks = taskService.getTasks();
    if (tasks.length === 0) {
      vscode.window.showInformationMessage('No tasks found');
      return;
    }

    const taskText = tasks.map((task) => `${task.title}${task.description ? ` - ${task.description}` : ''}`).join('\n');
    vscode.window.showInformationMessage(`Tasks:\n${taskText}`);
  });

  const openSidebarCommand = vscode.commands.registerCommand('tracking-extension.openSidebar', () => {
    vscode.commands.executeCommand('workbench.view.explorer');
    // Focus the specific view
    vscode.commands.executeCommand('workbench.view.extension.tracking-extension.sidebar');
  });

  const viewTaskDetailsCommand = vscode.commands.registerCommand(
    'tracking-extension.viewTaskDetails',
    async (arg?: string | vscode.TreeItem) => {
      let taskId: string | undefined;

      // Check if arg is a task ID string or tree item
      if (typeof arg === 'string') {
        taskId = arg;
      } else if (arg && typeof arg === 'object' && 'id' in arg && arg.id?.startsWith('task-')) {
        // Tree item with task ID in format "task-{taskId}"
        taskId = arg.id.substring(5); // Remove "task-" prefix
      }

      // If no taskId provided, ask user to select a task
      if (!taskId) {
        const task = await selectTask();
        taskId = task?.id;
      }

      if (taskId) {
        taskDetailsProvider.showTaskDetails(taskId);
      } else {
        vscode.window.showErrorMessage('No task selected');
      }
    }
  );

  const deleteTaskCommand = vscode.commands.registerCommand(
    'tracking-extension.deleteTask',
    async (arg?: string | vscode.TreeItem) => {
      let taskId: string | undefined;

      // Check if arg is a task ID string or tree item
      if (typeof arg === 'string') {
        taskId = arg;
      } else if (arg && typeof arg === 'object' && 'id' in arg && arg.id?.startsWith('task-')) {
        // Tree item with task ID in format "task-{taskId}"
        taskId = arg.id.substring(5); // Remove "task-" prefix
      }

      // If no taskId provided, ask user to select a task
      if (!taskId) {
        const task = await selectTask();
        taskId = task?.id;
      }

      if (!taskId) {
        vscode.window.showErrorMessage('No task selected');
        return;
      }

      const task = taskService.getTaskById(taskId);
      if (!task) {
        vscode.window.showErrorMessage('Task not found');
        return;
      }

      // Check if task has an active timer
      const timerState = timerService.getState();
      if (timerState.currentEntry?.taskId === taskId && timerState.isRunning) {
        const result = await vscode.window.showWarningMessage(
          `Cannot delete task "${task.title}" while timer is running. Stop the timer first?`,
          'Stop Timer and Delete',
          'Cancel'
        );

        if (result === 'Stop Timer and Delete') {
          timerService.stopTimer();
        } else {
          return; // Cancel deletion
        }
      }

      // Show confirmation dialog
      const confirmResult = await vscode.window.showWarningMessage(
        `Delete task "${task.title}"?`,
        {
          modal: true,
          detail: 'This will permanently delete the task and all its time entries. This action cannot be undone.',
        },
        'Delete',
        'Cancel'
      );

      if (confirmResult === 'Delete') {
        try {
          taskService.deleteTask(taskId);
          vscode.window.showInformationMessage(`Task "${task.title}" deleted successfully`);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to delete task: ${error}`);
        }
      }
    }
  );

  const editTaskCommand = vscode.commands.registerCommand(
    'tracking-extension.editTask',
    async (arg?: string | vscode.TreeItem) => {
      let taskId: string | undefined;

      // Check if arg is a task ID string or tree item
      if (typeof arg === 'string') {
        taskId = arg;
      } else if (arg && typeof arg === 'object' && 'id' in arg && arg.id?.startsWith('task-')) {
        // Tree item with task ID in format "task-{taskId}"
        taskId = arg.id.substring(5); // Remove "task-" prefix
      }

      // If no taskId provided, ask user to select a task
      if (!taskId) {
        const task = await selectTask();
        taskId = task?.id;
      }

      if (!taskId) {
        vscode.window.showErrorMessage('No task selected');
        return;
      }

      const task = taskService.getTaskById(taskId);
      if (!task) {
        vscode.window.showErrorMessage('Task not found');
        return;
      }

      // Get new title
      const newTitle = await vscode.window.showInputBox({
        prompt: 'Edit task title',
        placeHolder: 'Enter new title',
        value: task.title,
      });

      if (newTitle === undefined) {
        return; // User cancelled
      }

      if (!newTitle.trim()) {
        vscode.window.showErrorMessage('Task title cannot be empty');
        return;
      }

      // Get new description
      const newDescription = await vscode.window.showInputBox({
        prompt: 'Edit task description (optional)',
        placeHolder: 'Enter new description',
        value: task.description || '',
      });

      if (newDescription === undefined) {
        return; // User cancelled
      }

      try {
        taskService.updateTask(taskId, newTitle.trim(), newDescription.trim() || undefined);
        vscode.window.showInformationMessage(`Task "${newTitle}" updated successfully`);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to update task: ${error}`);
      }
    }
  );

  const toggleStorageScopeCommand = vscode.commands.registerCommand(
    'tracking-extension.toggleStorageScope',
    async () => {
      const currentScope = taskService.getStorageScope();
      const newScope = currentScope === StorageScope.Global ? StorageScope.Workspace : StorageScope.Global;

      const scopeName = newScope === StorageScope.Global ? 'global' : 'workspace';
      const confirmMessage = `Switch to ${scopeName} storage? This will migrate your tasks.`;

      const result = await vscode.window.showWarningMessage(confirmMessage, { modal: true }, 'Switch', 'Cancel');

      if (result === 'Switch') {
        try {
          taskService.setStorageScope(newScope);
          timerService.setStorageScope(newScope);

          // Update the configuration to persist the choice
          const config = vscode.workspace.getConfiguration('tracking-extension');
          await config.update('storageScope', scopeName, vscode.ConfigurationTarget.Workspace);

          vscode.window.showInformationMessage(`Switched to ${scopeName} storage. Tasks have been migrated.`);
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to switch storage scope: ${error}`);
        }
      }
    }
  );

  // Add to subscriptions for proper disposal
  context.subscriptions.push(
    startTimerCommand,
    stopTimerCommand,
    pauseTimerCommand,
    createTaskCommand,
    viewLogsCommand,
    viewTasksCommand,
    openSidebarCommand,
    viewTaskDetailsCommand,
    deleteTaskCommand,
    editTaskCommand,
    toggleStorageScopeCommand
  );
}

function updateStatusBar() {
  if (!statusBarTaskDisplay || !timerService || !taskService) return;

  const state = timerService.getState();
  const currentEntry = state.currentEntry;
  const task = currentEntry?.taskId ? taskService.getTaskById(currentEntry.taskId) : null;
  const taskName = task ? (task.title.length > 80 ? task.title.substring(0, 77) + '...' : task.title) : '';

  if (state.isRunning) {
    // Timer is running
    const elapsed = Math.floor(state.elapsedTime / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    statusBarTaskDisplay.text = taskName ? `$(clock) ${taskName} - ${timeStr}` : `$(clock) ${timeStr}`;
    statusBarTaskDisplay.tooltip = task
      ? `Timer running for: ${task.title}`
      : 'Timer running - Click to start a new timer';

    // Show pause and stop, hide start
    statusBarStartButton.hide();
    statusBarPauseButton.show();
    statusBarStopButton.show();
  } else if (currentEntry) {
    // Timer is paused (not running but has current entry)
    const elapsed = Math.floor(state.elapsedTime / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    statusBarTaskDisplay.text = taskName ? `$(debug-pause) ${taskName} - ${timeStr}` : `$(debug-pause) ${timeStr}`;
    statusBarTaskDisplay.tooltip = task
      ? `Timer paused for: ${task.title} - Click to resume`
      : 'Timer paused - Click to resume';

    // Show start (as resume) and stop, hide pause
    statusBarStartButton.show();
    statusBarStartButton.text = '$(play)';
    statusBarStartButton.tooltip = 'Resume Timer';
    statusBarPauseButton.hide();
    statusBarStopButton.show();
  } else {
    // Timer is stopped (not running and no current entry)
    statusBarTaskDisplay.text = '$(play) Start Timer';
    statusBarTaskDisplay.tooltip = 'Click to start timer';

    // Hide all buttons - only task display is visible
    statusBarStartButton.hide();
    statusBarPauseButton.hide();
    statusBarStopButton.hide();
  }
}

async function selectTask(): Promise<Task | undefined> {
  const tasks = taskService.getTasks();
  if (tasks.length === 0) {
    return undefined;
  }

  const items = tasks.map((task) => ({
    label: task.title,
    description: task.description,
    task,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a task (optional)',
  });

  return selected?.task;
}

export function deactivate() {
  console.log('Time Tracking Extension deactivated');
  if (timerService) {
    timerService.stopTimer();
  }
}
