/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert';
import * as vscode from 'vscode';
import { PdfReportService } from '../../pdfReportService';
import { Task, Column, StorageScope } from '../../types';

suite('PdfReportService Test Suite', () => {
  let pdfReportService: PdfReportService;
  let mockBoardService: any;
  let mockTaskService: any;
  let mockColumnService: any;
  let mockTimerService: any;

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

    // Create mock services
    mockTimerService = new (require('../../timerService').TimerService)(context, StorageScope.Global);
    mockTaskService = new (require('../../taskService').TaskService)(context, mockTimerService, StorageScope.Global);
    mockBoardService = new (require('../../boardService').BoardService)(context, StorageScope.Global);
    mockColumnService = new (require('../../columnService').ColumnService)(context, StorageScope.Global);

    // Create PDF report service
    pdfReportService = new PdfReportService(mockBoardService, mockTaskService, mockColumnService, mockTimerService);
  });

  test('PdfReportService should be created', () => {
    assert.ok(pdfReportService);
  });

  test('formatDuration should format milliseconds correctly', () => {
    // Test seconds
    assert.equal((pdfReportService as any).formatDuration(5000), '5s');

    // Test minutes and seconds
    assert.equal((pdfReportService as any).formatDuration(125000), '2m 5s');

    // Test hours, minutes and seconds
    assert.equal((pdfReportService as any).formatDuration(7265000), '2h 1m 5s');
  });

  test('formatDateRange should format dates correctly', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');
    const result = (pdfReportService as any).formatDateRange({ start: startDate, end: endDate });

    assert.ok(result.includes('1/1/2024'));
    assert.ok(result.includes('1/31/2024'));
  });

  test('groupTasksByColumn should group tasks correctly', () => {
    const columns: Column[] = [
      { id: 'col1', boardId: 'board1', name: 'Backlog', isDefault: true, position: 0, createdAt: new Date() },
      { id: 'col2', boardId: 'board1', name: 'In Progress', isDefault: false, position: 1, createdAt: new Date() },
    ];

    const tasks: Task[] = [
      { id: 'task1', title: 'Task 1', source: 'manual', createdAt: new Date(), boardId: 'board1', columnId: 'col1' },
      { id: 'task2', title: 'Task 2', source: 'manual', createdAt: new Date(), boardId: 'board1', columnId: 'col2' },
      { id: 'task3', title: 'Task 3', source: 'manual', createdAt: new Date(), boardId: 'board1', columnId: 'col1' },
    ];

    const result = (pdfReportService as any).groupTasksByColumn(tasks, columns);

    assert.equal(result['col1'].length, 2);
    assert.equal(result['col2'].length, 1);
    assert.equal(result['col1'][0].id, 'task1');
    assert.equal(result['col2'][0].id, 'task2');
  });

  test('filterTasksByDateRange should filter tasks correctly', () => {
    // Mock timer service to return time entries
    const originalGetCompletedEntries = mockTimerService.getCompletedEntries;
    mockTimerService.getCompletedEntries = () => [
      {
        id: 'entry1',
        taskId: 'task1',
        startTime: new Date('2024-01-15'),
        endTime: new Date('2024-01-15T01:00:00'),
        duration: 3600000,
      },
      {
        id: 'entry2',
        taskId: 'task2',
        startTime: new Date('2024-02-15'),
        endTime: new Date('2024-02-15T01:00:00'),
        duration: 3600000,
      },
    ];

    const tasks: Task[] = [
      { id: 'task1', title: 'Task 1', source: 'manual', createdAt: new Date() },
      { id: 'task2', title: 'Task 2', source: 'manual', createdAt: new Date() },
    ];

    const dateRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    };

    const result = (pdfReportService as any).filterTasksByDateRange(tasks, dateRange);

    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'task1');

    // Restore original method
    mockTimerService.getCompletedEntries = originalGetCompletedEntries;
  });
});
