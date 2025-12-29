# Tasks: Add Status Bar Timer Controls

1. **Create multiple status bar items in extension.ts**
   - Add status bar items for task display, start, pause, and stop buttons
   - Register all items in context subscriptions
   - Position items appropriately in status bar

2. **Implement task name display logic**
   - Modify updateStatusBar to show current task name
   - Add string truncation to 80 characters
   - Handle cases where no task is selected

3. **Add timer control buttons**
   - Create separate status bar items for start, pause, stop
   - Assign appropriate commands to each button
   - Set initial visibility and enablement states

4. **Implement button state management**
   - Update button enablement based on timer state
   - Show/hide buttons appropriately (pause/stop disabled when no timer)
   - Ensure visual feedback for disabled states

5. **Update status bar update function**
   - Extend updateStatusBar to handle multiple items
   - Optimize update logic to avoid redundant operations
   - Test update frequency and performance

6. **Add unit tests for status bar logic**
   - Test task name truncation
   - Test button state transitions
   - Mock timer service states

7. **Integration testing**
   - Test end-to-end status bar interaction
   - Verify commands execute from status bar clicks
   - Test persistence across VS Code restarts

8. **Update user documentation**
   - Document new status bar functionality
   - Update README with status bar features
   - Add screenshots if applicable
