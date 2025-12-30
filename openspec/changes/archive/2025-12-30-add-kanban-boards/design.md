# Kanban Boards Design

## Architecture Overview

Kanban boards extend the existing task management system by introducing hierarchical organization: Boards > Columns > Tasks. This maintains backward compatibility while adding visual workflow management.

## Data Model Extensions

### Board Entity

- `id`: unique identifier
- `name`: user-defined board name
- `description`: optional board description
- `columns`: array of column IDs in display order
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Column Entity

- `id`: unique identifier
- `boardId`: parent board reference
- `name`: column name (unique within board)
- `isDefault`: boolean (true for "Backlog")
- `position`: display order within board
- `createdAt`: timestamp

### Task Entity Extensions

- `boardId`: associated board (optional, defaults to first board or global)
- `columnId`: current column (defaults to "Backlog" column)

## Storage Strategy

Boards and columns follow the same storage scope as tasks (global vs workspace). When storage scope changes, all kanban data migrates accordingly.

## UI Integration

### Sidebar Enhancement

- Add board selector above task list
- Display tasks grouped by columns within selected board
- Provide board/column management options

### Task Movement

- Drag-and-drop between columns
- Context menu options for quick moves
- Visual feedback during operations

## Backward Compatibility

- Existing tasks without board/column assignment default to first available board's "Backlog" column
- All existing UI and commands continue to work
- Migration handles assignment of orphaned tasks

## Performance Considerations

- Lazy load board data on demand
- Cache column structures in memory
- Batch updates for drag-and-drop operations

## Error Handling

- Prevent deletion of boards/columns with active tasks
- Validate column name uniqueness within boards
- Graceful fallback if board data is corrupted
