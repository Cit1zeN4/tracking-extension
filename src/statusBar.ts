import * as vscode from 'vscode';
import { TimerService } from './timerService';
import { TaskService } from './taskService';

let statusBarTaskDisplay: vscode.StatusBarItem;
let statusBarStartButton: vscode.StatusBarItem;
let statusBarPauseButton: vscode.StatusBarItem;
let statusBarStopButton: vscode.StatusBarItem;

export function initializeStatusBar(
  context: vscode.ExtensionContext,
  timerService: TimerService,
  taskService: TaskService
) {
  // Create status bar items
  statusBarTaskDisplay = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarTaskDisplay.command = 'tracking-extension.startTimer';

  statusBarStartButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  statusBarStartButton.command = 'tracking-extension.startTimer';
  statusBarStartButton.text = '$(play)';
  statusBarStartButton.tooltip = 'Start Timer';

  statusBarPauseButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  statusBarPauseButton.command = 'tracking-extension.pauseTimer';
  statusBarPauseButton.text = '$(debug-pause)';
  statusBarPauseButton.tooltip = 'Pause Timer';

  statusBarStopButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 97);
  statusBarStopButton.command = 'tracking-extension.stopTimer';
  statusBarStopButton.text = '$(stop)';
  statusBarStopButton.tooltip = 'Stop Timer';

  updateStatusBar(timerService, taskService);

  // Show initial state - only task display is visible when no timer is running
  statusBarTaskDisplay.show();
  // All buttons are hidden initially by updateStatusBar()

  context.subscriptions.push(statusBarTaskDisplay, statusBarStartButton, statusBarPauseButton, statusBarStopButton);

  // Update status bar every second
  const statusBarUpdater = setInterval(() => updateStatusBar(timerService, taskService), 1000);
  context.subscriptions.push({ dispose: () => clearInterval(statusBarUpdater) });
}

function updateStatusBar(timerService: TimerService, taskService: TaskService) {
  if (!statusBarTaskDisplay) return;

  const state = timerService.getState();
  const currentEntry = state.currentEntry;
  const task = currentEntry?.taskId ? taskService.getTaskById(currentEntry.taskId) : null;
  const taskName = task ? (task.title.length > 80 ? task.title.substring(0, 77) + '...' : task.title) : '';

  if (state.isRunning) {
    // Timer is running
    const elapsed = Math.floor(state.elapsedTime / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    statusBarTaskDisplay.text = taskName ? `$(clock) ${taskName} - ${timeStr}` : `$(clock) ${timeStr}`;
    statusBarTaskDisplay.tooltip = task
      ? `Timer running for: ${task.title}`
      : 'Timer running - Click to start a new timer';

    // Show pause and stop, hide start
    statusBarStartButton.hide();
    statusBarPauseButton.show();
    statusBarStopButton.show();
  } else if (currentEntry) {
    // Timer is paused (not running but has current entry)
    const elapsed = Math.floor(state.elapsedTime / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    statusBarTaskDisplay.text = taskName ? `$(debug-pause) ${taskName} - ${timeStr}` : `$(debug-pause) ${timeStr}`;
    statusBarTaskDisplay.tooltip = task
      ? `Timer paused for: ${task.title} - Click to resume`
      : 'Timer paused - Click to resume';

    // Show start (as resume) and stop, hide pause
    statusBarStartButton.show();
    statusBarStartButton.text = '$(play)';
    statusBarStartButton.tooltip = 'Resume Timer';
    statusBarPauseButton.hide();
    statusBarStopButton.show();
  } else {
    // Timer is stopped (not running and no current entry)
    statusBarTaskDisplay.text = '$(play) Start Timer';
    statusBarTaskDisplay.tooltip = 'Click to start timer';

    // Hide all buttons - only task display is visible
    statusBarStartButton.hide();
    statusBarPauseButton.hide();
    statusBarStopButton.hide();
  }
}
