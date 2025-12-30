# task-association Specification

## Purpose

TBD - created by archiving change init-project. Update Purpose after archive.

## Requirements

### Requirement: Task Creation

The system SHALL allow users to create manual tasks for time tracking.

#### Scenario: Create Manual Task

Given user wants to track time for a specific task
When user creates a new task with title and description
Then task is stored and available for association

### Requirement: Task Selection

The system SHALL provide a way to associate running timers with tasks.

#### Scenario: Associate Timer with Task

Given a timer is running
When user selects a task to associate
Then the current time entry is linked to the selected task

### Requirement: Task Management

The system SHALL allow users to view and manage their tasks.

#### Scenario: View Task List

Given user has created tasks
When user views task list
Then all tasks are displayed with their details

### Requirement: Required Task Association

Time tracking SHALL require task association for all timer operations.

#### Scenario: Timer Requires Task

Given user attempts to start a timer
When no tasks exist or no task is selected
Then timer start is prevented with appropriate error message

#### Scenario: Timer With Task

Given tasks exist
When user starts a timer and selects a task
Then timer runs with task association

### Requirement: Board-Based Task Organization

The system SHALL organize tasks within kanban boards and columns.

#### Scenario: Task Board Assignment

Given a board exists
When task is created
Then task can be assigned to specific board

#### Scenario: Task Column Assignment

Given columns exist in board
When task is created or moved
Then task is placed in appropriate column

### Requirement: Default Board and Column

The system SHALL assign new tasks to default board and Backlog column when not specified.

#### Scenario: Automatic Backlog Assignment

Given no board/column specified for new task
When task is created
Then task is placed in default board's Backlog column

#### Scenario: First Board Default

Given no boards exist yet
When first task is created
Then default board is created automatically

### Requirement: Task Movement Between Columns

The system SHALL allow tasks to be moved between columns within a board.

#### Scenario: Column Movement

Given task exists in one column
When user moves task to different column
Then task's columnId is updated

#### Scenario: Cross-Board Movement

Given task exists in one board
When user moves task to different board
Then task's boardId and columnId are updated

### Requirement: Board and Column Constraints

The system SHALL enforce kanban structure rules on task operations.

#### Scenario: Backlog Protection

Given task is in Backlog column
When user attempts invalid operation
Then operation is allowed (Backlog is standard column)

#### Scenario: Column Uniqueness

Given column name already exists in board
When user creates new column
Then creation is rejected with error

### Requirement: Task Association with Kanban Context

The system SHALL maintain task relationships with boards and columns during operations.

#### Scenario: Timer Association with Board Context

Given timer is running for task
When task moves between columns
Then timer continues with updated context

#### Scenario: Task Deletion with Kanban Cleanup

Given task is deleted
When cleanup occurs
Then board/column references are handled appropriately
