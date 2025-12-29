# Tasks: Add Task Details in Sidebar

## Implementation Tasks

- [x] **Add time calculation method to TaskService**
  - Create `getTotalTimeSpent(taskId: string): number` method
  - Sum durations from all completed entries for the given task
  - Return total time in milliseconds

- [x] **Extend TaskItem class in sidebar**
  - Add time spent display to task label/description
  - Add inline buttons for start/pause/stop actions
  - Implement button visibility logic based on timer state

- [x] **Implement button action handlers**
  - Add command handlers for task-specific start/pause/stop
  - Update timer service to handle task-specific operations
  - Ensure proper state synchronization between sidebar and status bar

- [x] **Update sidebar refresh logic**
  - Ensure sidebar updates when timer state changes
  - Refresh task items when entries are completed
  - Handle button state changes dynamically

- [x] **Add UI styling and layout**
  - Style inline buttons appropriately
  - Ensure proper spacing and alignment
  - Make buttons accessible and keyboard navigable

## Validation Tasks

- [x] **Add unit tests for time calculation**
  - Test `getTotalTimeSpent` with various scenarios
  - Test edge cases (no entries, single entry, multiple entries)

- [x] **Add integration tests for sidebar**
  - Test button visibility states
  - Test button action functionality
  - Test time display accuracy

- [x] **Manual testing**
  - Test task creation and time tracking flow
  - Verify button states during different timer conditions
  - Test performance with many tasks and entries</content>
    <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-task-details-sidebar\tasks.md
