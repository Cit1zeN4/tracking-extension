import * as vscode from 'vscode';
import { TaskService } from '../taskService';
import { BoardService } from '../boardService';
import { ColumnService } from '../columnService';
import { SidebarProvider } from '../sidebarProvider';
import { Board } from '../types';

export function registerBoardCommands(
  taskService: TaskService,
  boardService: BoardService,
  columnService: ColumnService,
  sidebarProvider: SidebarProvider
): vscode.Disposable[] {
  const selectBoardCommand = vscode.commands.registerCommand('tracking-extension.selectBoard', async () => {
    const boards = boardService.getBoards();
    if (boards.length === 0) {
      vscode.window.showInformationMessage('No boards available. Create a board first.');
      return;
    }

    const items = boards.map((board) => ({
      label: board.name,
      description: board.description,
      board,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a board',
    });

    if (selected) {
      sidebarProvider.setSelectedBoardId(selected.board.id);
    }
  });

  const createBoardCommand = vscode.commands.registerCommand('tracking-extension.createBoard', async () => {
    const name = await vscode.window.showInputBox({
      prompt: 'Enter board name',
      placeHolder: 'My Board',
    });

    if (name) {
      const description = await vscode.window.showInputBox({
        prompt: 'Enter board description (optional)',
        placeHolder: 'Description',
      });

      const board = boardService.createBoard(name, description);
      columnService.createColumn(board.id, 'Backlog', true);
      vscode.window.showInformationMessage(`Board created: ${board.name}`);
    }
  });

  const editBoardCommand = vscode.commands.registerCommand(
    'tracking-extension.editBoard',
    async (arg?: string | vscode.TreeItem) => {
      let boardId: string | undefined;

      // Check if arg is a board ID string or tree item
      if (typeof arg === 'string') {
        boardId = arg;
      } else if (arg && typeof arg === 'object' && 'id' in arg) {
        // Tree item with board ID
        boardId = arg.id;
      }

      let board: Board | undefined;
      if (boardId) {
        // Find the board by ID
        board = boardService.getBoard(boardId);
        if (!board) {
          vscode.window.showErrorMessage('Board not found.');
          return;
        }
      } else {
        // Fallback: select board from list
        const boards = boardService.getBoards();
        if (boards.length === 0) {
          vscode.window.showInformationMessage('No boards available.');
          return;
        }

        const items = boards.map((board) => ({
          label: board.name,
          description: board.description,
          board,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select board to edit',
        });

        if (!selected) return;
        board = selected.board;
      }

      if (board) {
        const newName = await vscode.window.showInputBox({
          prompt: 'Enter new board name',
          value: board.name,
        });

        if (newName) {
          const newDescription = await vscode.window.showInputBox({
            prompt: 'Enter new board description (optional)',
            value: board.description || '',
          });

          boardService.updateBoard(board.id, { name: newName, description: newDescription });
          vscode.window.showInformationMessage(`Board updated: ${newName}`);
        }
      }
    }
  );

  const deleteBoardCommand = vscode.commands.registerCommand(
    'tracking-extension.deleteBoard',
    async (arg?: string | vscode.TreeItem) => {
      let boardId: string | undefined;

      // Check if arg is a board ID string or tree item
      if (typeof arg === 'string') {
        boardId = arg;
      } else if (arg && typeof arg === 'object' && 'id' in arg) {
        // Tree item with board ID
        boardId = arg.id;
      }

      let board: Board | undefined;
      if (boardId) {
        // Find the board by ID
        board = boardService.getBoard(boardId);
        if (!board) {
          vscode.window.showErrorMessage('Board not found.');
          return;
        }
      } else {
        // Fallback: select board from list
        const boards = boardService.getBoards();
        if (boards.length === 0) {
          vscode.window.showInformationMessage('No boards available.');
          return;
        }

        const items = boards.map((board) => ({
          label: board.name,
          description: board.description,
          board,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select board to delete',
        });

        if (!selected) return;
        board = selected.board;
      }

      if (board) {
        const result = await vscode.window.showWarningMessage(
          `Delete board "${board.name}"? This will also delete all associated columns and tasks.`,
          { modal: true },
          'Delete',
          'Cancel'
        );

        if (result === 'Delete') {
          boardService.deleteBoard(board.id, taskService);
          vscode.window.showInformationMessage(`Board deleted: ${board.name}`);
        }
      }
    }
  );

  return [selectBoardCommand, createBoardCommand, editBoardCommand, deleteBoardCommand];
}
