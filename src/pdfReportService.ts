import * as fs from 'fs';
import * as path from 'path';
const PDFDocument = require('pdfkit');
import { BoardService } from './boardService';
import { TaskService } from './taskService';
import { ColumnService } from './columnService';
import { TimerService } from './timerService';
import { Board, Task, Column, TimeEntry } from './types';

export interface ReportData {
  board: Board;
  columns: Column[];
  tasks: Task[];
  dateRange: {
    start: Date;
    end: Date;
  };
  totalTime: number;
}

export interface TaskTimeEntry {
  task: Task;
  timeEntries: TimeEntry[];
  totalTime: number;
}

export class PdfReportService {
  constructor(
    private boardService: BoardService,
    private taskService: TaskService,
    private columnService: ColumnService,
    private timerService: TimerService
  ) {
    // Validate dependencies
    this.validateDependencies();
  }

  /**
   * Validate that required dependencies are available
   */
  private validateDependencies(): void {
    try {
      // Check if PDFKit is available
      const PDFDocument = require('pdfkit');
      if (!PDFDocument) {
        throw new Error('PDFKit library is not available');
      }
    } catch (error) {
      throw new Error(`PDF generation dependencies are missing: ${error}`);
    }
  }

  /**
   * Generate PDF report for a board
   * @param {string} boardId - ID of the board to generate report for
   * @param {Object} [dateRange] - Optional date range for filtering
   * @param {Date} [dateRange.start] - Start date
   * @param {Date} [dateRange.end] - End date
   * @param {string} outputPath - Output file path
   * @returns {Promise<string>} Promise that resolves to the output file path
   */
  async generateBoardReport(
    boardId: string,
    dateRange?: { start?: Date; end?: Date },
    outputPath?: string
  ): Promise<string> {
    if (!outputPath) {
      throw new Error('Output path is required');
    }

    try {
      // Validate output path
      if (!outputPath.toLowerCase().endsWith('.pdf')) {
        throw new Error('Output file must have .pdf extension');
      }

      // Collect report data
      const reportData = await this.collectReportData(boardId, dateRange);

      // Validate that we have data to report
      if (reportData.tasks.length === 0) {
        throw new Error('No tasks found for the selected board and date range');
      }

      if (reportData.totalTime === 0) {
        throw new Error('No time tracking data found for the selected board and date range');
      }

      // Check for large datasets that might cause memory issues
      const totalTimeEntries = reportData.tasks.reduce((count, task) => {
        const entries = this.timerService.getCompletedEntries().filter((entry) => entry.taskId === task.id);
        return count + entries.length;
      }, 0);

      if (totalTimeEntries > 10000) {
        throw new Error('Report contains too many time entries (>10,000). Consider using a smaller date range.');
      }

      if (reportData.tasks.length > 1000) {
        throw new Error('Report contains too many tasks (>1,000). Consider using a smaller date range.');
      }

      // Create PDF document
      const doc = this.createPdfDocument(reportData);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Save PDF to file
      await this.savePdfDocument(doc, outputPath);

      return outputPath;
    } catch (error) {
      // Re-throw with more context
      if (error instanceof Error) {
        throw new Error(`Failed to generate PDF report: ${error.message}`);
      } else {
        throw new Error('Failed to generate PDF report: Unknown error occurred');
      }
    }
  }

