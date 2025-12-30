import * as vscode from 'vscode';
import { TaskService } from '../taskService';
import { ColumnService } from '../columnService';
import { SidebarProvider } from '../sidebarProvider';

export function processMoveTaskToColumnArgs(arg?: string | vscode.TreeItem): string | undefined {
  // Check if arg is a task ID string, tree item, or undefined
  let targetTaskId: string | undefined;
  if (typeof arg === 'string') {
    targetTaskId = arg;
  } else if (arg && typeof arg === 'object' && 'id' in arg && arg.id?.startsWith('task-')) {
    // Tree item with task ID in format "task-{taskId}"
    targetTaskId = arg.id.substring(5); // Remove "task-" prefix
  }
  return targetTaskId;
}

export function registerUICommands(
  taskService: TaskService,
  columnService: ColumnService,
  sidebarProvider: SidebarProvider
): vscode.Disposable[] {
  const viewLogsCommand = vscode.commands.registerCommand('tracking-extension.viewLogs', () => {
    const outputChannel = vscode.window.createOutputChannel('Time Tracking Extension');
    outputChannel.show();
  });

  const openSidebarCommand = vscode.commands.registerCommand('tracking-extension.openSidebar', () => {
    vscode.commands.executeCommand('workbench.view.extension.tracking-extension-sidebar');
  });

  const toggleStorageScopeCommand = vscode.commands.registerCommand(
    'tracking-extension.toggleStorageScope',
    async () => {
      const config = vscode.workspace.getConfiguration('tracking-extension');
      const currentScope = config.get<string>('storageScope', 'workspace');

      const newScope = currentScope === 'workspace' ? 'global' : 'workspace';

      await config.update('storageScope', newScope, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage(`Storage scope changed to: ${newScope}`);
    }
  );

  const moveTaskToColumnCommand = vscode.commands.registerCommand(
    'tracking-extension.moveTaskToColumn',
    async (arg?: string | vscode.TreeItem) => {
      let targetTaskId = processMoveTaskToColumnArgs(arg);

      if (!targetTaskId) {
        const tasks = taskService.getTasks();
        if (tasks.length === 0) {
          vscode.window.showInformationMessage('No tasks available.');
          return;
        }

        const items = tasks.map((task) => ({
          label: task.title,
          detail: task.description,
          task,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select task to move',
        });

        if (selected) {
          targetTaskId = selected.task.id;
        } else {
          return;
        }
      }

      const task = taskService.getTaskById(targetTaskId);
      if (!task) {
        vscode.window.showErrorMessage('Task not found.');
        return;
      }

      // Use task's board if available, otherwise use selected board from sidebar
      const currentBoardId = task.boardId || sidebarProvider.getSelectedBoardId();
      if (!currentBoardId) {
        vscode.window.showInformationMessage(
          'No board selected. Please select a board in the sidebar or ensure the task belongs to a board.'
        );
        return;
      }

      const columns = columnService.getColumns(currentBoardId);
      const items = columns.map((column) => ({
        label: column.name,
        column,
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select target column',
      });

      if (selected) {
        taskService.moveTaskToColumn(targetTaskId, currentBoardId, selected.column.id);
        vscode.window.showInformationMessage(`Task "${task.title}" moved to column "${selected.column.name}"`);
      }
    }
  );

  const createTaskForBoardCommand = vscode.commands.registerCommand(
    'tracking-extension.createTaskForBoard',
    async (boardId?: string) => {
      let targetBoardId = boardId;

      if (!targetBoardId) {
        targetBoardId = sidebarProvider.getSelectedBoardId();
      }

      if (!targetBoardId) {
        vscode.window.showInformationMessage('No board selected.');
        return;
      }

      const name = await vscode.window.showInputBox({
        prompt: 'Enter task name',
        placeHolder: 'New Task',
      });

      if (name) {
        const description = await vscode.window.showInputBox({
          prompt: 'Enter task description (optional)',
          placeHolder: 'Description',
        });

        // Find the default column for the board
        const columns = columnService.getColumns(targetBoardId);
        const defaultColumn = columns.find((col) => col.isDefault) || columns[0];

        taskService.createTask(name, description || undefined, targetBoardId, defaultColumn?.id);
        vscode.window.showInformationMessage(`Task created: ${name}`);
      }
    }
  );

  const deleteAllTasksCommand = vscode.commands.registerCommand('tracking-extension.deleteAllTasks', async () => {
    const tasks = taskService.getTasks();
    if (tasks.length === 0) {
      vscode.window.showInformationMessage('No tasks to delete.');
      return;
    }

    const result = await vscode.window.showWarningMessage(
      `Delete all ${tasks.length} tasks? This will permanently delete all tasks and their time entries. ` +
        `This action cannot be undone.`,
      { modal: true },
      'Delete All',
      'Cancel'
    );

    if (result === 'Delete All') {
      for (const task of tasks) {
        taskService.deleteTask(task.id);
      }
      vscode.window.showInformationMessage(`All ${tasks.length} tasks deleted successfully.`);
    }
  });

  return [
    viewLogsCommand,
    openSidebarCommand,
    toggleStorageScopeCommand,
    moveTaskToColumnCommand,
    createTaskForBoardCommand,
    deleteAllTasksCommand,
  ];
}
