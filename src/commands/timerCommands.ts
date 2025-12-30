import * as vscode from 'vscode';
import { TimerService } from '../timerService';
import { TaskService } from '../taskService';
import { Task } from '../types';

export function registerTimerCommands(timerService: TimerService, taskService: TaskService): vscode.Disposable[] {
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
          task = await selectTask(taskService);
        }

        if (!task) {
          vscode.window.showErrorMessage('Cannot start timer without selecting a task. Create a task first.');
          return;
        }

        timerService.startTimer(task.id);
        vscode.window.showInformationMessage(`Timer started for task: ${task.title}!`);
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

  return [startTimerCommand, stopTimerCommand, pauseTimerCommand];
}

async function selectTask(taskService: TaskService): Promise<Task | undefined> {
  const tasks = taskService.getTasks();
  if (tasks.length === 0) {
    vscode.window.showErrorMessage('No tasks available. Create a task first to start tracking time.');
    return undefined;
  }

  const items = tasks.map((task) => ({
    label: task.title,
    description: task.description,
    task,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a task',
  });

  return selected?.task;
}
