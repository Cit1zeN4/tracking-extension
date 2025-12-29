import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { TaskService, Task } from './taskService';

let timerService: TimerService;
let taskService: TaskService;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Time Tracking Extension activated');

  timerService = new TimerService(context);
  taskService = new TaskService(context);

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'tracking-extension.startTimer';
  updateStatusBar();
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

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

  // Add to subscriptions for proper disposal
  context.subscriptions.push(
    startTimerCommand,
    stopTimerCommand,
    pauseTimerCommand,
    createTaskCommand,
    viewLogsCommand,
    viewTasksCommand
  );
}

function updateStatusBar() {
  if (!statusBarItem || !timerService) return;

  const state = timerService.getState();
  if (state.isRunning) {
    const elapsed = Math.floor(state.elapsedTime / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    statusBarItem.text = `$(clock) ${minutes}:${seconds.toString().padStart(2, '0')}`;
    statusBarItem.tooltip = 'Timer running - Click to start a new timer';
  } else {
    statusBarItem.text = '$(play) Start Timer';
    statusBarItem.tooltip = 'Click to start timer';
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
