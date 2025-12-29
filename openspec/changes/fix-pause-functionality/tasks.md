# Tasks: Fix Pause Functionality

1. **Analyze current pause behavior**
   - Verify pauseTimer() maintains currentEntry
   - Check status bar logic for paused vs stopped states
   - Test current pause/resume functionality

2. **Update status bar logic for paused state**
   - Modify updateStatusBar() to detect paused state (!isRunning && currentEntry)
   - Show task name without time when paused
   - Display start and stop buttons when paused
   - Hide pause button when paused

3. **Ensure timer state preservation**
   - Verify pause maintains currentEntry and elapsed time
   - Test resume functionality from paused state
   - Confirm stop clears currentEntry properly

4. **Update status bar display text**
   - Show task name only (no time) when paused
   - Update tooltips for paused state
   - Ensure proper text for all three states

5. **Add tests for paused state**
   - Test status bar display during pause
   - Verify button visibility in paused state
   - Test resume from paused state

6. **Update documentation**
   - Update README with pause behavior description
   - Ensure user expectations are clear

7. **Integration testing**
   - Test full pause/resume workflow
   - Verify status bar updates correctly
   - Test edge cases (pause when no timer, etc.)