  /**
   * Collect report data for a board
   * @param boardId - ID of the board to generate report for
   * @param dateRange - Optional date range for filtering
   * @return Promise that resolves to report data
   */
  private async collectReportData(boardId: string, dateRange?: { start?: Date; end?: Date }): Promise<ReportData> {
    // Get board information
    const board = this.boardService.getBoard(boardId);
    if (!board) {
      throw new Error(`Board with ID ${boardId} not found`);
    }

    // Get columns for this board
    const columns = this.columnService.getColumns(boardId);

    // Handle edge cases
    if (columns.length === 0) {
      // Create a default "Backlog" column if none exist
      const defaultColumn = this.columnService.createColumn(boardId, 'Backlog', true);
      columns.push(defaultColumn);
    }

    // Get all tasks for this board
    const allTasks = this.taskService.getTasks();
    const boardTasks = allTasks.filter((task) => task.boardId === boardId);

    // Filter tasks by date range if specified
    let filteredTasks = boardTasks;
    if (dateRange?.start || dateRange?.end) {
      filteredTasks = this.filterTasksByDateRange(boardTasks, dateRange);
    }

    // If no tasks have time tracking, include all tasks but show 0 time
    const tasksWithTime = filteredTasks.filter((task) => {
      const taskTime = this.taskService.getTotalTimeSpent(task.id);
      return taskTime > 0;
    });

    const finalTasks = tasksWithTime.length > 0 ? tasksWithTime : filteredTasks;

    // Calculate total time for final tasks
    let totalTime = 0;
    for (const task of finalTasks) {
      totalTime += this.taskService.getTotalTimeSpent(task.id);
    }

    return {
      board,
      columns,
      tasks: finalTasks,
      dateRange: {
        start: dateRange?.start || new Date(0), // Default to epoch if not specified
        end: dateRange?.end || new Date(), // Default to now if not specified
      },
      totalTime,
    };
  }

