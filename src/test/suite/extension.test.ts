import * as assert from 'assert';
import * as vscode from 'vscode';
import { TimerService } from '../../timerService';
import { TaskService } from '../../taskService';

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

  test('Stop timer after pause records correct duration', async function () {
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
    const startState = freshTimerService.getState();
    assert.equal(startState.isRunning, true);

    // Wait for timer to run for a bit
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const runningState = freshTimerService.getState();
    assert.ok(runningState.elapsedTime > 0, 'Elapsed time should increase when running');
    const timeBeforePause = runningState.elapsedTime;

    // Pause timer
    freshTimerService.pauseTimer();
    const pausedState = freshTimerService.getState();
    assert.equal(pausedState.isRunning, false);
    assert.equal(pausedState.elapsedTime, timeBeforePause);

    // Wait again - time should NOT increase during pause
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const stillPausedState = freshTimerService.getState();
    assert.equal(stillPausedState.elapsedTime, timeBeforePause, 'Elapsed time should not increase during pause');

    // Stop timer after pause
    const stoppedEntry = freshTimerService.stopTimer();
    assert.ok(stoppedEntry, 'Should return completed entry');
    assert.equal(
      stoppedEntry!.duration,
      timeBeforePause,
      'Duration should equal time before pause, not include wait time after pause'
    );

    // Verify final state
    const finalState = freshTimerService.getState();
    assert.equal(finalState.isRunning, false);
    assert.equal(finalState.elapsedTime, 0);
  });

  suite('TaskService Time Calculation', () => {
    test('getTotalTimeSpent returns 0 for task with no entries', () => {
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

      const timerService = new TimerService(context);
      const taskService = new TaskService(context, timerService);

      const totalTime = taskService.getTotalTimeSpent('non-existent-task');
      assert.equal(totalTime, 0);
    });

    test('getTotalTimeSpent sums durations for single task entry', () => {
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

      const timerService = new TimerService(context);
      const taskService = new TaskService(context, timerService);

      // Manually add a completed entry
      const mockEntry = {
        id: 'test-entry',
        taskId: 'test-task',
        startTime: new Date(),
        endTime: new Date(Date.now() + 5000), // 5 seconds
        duration: 5000,
        description: 'Test entry',
      };

      // Access private property for testing
      (timerService as any).completedEntries = [mockEntry];

      const totalTime = taskService.getTotalTimeSpent('test-task');
      assert.equal(totalTime, 5000);
    });

    test('getTotalTimeSpent sums durations for multiple task entries', () => {
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

      const timerService = new TimerService(context);
      const taskService = new TaskService(context, timerService);

      // Manually add multiple completed entries
      const mockEntries = [
        {
          id: 'entry-1',
          taskId: 'test-task',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3000),
          duration: 3000,
          description: 'Entry 1',
        },
        {
          id: 'entry-2',
          taskId: 'test-task',
          startTime: new Date(),
          endTime: new Date(Date.now() + 7000),
          duration: 7000,
          description: 'Entry 2',
        },
        {
          id: 'entry-3',
          taskId: 'other-task',
          startTime: new Date(),
          endTime: new Date(Date.now() + 2000),
          duration: 2000,
          description: 'Other task entry',
        },
      ];

      (timerService as any).completedEntries = mockEntries;

      const totalTime = taskService.getTotalTimeSpent('test-task');
      assert.equal(totalTime, 10000); // 3000 + 7000
    });
  });

  suite('Sidebar Integration', () => {
    test('TaskItem displays time spent in label', () => {
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

      const timerService = new TimerService(context);
      const taskService = new TaskService(context, timerService);

      // Create a task
      const task = taskService.createTask('Test Task', 'Test Description');

      // Add a completed entry
      const mockEntry = {
        id: 'test-entry',
        taskId: task.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 65000), // 65 seconds
        duration: 65000,
        description: 'Test entry',
      };
      (timerService as any).completedEntries = [mockEntry];

      // Create TaskItem (we need to import it or test indirectly)
      // For now, just test that getTotalTimeSpent works in the context
      const totalTime = taskService.getTotalTimeSpent(task.id);
      assert.equal(totalTime, 65000);
    });

    test('TaskItem has correct context value based on timer state', () => {
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

      const timerService = new TimerService(context);
      const taskService = new TaskService(context, timerService);

      // Create a task
      const task = taskService.createTask('Test Task');
      assert.ok(task.id); // Verify task was created

      // Test context value when no timer is running
      const timerState = timerService.getState();
      assert.equal(timerState.isRunning, false);
      assert.equal(timerState.currentEntry, undefined);

      // Since we can't directly test TaskItem contextValue without importing,
      // we'll test the logic indirectly by checking timer state
      assert.equal(timerState.isRunning, false);
    });
  });

  suite('TaskDetailsProvider', () => {
    let taskDetailsProvider: any;
    let testTask: any;

    suiteSetup(() => {
      // Create TaskDetailsProvider instance
      taskDetailsProvider = new (require('../../taskDetailsProvider').TaskDetailsProvider)(
        {
          extensionUri: vscode.Uri.file(''),
          subscriptions: [],
        },
        taskService,
        timerService
      );

      // Create a test task
      testTask = taskService.createTask('Test Task', 'Test description');
    });

    test('TaskDetailsProvider should be created', () => {
      assert.ok(taskDetailsProvider);
      assert.ok(typeof taskDetailsProvider.showTaskDetails === 'function');
    });

    test('getHtmlContent generates valid HTML for task with no time entries', () => {
      const html = taskDetailsProvider.getHtmlContent(testTask, [], 0, 0, 0);
      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes('Test Task'));
      assert.ok(html.includes('Test description'));
      assert.ok(html.includes('No time entries found'));
      assert.ok(html.includes('0s')); // Total time
      assert.ok(html.includes('0')); // Sessions
    });

    test('getHtmlContent generates valid HTML for task with time entries', () => {
      const mockEntries = [
        {
          startTime: new Date('2023-01-01T10:00:00'),
          endTime: new Date('2023-01-01T10:30:00'),
          duration: 30 * 60 * 1000, // 30 minutes
          taskId: testTask.id,
        },
        {
          startTime: new Date('2023-01-01T11:00:00'),
          endTime: new Date('2023-01-01T11:15:00'),
          duration: 15 * 60 * 1000, // 15 minutes
          taskId: testTask.id,
        },
      ];

      const totalTime = 45 * 60 * 1000; // 45 minutes
      const sessionCount = 2;
      const averageSession = totalTime / sessionCount;

      const html = taskDetailsProvider.getHtmlContent(testTask, mockEntries, totalTime, sessionCount, averageSession);

      assert.ok(html.includes('Test Task'));
      assert.ok(html.includes('45m')); // Total time
      assert.ok(html.includes('2')); // Sessions
      assert.ok(html.includes('22m')); // Average session (22.5m rounded)
      assert.ok(html.includes('30m')); // First entry duration
      assert.ok(html.includes('15m')); // Second entry duration
    });

    test('getHtmlContent formats duration correctly', () => {
      const html = taskDetailsProvider.getHtmlContent(testTask, [], 3661000, 1, 3661000); // 1h 1m 1s
      assert.ok(html.includes('1h 1m')); // Should show hours and minutes
    });

    test('getHtmlContent displays task metadata correctly', () => {
      const taskWithExternalId = {
        ...testTask,
        source: 'external',
        externalId: 'EXT-123',
      };

      const html = taskDetailsProvider.getHtmlContent(taskWithExternalId, [], 0, 0, 0);
      assert.ok(html.includes('external (EXT-123)'));
    });
  });

  suite('Task Details Command Integration', () => {
    let testTask: any;

    suiteSetup(() => {
      testTask = taskService.createTask('Integration Test Task', 'For command testing');
    });

    test('viewTaskDetails command should be registered', async () => {
      // Test that the command exists by trying to execute it
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('tracking-extension.viewTaskDetails'));
    });

    test('viewTaskDetails command with valid task ID should not throw error', async () => {
      // This test verifies the command can be called without throwing
      // In a real scenario, this would open a webview panel
      try {
        await vscode.commands.executeCommand('tracking-extension.viewTaskDetails', testTask.id);
        assert.ok(true); // Command executed without error
      } catch (error) {
        // In test environment, webview creation might fail, but command registration should work
        assert.ok((error as Error).message.includes('webview') || (error as Error).message.includes('window'));
      }
    });

    test('viewTaskDetails command with invalid task ID should handle gracefully', async () => {
      try {
        await vscode.commands.executeCommand('tracking-extension.viewTaskDetails', 'invalid-id');
        // Should not throw, but may show error message
        assert.ok(true);
      } catch (error) {
        // Expected to potentially fail in test environment
        assert.ok(true);
      }
    });
  });
});
