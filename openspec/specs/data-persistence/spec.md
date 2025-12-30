# data-persistence Specification

## Purpose

TBD - created by archiving change init-project. Update Purpose after archive.
## Requirements
### Requirement: Time Entry Storage

The system SHALL persist time entries across VS Code sessions.

#### Scenario: Save Time Entry

Given a time entry is completed
When timer is stopped
Then time entry is saved to persistent storage

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

### Requirement: Data Retrieval

The system SHALL load persisted data on startup.

#### Scenario: Load Data on Activation

Given persisted data exists
When extension activates
Then time entries and tasks are loaded from storage

### Requirement: Data Integrity

The system SHALL handle storage errors gracefully.

#### Scenario: Storage Failure

Given storage operation fails
When saving or loading data
Then user is notified and operation continues with fallback behavior

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