  /**
   * Create PDF document with report content
   * @param data - Report data to include in the PDF
   * @return PDF document instance
   */
  private createPdfDocument(data: ReportData): any {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `Time Report - ${data.board.name}`,
        Author: 'Time Tracking Extension',
        Subject: `Board: ${data.board.name}`,
      },
    });

    // Set up fonts and colors
    const titleFont = 'Helvetica-Bold';
    const normalFont = 'Helvetica';

    // Colors
    const primaryColor = '#2E86AB';
    const secondaryColor = '#A23B72';
    const textColor = '#333333';
    const lightGray = '#666666';

    // Title with background
    doc.rect(0, 0, doc.page.width, 80).fill(primaryColor);

    doc.fillColor('white').font(titleFont, 24).text('Time Tracking Report', 50, 30).moveDown(0.5);

    // Reset fill color
    doc.fillColor(textColor);

    // Board information in a bordered box
    doc.rect(50, 90, doc.page.width - 100, 60).stroke(secondaryColor);

    doc.font(normalFont, 14).text(`Board: ${data.board.name}`, 60, 100).moveDown(0.3);

    if (data.board.description) {
      doc
        .font(normalFont, 12)
        .fillColor(lightGray)
        .text(`Description: ${data.board.description}`, 60)
        .fillColor(textColor)
        .moveDown(0.3);
    }

    // Date range
    const dateRangeText = this.formatDateRange(data.dateRange);
    doc.font(normalFont, 12).text(`Report Period: ${dateRangeText}`, 60, 140).moveDown(0.5);

    // Move to next section
    doc.y = 170;

    // Total time summary in a highlighted box
    doc
      .rect(50, doc.y, doc.page.width - 100, 40)
      .fill('#F0F8FF')
      .stroke(secondaryColor);

    doc
      .fillColor(textColor)
      .font(titleFont, 16)
      .text('Summary', 60, doc.y + 10)
      .moveDown(0.3);

    doc
      .font(normalFont, 12)
      .text(`Total Time Tracked: ${this.formatDuration(data.totalTime)}`, 60)
      .text(`Number of Tasks: ${data.tasks.length}`, 60)
      .text(`Number of Columns: ${data.columns.length}`, 60)
      .moveDown(0.5);

    // Move past the summary box
    doc.y += 50;

    // Column-based task breakdown
    doc.font(titleFont, 14).text('Task Details by Column').moveDown(0.3);

    // Group tasks by column
    const tasksByColumn = this.groupTasksByColumn(data.tasks, data.columns);

    for (const column of data.columns) {
      const columnTasks = tasksByColumn[column.id] || [];
      if (columnTasks.length === 0) continue;

      // Column header
      doc.font(titleFont, 12).text(`Column: ${column.name}`).moveDown(0.2);

      // Tasks in this column
      for (const task of columnTasks) {
        const taskTime = this.taskService.getTotalTimeSpent(task.id);
        if (taskTime === 0) continue; // Skip tasks with no time tracked

        doc.font(normalFont, 10).text(`• ${task.title}`, { indent: 20 }).moveDown(0.1);

        if (task.description) {
          doc
            .font(normalFont, 9)
            .fillColor(lightGray)
            .text(task.description, { indent: 30 })
            .fillColor(textColor)
            .moveDown(0.1);
        }

        doc
          .font(normalFont, 9)
          .text(`Time spent: ${this.formatDuration(taskTime)}`, { indent: 30 })
          .moveDown(0.1);

        // Get time entries for this task
        const timeEntries = this.timerService
          .getCompletedEntries()
          .filter((entry: TimeEntry) => entry.taskId === task.id);
        if (timeEntries.length > 0) {
          doc.font(normalFont, 8).text('Time entries:', { indent: 30 }).moveDown(0.1);

          for (const entry of timeEntries) {
            const startTime = entry.startTime.toLocaleString();
            const duration = this.formatDuration(entry.duration);
            const desc = entry.description ? ` - ${entry.description}` : '';

            doc.font(normalFont, 8).text(`• ${startTime}: ${duration}${desc}`, { indent: 40 }).moveDown(0.05);
          }
        }

        doc.moveDown(0.2);
      }

      doc.moveDown(0.3);
    }

    return doc;
  }

  /**
   * Format date range for display
   * @param dateRange - Date range object
   * @return Formatted date range string
   */
  private formatDateRange(dateRange: { start: Date; end: Date }): string {
    const formatDate = (date: Date) => date.toLocaleDateString();
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  }

  /**
   * Format duration in milliseconds to human readable format
   * @param milliseconds - Duration in milliseconds
   * @return Formatted duration string
   */
  private formatDuration(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Group tasks by their column ID
   * @param tasks - Array of tasks to group
   * @param columns - Array of columns
   * @return Object with column IDs as keys and task arrays as values
   */
  private groupTasksByColumn(tasks: Task[], columns: Column[]): Record<string, Task[]> {
    const tasksByColumn: Record<string, Task[]> = {};

    // Initialize with empty arrays for all columns
    for (const column of columns) {
      tasksByColumn[column.id] = [];
    }

    // Group tasks by column
    for (const task of tasks) {
      if (task.columnId && tasksByColumn[task.columnId] !== undefined) {
        tasksByColumn[task.columnId]!.push(task);
      }
    }

    return tasksByColumn;
  }

  /**
   * Filter tasks based on time entries within date range
   * @param tasks - Array of tasks to filter
   * @param dateRange - Date range for filtering
   * @return Filtered array of tasks
   */
  private filterTasksByDateRange(tasks: Task[], dateRange: { start?: Date; end?: Date }): Task[] {
    return tasks.filter((task) => {
      const timeEntries = this.timerService
        .getCompletedEntries()
        .filter((entry: TimeEntry) => entry.taskId === task.id);

      // Include task if any of its time entries fall within the date range
      return timeEntries.some((entry) => {
        const entryStart = entry.startTime;
        const entryEnd = entry.endTime || new Date(); // Use current time if entry is still running

        const rangeStart = dateRange.start || new Date(0);
        const rangeEnd = dateRange.end || new Date();

        // Check if entry overlaps with the date range
        return entryStart <= rangeEnd && entryEnd >= rangeStart;
      });
    });
  }

  /**
   * Save PDF document to file
   * @param doc - PDF document instance
   * @param filePath - Output file path
   * @return Promise that resolves when file is saved
   */
  private async savePdfDocument(doc: any, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      stream.on('finish', () => {
        resolve();
      });

      stream.on('error', (error) => {
        reject(error);
      });

      doc.end();
    });
  }
}
