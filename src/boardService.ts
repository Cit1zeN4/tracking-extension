import * as vscode from 'vscode';
import { Board, StorageScope } from './types';
import { TaskService } from './taskService';

export class BoardService {
  private boards: Board[] = [];
  private context: vscode.ExtensionContext;
  private storageScope: StorageScope;
  private _onBoardsChanged = new vscode.EventEmitter<void>();
  public readonly onBoardsChanged = this._onBoardsChanged.event;

  constructor(context: vscode.ExtensionContext, storageScope: StorageScope = StorageScope.Global) {
    this.context = context;
    this.storageScope = storageScope;
    this.loadBoards();
  }

  createBoard(name: string, description?: string): Board {
    const board: Board = {
      id: this.generateId(),
      name,
      description,
      columns: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.boards.push(board);
    this.saveBoards();
    this._onBoardsChanged.fire();
    return board;
  }

  getBoards(): Board[] {
    return [...this.boards];
  }

  getBoard(id: string): Board | undefined {
    return this.boards.find((board) => board.id === id);
  }

  updateBoard(id: string, updates: Partial<Pick<Board, 'name' | 'description'>>): Board | undefined {
    const board = this.boards.find((b) => b.id === id);
    if (!board) return undefined;

    Object.assign(board, updates, { updatedAt: new Date() });
    this.saveBoards();
    this._onBoardsChanged.fire();
    return board;
  }

  deleteBoard(id: string, taskService?: TaskService): boolean {
    const index = this.boards.findIndex((board) => board.id === id);
    if (index === -1) return false;

    // Delete all tasks associated with this board
    if (taskService) {
      const tasksToDelete = taskService.getTasks().filter((t) => t.boardId === id);
      for (const task of tasksToDelete) {
        taskService.deleteTask(task.id);
      }
    }

    this.boards.splice(index, 1);
    this.saveBoards();
    this._onBoardsChanged.fire();
    return true;
  }

  getStorageScope(): StorageScope {
    return this.storageScope;
  }

  setStorageScope(newScope: StorageScope): void {
    if (newScope === this.storageScope) {
      return;
    }

    const previousScope = this.storageScope;
    try {
      this.saveBoards();
      this.storageScope = newScope;
      this.boards = [];
      this.loadBoards();
      this._onBoardsChanged.fire();
    } catch (error) {
      this.storageScope = previousScope;
      console.error('Failed to change storage scope for boards:', error);
      throw error;
    }
  }

  private saveBoards(): void {
    const storage = this.storageScope === StorageScope.Global ? this.context.globalState : this.context.workspaceState;
    storage.update('boards', this.boards);
  }

  private loadBoards(): void {
    const storage = this.storageScope === StorageScope.Global ? this.context.globalState : this.context.workspaceState;
    const savedBoards = storage.get('boards') as Board[] | undefined;
    if (savedBoards) {
      this.boards = savedBoards.map((board) => ({
        ...board,
        createdAt: typeof board.createdAt === 'string' ? new Date(board.createdAt) : board.createdAt,
        updatedAt: typeof board.updatedAt === 'string' ? new Date(board.updatedAt) : board.updatedAt,
      }));
    } else {
      this.boards = [];
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
