import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { TaskService, Task } from './taskService';
import { StorageScope } from './types';

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export class SidebarProvider implements vscode.TreeDataProvider<TreeItem> {
  public static readonly viewType = 'tracking-extension.sidebar';

  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<
    TreeItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

  constructor(
    private readonly timerService: TimerService,
    private readonly taskService: TaskService
  ) {
    this.timerService.onTimerStateChanged(() => this.refresh());
    this.taskService.onTasksChanged(() => this.refresh());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (!element) {
      // Root level
      return Promise.resolve([new StorageScopeItem(this.taskService), new TasksSectionItem()]);
    }

    if (element instanceof TasksSectionItem) {
      const tasks = this.taskService.getTasks();
      const taskItems = tasks.map((task) => new TaskItem(task, this.taskService, this.timerService));
      return Promise.resolve([new CreateTaskButton(), ...taskItems]);
    }

    return Promise.resolve([]);
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
}

class StorageScopeItem extends TreeItem {
  constructor(private taskService: TaskService) {
    const currentScope = taskService.getStorageScope();
    const scopeLabel = currentScope === StorageScope.Global ? 'Global Tasks' : 'Workspace Tasks';
    super(scopeLabel, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('database');
    this.tooltip = `Current storage: ${scopeLabel}. Click to change storage scope.`;
    this.command = {
      command: 'tracking-extension.toggleStorageScope',
      title: 'Toggle Storage Scope',
    };
  }
}

class TasksSectionItem extends TreeItem {
  constructor() {
    super('Tasks', vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = new vscode.ThemeIcon('checklist');
    this.contextValue = 'tasks-section';
  }
}

class TaskItem extends TreeItem {
  constructor(
    private task: Task,
    private taskService: TaskService,
    private timerService: TimerService
  ) {
    const timeSpent = taskService.getTotalTimeSpent(task.id);
    const timeDisplay = timeSpent > 0 ? formatDuration(timeSpent) : '';
    const label = timeDisplay ? `${task.title} (${timeDisplay})` : task.title;

    super(label);
    this.id = `task-${task.id}`; // Set unique ID for the tree item
    this.iconPath = new vscode.ThemeIcon('tasklist');
    this.tooltip = task.description
      ? `${task.description}\nTime spent: ${timeDisplay || '0:00'}`
      : `Time spent: ${timeDisplay || '0:00'}`;
    this.contextValue = this.getContextValue();
  }

  private getContextValue(): string {
    const timerState = this.timerService.getState();
    const isCurrentTask = timerState.currentEntry?.taskId === this.task.id;

    if (isCurrentTask) {
      return timerState.isRunning ? 'task-running' : 'task-paused';
    } else if (!timerState.isRunning) {
      return 'task-stopped';
    } else {
      return 'task-other-running';
    }
  }
}

class CreateTaskButton extends TreeItem {
  constructor() {
    super('Create Task', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('add');
    this.tooltip = 'Create a new task';
    this.command = {
      command: 'tracking-extension.createTask',
      title: 'Create Task',
    };
  }
}
