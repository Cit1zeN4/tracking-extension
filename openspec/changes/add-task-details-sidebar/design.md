# Design: Add Task Details in Sidebar

## Architecture Overview

The enhancement extends the existing sidebar tree view to provide richer task information and inline controls. This maintains the current tree structure while adding new capabilities to individual task nodes.

## Key Components

### TaskService Enhancement

- Add `getTotalTimeSpent(taskId: string): number` method
- Calculate sum of all completed time entries for a specific task
- Return total duration in milliseconds for display formatting

### SidebarProvider Modifications

- Extend `TaskItem` class to support rich content
- Add button elements to tree item UI
- Implement command handling for inline actions

### UI State Management

- Button visibility based on current timer state and active task
- Dynamic updates when timer state changes
- Consistent state between sidebar and status bar

## Implementation Details

### Time Calculation Logic

```typescript
getTotalTimeSpent(taskId: string): number {
  return this.timerService
    .getCompletedEntries()
    .filter(entry => entry.taskId === taskId)
    .reduce((total, entry) => total + entry.duration, 0);
}
```

### Button State Logic

- **Start Button**: Show when no timer is running or different task is active
- **Pause Button**: Show when current task is running
- **Stop Button**: Show when current task is running or paused
- **Time Display**: Always show total time spent on task

### Command Integration

- Reuse existing timer commands with task context
- Pass task ID as parameter to start/pause/stop operations
- Maintain compatibility with status bar controls

## UI/UX Considerations

### Visual Hierarchy

- Task name as primary label
- Time spent as secondary information
- Control buttons aligned to the right
- Consistent with VS Code tree item patterns

### Accessibility

- Keyboard navigation support for buttons
- Screen reader friendly labels
- Proper ARIA attributes for interactive elements

### Performance

- Cache time calculations where possible
- Update only affected task items on state changes
- Avoid recalculating all task times on every refresh

## Dependencies and Integration

### Timer Service

- Utilize existing `getCompletedEntries()` method
- Integrate with timer state change events
- Maintain compatibility with current timer operations

### Task Service

- Extend with time calculation capabilities
- Preserve existing task management functionality
- Ensure data consistency across services

### Extension Commands

- Leverage existing command infrastructure
- Add task-specific command variants if needed
- Maintain command palette discoverability</content>
  <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-task-details-sidebar\design.md
