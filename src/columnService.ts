import * as vscode from 'vscode';
import { Column, StorageScope } from './types';

export class ColumnService {
  private columns: Column[] = [];
  private context: vscode.ExtensionContext;
  private storageScope: StorageScope;
  private _onColumnsChanged = new vscode.EventEmitter<void>();
  public readonly onColumnsChanged = this._onColumnsChanged.event;

  constructor(context: vscode.ExtensionContext, storageScope: StorageScope = StorageScope.Global) {
    this.context = context;
    this.storageScope = storageScope;
    this.loadColumns();
  }

  createColumn(boardId: string, name: string, isDefault: boolean = false): Column {
    const position = this.getNextPosition(boardId);
    const column: Column = {
      id: this.generateId(),
      boardId,
      name,
      isDefault,
      position,
      createdAt: new Date(),
    };

    this.columns.push(column);
    this.saveColumns();
    this._onColumnsChanged.fire();
    return column;
  }

  getColumns(boardId?: string): Column[] {
    if (boardId) {
      return this.columns.filter((column) => column.boardId === boardId).sort((a, b) => a.position - b.position);
    }
    return [...this.columns];
  }

  getColumn(id: string): Column | undefined {
    return this.columns.find((column) => column.id === id);
  }

  updateColumn(id: string, updates: Partial<Pick<Column, 'name' | 'position'>>): Column | undefined {
    const column = this.columns.find((c) => c.id === id);
    if (!column || column.isDefault) return undefined; // Cannot update default columns

    Object.assign(column, updates);
    this.saveColumns();
    this._onColumnsChanged.fire();
    return column;
  }

  deleteColumn(id: string): boolean {
    const column = this.columns.find((c) => c.id === id);
    if (!column || column.isDefault) return false; // Cannot delete default columns

    const index = this.columns.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.columns.splice(index, 1);
    this.saveColumns();
    this._onColumnsChanged.fire();
    return true;
  }

  isColumnNameUnique(boardId: string, name: string, excludeId?: string): boolean {
    return !this.columns.some(
      (column) => column.boardId === boardId && column.name === name && column.id !== excludeId
    );
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
      this.saveColumns();
      this.storageScope = newScope;
      this.columns = [];
      this.loadColumns();
      this._onColumnsChanged.fire();
    } catch (error) {
      this.storageScope = previousScope;
      console.error('Failed to change storage scope for columns:', error);
      throw error;
    }
  }

  private getNextPosition(boardId: string): number {
    const boardColumns = this.columns.filter((c) => c.boardId === boardId);
    return boardColumns.length > 0 ? Math.max(...boardColumns.map((c) => c.position)) + 1 : 0;
  }

  private saveColumns(): void {
    const storage = this.storageScope === StorageScope.Global ? this.context.globalState : this.context.workspaceState;
    storage.update('columns', this.columns);
  }

  private loadColumns(): void {
    const storage = this.storageScope === StorageScope.Global ? this.context.globalState : this.context.workspaceState;
    const savedColumns = storage.get('columns') as Column[] | undefined;
    if (savedColumns) {
      this.columns = savedColumns.map((column) => ({
        ...column,
        createdAt: typeof column.createdAt === 'string' ? new Date(column.createdAt) : column.createdAt,
      }));
    } else {
      this.columns = [];
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
