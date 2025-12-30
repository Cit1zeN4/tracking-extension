# user-interface Specification Delta

## ADDED Requirements

### Requirement: Board Selection UI

The system SHALL provide a board selector in the sidebar to switch between available kanban boards.

#### Scenario: Board Selector Display

Given kanban boards exist
When user opens the sidebar
Then board selector is visible above the tasks section

#### Scenario: Board Switching

Given multiple boards exist
When user selects a different board
Then tasks list updates to show tasks from selected board organized by columns

### Requirement: Column-Based Task Display

The system SHALL display tasks grouped by columns within the selected board.

#### Scenario: Column Organization

Given a board is selected
When tasks are displayed
Then tasks are grouped under their respective columns with column headers

#### Scenario: Backlog Column Default

Given tasks exist without column assignment
When board is displayed
Then tasks default to "Backlog" column

### Requirement: Board Management UI

The system SHALL provide dialogs for creating, editing, and deleting boards.

#### Scenario: Create Board Dialog

Given user initiates board creation
When create board command is executed
Then dialog prompts for board name and description

#### Scenario: Edit Board Dialog

Given a board exists
When user edits board
Then dialog pre-fills current values for modification

#### Scenario: Delete Board Confirmation

Given a board exists
When user deletes board
Then confirmation dialog warns about data loss and requires approval

### Requirement: Column Management UI

The system SHALL provide dialogs for managing columns within boards.

#### Scenario: Add Column Dialog

Given a board is selected
When user adds column
Then dialog prompts for column name with uniqueness validation

#### Scenario: Edit Column Dialog

Given a column exists and is not "Backlog"
When user edits column
Then dialog allows name modification with uniqueness check

#### Scenario: Delete Column Dialog

Given a column exists and is not "Backlog"
When user deletes column
Then confirmation dialog shows affected tasks and requires approval

### Requirement: Task Movement UI

The system SHALL support drag-and-drop and menu-based task movement between columns.

#### Scenario: Drag-and-Drop Movement

Given tasks are displayed in columns
When user drags task to different column
Then task moves to new column and UI updates

#### Scenario: Context Menu Movement

Given task is selected
When user chooses "Move to Column" from context menu
Then column picker shows available columns for selection

### Requirement: Board Context Indicators

The system SHALL visually indicate the current board and column context.

#### Scenario: Active Board Highlighting

Given multiple boards exist
When board is selected
Then selected board is highlighted in selector

#### Scenario: Column Headers

Given board is displayed
When columns are shown
Then each column has clear header with name and task count
