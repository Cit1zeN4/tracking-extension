# Proposal: Fix Pause Functionality

## Summary

Fix the pause button functionality so it properly pauses the timer instead of stopping it, update the status bar to show appropriate controls during paused state, and ensure elapsed time is correctly preserved during pause.

## Motivation

Currently, the pause button behaves like a stop button, the status bar doesn't properly handle the paused state, and elapsed time continues to increment even when paused. Users expect pause to temporarily stop timing while preserving the session and elapsed time, and the UI should reflect this state appropriately.

## Impact

- Corrects timer pause behavior to preserve session state
- Improves status bar UX by showing relevant controls during pause
- Fixes elapsed time calculation to stop during pause and resume correctly
- Maintains timer continuity when resuming work

## Implementation Approach

- Ensure pause stops timing but keeps currentEntry active
- Update status bar logic to distinguish between stopped and paused states
- Show task name and start/stop buttons when paused
- Hide pause button during pause state
- Fix elapsed time calculation to preserve time during pause

## Dependencies

Builds on existing timer service and status bar implementation.

## Risks

- Minimal risk as this refines existing functionality
- Need to ensure state transitions work correctly
