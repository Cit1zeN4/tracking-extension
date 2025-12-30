# Add Kanban Boards

## Summary

Implement kanban board functionality to organize tasks into customizable columns for better task management workflow. Users can create multiple boards, manage columns within each board, and move tasks between columns to track progress visually.

## Motivation

The current task management system provides basic CRUD operations for tasks but lacks visual organization tools. Kanban boards will allow users to categorize tasks by status (e.g., Backlog, In Progress, Done) and provide a more intuitive way to manage work items, especially for teams or complex projects.

## Scope

- Add board creation, editing, and deletion
- Add column management within boards (create, edit, delete with restrictions on "Backlog")
- Modify task association to include board and column placement
- Update UI to display boards and allow drag-and-drop task movement
- Extend data persistence to store board and column structures
- Ensure backward compatibility with existing tasks (default to "Backlog" column)

## Impact

This change extends the task management capabilities without breaking existing functionality. All current features remain available, with kanban boards as an optional enhancement.

## Dependencies

None - this builds on existing task and UI infrastructure.
