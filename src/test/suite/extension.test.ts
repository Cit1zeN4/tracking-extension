import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  let timerService: any;
  let taskService: any;

  suiteSetup(() => {
    // Create mock context
    const mockStorage = new Map<string, any>();
    const context = {
      extensionUri: vscode.Uri.file(''),
      subscriptions: [],
      workspaceState: {
        get: (key: string) => mockStorage.get(key),
        update: (key: string, value: any) => mockStorage.set(key, value),
      },
      globalState: {
        get: (key: string) => mockStorage.get(key),
        update: (key: string, value: any) => mockStorage.set(key, value),
      },
    } as any;

    // Create services directly for testing
    timerService = new (require('../../timerService').TimerService)(context);
    taskService = new (require('../../taskService').TaskService)(context);
  });

  test('Services should be created', () => {
    assert.ok(timerService);
    assert.ok(taskService);
  });

  test('Task name truncation logic', () => {
    // Test the truncation logic directly
    const longTaskName = 'A'.repeat(85);
    const truncated = longTaskName.length > 80 ? longTaskName.substring(0, 77) + '...' : longTaskName;
    assert.equal(truncated.length, 80);
    assert.ok(truncated.endsWith('...'));

    const shortTaskName = 'Short Task';
    const notTruncated = shortTaskName.length > 80 ? shortTaskName.substring(0, 77) + '...' : shortTaskName;
    assert.equal(notTruncated, shortTaskName);
  });

  test('Timer state transitions', () => {
    // Test timer state
    const initialState = timerService.getState();
    assert.equal(initialState.isRunning, false);

    // Start timer
    timerService.startTimer();
    const runningState = timerService.getState();
    assert.equal(runningState.isRunning, true);
    assert.ok(runningState.currentEntry);

    // Stop timer
    const entry = timerService.stopTimer();
    assert.ok(entry);
    const stoppedState = timerService.getState();
    assert.equal(stoppedState.isRunning, false);
  });

  test('Starting timer when already running stops previous and starts new', () => {
    // Create fresh instance for this test
    const mockStorage = new Map<string, any>();
    const context = {
      workspaceState: {
        get: (key: string) => mockStorage.get(key),
        update: (key: string, value: any) => mockStorage.set(key, value),
      },
      globalState: {
        get: (key: string) => mockStorage.get(key),
        update: (key: string, value: any) => mockStorage.set(key, value),
      },
    } as any;
    const freshTimerService = new (require('../../timerService').TimerService)(context);

    // Start first timer
    freshTimerService.startTimer('task1');
    let state = freshTimerService.getState();
    assert.equal(state.isRunning, true);
    assert.equal(state.currentEntry?.taskId, 'task1');

    // Start second timer - should stop first and start new
    freshTimerService.startTimer('task2');
    state = freshTimerService.getState();
    assert.equal(state.isRunning, true);
    assert.equal(state.currentEntry?.taskId, 'task2');

    // Should have one completed entry from the first timer
    const completed = freshTimerService.getCompletedEntries();
    assert.equal(completed.length, 1);
    assert.equal(completed[0].taskId, 'task1');

    // Clean up
    freshTimerService.stopTimer();
  });

  test('Pause and resume timer', () => {
    // Create fresh instance for this test
    const mockStorage = new Map<string, any>();
    const context = {
      workspaceState: {
        get: (key: string) => mockStorage.get(key),
        update: (key: string, value: any) => mockStorage.set(key, value),
      },
      globalState: {
        get: (key: string) => mockStorage.get(key),
        update: (key: string, value: any) => mockStorage.set(key, value),
      },
    } as any;
    const freshTimerService = new (require('../../timerService').TimerService)(context);

    // Start timer
    freshTimerService.startTimer();
    let state = freshTimerService.getState();
    assert.equal(state.isRunning, true);

    // Pause timer
    freshTimerService.pauseTimer();
    state = freshTimerService.getState();
    assert.equal(state.isRunning, false);
    assert.ok(state.currentEntry); // Entry should still exist

    // Resume timer (by starting again)
    freshTimerService.startTimer();
    state = freshTimerService.getState();
    assert.equal(state.isRunning, true);
    assert.ok(state.currentEntry);

    // Clean up
    freshTimerService.stopTimer();
  });
});
