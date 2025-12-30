## ADDED Requirements

### Requirement: Storage Scope Toggle

The system SHALL provide a toggle control in the sidebar above the tasks section to switch between global and workspace storage modes.

#### Scenario: Toggle Display

Given the sidebar is open
When user views the sidebar
Then storage scope toggle is visible above the tasks section

#### Scenario: Scope Selection

Given storage scope toggle is visible
When user selects a different scope
Then storage scope setting is updated and tasks list refreshes

### Requirement: Storage Scope Indicator

The system SHALL visually indicate the current storage scope in the sidebar.

#### Scenario: Scope Display

Given sidebar is open
When storage scope is global
Then toggle shows "Global Tasks" or similar indicator

Given sidebar is open
When storage scope is workspace
Then toggle shows "Workspace Tasks" or similar indicator

### Requirement: Scope Change Feedback

The system SHALL provide feedback when storage scope changes.

#### Scenario: Migration Progress

Given storage scope is changing
When migration is in progress
Then loading indicator is shown and UI is temporarily disabled

#### Scenario: Migration Complete

Given storage scope change completes
When migration finishes
Then tasks list updates to show tasks from new scope
And success notification is displayed

### Requirement: Scope Change Confirmation

The system SHALL confirm scope changes that may result in data migration.

#### Scenario: Confirm Migration

Given changing scope would migrate existing data
When user initiates scope change
Then confirmation dialog explains the migration and asks for approval</content>
<parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-storage-scope-toggle\specs\user-interface\spec.md
