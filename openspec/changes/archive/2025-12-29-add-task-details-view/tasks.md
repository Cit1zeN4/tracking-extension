# Tasks: Add Task Details View

## Implementation Tasks

- [x] **Add task details command**
  - Register new command `tracking-extension.viewTaskDetails`
  - Add command to package.json contributions
  - Implement command handler in extension.ts

- [x] **Create task details webview**
  - Create TaskDetailsProvider class
  - Implement webview panel creation and management
  - Add HTML/CSS/JS for task details display

- [x] **Implement task information display**
  - Show task title, description, creation date, and metadata
  - Display task source and external ID if applicable
  - Format information in readable layout

- [x] **Add task-specific time logs**
  - Filter time entries by task ID
  - Display chronological list of time sessions
  - Show duration, start/end times for each entry

- [x] **Add sidebar context menu integration**
  - Add context menu item for "View Details" on task items
  - Pass selected task ID to details command
  - Update sidebar provider with context menu contributions

- [x] **Add time statistics display**
  - Calculate and display total time spent on task
  - Show session count and average session duration
  - Add time distribution visualization

## Validation Tasks

- [x] **Add unit tests for task details provider**
  - Test webview creation and content generation
  - Test task data formatting and display
  - Test time log filtering and statistics

- [x] **Add integration tests for task details command**
  - Test command registration and execution
  - Test context menu integration
  - Test webview panel lifecycle

- [x] **Manual testing**
  - Test task details view opening from sidebar context menu
  - Verify task information display accuracy
  - Test time log filtering and statistics
  - Test performance with many tasks and entries
  - Test webview panel behavior and styling</content>
    <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-task-details-view\tasks.md
