# Design: Storage Scope Toggle

## Architectural Considerations

### Storage Abstraction

The current TaskService directly uses `context.globalState` for persistence. To support both global and workspace storage, we need to abstract the storage mechanism.

**Options:**

1. Add a storage scope parameter to TaskService constructor
2. Create a StorageAdapter interface with GlobalStorageAdapter and WorkspaceStorageAdapter implementations
3. Use a configuration-driven approach where TaskService reads from settings

**Chosen Approach:** Configuration-driven approach with a StorageScope enum. This keeps the API simple while allowing future extensibility.

### UI Integration

The toggle should be prominently placed above the tasks section in the sidebar. Since the sidebar uses a TreeDataProvider, we'll add a new root-level item for the storage scope selector.

**Design Decisions:**

- Use a dropdown or toggle button in the sidebar header
- Persist the user's choice in workspace settings (so each workspace can have its own preference)
- Update the tasks list immediately when scope changes

### Data Migration

When switching from global to workspace storage, existing global tasks should be copied to workspace storage to avoid data loss. When switching back, workspace tasks should be merged or handled appropriately.

**Migration Strategy:**

- On scope change, if target storage is empty, copy from source storage
- If target has data, prompt user for merge strategy (keep both, replace, etc.)

### Backward Compatibility

Existing installations should continue to work with global storage as default. The new feature should be opt-in.

## Implementation Details

### Storage Scope Types

```typescript
enum StorageScope {
  Global = 'global',
  Workspace = 'workspace',
}
```

### TaskService Changes

- Add `storageScope` parameter to constructor
- Modify `saveTasks()` and `loadTasks()` to use appropriate storage based on scope
- Add method to change storage scope with migration logic

### Sidebar Changes

- Add `StorageScopeItem` as a root-level tree item above TasksSectionItem
- Implement toggle logic with immediate UI refresh
- Use VS Code's configuration API to persist scope preference

### Configuration

Add a new setting: `tracking-extension.storageScope` with values 'global' | 'workspace', defaulting to 'global'.</content>
<parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-storage-scope-toggle\design.md
