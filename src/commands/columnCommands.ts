import * as vscode from 'vscode';
import { TaskService } from '../taskService';
import { BoardService } from '../boardService';
import { ColumnService } from '../columnService';
import { Column } from '../types';
import { SidebarProvider } from '../sidebarProvider';

export function registerColumnCommands(
  taskService: TaskService,
  boardService: BoardService,
  columnService: ColumnService,
  sidebarProvider: SidebarProvider
): vscode.Disposable[] {
  const createColumnCommand = vscode.commands.registerCommand(
    'tracking-extension.createColumn',
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
        prompt: 'Enter column name',
        placeHolder: 'In Progress',
      });

      if (name) {
        if (columnService.isColumnNameUnique(targetBoardId, name)) {
          columnService.createColumn(targetBoardId, name);
          vscode.window.showInformationMessage(`Column created: ${name}`);
        } else {
          vscode.window.showErrorMessage('Column name already exists in this board.');
        }
      }
    }
  );

  const editColumnCommand = vscode.commands.registerCommand(
    'tracking-extension.editColumn',
    async (arg?: string | vscode.TreeItem) => {
      let columnId: string | undefined;

      // Check if arg is a column ID string or tree item
      if (typeof arg === 'string') {
        columnId = arg;
      } else if (arg && typeof arg === 'object' && 'id' in arg) {
        // Tree item with column ID
        columnId = arg.id;
      }

      let column: Column | undefined;
      if (columnId) {
        // Find the column by ID
        const boards = boardService.getBoards();
        for (const board of boards) {
          const columns = columnService.getColumns(board.id);
          column = columns.find((col) => col.id === columnId);
          if (column) break;
        }

        if (!column) {
          vscode.window.showErrorMessage('Column not found.');
          return;
        }

        if (column.isDefault) {
          vscode.window.showInformationMessage('Default columns cannot be edited.');
          return;
        }
      } else {
        // Fallback: select column from current board
        const currentBoardId = sidebarProvider.getSelectedBoardId();
        if (!currentBoardId) {
          vscode.window.showInformationMessage('No board selected.');
          return;
        }

        const columns = columnService.getColumns(currentBoardId).filter((col) => !col.isDefault);
        if (columns.length === 0) {
          vscode.window.showInformationMessage('No editable columns in this board.');
          return;
        }

        const items = columns.map((column) => ({
          label: column.name,
          column,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select column to edit',
        });

        if (!selected) return;
        column = selected.column;
      }

      const newName = await vscode.window.showInputBox({
        prompt: 'Enter new column name',
        value: column.name,
      });

      if (newName) {
        if (!column) {
          vscode.window.showErrorMessage('Column not found.');
          return;
        }

        // Find the board that contains this column
        const boards = boardService.getBoards();
        let boardId: string | undefined;
        for (const board of boards) {
          const columns = columnService.getColumns(board.id);
          if (columns.some((col) => col.id === column!.id)) {
            boardId = board.id;
            break;
          }
        }

        if (boardId && columnService.isColumnNameUnique(boardId, newName, column.id)) {
          columnService.updateColumn(column.id, { name: newName });
          vscode.window.showInformationMessage(`Column renamed to: ${newName}`);
        } else if (boardId) {
          vscode.window.showErrorMessage('Column name already exists in this board.');
        } else {
          vscode.window.showErrorMessage('Could not find the board containing this column.');
        }
      }
    }
  );

  const deleteColumnCommand = vscode.commands.registerCommand(
    'tracking-extension.deleteColumn',
    async (arg?: string | vscode.TreeItem) => {
      let columnId: string | undefined;

      // Check if arg is a column ID string or tree item
      if (typeof arg === 'string') {
        columnId = arg;
      } else if (arg && typeof arg === 'object' && 'id' in arg) {
        // Tree item with column ID
        columnId = arg.id;
      }

      let column: Column | undefined;
      if (columnId) {
        // Find the column by ID
        const boards = boardService.getBoards();
        for (const board of boards) {
          const columns = columnService.getColumns(board.id);
          column = columns.find((col) => col.id === columnId);
          if (column) break;
        }

        if (!column) {
          vscode.window.showErrorMessage('Column not found.');
          return;
        }

        if (column.isDefault) {
          vscode.window.showInformationMessage('Default columns cannot be deleted.');
          return;
        }
      } else {
        // Fallback: select column from current board
        const currentBoardId = sidebarProvider.getSelectedBoardId();
        if (!currentBoardId) {
          vscode.window.showInformationMessage('No board selected.');
          return;
        }

        const columns = columnService.getColumns(currentBoardId).filter((col) => !col.isDefault);
        if (columns.length === 0) {
          vscode.window.showInformationMessage('No deletable columns in this board.');
          return;
        }

        const items = columns.map((column) => ({
          label: column.name,
          column,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select column to delete',
        });

        if (!selected) return;
        column = selected.column;
      }

      if (column) {
        const tasksInColumn = taskService.getTasks().filter((t) => t.columnId === column!.id);
        if (tasksInColumn.length > 0) {
          vscode.window.showErrorMessage('Cannot delete column with tasks. Move tasks first.');
          return;
        }

        const result = await vscode.window.showWarningMessage(
          `Delete column "${column.name}"?`,
          { modal: true },
          'Delete',
          'Cancel'
        );

        if (result === 'Delete') {
          columnService.deleteColumn(column.id);
          vscode.window.showInformationMessage(`Column deleted: ${column.name}`);
        }
      }
    }
  );

  return [createColumnCommand, editColumnCommand, deleteColumnCommand];
}
