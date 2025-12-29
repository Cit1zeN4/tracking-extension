# Design: Fix Pause Functionality

## Architecture Overview

The pause functionality fix refines the timer state management and status bar display logic to properly handle the paused state as distinct from stopped state.

## Timer State Management

### Current Issue

- Pause currently sets `isRunning = false` but doesn't distinguish from stopped state
- Status bar treats all non-running states the same

### Solution

- Maintain `currentEntry` when paused (vs null when stopped)
- Add logic to detect paused state: `!isRunning && currentEntry exists`
- Ensure pause/resume preserves elapsed time correctly

## Status Bar State Logic

### State Detection

```typescript
if (state.isRunning) {
  // Running: show task + time, pause/stop buttons
} else if (state.currentEntry) {
  // Paused: show task name, start/stop buttons
} else {
  // Stopped: show "Start Timer", no buttons
}
```

### Button Visibility

- **Running**: Show pause + stop, hide start
- **Paused**: Show start + stop, hide pause
- **Stopped**: Hide all buttons

## Implementation Details

### TimerService Changes

- Ensure `pauseTimer()` maintains `currentEntry`
- Ensure `startTimer()` can resume from paused state
- Preserve elapsed time across pause/resume

### Status Bar Updates

- Extend `updateStatusBar()` with three-state logic
- Update button visibility based on precise state
- Show appropriate text and tooltips for each state

## Trade-offs

- **State Complexity**: Three states (stopped/paused/running) vs two
- **UI Clarity**: More specific controls vs simpler interface
- **User Expectations**: Matches standard timer behavior

## Performance Considerations

- No additional performance impact
- Same update frequency (1 second)
- Minimal additional logic per update
