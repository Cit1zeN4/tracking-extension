import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { TaskService } from './taskService';
import { BoardService } from './boardService';
import { ColumnService } from './columnService';
import { SidebarProvider } from './sidebarProvider';
import { TaskDetailsProvider } from './taskDetailsProvider';
import { StorageScope } from './types';
import { registerCommands } from './commands/index';
import { initializeStatusBar } from './statusBar';
import { initializeDefaultBoardAndColumn } from './utils';

let timerService: TimerService;
let taskService: TaskService;
let boardService: BoardService;
let columnService: ColumnService;

export function activate(context: vscode.ExtensionContext) {
  console.log('Time Tracking Extension activated');

  // Read storage scope configuration
  const config = vscode.workspace.getConfiguration('tracking-extension');
  const storageScope = config.get('storageScope', 'global') as StorageScope;

  timerService = new TimerService(context, storageScope);
  taskService = new TaskService(context, timerService, storageScope);
  boardService = new BoardService(context, storageScope);
  columnService = new ColumnService(context, storageScope);

  // Initialize default board and column if needed
  initializeDefaultBoardAndColumn(boardService, columnService, taskService);

  // Register sidebar
  const sidebarProvider = new SidebarProvider(timerService, taskService, boardService, columnService);
  context.subscriptions.push(vscode.window.registerTreeDataProvider(SidebarProvider.viewType, sidebarProvider));

  // Create task details provider
  const taskDetailsProvider = new TaskDetailsProvider(context, taskService, timerService);

  // Initialize status bar
  initializeStatusBar(context, timerService, taskService);

  // Register commands
  const commands = registerCommands(
    context,
    timerService,
    taskService,
    boardService,
    columnService,
    sidebarProvider,
    taskDetailsProvider
  );
  context.subscriptions.push(...commands);
}

export function deactivate() {
  console.log('Time Tracking Extension deactivated');
  if (timerService) {
    timerService.stopTimer();
  }
}
