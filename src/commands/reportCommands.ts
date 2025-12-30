import * as vscode from 'vscode';
import { TimerService } from '../timerService';
import { TaskService } from '../taskService';
import { BoardService } from '../boardService';
import { ColumnService } from '../columnService';
import { PdfReportService } from '../pdfReportService';

export function registerReportCommands(
  timerService: TimerService,
  taskService: TaskService,
  boardService: BoardService,
  columnService: ColumnService
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Create PDF report service instance
  const pdfReportService = new PdfReportService(boardService, taskService, columnService, timerService);

  // Register generate PDF report command
  const generatePdfReportCommand = vscode.commands.registerCommand('tracking-extension.generatePdfReport', async () => {
    try {
      // Get all available boards
      const boards = boardService.getBoards();

      if (boards.length === 0) {
        vscode.window.showErrorMessage('No boards found. Create a board first to generate reports.');
        return;
      }

      // Show board selection quick pick
      const boardItems = boards.map((board) => ({
        label: board.name,
        description: board.description,
        detail: `Created: ${board.createdAt.toLocaleDateString()}`,
        board,
      }));

      if (boardItems.length === 0) {
        vscode.window.showErrorMessage('No boards found. Create a board first to generate reports.');
        return;
      }

      const selectedBoardItem = await vscode.window.showQuickPick(boardItems, {
        placeHolder: 'Select a board to generate PDF report for',
        matchOnDescription: true,
      });

      if (!selectedBoardItem) {
        return; // User cancelled
      }

      const boardId = selectedBoardItem.board.id;

      // Validate that the board has tasks with time tracking
      const boardTasks = taskService.getTasks().filter((task) => task.boardId === boardId);
      const tasksWithTime = boardTasks.filter((task) => taskService.getTotalTimeSpent(task.id) > 0);

      if (tasksWithTime.length === 0) {
        const createTask = 'Create Task';
        const result = await vscode.window.showWarningMessage(
          `Board "${selectedBoardItem.board.name}" has no tasks with time tracking. ` +
            `Would you like to create a task first?`,
          createTask
        );

        if (result === createTask) {
          await vscode.commands.executeCommand('tracking-extension.createTask');
        }
        return;
      }

      // Show date range options
      const dateRangeOptions = [
        { label: 'All Time', value: undefined as { start: Date; end: Date } | undefined },
        { label: 'Last 7 Days', value: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() } },
        { label: 'Last 30 Days', value: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() } },
        { label: 'Custom Range', value: 'custom' as const },
      ];

      const selectedDateRange = await vscode.window.showQuickPick(dateRangeOptions, {
        placeHolder: 'Select date range for the report',
      });

      if (!selectedDateRange) {
        return; // User cancelled
      }

      let dateRange: { start: Date; end: Date } | undefined;

      if (selectedDateRange.value === 'custom') {
        // Handle custom date range
        const startDate = await vscode.window.showInputBox({
          prompt: 'Enter start date (YYYY-MM-DD)',
          placeHolder: '2024-01-01',
        });

        if (!startDate) return;

        const endDate = await vscode.window.showInputBox({
          prompt: 'Enter end date (YYYY-MM-DD)',
          placeHolder: new Date().toISOString().split('T')[0],
        });

        if (!endDate) return;

        try {
          dateRange = {
            start: new Date(startDate),
            end: new Date(endDate),
          };
        } catch (error) {
          vscode.window.showErrorMessage('Invalid date format. Please use YYYY-MM-DD format.');
          return;
        }
      } else {
        dateRange = selectedDateRange.value;
      }

      // Show save dialog
      const fileUri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(`time-report-${selectedBoardItem.board.name.replace(/\s+/g, '-')}.pdf`),
        filters: {
          'PDF Files': ['pdf'],
        },
        saveLabel: 'Generate PDF Report',
      });

      if (!fileUri) {
        return; // User cancelled
      }

      // Show progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Generating PDF Report',
          cancellable: false,
        },
        async (progress) => {
          progress.report({ increment: 0, message: 'Collecting data...' });

          try {
            // Generate the report
            const filePath = fileUri.fsPath;
            await pdfReportService.generateBoardReport(boardId, dateRange || undefined, filePath);

            progress.report({ increment: 100, message: 'Report generated successfully!' });

            // Show success message with option to open the file
            const openFile = 'Open File';
            const result = await vscode.window.showInformationMessage(
              `PDF report generated successfully: ${filePath}`,
              openFile
            );

            if (result === openFile) {
              vscode.env.openExternal(vscode.Uri.file(filePath));
            }
          } catch (error) {
            vscode.window.showErrorMessage(`Failed to generate PDF report: ${error}`);
          }
        }
      );
    } catch (error) {
      vscode.window.showErrorMessage(`Error generating PDF report: ${error}`);
    }
  });

  disposables.push(generatePdfReportCommand);

  return disposables;
}
