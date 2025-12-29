# Design: Status Bar Timer Controls

## Architecture Overview

The status bar enhancement will extend the existing extension architecture by adding multiple status bar items that interact with the TimerService and TaskService. The design maintains separation of concerns while providing direct UI access to core functionality.

## Status Bar Item Structure

### Task Display Item
- Position: Left alignment, high priority
- Content: Current task name (truncated to 80 chars) + timer status
- Behavior: Click to open task selection or start timer

### Control Buttons
- Start Button: Always visible, enabled when no timer running
- Pause Button: Visible when timer running, disabled when not
- Stop Button: Visible when timer running or paused, disabled when not

## State Management

Status bar items will be updated every second via the existing interval, ensuring real-time reflection of timer state. Button enablement will be managed through VS Code's command enablement context or direct property setting.

## Implementation Details

### Status Bar Item Creation
- Create multiple status bar items in extension activation
- Register disposal in context subscriptions
- Position items appropriately to avoid overlap

### Update Logic
- Extend `updateStatusBar()` function to handle multiple items
- Retrieve current task from TimerService state
- Apply truncation logic for task names
- Set button visibility and enablement based on timer state

### Command Integration
- Reuse existing timer commands (startTimer, pauseTimer, stopTimer)
- Ensure commands work from status bar clicks
- Maintain existing command palette accessibility

## Trade-offs

- **Multiple Items vs Single Composite**: Multiple items provide clearer separation but consume more status bar space
- **Always Visible vs Contextual**: Buttons always visible for discoverability, but disabled when inappropriate
- **Text Truncation**: 80 char limit prevents overflow but may hide task details

## Performance Considerations

- Updates every 1 second (existing pattern)
- Minimal computation per update (string truncation, state checks)
- No additional API calls or heavy operations
