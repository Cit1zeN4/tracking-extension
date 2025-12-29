# user-interface Specification Delta

## MODIFIED Requirements

### Requirement: Sidebar Task List

The sidebar SHALL display a list of available tasks with selection capabilities, time spent information, and inline control buttons.

#### Scenario: Task Selection from Sidebar

Given tasks exist and sidebar is open
When the user selects a task from the list
Then the selected task is associated with the current timer session

#### Scenario: Task Time Display

Given tasks exist with completed time entries
When the user views the task list
Then total time spent on each task is displayed

#### Scenario: Task Description Display

Given tasks have descriptions
When the user views the task list
Then task descriptions are shown as tooltips or expanded information

#### Scenario: Task Control Buttons

Given the sidebar is open
When the user views task items
Then appropriate control buttons (start/pause/stop) are displayed based on timer state

## ADDED Requirements

### Requirement: Task-Specific Timer Controls

The system SHALL provide inline timer controls for each task in the sidebar with proper state management.

#### Scenario: Start Task from Sidebar

Given a task is not currently active
When user clicks start button on task item
Then timer starts for that specific task
And UI updates to show pause/stop buttons

#### Scenario: Pause Task from Sidebar

Given a task is currently running
When user clicks pause button on task item
Then timer pauses for that task
And UI updates to show resume/stop buttons

#### Scenario: Stop Task from Sidebar

Given a task is running or paused
When user clicks stop button on task item
Then timer stops and entry is saved
And UI updates to show start button

#### Scenario: Button State Synchronization

Given timer state changes from status bar or commands
When sidebar refreshes
Then task control buttons reflect current timer state accurately

### Requirement: Task Time Tracking Display

The system SHALL display cumulative time spent on each task in the sidebar.

#### Scenario: Time Display Format

Given a task has time entries
When user views task in sidebar
Then total time is displayed in HH:MM:SS or MM:SS format

#### Scenario: Real-time Time Updates

Given a task is currently running
When timer updates
Then time display reflects current session progress

#### Scenario: No Time Display

Given a task has no time entries
When user views task in sidebar
Then time display shows 0:00 or is omitted</content>
<parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-task-details-sidebar\specs\user-interface\spec.md
