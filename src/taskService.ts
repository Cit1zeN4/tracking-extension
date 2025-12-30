import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { StorageScope, Task } from './types';

export class TaskService {
  private tasks: Task[] = [];
  private context: vscode.ExtensionContext;
  private timerService: TimerService;
  private storageScope: StorageScope;
  private _onTasksChanged = new vscode.EventEmitter<void>();
  public readonly onTasksChanged = this._onTasksChanged.event;

  constructor(
    context: vscode.ExtensionContext,
    timerService?: TimerService,
    storageScope: StorageScope = StorageScope.Global
  ) {
    this.context = context;
    this.timerService = timerService!;
    this.storageScope = storageScope;
    this.loadTasks();
  }

  createTask(title: string, description?: string, boardId?: string, columnId?: string): Task {
    const task: Task = {
      id: this.generateId(),
      title,
      description,
      source: 'manual',
      createdAt: new Date(),
      boardId,
      columnId,
    };

    this.tasks.push(task);
    this.saveTasks();
    this._onTasksChanged.fire();
    return task;
  }

  getTasks(): Task[] {
    return [...this.tasks];
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find((task) => task.id === id);
  }

  deleteTask(id: string): void {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    // Also delete all timer entries associated with this task
    if (this.timerService) {
      this.timerService.deleteEntriesByTaskId(id);
    }
    this.saveTasks();
    this._onTasksChanged.fire();
  }

  updateTask(id: string, title?: string, description?: string): void {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      this.saveTasks();
      this._onTasksChanged.fire();
    }
  }

  getTotalTimeSpent(taskId: string): number {
    if (!this.timerService) {
      return 0;
    }
    return this.timerService
      .getCompletedEntries()
      .filter((entry) => entry.taskId === taskId)
      .reduce((total, entry) => total + entry.duration, 0);
  }

  moveTaskToColumn(taskId: string, boardId: string, columnId: string): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;

    task.boardId = boardId;
    task.columnId = columnId;
    this.saveTasks();
    this._onTasksChanged.fire();
    return true;
  }

  assignDefaultBoardAndColumn(defaultBoardId: string, defaultColumnId: string): void {
    let updated = false;
    this.tasks.forEach((task) => {
      if (!task.boardId || !task.columnId) {
        task.boardId = defaultBoardId;
        task.columnId = defaultColumnId;
        updated = true;
      }
    });
    if (updated) {
      this.saveTasks();
      this._onTasksChanged.fire();
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveTasks(): void {
    const storage = this.storageScope === StorageScope.Global ? this.context.globalState : this.context.workspaceState;
    storage.update('tasks', this.tasks);
  }

  getStorageScope(): StorageScope {
    return this.storageScope;
  }

  setStorageScope(newScope: StorageScope): void {
    if (newScope === this.storageScope) {
      return; // No change needed
    }

    const previousScope = this.storageScope;
    try {
      // Save current tasks to the old storage before switching
      this.saveTasks();

      // Change storage scope
      this.storageScope = newScope;

      // Clear in-memory tasks and load from new storage
      this.tasks = [];
      this.loadTasks();

      // Fire event to update UI
      this._onTasksChanged.fire();
    } catch (error) {
      // Revert to previous scope if something goes wrong
      this.storageScope = previousScope;
      console.error('Failed to change storage scope:', error);
      throw error;
    }
  }

  private loadTasks(): void {
    const storage = this.storageScope === StorageScope.Global ? this.context.globalState : this.context.workspaceState;
    const savedTasks = storage.get('tasks') as Task[] | undefined;
    if (savedTasks) {
      this.tasks = savedTasks.map((task) => ({
        ...task,
        createdAt: typeof task.createdAt === 'string' ? new Date(task.createdAt) : task.createdAt,
      }));
    } else {
      // If no tasks in this storage scope, start with empty array
      this.tasks = [];
    }
  }
}
