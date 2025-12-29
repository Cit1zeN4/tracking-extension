# Proposal: Add Task Details in Sidebar

## Summary

Enhance the sidebar panel to display detailed task information including description, total time spent, and interactive controls (start/pause/stop buttons) for each task. This improves task management UX by providing quick access to task details and timer controls directly from the task list.

## Motivation

Currently, the sidebar shows a basic task list without any time information or control buttons. Users need to navigate to status bar or command palette to start/pause/stop timers for specific tasks. This creates friction in the workflow. By adding task details with time spent and inline controls, users can:

- Quickly see how much time has been spent on each task
- Start timers directly from the task list
- See task descriptions without opening separate dialogs
- Have pause/stop controls visible when tasks are active

## Impact

- Improves task management UX with inline controls and time tracking visibility
- Reduces navigation between sidebar and status bar for timer operations
- Provides better task overview with descriptions and time spent
- Maintains existing functionality while adding new capabilities

## Implementation Approach

- Extend TaskItem in sidebar to show time spent and control buttons
- Add method to calculate total time spent per task from completed entries
- Implement inline button actions for start/pause/stop operations
- Update UI to show different button states based on timer status
- Preserve existing tree structure while enhancing individual task items

## Dependencies

Builds on existing timer service, task service, and sidebar provider implementations.

## Risks

- Minimal risk as this enhances existing UI without changing core functionality
- Need to ensure button states update correctly when timer state changes
- Performance consideration for calculating time spent across many entries</content>
  <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-task-details-sidebar\proposal.md
