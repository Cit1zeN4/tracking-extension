# user-interface Specification Delta

## MODIFIED Requirements

### Requirement: Status Bar Display

The system SHALL display timer status and current task name in the VS Code status bar, with task name limited to 80 characters.

#### Scenario: Timer Status Display

Given a timer is running
When user views status bar
Then current timer state, elapsed time, and associated task name (truncated to 80 chars) are shown

#### Scenario: Task Name Display

Given a timer is running with an associated task
When the task name exceeds 80 characters
Then the name is truncated with ellipsis and shows within status bar limits

#### Scenario: No Task Display

Given a timer is running without an associated task
When user views status bar
Then timer status shows without task name

## ADDED Requirements

### Requirement: Status Bar Timer Controls

The system SHALL provide interactive buttons in the status bar for timer operations (start, pause, stop).

#### Scenario: Start Button Availability

Given no timer is currently running
When user views status bar
Then start button is visible and enabled

#### Scenario: Pause Button State

Given a timer is running
When user views status bar
Then pause button is visible and enabled

Given no timer is running
When user views status bar
Then pause button is visible but disabled

#### Scenario: Stop Button State

Given a timer is running or paused
When user views status bar
Then stop button is visible and enabled

Given no timer is running
When user views status bar
Then stop button is visible but disabled

#### Scenario: Button Interaction

Given status bar control buttons are visible
When user clicks a button
Then the corresponding timer command is executed
And UI updates to reflect new timer state
