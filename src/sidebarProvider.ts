import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { TaskService, Task } from './taskService';

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
      return Promise.resolve([new TimerSectionItem(), new TasksSectionItem()]);
    }

    if (element instanceof TimerSectionItem) {
      return Promise.resolve([...this.timerService.getCompletedEntries().map((log) => new LogItem(log))]);
    }

    if (element instanceof TasksSectionItem) {
      const tasks = this.taskService.getTasks();
      return Promise.resolve(tasks.map((task) => new TaskItem(task)));
    }

    return Promise.resolve([]);
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
}

class TimerSectionItem extends TreeItem {
  constructor() {
    super('Timer', vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = new vscode.ThemeIcon('clock');
    this.contextValue = 'timer';
  }
}

class TasksSectionItem extends TreeItem {
  constructor() {
    super('Tasks', vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = new vscode.ThemeIcon('checklist');
  }
}

class TaskItem extends TreeItem {
  constructor(private task: Task) {
    super(task.title);
    this.iconPath = new vscode.ThemeIcon('tasklist');
    this.tooltip = task.description || '';
    this.contextValue = 'task';
  }
}

class LogItem extends TreeItem {
  constructor(private log: any) {
    super(`Duration: ${Math.round(log.duration / 1000)}s`);
    this.iconPath = new vscode.ThemeIcon('clock');
    this.tooltip = `Task: ${log.taskId || 'None'}, Start: ${new Date(log.startTime).toLocaleString()}`;
  }
}
