import * as vscode from 'vscode';

export interface TimeEntry {
  id: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in milliseconds
  description?: string;
}

export interface TimerState {
  isRunning: boolean;
  currentEntry?: TimeEntry;
  elapsedTime: number;
}

export class TimerService {
  private state: TimerState = {
    isRunning: false,
    elapsedTime: 0,
  };

  private completedEntries: TimeEntry[] = [];
  private intervalId?: NodeJS.Timeout;
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.loadState();
  }

  startTimer(taskId?: string, description?: string): void {
    if (this.state.isRunning) {
      throw new Error('Timer is already running');
    }

    const entry: TimeEntry = {
      id: this.generateId(),
      taskId,
      startTime: new Date(),
      duration: 0,
      description,
    };

    this.state = {
      isRunning: true,
      currentEntry: entry,
      elapsedTime: 0,
    };

    this.startInterval();
    this.saveState();
  }

  stopTimer(): TimeEntry | undefined {
    if (!this.state.isRunning || !this.state.currentEntry) {
      return undefined;
    }

    const endTime = new Date();
    const duration = endTime.getTime() - this.state.currentEntry.startTime.getTime();

    const completedEntry: TimeEntry = {
      ...this.state.currentEntry,
      endTime,
      duration,
    };

    this.completedEntries.push(completedEntry);

    this.state = {
      isRunning: false,
      elapsedTime: 0,
    };

    this.stopInterval();
    this.saveState();

    return completedEntry;
  }

  pauseTimer(): void {
    if (!this.state.isRunning) {
      return;
    }

    this.state.isRunning = false;
    this.stopInterval();
    this.saveState();
  }

  resumeTimer(): void {
    if (this.state.isRunning || !this.state.currentEntry) {
      return;
    }

    this.state.isRunning = true;
    this.startInterval();
    this.saveState();
  }

  getState(): TimerState {
    return { ...this.state };
  }

  getCompletedEntries(): TimeEntry[] {
    return [...this.completedEntries];
  }

  private startInterval(): void {
    this.intervalId = setInterval(() => {
      if (this.state.currentEntry) {
        this.state.elapsedTime = Date.now() - this.state.currentEntry.startTime.getTime();
      }
    }, 1000);
  }

  private stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveState(): void {
    // Save to workspace state
    this.context.workspaceState.update('timerState', this.state);
    this.context.workspaceState.update('completedEntries', this.completedEntries);
  }

  private loadState(): void {
    // Load from workspace state
    const savedState = this.context.workspaceState.get('timerState') as TimerState;
    if (savedState) {
      this.state = savedState;
      // If timer was running, resume it
      if (this.state.isRunning && this.state.currentEntry) {
        this.startInterval();
      }
    }

    const savedEntries = this.context.workspaceState.get('completedEntries') as TimeEntry[];
    if (savedEntries) {
      this.completedEntries = savedEntries;
    }
  }
}
