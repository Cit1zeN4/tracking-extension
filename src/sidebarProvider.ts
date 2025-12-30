import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { TaskService } from './taskService';
import { BoardService } from './boardService';
import { ColumnService } from './columnService';
import { StorageScope, Task, Column, Board } from './types';

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export class SidebarProvider implements vscode.TreeDataProvider<TreeItem>, vscode.TreeDragAndDropController<TreeItem> {
  public static readonly viewType = 'tracking-extension.sidebar';

  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined> = new vscode.EventEmitter<
    TreeItem | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

  public dropMimeTypes = ['application/vnd.code.tree.taskItem'];
  public dragMimeTypes = ['application/vnd.code.tree.taskItem'];

  private selectedBoardId: string | undefined;

  getSelectedBoardId(): string | undefined {
    return this.selectedBoardId;
  }

  setSelectedBoardId(boardId: string | undefined): void {
    this.selectedBoardId = boardId;
    this.refresh();
  }

  constructor(
    private readonly timerService: TimerService,
    private readonly taskService: TaskService,
    private readonly boardService: BoardService,
    private readonly columnService: ColumnService
  ) {
    this.timerService.onTimerStateChanged(() => this.refresh());
    this.taskService.onTasksChanged(() => this.refresh());
    this.boardService.onBoardsChanged(() => this.refresh());
    this.columnService.onColumnsChanged(() => this.refresh());
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
      return Promise.resolve([
        new StorageScopeItem(this.taskService),
        new BoardSectionItem(this.boardService, this.columnService, this.taskService, this.timerService),
      ]);
    }

    if (element instanceof BoardSectionItem) {
      const boards = this.boardService.getBoards();
      const boardItems = boards.map(
        (board) => new BoardItem(board, this.columnService, this.taskService, this.timerService)
      );
      return Promise.resolve(boardItems);
    }

    if (element instanceof BoardItem) {
      const board = element.getBoard();
      const columns = this.columnService.getColumns(board.id);
      const columnItems = columns.map((column) => {
        const tasksInColumn = this.taskService.getTasks().filter((task) => task.columnId === column.id);
        return new ColumnItem(column, tasksInColumn.length);
      });
      return Promise.resolve([
        new CreateColumnButton(board.id),
        new CreateTaskForBoardButton(board.id),
        ...columnItems,
      ]);
    }

    if (element instanceof ColumnItem) {
      const column = element.getColumn();
      const tasksInColumn = this.taskService.getTasks().filter((task) => task.columnId === column.id);
      const taskItems = tasksInColumn.map((task) => new TaskItem(task, this.taskService, this.timerService));
      return Promise.resolve(taskItems);
    }

    return Promise.resolve([]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDrag(source: readonly TreeItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void {
    const taskItems = source.filter((item) => item instanceof TaskItem);
    if (taskItems.length > 0) {
      dataTransfer.set('application/vnd.code.tree.taskItem', new vscode.DataTransferItem(taskItems));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDrop(target: TreeItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void {
    const transferItem = dataTransfer.get('application/vnd.code.tree.taskItem');
    if (!transferItem) return;

    const draggedItems = transferItem.value as TaskItem[];
    if (!draggedItems || draggedItems.length === 0) return;

    let targetColumnId: string | undefined;
    let targetBoardId: string | undefined;

    if (target instanceof ColumnItem) {
      targetColumnId = target.getColumn().id;
      // Find the board that contains this column
      const boards = this.boardService.getBoards();
      for (const board of boards) {
        const columns = this.columnService.getColumns(board.id);
        if (columns.some((col) => col.id === targetColumnId)) {
          targetBoardId = board.id;
          break;
        }
      }
    } else if (target instanceof TaskItem) {
      // If dropped on a task, move to that task's column and board
      const task = this.taskService.getTaskById(target.getTask().id);
      targetColumnId = task?.columnId;
      targetBoardId = task?.boardId;
    }

    if (!targetColumnId || !targetBoardId) return;

    // Move all dragged tasks to the target column and board
    for (const draggedItem of draggedItems) {
      this.taskService.moveTaskToColumn(draggedItem.getTask().id, targetBoardId, targetColumnId);
    }
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState);
  }
}

class CreateColumnButton extends TreeItem {
  constructor(private boardId: string) {
    super('Create Column', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('add');
    this.tooltip = 'Create a new column in this board';
    this.command = {
      command: 'tracking-extension.createColumn',
      title: 'Create Column',
      arguments: [boardId],
    };
  }
}

class CreateTaskForBoardButton extends TreeItem {
  constructor(private boardId: string) {
    super('Create Task', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('add');
    this.tooltip = 'Create a new task in this board';
    this.command = {
      command: 'tracking-extension.createTaskForBoard',
      title: 'Create Task',
      arguments: [boardId],
    };
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

class BoardSectionItem extends TreeItem {
  constructor(
    private boardService: BoardService,
    private columnService: ColumnService,
    private taskService: TaskService,
    private timerService: TimerService
  ) {
    super('Boards', vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = new vscode.ThemeIcon('project');
    this.contextValue = 'board-selector';
  }
}

class BoardItem extends TreeItem {
  constructor(
    private board: Board,
    private columnService: ColumnService,
    private taskService: TaskService,
    private timerService: TimerService
  ) {
    const totalTasks = taskService.getTasks().filter((task) => task.boardId === board.id).length;
    const label = `${board.name} (${totalTasks})`;
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.id = board.id; // Set unique ID for the tree item
    this.iconPath = new vscode.ThemeIcon('project');
    this.tooltip = `Board: ${board.name}\nTasks: ${totalTasks}`;
    this.contextValue = 'board-item';
  }

  getBoard() {
    return this.board;
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

  getTask(): Task {
    return this.task;
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

class ColumnItem extends TreeItem {
  constructor(
    private column: Column,
    private taskCount: number
  ) {
    const label = `${column.name} (${taskCount})`;
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.id = column.id; // Set unique ID for the tree item
    this.iconPath = new vscode.ThemeIcon('list-unordered');
    this.tooltip = `Column: ${column.name}\nTasks: ${taskCount}`;
    this.contextValue = column.isDefault ? 'column-default' : 'column-custom';
  }

  getColumn(): Column {
    return this.column;
  }
}
