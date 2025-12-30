import * as vscode from 'vscode';
import { TimerService } from '../timerService';
import { TaskService } from '../taskService';
import { BoardService } from '../boardService';
import { ColumnService } from '../columnService';
import { SidebarProvider } from '../sidebarProvider';
import { TaskDetailsProvider } from '../taskDetailsProvider';
import { registerTimerCommands } from './timerCommands';
import { registerTaskCommands } from './taskCommands';
import { registerBoardCommands } from './boardCommands';
import { registerColumnCommands } from './columnCommands';
import { registerUICommands } from './uiCommands';

export function registerCommands(
  context: vscode.ExtensionContext,
  timerService: TimerService,
  taskService: TaskService,
  boardService: BoardService,
  columnService: ColumnService,
  sidebarProvider: SidebarProvider,
  taskDetailsProvider: TaskDetailsProvider
): vscode.Disposable[] {
  const disposables: vscode.Disposable[] = [];

  // Register timer commands
  disposables.push(...registerTimerCommands(timerService, taskService));

  // Register task commands
  disposables.push(...registerTaskCommands(timerService, taskService, taskDetailsProvider));

  // Register board commands
  disposables.push(...registerBoardCommands(taskService, boardService, columnService, sidebarProvider));

  // Register column commands
  disposables.push(...registerColumnCommands(taskService, boardService, columnService, sidebarProvider));

  // Register UI commands
  disposables.push(...registerUICommands(taskService, columnService, sidebarProvider));

  return disposables;
}
