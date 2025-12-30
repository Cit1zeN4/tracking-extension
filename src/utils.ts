import { BoardService } from './boardService';
import { ColumnService } from './columnService';
import { TaskService } from './taskService';

export function initializeDefaultBoardAndColumn(
  boardService: BoardService,
  columnService: ColumnService,
  taskService: TaskService
) {
  const boards = boardService.getBoards();
  if (boards.length === 0) {
    // Create default board
    const defaultBoard = boardService.createBoard('Default Board', 'Default kanban board for organizing tasks');
    const defaultColumn = columnService.createColumn(defaultBoard.id, 'Backlog', true);
    // Assign default to existing tasks
    taskService.assignDefaultBoardAndColumn(defaultBoard.id, defaultColumn.id);
  } else {
    // Ensure all tasks have board/column assigned
    const defaultBoard = boards[0];
    if (defaultBoard) {
      const columns = columnService.getColumns(defaultBoard.id);
      const backlogColumn = columns.find((col) => col.isDefault) || columns[0];
      if (backlogColumn) {
        taskService.assignDefaultBoardAndColumn(defaultBoard.id, backlogColumn.id);
      }
    }
  }
}
