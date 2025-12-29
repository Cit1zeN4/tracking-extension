import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { TaskService, Task } from './taskService';
import { SidebarProvider } from './sidebarProvider';

let timerService: TimerService;
let taskService: TaskService;
let statusBarTaskDisplay: vscode.StatusBarItem;
let statusBarStartButton: vscode.StatusBarItem;
let statusBarPauseButton: vscode.StatusBarItem;
let statusBarStopButton: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Time Tracking Extension activated');

  timerService = new TimerService(context);
  taskService = new TaskService(context);

  // Register sidebar
  const sidebarProvider = new SidebarProvider(timerService, taskService);
  context.subscriptions.push(vscode.window.registerTreeDataProvider(SidebarProvider.viewType, sidebarProvider));

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
  const startTimerCommand = vscode.commands.registerCommand('tracking-extension.startTimer', async () => {
    try {
      const task = await selectTask();
      timerService.startTimer(task?.id);
      vscode.window.showInformationMessage(`Timer started${task ? ` for task: ${task.title}` : ''}!`);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to start timer: ${error}`);
    }
  });

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

  // Add to subscriptions for proper disposal
  context.subscriptions.push(
    startTimerCommand,
    stopTimerCommand,
    pauseTimerCommand,
    createTaskCommand,
    viewLogsCommand,
    viewTasksCommand,
    openSidebarCommand
  );
}

function updateStatusBar() {
  if (!statusBarTaskDisplay || !timerService || !taskService) return;

  const state = timerService.getState();
  const currentEntry = state.currentEntry;
  const task = currentEntry?.taskId ? taskService.getTaskById(currentEntry.taskId) : null;
  const taskName = task ? (task.title.length > 80 ? task.title.substring(0, 77) + '...' : task.title) : '';

  if (state.isRunning) {
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
  } else {
    statusBarTaskDisplay.text = '$(play) Start Timer';
    statusBarTaskDisplay.tooltip = 'Click to start timer';

    // Hide all buttons when timer is not running
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
