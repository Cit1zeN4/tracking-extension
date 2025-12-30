interface TreeItemLike {
  id?: string;
}

export function processMoveTaskToColumnArgs(arg?: string | TreeItemLike): string | undefined {
  // Check if arg is a task ID string, tree item, or undefined
  let targetTaskId: string | undefined;
  if (typeof arg === 'string') {
    targetTaskId = arg;
  } else if (arg && typeof arg === 'object' && 'id' in arg && arg.id?.startsWith('task-')) {
    // Tree item with task ID in format "task-{taskId}"
    targetTaskId = arg.id.substring(5); // Remove "task-" prefix
  }
  return targetTaskId;
}

export function processEditColumnArgs(arg?: string | TreeItemLike): string | undefined {
  // Check if arg is a column ID string or tree item
  let columnId: string | undefined;
  if (typeof arg === 'string') {
    columnId = arg;
  } else if (arg && typeof arg === 'object' && 'id' in arg) {
    // Tree item with column ID
    columnId = arg.id;
  }
  return columnId;
}

export function processDeleteColumnArgs(arg?: string | TreeItemLike): string | undefined {
  // Check if arg is a column ID string or tree item
  let columnId: string | undefined;
  if (typeof arg === 'string') {
    columnId = arg;
  } else if (arg && typeof arg === 'object' && 'id' in arg) {
    // Tree item with column ID
    columnId = arg.id;
  }
  return columnId;
}

export function processEditBoardArgs(arg?: string | TreeItemLike): string | undefined {
  // Check if arg is a board ID string or tree item
  let boardId: string | undefined;
  if (typeof arg === 'string') {
    boardId = arg;
  } else if (arg && typeof arg === 'object' && 'id' in arg) {
    // Tree item with board ID
    boardId = arg.id;
  }
  return boardId;
}

export function processDeleteBoardArgs(arg?: string | TreeItemLike): string | undefined {
  // Check if arg is a board ID string or tree item
  let boardId: string | undefined;
  if (typeof arg === 'string') {
    boardId = arg;
  } else if (arg && typeof arg === 'object' && 'id' in arg) {
    // Tree item with board ID
    boardId = arg.id;
  }
  return boardId;
}
