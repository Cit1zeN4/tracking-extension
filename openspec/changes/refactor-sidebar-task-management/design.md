# Design: Refactor Sidebar Task Management

## Overview

This change refactors the sidebar to remove the timer logs section and adds comprehensive task management capabilities. The sidebar will focus exclusively on task management while providing full CRUD operations for tasks.

## Architecture Changes

### Sidebar Structure

**Before:**

```
Sidebar Root
├── Timer (TimerSectionItem)
│   ├── Log Entry 1 (LogItem)
│   ├── Log Entry 2 (LogItem)
│   └── ...
└── Tasks (TasksSectionItem)
    ├── Task 1 (TaskItem)
    ├── Task 2 (TaskItem)
    └── ...
```

**After:**

```
Sidebar Root
└── Tasks (TasksSectionItem)
    ├── Task 1 (TaskItem)
    ├── Task 2 (TaskItem)
    └── ...
```

### Removed Components

- **TimerSectionItem**: Timer logs section that duplicated "View Logs" command
- **LogItem**: Individual log entry display items
- **Timer logs display logic**: Code for rendering and managing log entries

### Added Components

- **Delete Task Command**: `tracking-extension.deleteTask`
- **Edit Task Command**: `tracking-extension.editTask`
- **Context Menu Items**: Delete and Edit options in task context menus
- **Confirmation Dialogs**: Safe deletion with user confirmation

## Task Management Flow

### Delete Task Flow

1. User selects "Delete Task" from context menu
2. System checks if task has active timer
3. If active timer exists, prompt user to stop timer first
4. Show confirmation dialog with task details
5. If confirmed, delete task and clean up related data
6. Refresh sidebar to reflect changes

### Edit Task Flow

1. User selects "Edit Task" from context menu
2. Show input box for new title (pre-filled with current)
3. Show input box for new description (pre-filled with current)
4. Validate inputs (title required, description optional)
5. Update task in storage
6. Refresh sidebar and any open task details views

## Data Integrity Considerations

### Task Deletion

- **Timer Entries**: Remove all time entries associated with deleted task
- **Active Timer**: Prevent deletion if task is currently being timed
- **References**: Clean up any cached references to deleted task

### Task Updates

- **Timer State**: Preserve timer associations when updating task metadata
- **UI Updates**: Refresh all displays showing the updated task
- **Validation**: Ensure title is not empty, handle description updates

## UI/UX Design

### Context Menu Structure

```
Task Item (Right-click)
├── Start Task
├── Pause Task
├── Stop Task
├── View Details
├── ──────────
├── Edit Task
└── Delete Task
```

### Confirmation Dialogs

**Delete Confirmation:**

```
Delete Task: "[Task Title]"?

This will permanently delete the task and all its time entries.
This action cannot be undone.

[Cancel] [Delete]
```

**Active Timer Warning:**

```
Cannot delete task while timer is running.

Please stop the timer first, then try again.

[OK]
```

## Error Handling

- **Invalid Task ID**: Graceful handling of deleted or non-existent tasks
- **Permission Issues**: Handle cases where task cannot be modified
- **UI State**: Ensure sidebar remains consistent during operations
- **Cancellation**: Allow users to cancel operations at any confirmation step

## Testing Strategy

- **Unit Tests**: Command handlers, validation logic, data cleanup
- **Integration Tests**: Sidebar updates, context menu functionality
- **Manual Tests**: Full user workflows, edge cases, error scenarios</content>
  <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\refactor-sidebar-task-management\design.md
