# Design Document: Initialize Project

## Overview

This design document outlines the architectural decisions and technical approach **Rationale**: Minimal UI footprint, leverages familiar VS Code patterns, accessible via keyboard.

## Integration Patterns

### VS Code API Usage

- `vscode.commands.registerCommand` for user actions
- `vscode.window.createStatusBarItem` for timer display
- `vscode.workspace.onDidChangeConfiguration` for settings
- `vscode.extensions.getExtension` for self-reference

### Error Handling

- Graceful degradation when storage fails
- User notifications for errors
- Logging to VS Code output channel

### Performance Considerations

- Lazy loading of non-essential components
- Debounced UI updates during rapid state changes
- Efficient data structures for large time logse time tracking VS Code extension. It covers the core systems, data flow, and integration patterns that will form the foundation of the extension.

## Architecture Overview

The extension follows a layered architecture with clear separation of concerns:

```text
┌─────────────────┐
│   UI Layer      │  (Commands, Status Bar, Views)
├─────────────────┤
│ Business Logic  │  (Timer Service, Task Management)
├─────────────────┤
│   Data Layer    │  (Persistence, Models)
├─────────────────┤
│ VS Code APIs    │  (Extension Host, Workspace)
└─────────────────┘
```

## Core Components

### 1. Extension Activation System

**Purpose**: Manage the extension lifecycle and register core services.

**Design Decisions**:

- Use `onStartupFinished` activation event for immediate availability
- Implement proper disposal patterns for all resources
- Register commands and views during activation
- Use dependency injection container for service management

**Rationale**: Ensures extension is ready when VS Code starts, prevents resource leaks, and maintains testability.

### 2. Time Tracking Service

**Purpose**: Core timer functionality with start/stop/pause operations.

**Design Decisions**:

- Singleton service instance per workspace
- Event-driven state updates
- Immutable time entry objects
- Background timer using Node.js timers

**Data Model**:

```typescript
interface TimeEntry {
  id: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in milliseconds
  description?: string;
}

interface TimerState {
  isRunning: boolean;
  currentEntry?: TimeEntry;
  elapsedTime: number;
}
```

**Rationale**: Single source of truth for timer state, immutable data prevents bugs, event-driven for UI updates.

### 3. Task Association System

**Purpose**: Link time tracking to specific work items or tasks.

**Design Decisions**:

- Flexible task model supporting multiple sources (manual, external systems)
- Task selection UI integrated with VS Code quick pick
- Optional task association (timers can run without tasks)

**Data Model**:

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  source: 'manual' | 'external';
  externalId?: string;
  createdAt: Date;
}
```

**Rationale**: Supports both simple manual task creation and integration with external systems like Jira, GitHub Issues.

### 4. Data Persistence Layer

**Purpose**: Store time entries and tasks across VS Code sessions.

**Design Decisions**:

- Use VS Code's workspace/global state for storage
- JSON serialization with schema versioning
- Automatic migration for data format changes
- Backup and recovery mechanisms

**Storage Strategy**:

- Time entries: Workspace-scoped (per project)
- Tasks: Global-scoped (shared across workspaces)
- Settings: VS Code configuration

**Rationale**: Leverages VS Code's built-in storage, ensures data portability, handles schema evolution.

### 5. User Interface Components

**Purpose**: Provide user interaction points within VS Code.

**Design Decisions**:

- Status bar integration for timer visibility
- Command palette integration for actions
- Tree view for time logs and task management
- Consistent with VS Code design language

**UI Components**:

- Status bar item showing current timer state
- Commands: Start Timer, Stop Timer, Pause Timer, View Logs
- Tree data provider for time entries and tasks

**Rationale**: Minimal UI footprint, leverages familiar VS Code patterns, accessible via keyboard.

## Data Flow

1. **Timer Start**: User command → Timer Service → Create TimeEntry → UI Update
2. **Task Association**: User selects task → Timer Service updates current entry → Persistence
3. **Timer Stop**: Timer Service → Calculate duration → Save TimeEntry → Reset state
4. **Data Persistence**: On state change → Serialize → VS Code storage API

## Integration Patterns

### VS Code API Usage

- `vscode.commands.registerCommand` for user actions
- `vscode.window.createStatusBarItem` for timer display
- `vscode.workspace.onDidChangeConfiguration` for settings
- `vscode.extensions.getExtension` for self-reference

### Error Handling

- Graceful degradation when storage fails
- User notifications for errors
- Logging to VS Code output channel

### Performance Considerations

- Lazy loading of non-essential components
- Debounced UI updates during rapid state changes
- Efficient data structures for large time logs

## Security and Privacy

- No external network communication without explicit user consent
- Local-only data storage
- No telemetry collection
- Clear data ownership (user's data stays local)

## Testing Strategy

- Unit tests for business logic (TimerService, data models)
- Integration tests for VS Code API interactions
- UI tests for command and view functionality
- Mock VS Code APIs for isolated testing

## Future Extensibility

- Plugin architecture for external task sources
- Custom reporting and export formats
- Integration with time tracking services (Toggl, Harvest)
- Advanced analytics and productivity insights

## Trade-offs and Alternatives Considered

### Storage Options

- **Chosen**: VS Code workspace state (simple, integrated)
- **Alternative**: File-based storage (more control, but complex permissions)
- **Rationale**: Simplicity and VS Code integration outweighs flexibility needs

### Timer Implementation

- **Chosen**: Background Node.js timer
- **Alternative**: Polling-based (simpler but less accurate)
- **Rationale**: Accuracy and resource efficiency for long-running timers

### UI Framework

- **Chosen**: Native VS Code UI components
- **Alternative**: Webview-based custom UI (more flexible but heavier)
- **Rationale**: Consistency with VS Code, better performance, easier maintenance
