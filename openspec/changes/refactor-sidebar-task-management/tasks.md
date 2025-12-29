# Tasks: Refactor Sidebar Task Management

## Implementation Tasks

1. **Remove timer section from sidebar**
   - Remove TimerSectionItem from sidebar tree structure
   - Remove LogItem class and related code
   - Update sidebar provider to only show tasks section
   - Test that sidebar still functions correctly

2. **Add delete task command**
   - Register new command `tracking-extension.deleteTask`
   - Add command to package.json contributions
   - Implement command handler with confirmation dialog
   - Handle timer state when deleting active task

3. **Add edit task command**
   - Register new command `tracking-extension.editTask`
   - Add command to package.json contributions
   - Implement command handler with input prompts for title/description
   - Update task display when edited

4. **Update sidebar context menus**
   - Add "Delete Task" and "Edit Task" options to task context menus
   - Update menu conditions to show options for all tasks
   - Pass selected task ID to management commands

5. **Update task service integration**
   - Ensure deleteTask properly cleans up related timer entries
   - Verify updateTask preserves task relationships
   - Handle edge cases (deleting active timer task, etc.)

## Validation Tasks

6. **Add unit tests for task management commands**
   - Test delete command with confirmation handling
   - Test edit command with input validation
   - Test error handling for invalid task IDs

7. **Add integration tests for sidebar changes**
   - Test sidebar no longer shows timer section
   - Test context menu integration for task management
   - Test task list updates after delete/edit operations

8. **Manual testing**
   - Test sidebar interface without timer logs section
   - Test task deletion with confirmation dialogs
   - Test task editing with input validation
   - Test context menu functionality
   - Verify no regression in existing task features</content>
     <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\refactor-sidebar-task-management\tasks.md
