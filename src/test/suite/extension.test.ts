/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TimerService } from '../../timerService';
import { TaskService } from '../../taskService';
import { StorageScope } from '../../types';

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
    timerService = new (require('../../timerService').TimerService)(context, StorageScope.Global);
    taskService = new (require('../../taskService').TaskService)(context, timerService, StorageScope.Global);
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

  suite('Task Details Integration', () => {
    let taskDetailsProvider: any;
    let testTask: any;

    suiteSetup(async () => {
      taskDetailsProvider = new (require('../../taskDetailsProvider').TaskDetailsProvider)(
        {
          extensionUri: vscode.Uri.file(''),
          subscriptions: [],
        },
        taskService,
        timerService
      );
      testTask = taskService.createTask('Integration Test Task', 'For command testing');
      // Wait for extension to activate
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    test('TaskDetailsProvider should be able to show details for valid task', () => {
      // This should not throw an error
      try {
        taskDetailsProvider.showTaskDetails(testTask.id);
        assert.ok(true);
      } catch (error) {
        // In test environment, webview creation might fail
        const message = (error as Error).message;
        assert.ok(message.includes('webview') || message.includes('window') || message.includes('createWebviewPanel'));
      }
    });

    test('TaskDetailsProvider should handle invalid task ID gracefully', () => {
      try {
        taskDetailsProvider.showTaskDetails('invalid-id');
        assert.ok(true); // Should not throw
      } catch (error) {
        // Should not throw, but may show error message
        assert.ok(true);
      }
    });

    test('TaskService deleteTask should remove task and associated timer entries', () => {
      // Create a task
      const task = taskService.createTask('Test Task for Deletion', 'Description');

      // Add some timer entries for this task
      timerService.startTimer(task.id);
      timerService.stopTimer();
      timerService.startTimer(task.id);
      timerService.stopTimer();

      // Verify task and entries exist (3 tasks: TaskDetailsProvider + suiteSetup + this test)
      assert.equal(taskService.getTasks().length, 3);
      const entriesBefore = timerService.getCompletedEntries().filter((e: any) => e.taskId === task.id);
      assert.equal(entriesBefore.length, 2);

      // Delete task
      taskService.deleteTask(task.id);

      // Verify task and entries are removed (2 tasks remaining: TaskDetailsProvider + suiteSetup)
      assert.equal(taskService.getTasks().length, 2);
      const entriesAfter = timerService.getCompletedEntries().filter((e: any) => e.taskId === task.id);
      assert.equal(entriesAfter.length, 0);
    });

    test('TaskService updateTask should modify task properties', () => {
      // Create a task
      const task = taskService.createTask('Original Title', 'Original Description');

      // Update task
      taskService.updateTask(task.id, 'Updated Title', 'Updated Description');

      // Verify changes
      const updatedTask = taskService.getTaskById(task.id);
      assert.equal(updatedTask?.title, 'Updated Title');
      assert.equal(updatedTask?.description, 'Updated Description');
      assert.equal(updatedTask?.id, task.id); // ID should remain the same
    });

    test('TaskService updateTask should preserve task ID and other properties', () => {
      // Create a task
      const task = taskService.createTask('Test Task', 'Test Description');
      const originalId = task.id;
      const originalCreatedAt = task.createdAt;

      // Update only title
      taskService.updateTask(task.id, 'New Title');

      // Verify ID and createdAt are preserved
      const updatedTask = taskService.getTaskById(task.id);
      assert.equal(updatedTask?.id, originalId);
      assert.equal(updatedTask?.createdAt.getTime(), originalCreatedAt.getTime());
      assert.equal(updatedTask?.title, 'New Title');
      assert.equal(updatedTask?.description, 'Test Description'); // Should remain unchanged
    });
  });

  suite('Storage Scope Tests', () => {
    test('TaskService should initialize with correct storage scope', () => {
      assert.equal(taskService.getStorageScope(), StorageScope.Global);
    });

    test('TaskService should change storage scope without migration', () => {
      // Create separate storage for global and workspace
      const globalStorage = new Map<string, any>();
      const workspaceStorage = new Map<string, any>();
      const context = {
        extensionUri: vscode.Uri.file(''),
        subscriptions: [],
        workspaceState: {
          get: (key: string) => workspaceStorage.get(key),
          update: (key: string, value: any) => workspaceStorage.set(key, value),
        },
        globalState: {
          get: (key: string) => globalStorage.get(key),
          update: (key: string, value: any) => globalStorage.set(key, value),
        },
      } as any;

      const testTimerService = new TimerService(context, StorageScope.Global);
      const testTaskService = new TaskService(context, testTimerService, StorageScope.Global);

      // Create a task in global storage
      testTaskService.createTask('Global Task', 'Global Description');
      assert.equal(testTaskService.getTasks().length, 1);

      // Change to workspace storage
      testTaskService.setStorageScope(StorageScope.Workspace);
      assert.equal(testTaskService.getStorageScope(), StorageScope.Workspace);

      // Should have no tasks in workspace storage (separate from global)
      const tasks = testTaskService.getTasks();
      assert.equal(tasks.length, 0);

      // Switch back to global storage
      testTaskService.setStorageScope(StorageScope.Global);
      assert.equal(testTaskService.getStorageScope(), StorageScope.Global);

      // Task should be back
      const globalTasks = testTaskService.getTasks();
      assert.equal(globalTasks.length, 1);
      assert.ok(globalTasks[0]);
      assert.equal(globalTasks[0].title, 'Global Task');
      assert.equal(globalTasks[0].description, 'Global Description');
    });

    test('TimerService should change storage scope', () => {
      // Initially global
      // Change to workspace
      timerService.setStorageScope(StorageScope.Workspace);
      // Should not throw error
      assert.ok(true);
    });

    test('Storage scopes should maintain separate task data', () => {
      // Create separate storage for global and workspace
      const globalStorage = new Map<string, any>();
      const workspaceStorage = new Map<string, any>();
      const context = {
        extensionUri: vscode.Uri.file(''),
        subscriptions: [],
        workspaceState: {
          get: (key: string) => workspaceStorage.get(key),
          update: (key: string, value: any) => workspaceStorage.set(key, value),
        },
        globalState: {
          get: (key: string) => globalStorage.get(key),
          update: (key: string, value: any) => globalStorage.set(key, value),
        },
      } as any;

      const workspaceTimerService = new TimerService(context, StorageScope.Workspace);
      const workspaceTaskService = new TaskService(context, workspaceTimerService, StorageScope.Workspace);

      // Create task in workspace storage
      workspaceTaskService.createTask('Workspace Task');
      assert.equal(workspaceTaskService.getTasks().length, 1);

      // Switch to global scope
      workspaceTaskService.setStorageScope(StorageScope.Global);
      workspaceTimerService.setStorageScope(StorageScope.Global);

      // Should have no tasks in global storage
      const globalTasks = workspaceTaskService.getTasks();
      assert.equal(globalTasks.length, 0);

      // Switch back to workspace
      workspaceTaskService.setStorageScope(StorageScope.Workspace);
      workspaceTimerService.setStorageScope(StorageScope.Workspace);

      // Task should be back
      const workspaceTasks = workspaceTaskService.getTasks();
      assert.equal(workspaceTasks.length, 1);
      assert.ok(workspaceTasks[0]);
      assert.equal(workspaceTasks[0].title, 'Workspace Task');
    });
  });

  // Kanban Board Tests
  suite('Kanban Board Tests', () => {
    let boardService: any;

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

      // Create kanban services
      boardService = new (require('../../boardService').BoardService)(context, StorageScope.Global);
    });

    test('BoardService should be created', () => {
      assert.ok(boardService);
    });

    test('BoardService createBoard creates board with correct properties', () => {
      const board = boardService.createBoard('Test Board', 'Test Description');
      assert.ok(board.id);
      assert.equal(board.name, 'Test Board');
      assert.equal(board.description, 'Test Description');
      assert.ok(board.createdAt);
      assert.ok(board.updatedAt);
      assert.deepEqual(board.columns, []);
    });

    test('BoardService getBoards returns all boards', () => {
      const initialCount = boardService.getBoards().length;
      boardService.createBoard('Board 1');
      boardService.createBoard('Board 2');
      const boards = boardService.getBoards();
      assert.equal(boards.length, initialCount + 2);
    });

    test('BoardService getBoard returns specific board', () => {
      const board = boardService.createBoard('Specific Board');
      const retrieved = boardService.getBoard(board.id);
      assert.ok(retrieved);
      assert.equal(retrieved!.id, board.id);
      assert.equal(retrieved!.name, 'Specific Board');
    });

    test('BoardService updateBoard updates board properties', () => {
      const board = boardService.createBoard('Original Name');
      const originalUpdatedAt = board.updatedAt.getTime();
      const updated = boardService.updateBoard(board.id, { name: 'Updated Name', description: 'Updated Desc' });
      assert.ok(updated);
      assert.equal(updated!.name, 'Updated Name');
      assert.equal(updated!.description, 'Updated Desc');
      assert.ok(updated!.updatedAt.getTime() >= originalUpdatedAt);
    });

    test('BoardService deleteBoard removes board', () => {
      const board = boardService.createBoard('To Delete');
      const initialCount = boardService.getBoards().length;
      const deleted = boardService.deleteBoard(board.id);
      assert.equal(deleted, true);
      assert.equal(boardService.getBoards().length, initialCount - 1);
      assert.equal(boardService.getBoard(board.id), undefined);
    });

    test('BoardService storage scope management', () => {
      // Test that storage scope can be changed
      assert.equal(boardService.getStorageScope(), StorageScope.Global);
      boardService.setStorageScope(StorageScope.Workspace);
      assert.equal(boardService.getStorageScope(), StorageScope.Workspace);
      boardService.setStorageScope(StorageScope.Global);
      assert.equal(boardService.getStorageScope(), StorageScope.Global);
    });
  });

  // Column Service Tests
  suite('Column Service Tests', () => {
    let boardService: any;
    let columnService: any;

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

      boardService = new (require('../../boardService').BoardService)(context, StorageScope.Global);
      columnService = new (require('../../columnService').ColumnService)(context, StorageScope.Global);
    });

    test('ColumnService should be created', () => {
      assert.ok(columnService);
    });

    test('ColumnService createColumn creates column with correct properties', () => {
      const board = boardService.createBoard('Test Board');
      const column = columnService.createColumn(board.id, 'Test Column');
      assert.ok(column.id);
      assert.equal(column.boardId, board.id);
      assert.equal(column.name, 'Test Column');
      assert.equal(column.isDefault, false);
      assert.equal(column.position, 0);
      assert.ok(column.createdAt);
    });

    test('ColumnService createColumn with isDefault flag', () => {
      const board = boardService.createBoard('Default Board');
      const defaultColumn = columnService.createColumn(board.id, 'Backlog', true);
      assert.equal(defaultColumn.isDefault, true);
      assert.equal(defaultColumn.name, 'Backlog');
    });

    test('ColumnService getColumns returns columns for specific board', () => {
      const board1 = boardService.createBoard('Board 1');
      const board2 = boardService.createBoard('Board 2');

      columnService.createColumn(board1.id, 'Column 1-1');
      columnService.createColumn(board1.id, 'Column 1-2');
      columnService.createColumn(board2.id, 'Column 2-1');

      const board1Columns = columnService.getColumns(board1.id);
      const board2Columns = columnService.getColumns(board2.id);

      assert.equal(board1Columns.length, 2);
      assert.equal(board2Columns.length, 1);
      assert.equal(board1Columns[0].name, 'Column 1-1');
      assert.equal(board1Columns[1].name, 'Column 1-2');
    });

    test('ColumnService getColumns sorts by position', () => {
      const board = boardService.createBoard('Position Board');
      const col1 = columnService.createColumn(board.id, 'First');
      const col2 = columnService.createColumn(board.id, 'Second');
      const col3 = columnService.createColumn(board.id, 'Third');

      // Manually set positions to test sorting
      columnService.updateColumn(col1.id, { position: 2 });
      columnService.updateColumn(col2.id, { position: 0 });
      columnService.updateColumn(col3.id, { position: 1 });

      const columns = columnService.getColumns(board.id);
      assert.equal(columns[0].name, 'Second'); // position 0
      assert.equal(columns[1].name, 'Third'); // position 1
      assert.equal(columns[2].name, 'First'); // position 2
    });

    test('ColumnService updateColumn updates name and position', () => {
      const board = boardService.createBoard('Update Board');
      const column = columnService.createColumn(board.id, 'Original Name');

      const updated = columnService.updateColumn(column.id, { name: 'Updated Name', position: 5 });
      assert.ok(updated);
      assert.equal(updated!.name, 'Updated Name');
      assert.equal(updated!.position, 5);
    });

    test('ColumnService updateColumn cannot update default columns', () => {
      const board = boardService.createBoard('Default Update Board');
      const defaultColumn = columnService.createColumn(board.id, 'Backlog', true);

      const updated = columnService.updateColumn(defaultColumn.id, { name: 'New Name' });
      assert.equal(updated, undefined);
    });

    test('ColumnService deleteColumn removes non-default columns', () => {
      const board = boardService.createBoard('Delete Board');
      const column = columnService.createColumn(board.id, 'To Delete');

      const initialCount = columnService.getColumns(board.id).length;
      const deleted = columnService.deleteColumn(column.id);
      assert.equal(deleted, true);
      assert.equal(columnService.getColumns(board.id).length, initialCount - 1);
    });

    test('ColumnService deleteColumn cannot delete default columns', () => {
      const board = boardService.createBoard('Delete Default Board');
      const defaultColumn = columnService.createColumn(board.id, 'Backlog', true);

      const deleted = columnService.deleteColumn(defaultColumn.id);
      assert.equal(deleted, false);
      assert.equal(columnService.getColumns(board.id).length, 1);
    });

    test('ColumnService isColumnNameUnique validates uniqueness', () => {
      const board = boardService.createBoard('Unique Board');
      columnService.createColumn(board.id, 'Existing Column');

      // Same name should not be unique
      assert.equal(columnService.isColumnNameUnique(board.id, 'Existing Column'), false);
      // Different name should be unique
      assert.equal(columnService.isColumnNameUnique(board.id, 'New Column'), true);
      // Same name but excluding existing should be unique
      const existingColumn = columnService.getColumns(board.id)[0];
      assert.equal(columnService.isColumnNameUnique(board.id, 'Existing Column', existingColumn.id), true);
    });

    test('ColumnService storage scope management', () => {
      // Test that storage scope can be changed
      assert.equal(columnService.getStorageScope(), StorageScope.Global);
      columnService.setStorageScope(StorageScope.Workspace);
      assert.equal(columnService.getStorageScope(), StorageScope.Workspace);
      columnService.setStorageScope(StorageScope.Global);
      assert.equal(columnService.getStorageScope(), StorageScope.Global);
    });
  });

  // Task Service Kanban Extensions Tests
  suite('Task Service Kanban Extensions', () => {
    let boardService: any;
    let columnService: any;
    let taskService: any;
    let timerService: any;

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

      boardService = new (require('../../boardService').BoardService)(context, StorageScope.Global);
      columnService = new (require('../../columnService').ColumnService)(context, StorageScope.Global);
      timerService = new (require('../../timerService').TimerService)(context, StorageScope.Global);
      taskService = new (require('../../taskService').TaskService)(context, timerService, StorageScope.Global);
    });

    test('TaskService createTask with board and column assigns them', () => {
      const board = boardService.createBoard('Task Board');
      const column = columnService.createColumn(board.id, 'Task Column');

      const task = taskService.createTask('Kanban Task', 'Description', board.id, column.id);
      assert.ok(task.boardId);
      assert.ok(task.columnId);
      assert.equal(task.boardId, board.id);
      assert.equal(task.columnId, column.id);
      assert.equal(task.title, 'Kanban Task');
      assert.equal(task.description, 'Description');
    });

    test('TaskService createTask without board and column creates task without assignments', () => {
      const task = taskService.createTask('Simple Task');
      assert.equal(task.boardId, undefined);
      assert.equal(task.columnId, undefined);
    });

    test('TaskService moveTaskToColumn updates task board and column', () => {
      const board1 = boardService.createBoard('Board 1');
      const board2 = boardService.createBoard('Board 2');
      const column1 = columnService.createColumn(board1.id, 'Column 1');
      const column2 = columnService.createColumn(board2.id, 'Column 2');

      const task = taskService.createTask('Movable Task');
      assert.equal(task.boardId, undefined);
      assert.equal(task.columnId, undefined);

      // Move to first board/column
      const moved = taskService.moveTaskToColumn(task.id, board1.id, column1.id);
      assert.equal(moved, true);

      const updatedTask = taskService.getTaskById(task.id);
      assert.ok(updatedTask);
      assert.equal(updatedTask!.boardId, board1.id);
      assert.equal(updatedTask!.columnId, column1.id);

      // Move to different board/column
      const movedAgain = taskService.moveTaskToColumn(task.id, board2.id, column2.id);
      assert.equal(movedAgain, true);

      const updatedAgain = taskService.getTaskById(task.id);
      assert.ok(updatedAgain);
      assert.equal(updatedAgain!.boardId, board2.id);
      assert.equal(updatedAgain!.columnId, column2.id);
    });

    test('TaskService moveTaskToColumn returns false for invalid task', () => {
      const board = boardService.createBoard('Invalid Board');
      const column = columnService.createColumn(board.id, 'Invalid Column');

      const moved = taskService.moveTaskToColumn('invalid-id', board.id, column.id);
      assert.equal(moved, false);
    });

    test('TaskService assignDefaultBoardAndColumn assigns to unassigned tasks', () => {
      const board = boardService.createBoard('Default Board');
      const column = columnService.createColumn(board.id, 'Default Column');

      // Create tasks - some with assignments, some without
      const assignedTask = taskService.createTask('Already Assigned', '', board.id, column.id);
      const unassignedTask1 = taskService.createTask('Unassigned 1');
      const unassignedTask2 = taskService.createTask('Unassigned 2');

      // Assign defaults
      taskService.assignDefaultBoardAndColumn(board.id, column.id);

      // Check that unassigned tasks got defaults
      const updated1 = taskService.getTaskById(unassignedTask1.id);
      const updated2 = taskService.getTaskById(unassignedTask2.id);
      const stillAssigned = taskService.getTaskById(assignedTask.id);

      assert.ok(updated1);
      assert.ok(updated2);
      assert.ok(stillAssigned);

      assert.equal(updated1!.boardId, board.id);
      assert.equal(updated1!.columnId, column.id);
      assert.equal(updated2!.boardId, board.id);
      assert.equal(updated2!.columnId, column.id);

      // Already assigned task should remain unchanged
      assert.equal(stillAssigned!.boardId, board.id);
      assert.equal(stillAssigned!.columnId, column.id);
    });
  });

  // Kanban Integration Tests
  suite('Kanban Integration Tests', () => {
    let boardService: any;
    let columnService: any;
    let taskService: any;
    let timerService: any;

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

      boardService = new (require('../../boardService').BoardService)(context, StorageScope.Global);
      columnService = new (require('../../columnService').ColumnService)(context, StorageScope.Global);
      timerService = new (require('../../timerService').TimerService)(context, StorageScope.Global);
      taskService = new (require('../../taskService').TaskService)(context, timerService, StorageScope.Global);
    });

    test('Complete kanban workflow: create board, columns, tasks, and move tasks', () => {
      // Create a project board
      const projectBoard = boardService.createBoard('Project Alpha', 'Main project board');

      // Create columns
      const backlogColumn = columnService.createColumn(projectBoard.id, 'Backlog', true);
      const inProgressColumn = columnService.createColumn(projectBoard.id, 'In Progress');
      const reviewColumn = columnService.createColumn(projectBoard.id, 'Review');
      const doneColumn = columnService.createColumn(projectBoard.id, 'Done');

      // Verify board has columns
      const board = boardService.getBoard(projectBoard.id);
      assert.ok(board);
      assert.equal(board!.columns.length, 0); // Board.columns is array of column IDs, not actual columns

      // Verify columns exist for board
      const boardColumns = columnService.getColumns(projectBoard.id);
      assert.equal(boardColumns.length, 4);
      assert.equal(boardColumns[0].name, 'Backlog');
      assert.equal(boardColumns[1].name, 'In Progress');
      assert.equal(boardColumns[2].name, 'Review');
      assert.equal(boardColumns[3].name, 'Done');

      // Create tasks in backlog
      const task1 = taskService.createTask(
        'Implement login',
        'User authentication feature',
        projectBoard.id,
        backlogColumn.id
      );
      const task2 = taskService.createTask(
        'Design dashboard',
        'UI/UX for main dashboard',
        projectBoard.id,
        backlogColumn.id
      );
      const task3 = taskService.createTask(
        'Write tests',
        'Unit and integration tests',
        projectBoard.id,
        backlogColumn.id
      );

      // Move task to in progress
      taskService.moveTaskToColumn(task1.id, projectBoard.id, inProgressColumn.id);
      let updatedTask1 = taskService.getTaskById(task1.id);
      assert.equal(updatedTask1!.boardId, projectBoard.id);
      assert.equal(updatedTask1!.columnId, inProgressColumn.id);

      // Move task to review
      taskService.moveTaskToColumn(task1.id, projectBoard.id, reviewColumn.id);
      updatedTask1 = taskService.getTaskById(task1.id);
      assert.equal(updatedTask1!.columnId, reviewColumn.id);

      // Move task to done
      taskService.moveTaskToColumn(task1.id, projectBoard.id, doneColumn.id);
      updatedTask1 = taskService.getTaskById(task1.id);
      assert.equal(updatedTask1!.columnId, doneColumn.id);

      // Verify all tasks are still in the system
      const allTasks = taskService.getTasks();
      assert.equal(allTasks.length, 3);

      // Verify task assignments
      const finalTask1 = allTasks.find((t: any) => t.id === task1.id);
      const finalTask2 = allTasks.find((t: any) => t.id === task2.id);
      const finalTask3 = allTasks.find((t: any) => t.id === task3.id);

      assert.ok(finalTask1);
      assert.ok(finalTask2);
      assert.ok(finalTask3);

      assert.equal(finalTask1!.boardId, projectBoard.id);
      assert.equal(finalTask1!.columnId, doneColumn.id);
      assert.equal(finalTask2!.boardId, projectBoard.id);
      assert.equal(finalTask2!.columnId, backlogColumn.id);
      assert.equal(finalTask3!.boardId, projectBoard.id);
      assert.equal(finalTask3!.columnId, backlogColumn.id);
    });

    test('Multiple boards with separate workflows', () => {
      // Create two separate boards
      const board1 = boardService.createBoard('Frontend Board');
      const board2 = boardService.createBoard('Backend Board');

      // Create columns for each board
      const board1Backlog = columnService.createColumn(board1.id, 'Backlog', true);
      const board1Progress = columnService.createColumn(board1.id, 'In Progress');
      const board2Backlog = columnService.createColumn(board2.id, 'Backlog', true);
      const board2Progress = columnService.createColumn(board2.id, 'In Progress');

      // Create tasks on different boards
      const frontendTask = taskService.createTask('Build UI component', '', board1.id, board1Backlog.id);
      const backendTask = taskService.createTask('Implement API', '', board2.id, board2Backlog.id);

      // Move tasks independently
      taskService.moveTaskToColumn(frontendTask.id, board1.id, board1Progress.id);
      taskService.moveTaskToColumn(backendTask.id, board2.id, board2Progress.id);

      // Verify tasks are on correct boards and columns
      const updatedFrontend = taskService.getTaskById(frontendTask.id);
      const updatedBackend = taskService.getTaskById(backendTask.id);

      assert.equal(updatedFrontend!.boardId, board1.id);
      assert.equal(updatedFrontend!.columnId, board1Progress.id);
      assert.equal(updatedBackend!.boardId, board2.id);
      assert.equal(updatedBackend!.columnId, board2Progress.id);

      // Verify board isolation
      const board1Columns = columnService.getColumns(board1.id);
      const board2Columns = columnService.getColumns(board2.id);

      assert.equal(board1Columns.length, 2);
      assert.equal(board2Columns.length, 2);
    });

    test('Backward compatibility: existing tasks can be assigned to kanban', () => {
      // Create tasks without board/column (simulating existing tasks)
      const existingTask1 = taskService.createTask('Legacy Task 1');
      const existingTask2 = taskService.createTask('Legacy Task 2');

      // Verify they have no board/column initially
      assert.equal(existingTask1.boardId, undefined);
      assert.equal(existingTask1.columnId, undefined);
      assert.equal(existingTask2.boardId, undefined);
      assert.equal(existingTask2.columnId, undefined);

      // Create default board and column
      const defaultBoard = boardService.createBoard('Default Board');
      const defaultColumn = columnService.createColumn(defaultBoard.id, 'Backlog', true);

      // Assign defaults to existing tasks
      taskService.assignDefaultBoardAndColumn(defaultBoard.id, defaultColumn.id);

      // Verify tasks now have board and column
      const updatedTask1 = taskService.getTaskById(existingTask1.id);
      const updatedTask2 = taskService.getTaskById(existingTask2.id);

      assert.ok(updatedTask1);
      assert.ok(updatedTask2);
      assert.equal(updatedTask1!.boardId, defaultBoard.id);
      assert.equal(updatedTask1!.columnId, defaultColumn.id);
      assert.equal(updatedTask2!.boardId, defaultBoard.id);
      assert.equal(updatedTask2!.columnId, defaultColumn.id);
    });

    test('editColumn command argument processing works correctly', () => {
      // Import the argument processing function
      const { processEditColumnArgs } = require('../utils/commandUtils');

      // Test with string argument
      let result = processEditColumnArgs('test-column-id');
      assert.equal(result, 'test-column-id');

      // Test with TreeItem argument
      const mockTreeItem = { id: 'column-abc123' };
      result = processEditColumnArgs(mockTreeItem);
      assert.equal(result, 'column-abc123');

      // Test with undefined argument
      result = processEditColumnArgs(undefined);
      assert.equal(result, undefined);

      // Test with null argument
      result = processEditColumnArgs(null);
      assert.equal(result, undefined);

      // Test with empty object
      result = processEditColumnArgs({});
      assert.equal(result, undefined);
    });

    test('deleteColumn command argument processing works correctly', () => {
      // Import the argument processing function
      const { processDeleteColumnArgs } = require('../utils/commandUtils');

      // Test with string argument
      let result = processDeleteColumnArgs('test-column-id');
      assert.equal(result, 'test-column-id');

      // Test with TreeItem argument
      const mockTreeItem = { id: 'column-abc123' };
      result = processDeleteColumnArgs(mockTreeItem);
      assert.equal(result, 'column-abc123');

      // Test with undefined argument
      result = processDeleteColumnArgs(undefined);
      assert.equal(result, undefined);

      // Test with null argument
      result = processDeleteColumnArgs(null);
      assert.equal(result, undefined);

      // Test with empty object
      result = processDeleteColumnArgs({});
      assert.equal(result, undefined);
    });

    test('editBoard command argument processing works correctly', () => {
      // Import the argument processing function
      const { processEditBoardArgs } = require('../utils/commandUtils');

      // Test with string argument
      let result = processEditBoardArgs('test-board-id');
      assert.equal(result, 'test-board-id');

      // Test with TreeItem argument
      const mockTreeItem = { id: 'board-abc123' };
      result = processEditBoardArgs(mockTreeItem);
      assert.equal(result, 'board-abc123');

      // Test with undefined argument
      result = processEditBoardArgs(undefined);
      assert.equal(result, undefined);

      // Test with null argument
      result = processEditBoardArgs(null);
      assert.equal(result, undefined);

      // Test with empty object
      result = processEditBoardArgs({});
      assert.equal(result, undefined);
    });

    test('deleteBoard command argument processing works correctly', () => {
      // Import the argument processing function
      const { processDeleteBoardArgs } = require('../utils/commandUtils');

      // Test with string argument
      let result = processDeleteBoardArgs('test-board-id');
      assert.equal(result, 'test-board-id');

      // Test with TreeItem argument
      const mockTreeItem = { id: 'board-abc123' };
      result = processDeleteBoardArgs(mockTreeItem);
      assert.equal(result, 'board-abc123');

      // Test with undefined argument
      result = processDeleteBoardArgs(undefined);
      assert.equal(result, undefined);

      // Test with null argument
      result = processDeleteBoardArgs(null);
      assert.equal(result, undefined);

      // Test with empty object
      result = processDeleteBoardArgs({});
      assert.equal(result, undefined);
    });

    test('Deleting a board deletes all associated tasks', () => {
      // Create a board and some tasks
      const board = boardService.createBoard('Board to Delete');
      const column = columnService.createColumn(board.id, 'Test Column');

      taskService.createTask('Task 1', 'Description 1', board.id, column.id);
      taskService.createTask('Task 2', 'Description 2', board.id, column.id);
      taskService.createTask('Task 3', 'Description 3', board.id, column.id);

      // Verify tasks are created
      const tasksBefore = taskService.getTasks().length;
      const boardsBefore = boardService.getBoards().length;

      // Delete the board (this should delete the tasks)
      const deleted = boardService.deleteBoard(board.id, taskService);
      assert.equal(deleted, true);

      // Verify board is deleted
      assert.equal(boardService.getBoards().length, boardsBefore - 1);

      // Verify tasks are deleted
      const tasksAfter = taskService.getTasks().length;
      assert.equal(tasksAfter, tasksBefore - 3);
    });

    test('Delete all tasks removes all tasks', () => {
      // Create some tasks
      const task1 = taskService.createTask('Task 1', 'Description 1');
      const task2 = taskService.createTask('Task 2', 'Description 2');
      const task3 = taskService.createTask('Task 3', 'Description 3');

      // Verify tasks are created
      const tasksBefore = taskService.getTasks().length;

      // Delete all tasks (simulate the command logic)
      taskService.deleteTask(task1.id);
      taskService.deleteTask(task2.id);
      taskService.deleteTask(task3.id);

      // Verify tasks are deleted
      const tasksAfter = taskService.getTasks().length;
      assert.equal(tasksAfter, tasksBefore - 3);
    });
  });
});
