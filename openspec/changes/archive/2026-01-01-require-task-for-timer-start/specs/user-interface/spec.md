# User Interface

## MODIFIED Requirements

### Requirement: Timer Start Validation

The system SHALL require task association when starting a timer.

#### Scenario: Timer Start Without Tasks

Given no tasks exist
When user attempts to start timer
Then system displays error message "No tasks available. Create a task first to start tracking time."

#### Scenario: Timer Start With Task Selection

Given tasks exist
When user starts timer
Then system requires task selection before starting timer

#### Scenario: Task Selection Required

Given timer start is initiated
When user is prompted to select task
Then selection is mandatory (cannot be cancelled without selecting)

### Requirement: Error Messaging

The system SHALL provide clear error messages for timer start failures.

#### Scenario: No Tasks Error Display

Given timer start attempted without tasks
When error occurs
Then message guides user to create tasks first

## UNCHANGED Requirements

### Requirement: Status Bar Display

The system SHALL display timer status in the VS Code status bar.

### Requirement: Command Access

The system SHALL provide commands accessible via command palette.

### Requirement: Time Log Viewer

The system SHALL provide a way to view recorded time entries.

### Requirement: Task Selection UI

The system SHALL provide an interface for selecting tasks.
