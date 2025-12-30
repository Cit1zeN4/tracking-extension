# Tasks: Add Storage Scope Toggle

1. **Add StorageScope enum and configuration**
   - Define StorageScope enum in shared types
   - Add `tracking-extension.storageScope` setting to package.json with default 'global'
   - Update extension activation to read storage scope setting

2. **Update TaskService for configurable storage**
   - Add storageScope parameter to TaskService constructor
   - Modify saveTasks() and loadTasks() to use globalState or workspaceState based on scope
   - Add method to change storage scope with data migration logic

3. **Implement data migration logic**
   - Add migrateTasks() method to handle copying tasks between storage scopes
   - Handle conflicts when target storage already has data (prompt user or merge)
   - Ensure migration preserves task relationships and timer entries

4. **Add StorageScopeItem to sidebar**
   - Create StorageScopeItem class extending TreeItem
   - Add dropdown or toggle UI for selecting storage scope
   - Position it above TasksSectionItem in the tree hierarchy

5. **Implement scope change handling**
   - Add command for changing storage scope
   - Update sidebar to refresh tasks when scope changes
   - Persist scope preference to workspace configuration

6. **Update timer entries storage**
   - Ensure timer entries follow the same storage scope as tasks
   - Update TimerService to use appropriate storage based on current scope
   - Handle migration of timer entries when scope changes

7. **Add UI feedback and validation**
   - Show loading indicator during scope changes
   - Display confirmation dialogs for migrations that may lose data
   - Add tooltips and help text for the storage scope toggle

8. **Update tests**
   - Add unit tests for TaskService with different storage scopes
   - Add integration tests for scope switching and data migration
   - Update existing tests to work with configurable storage

9. **Update documentation**
   - Add user documentation for storage scope feature
   - Update README with information about workspace-specific tasks
   - Add migration guide for users upgrading to this version</content>
     <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-storage-scope-toggle\tasks.md
