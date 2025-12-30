# Add Storage Scope Toggle

## Summary

Add the ability to switch between global storage and workspace-specific storage for tasks. This allows users to create tasks that are either shared across all workspaces or specific to the current workspace only.

## Motivation

Currently, all tasks are stored globally, meaning they appear in all VS Code workspaces. Users need the flexibility to have workspace-specific tasks that are only visible and manageable within that particular workspace, improving organization and reducing clutter.

## Scope

- Add a toggle control in the sidebar above the tasks section
- Modify data persistence to support both global and workspace storage modes
- Ensure seamless switching between storage scopes
- Maintain backward compatibility with existing global tasks

## Impact

- Affects data-persistence and user-interface capabilities
- No breaking changes to existing functionality
- New setting to persist user's storage scope preference

## Implementation Approach

- Add a storage scope setting (global/workspace)
- Update TaskService to use appropriate storage based on setting
- Add toggle UI in sidebar above tasks
- Handle migration of existing tasks when switching scopes</content>
  <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-storage-scope-toggle\proposal.md
