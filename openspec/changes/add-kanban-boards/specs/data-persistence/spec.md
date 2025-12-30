# data-persistence Specification Delta

## ADDED Requirements

### Requirement: Board Storage

The system SHALL persist kanban boards in the same scope as tasks (global or workspace).

#### Scenario: Board Persistence

Given a board is created
When extension saves data
Then board metadata is stored persistently

#### Scenario: Board Scope Consistency

Given storage scope is set
When boards are stored
Then boards follow the same global/workspace scope as tasks

### Requirement: Column Storage

The system SHALL persist columns associated with their parent boards.

#### Scenario: Column Persistence

Given columns are created for a board
When data is saved
Then column data including position and constraints is stored

#### Scenario: Column Relationship Integrity

Given a board is deleted
When cleanup occurs
Then associated columns are also removed

### Requirement: Task Board Association Storage

The system SHALL store board and column assignments for tasks.

#### Scenario: Task Board Storage

Given task is assigned to board
When task is saved
Then boardId is persisted with task data

#### Scenario: Task Column Storage

Given task is in a column
When task is saved
Then columnId is persisted with task data

### Requirement: Kanban Data Migration

The system SHALL migrate kanban data when storage scope changes.

#### Scenario: Board Migration

Given storage scope changes
When migration runs
Then all boards and columns move to new scope

#### Scenario: Default Board Assignment

Given tasks exist without board assignment
When migration completes
Then tasks are assigned to default board and Backlog column

### Requirement: Kanban Data Integrity

The system SHALL validate kanban data relationships on load.

#### Scenario: Orphaned Task Handling

Given task references non-existent board/column
When data loads
Then task is reassigned to default board Backlog

#### Scenario: Invalid Column References

Given column references invalid board
When validation runs
Then column is removed or corrected
