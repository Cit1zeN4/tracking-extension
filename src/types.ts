export enum StorageScope {
  Global = 'global',
  Workspace = 'workspace',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  source: 'manual' | 'external';
  externalId?: string;
  createdAt: Date;
  boardId?: string;
  columnId?: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  columns: string[]; // array of column IDs in display order
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  isDefault: boolean; // true for "Backlog"
  position: number; // display order within board
  createdAt: Date;
}

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
  pausedTime: number; // Time elapsed when paused
  resumeTime?: number; // Time when timer was resumed (timestamp)
}
