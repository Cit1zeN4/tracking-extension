import * as vscode from 'vscode';

export interface Task {
  id: string;
  title: string;
  description?: string;
  source: 'manual' | 'external';
  externalId?: string;
  createdAt: Date;
}

export class TaskService {
  private tasks: Task[] = [];
  private context: vscode.ExtensionContext;
  private _onTasksChanged = new vscode.EventEmitter<void>();
  public readonly onTasksChanged = this._onTasksChanged.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadTasks();
  }

  createTask(title: string, description?: string): Task {
    const task: Task = {
      id: this.generateId(),
      title,
      description,
      source: 'manual',
      createdAt: new Date(),
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

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveTasks(): void {
    // Save to global state
    this.context.globalState.update('tasks', this.tasks);
  }

  private loadTasks(): void {
    // Load from global state
    const savedTasks = this.context.globalState.get('tasks') as Task[];
    if (savedTasks) {
      this.tasks = savedTasks;
    }
  }
}
