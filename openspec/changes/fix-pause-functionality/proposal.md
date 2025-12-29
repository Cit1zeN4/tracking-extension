# Proposal: Fix Pause Functionality

## Summary

Fix the pause button functionality so it properly pauses the timer instead of stopping it, and update the status bar to show appropriate controls during paused state.

## Motivation

Currently, the pause button behaves like a stop button and the status bar doesn't properly handle the paused state. Users expect pause to temporarily stop timing while preserving the session, and the UI should reflect this state appropriately.

## Impact

- Corrects timer pause behavior to preserve session state
- Improves status bar UX by showing relevant controls during pause
- Maintains timer continuity when resuming work

## Implementation Approach

- Ensure pause stops timing but keeps currentEntry active
- Update status bar logic to distinguish between stopped and paused states
- Show task name and start/stop buttons when paused
- Hide pause button during pause state

## Dependencies

Builds on existing timer service and status bar implementation.

## Risks

- Minimal risk as this refines existing functionality
- Need to ensure state transitions work correctly
