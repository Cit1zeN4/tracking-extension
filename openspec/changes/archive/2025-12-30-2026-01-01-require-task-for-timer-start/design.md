# Design Document: Require Task Association for Timer Start

## Overview

This design document outlines the changes required to enforce task association when starting timers in the time tracking VS Code extension.

## Current Behavior

Currently, the `startTimerCommand` allows users to start timers optionally associated with tasks:

1. User invokes timer start command
2. System shows task selection UI with "Select a task (optional)" placeholder
3. If no tasks exist, selection returns `undefined`
4. Timer starts regardless of task selection

## Proposed Changes

### Timer Start Flow

The new flow will enforce task selection:

```text
┌─────────────────┐
│ Start Timer     │
│ Command         │
└───────┬─────────┘
        │
        v
┌─────────────────┐    No Tasks
│ Check Tasks     │─────────────┐
│ Exist           │             │
└───────┬─────────┘             │
        │                       │
        v                       v
┌─────────────────┐    ┌─────────────────┐
│ Show Task       │    │ Show Error:     │
│ Selection UI    │    │ "Create a task  │
│ (Required)      │    │ first"          │
└───────┬─────────┘    └─────────────────┘
        │
        v
┌─────────────────┐    No Selection
│ User Selects    │─────────────┐
│ Task            │             │
└───────┬─────────┘             │
        │                       │
        v                       v
┌─────────────────┐    ┌─────────────────┐
│ Start Timer     │    │ Cancel Timer   │
│ with Task       │    │ Start          │
└─────────────────┘    └─────────────────┘
```

### Code Changes

#### 1. Timer Commands (`src/commands/timerCommands.ts`)

- Modify `selectTask` function to return `Task` instead of `Task | undefined`
- Update `startTimerCommand` to handle the case when no tasks exist
- Change placeholder text from "Select a task (optional)" to "Select a task"

#### 2. Timer Service (`src/timerService.ts`)

- Update `startTimer` method signature to require `taskId: string` parameter
- Remove optional task association logic

#### 3. Error Handling

- Add user-friendly error messages when no tasks exist
- Provide guidance on creating tasks

### UI/UX Considerations

- Clear error messaging when attempting to start timer without tasks
- Consistent behavior across all timer start entry points
- Maintain existing pause/resume functionality (no task association required)

### Backward Compatibility

- Existing time entries without tasks remain valid
- No migration required for stored data
- Only affects new timer starts

## Testing Strategy

- Unit tests for modified command functions
- Integration tests for timer start flow
- UI tests for error message display
- Regression tests for existing functionality
