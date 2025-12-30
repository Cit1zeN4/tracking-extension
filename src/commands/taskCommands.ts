import * as vscode from 'vscode';
import { TimerService } from '../timerService';
import { TaskService } from '../taskService';
import { Task } from '../types';
import { TaskDetailsProvider } from '../taskDetailsProvider';

export function registerTaskCommands(
  timerService: TimerService,
  taskService: TaskService,
  taskDetailsProvider: TaskDetailsProvider
): vscode.Disposable[] {
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

  const viewTasksCommand = vscode.commands.registerCommand('tracking-extension.viewTasks', () => {
    const tasks = taskService.getTasks();
    if (tasks.length === 0) {
      vscode.window.showInformationMessage('No tasks found');
      return;
    }

    const taskText = tasks.map((task) => `${task.title}${task.description ? ` - ${task.description}` : ''}`).join('\n');
    vscode.window.showInformationMessage(`Tasks:\n${taskText}`);
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
        const task = await selectTask(taskService);
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
        const task = await selectTask(taskService);
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
        const task = await selectTask(taskService);
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

  return [createTaskCommand, viewTasksCommand, viewTaskDetailsCommand, deleteTaskCommand, editTaskCommand];
}

async function selectTask(taskService: TaskService): Promise<Task | undefined> {
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
