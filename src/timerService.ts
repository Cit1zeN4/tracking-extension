import * as vscode from 'vscode';
import { StorageScope, TimeEntry, TimerState } from './types';

export class TimerService {
  private state: TimerState = {
    isRunning: false,
    elapsedTime: 0,
    pausedTime: 0,
  };

  private completedEntries: TimeEntry[] = [];
  private intervalId?: NodeJS.Timeout;
  private context: vscode.ExtensionContext;
  private storageScope: StorageScope;
  private _onStateChanged = new vscode.EventEmitter<void>();
  public readonly onTimerStateChanged = this._onStateChanged.event;

  constructor(context: vscode.ExtensionContext, storageScope: StorageScope = StorageScope.Global) {
    this.context = context;
    this.storageScope = storageScope;
    this.loadState();
  }

  startTimer(taskId?: string, description?: string): void {
    // Stop current timer if running
    if (this.state.isRunning) {
      this.stopTimer();
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
      pausedTime: 0,
      resumeTime: Date.now(),
    };

    this.startInterval();
    this.saveState();
    this._onStateChanged.fire();
  }

  stopTimer(): TimeEntry | undefined {
    if (!this.state.currentEntry) {
      return undefined;
    }

    const endTime = new Date();

    // Calculate duration based on timer state
    let duration: number;
    if (this.state.isRunning && this.state.resumeTime) {
      // Timer is currently running (was resumed)
      duration = this.state.pausedTime + (endTime.getTime() - this.state.resumeTime);
    } else if (!this.state.isRunning && this.state.pausedTime > 0) {
      // Timer is paused
      duration = this.state.pausedTime;
    } else {
      // Timer was never paused (running continuously)
      duration = endTime.getTime() - this.state.currentEntry.startTime.getTime();
    }

    const completedEntry: TimeEntry = {
      ...this.state.currentEntry,
      endTime,
      duration,
    };

    this.completedEntries.push(completedEntry);

    this.state = {
      isRunning: false,
      elapsedTime: 0,
      pausedTime: 0,
    };

    this.stopInterval();
    this.saveState();
    this._onStateChanged.fire();

    return completedEntry;
  }

  pauseTimer(): void {
    if (!this.state.isRunning) {
      return;
    }

    // Store the current elapsed time as paused time
    this.state.pausedTime = this.state.elapsedTime;
    this.state.isRunning = false;
    this.state.resumeTime = undefined; // Clear resume time when pausing
    this.stopInterval();
    this.saveState();
    this._onStateChanged.fire();
  }

  resumeTimer(): void {
    if (this.state.isRunning || !this.state.currentEntry) {
      return;
    }

    // Set resume time to current time
    this.state.resumeTime = Date.now();
    this.state.isRunning = true;
    this.startInterval();
    this.saveState();
    this._onStateChanged.fire();
  }

  getState(): TimerState {
    return { ...this.state };
  }

  getCompletedEntries(): TimeEntry[] {
    return [...this.completedEntries];
  }

  deleteEntriesByTaskId(taskId: string): void {
    this.completedEntries = this.completedEntries.filter((entry) => entry.taskId !== taskId);
    this.saveState();
  }

  setStorageScope(newScope: StorageScope): void {
    if (newScope === this.storageScope) {
      return; // No change needed
    }

    const previousScope = this.storageScope;
    try {
      // Save current state to the old storage before switching
      this.saveState();

      // Change storage scope
      this.storageScope = newScope;

      // Clear in-memory state and load from new storage
      this.state = {
        isRunning: false,
        elapsedTime: 0,
        pausedTime: 0,
      };
      this.completedEntries = [];
      this.loadState();

      // Fire event to update UI
      this._onStateChanged.fire();
    } catch (error) {
      // Revert to previous scope if something goes wrong
      this.storageScope = previousScope;
      console.error('Failed to change timer storage scope:', error);
      throw error;
    }
  }

  getStatus(): string {
    if (this.state.isRunning) {
      const minutes = Math.floor(this.state.elapsedTime / 60000);
      const seconds = Math.floor((this.state.elapsedTime % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return 'Stopped';
  }

  private startInterval(): void {
    this.intervalId = setInterval(() => {
      if (this.state.isRunning && this.state.currentEntry && this.state.resumeTime) {
        this.state.elapsedTime = this.state.pausedTime + (Date.now() - this.state.resumeTime);
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
    const storage = this.storageScope === StorageScope.Global ? this.context.globalState : this.context.workspaceState;
    storage.update('timerState', this.state);
    storage.update('completedEntries', this.completedEntries);
  }

  private loadState(): void {
    const storage = this.storageScope === StorageScope.Global ? this.context.globalState : this.context.workspaceState;
    const savedState = storage.get('timerState') as TimerState | undefined;
    if (savedState) {
      this.state = savedState;
      // Convert date strings back to Date objects
      if (this.state.currentEntry) {
        if (typeof this.state.currentEntry.startTime === 'string') {
          this.state.currentEntry.startTime = new Date(this.state.currentEntry.startTime);
        }
        if (this.state.currentEntry.endTime && typeof this.state.currentEntry.endTime === 'string') {
          this.state.currentEntry.endTime = new Date(this.state.currentEntry.endTime);
        }
      }
      // If timer was running, resume it
      if (this.state.isRunning && this.state.currentEntry) {
        this.startInterval();
      }
    } else {
      // Reset to default state if no saved state in this scope
      this.state = {
        isRunning: false,
        elapsedTime: 0,
        pausedTime: 0,
      };
    }

    const savedEntries = storage.get('completedEntries') as TimeEntry[] | undefined;
    if (savedEntries) {
      this.completedEntries = savedEntries.map((entry) => ({
        ...entry,
        startTime: typeof entry.startTime === 'string' ? new Date(entry.startTime) : entry.startTime,
        endTime: entry.endTime && typeof entry.endTime === 'string' ? new Date(entry.endTime) : entry.endTime,
      }));
    } else {
      // Reset to empty array if no saved entries in this scope
      this.completedEntries = [];
    }
  }
}
