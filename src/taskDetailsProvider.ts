import * as vscode from 'vscode';
import { TaskService } from './taskService';
import { TimerService } from './timerService';

export class TaskDetailsProvider {
  private panel: vscode.WebviewPanel | undefined;
  private readonly extensionUri: vscode.Uri;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly taskService: TaskService,
    private readonly timerService: TimerService
  ) {
    this.extensionUri = context.extensionUri;
  }

  public showTaskDetails(taskId: string) {
    const task = this.taskService.getTaskById(taskId);
    if (!task) {
      vscode.window.showErrorMessage('Task not found');
      return;
    }

    // Create or reveal panel
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
    } else {
      this.panel = vscode.window.createWebviewPanel(
        'taskDetails',
        `Task Details: ${task.title}`,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media')],
        }
      );

      this.panel.onDidDispose(
        () => {
          this.panel = undefined;
        },
        null,
        this.context.subscriptions
      );
    }

    // Update content
    this.updateContent(taskId);
  }

  private updateContent(taskId: string) {
    if (!this.panel) return;

    const task = this.taskService.getTaskById(taskId);
    if (!task) return;

    const timeEntries = this.timerService
      .getCompletedEntries()
      .filter((entry) => entry.taskId === taskId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime()); // Most recent first

    const totalTime = timeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const sessionCount = timeEntries.length;
    const averageSession = sessionCount > 0 ? totalTime / sessionCount : 0;

    const html = this.getHtmlContent(task, timeEntries, totalTime, sessionCount, averageSession);
    this.panel.webview.html = html;
  }

  private getHtmlContent(
    task: any,
    timeEntries: any[],
    totalTime: number,
    sessionCount: number,
    averageSession: number
  ): string {
    const formatDuration = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      const remainingSeconds = seconds % 60;

      if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      } else {
        return `${remainingSeconds}s`;
      }
    };

    const formatDateTime = (date: Date): string => {
      return date.toLocaleString();
    };

    const timeEntriesHtml =
      timeEntries.length > 0
        ? timeEntries
            .map(
              (entry) => `
          <div class="time-entry">
            <div class="time-entry-header">
              <span class="duration">${formatDuration(entry.duration)}</span>
              <span class="datetime">${formatDateTime(entry.startTime)}</span>
            </div>
            <div class="time-entry-details">
              ${
                entry.endTime
                  ? `${entry.startTime.toLocaleTimeString()} - ${entry.endTime.toLocaleTimeString()}`
                  : 'In progress'
              }
            </div>
          </div>
        `
            )
            .join('')
        : '<div class="no-entries">No time entries found for this task</div>';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Task Details</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
          }

          .task-header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 16px;
            margin-bottom: 24px;
          }

          .task-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--vscode-textLink-foreground);
          }

          .task-info {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 8px 16px;
            margin-bottom: 16px;
          }

          .info-label {
            font-weight: bold;
            color: var(--vscode-descriptionForeground);
          }

          .task-description {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 12px 16px;
            margin: 16px 0;
            white-space: pre-wrap;
          }

          .stats-section {
            background-color: var(--vscode-toolbar-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .stats-title {
            font-weight: bold;
            margin-bottom: 12px;
            color: var(--vscode-textLink-foreground);
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
          }

          .stat-item {
            text-align: center;
          }

          .stat-value {
            font-size: 1.2em;
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
          }

          .stat-label {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
          }

          .entries-section {
            margin-top: 24px;
          }

          .entries-title {
            font-weight: bold;
            margin-bottom: 12px;
            color: var(--vscode-textLink-foreground);
          }

          .time-entry {
            background-color: var(--vscode-list-inactiveSelectionBackground);
            border: 1px solid var(--vscode-list-inactiveSelectionBackground);
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 8px;
          }

          .time-entry-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
          }

          .duration {
            font-weight: bold;
            color: var(--vscode-textLink-foreground);
          }

          .datetime {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
          }

          .time-entry-details {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
          }

          .no-entries {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 24px;
          }
        </style>
      </head>
      <body>
        <div class="task-header">
          <div class="task-title">${task.title}</div>
          <div class="task-info">
            <span class="info-label">Created:</span>
            <span>${task.createdAt.toLocaleString()}</span>
            <span class="info-label">Source:</span>
            <span>${task.source}${task.externalId ? ` (${task.externalId})` : ''}</span>
          </div>
          ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
        </div>

        <div class="stats-section">
          <div class="stats-title">Time Statistics</div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${formatDuration(totalTime)}</div>
              <div class="stat-label">Total Time</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${sessionCount}</div>
              <div class="stat-label">Sessions</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${formatDuration(averageSession)}</div>
              <div class="stat-label">Avg Session</div>
            </div>
          </div>
        </div>

        <div class="entries-section">
          <div class="entries-title">Time Entries</div>
          ${timeEntriesHtml}
        </div>
      </body>
      </html>
    `;
  }
}
