# Proposal: Add Status Bar Timer Controls

## Summary

Enhance the VS Code status bar to display the current task name being tracked (limited to 80 characters) and provide interactive buttons for timer control (start, pause, stop). The pause and stop buttons should be disabled when no timer is active.

## Motivation

Currently, the status bar only shows basic timer information. Users need quick access to timer controls and visibility of the active task directly from the status bar without opening the sidebar or command palette.

## Impact

- Improves user experience by providing always-visible timer controls
- Shows current task context in status bar
- Maintains consistency with VS Code's status bar conventions

## Implementation Approach

- Modify status bar items to include task name display
- Add separate status bar items for start, pause, and stop buttons
- Implement button state management based on timer state
- Ensure task name truncation to 80 characters

## Dependencies

None - this builds on existing timer and task services.

## Risks

- Status bar clutter if not implemented carefully
- Potential performance impact from frequent updates (mitigated by existing 1-second interval)
