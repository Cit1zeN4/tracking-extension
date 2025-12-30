## MODIFIED Requirements

### Requirement: Task Storage

The system SHALL persist user-created tasks in either global or workspace-specific storage based on user configuration.

#### Scenario: Global Task Storage

Given storage scope is set to global
When user creates a task
Then task is saved to global storage and visible across all workspaces

#### Scenario: Workspace Task Storage

Given storage scope is set to workspace
When user creates a task
Then task is saved to workspace storage and only visible in current workspace

## ADDED Requirements

### Requirement: Storage Scope Configuration

The system SHALL allow users to configure whether tasks are stored globally or per-workspace.

#### Scenario: Storage Scope Setting

Given extension is activated
When user accesses settings
Then storage scope option is available with global/workspace choices

### Requirement: Storage Scope Migration

The system SHALL handle migration of tasks when storage scope changes.

#### Scenario: Migrate to Workspace Storage

Given tasks exist in global storage and storage scope changes to workspace
When migration completes
Then tasks are copied to workspace storage and remain accessible

#### Scenario: Migrate to Global Storage

Given tasks exist in workspace storage and storage scope changes to global
When migration completes
Then tasks are copied to global storage and remain accessible

### Requirement: Timer Entry Scope Consistency

The system SHALL store timer entries in the same scope as their associated tasks.

#### Scenario: Scoped Timer Entries

Given a task is stored in workspace scope
When timer entries are created for that task
Then entries are stored in workspace storage

#### Scenario: Scope Change with Active Timers

Given a timer is running for a task
When storage scope changes
Then timer continues running and new entries follow new scope</content>
<parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-storage-scope-toggle\specs\data-persistence\spec.md
