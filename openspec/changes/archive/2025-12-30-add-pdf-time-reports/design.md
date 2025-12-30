# PDF Time Reports Design

## Architecture Overview

The PDF report generation will be implemented as a new command that:

1. Prompts user to select a board
2. Allows date range selection (all time or custom period)
3. Queries time tracking data for the selected board and period
4. Generates PDF document with structured layout
5. Saves PDF to user-selected location

## Key Components

### PDF Generation Service

- New `PdfReportService` class handling PDF creation
- Uses a PDF library (pdfkit recommended for Node.js compatibility)
- Handles text formatting, tables, and layout
- Manages memory efficiently for large reports

### Report Data Structure

- Board metadata (name, description, date range)
- Column-based task grouping
- Task details with descriptions and time summaries
- Individual time entries with timestamps
- Total time calculations

### UI Integration

- New command: "Generate PDF Report"
- Available in command palette and board context menu
- Progress indication during PDF generation
- File save dialog for output location

## Data Flow

1. User selects board and date range
2. System queries tasks, time entries, and column data
3. Data is organized by columns and sorted by time spent
4. PDF document is generated with:
   - Header with board info and date range
   - Summary section with total time
   - Column sections with task lists
   - Detailed time entries per task
5. PDF is saved to user-specified location

## Technical Considerations

### PDF Library Selection

- **pdfkit**: Mature, lightweight, good for structured documents
- **puppeteer**: Better for complex layouts but heavier dependency
- **jsPDF**: Alternative option, good for simple reports

### Performance

- Stream PDF generation for large reports
- Implement progress callbacks for user feedback
- Handle memory efficiently with large datasets

### Error Handling

- Validate board selection and data availability
- Handle PDF generation failures gracefully
- Provide clear error messages for missing dependencies

### File Management

- Default filename: `{board-name}-time-report-{date}.pdf`
- Allow user to choose save location
- Handle file overwrite confirmations

## Dependencies

### External Libraries

- PDF generation library (to be determined)
- Date manipulation utilities (existing)

### Internal Dependencies

- `BoardService` for board data
- `TaskService` for task and time entry data
- `ColumnService` for column information
- Existing UI command infrastructure

## Future Extensions

This design allows for future enhancements:

- Multiple board reports
- Custom report templates
- Email integration
- Scheduled report generation
- Advanced filtering options</content>
  <parameter name="filePath">d:\Proj\tracking-extension\openspec\changes\add-pdf-time-reports\design.md
