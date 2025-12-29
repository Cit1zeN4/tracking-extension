# Project Context

## Purpose

This project develops a VS Code extension called "tracking-extension" that provides time tracking capabilities for work spent on tasks within the Visual Studio Code environment. The extension aims to help developers track and log time spent on specific tasks, projects, or work items directly from their IDE, improving productivity, project management, and time reporting accuracy.

## Tech Stack

- **Primary Language**: TypeScript
- **Runtime**: Node.js (for extension host and development)
- **Framework**: VS Code Extension API
- **Build Tools**: TypeScript compiler, VS Code Extension Manager
- **Linting**: ESLint with Google configuration profile
- **Formatting**: Prettier for automatic code formatting
- **Testing**: Jest or Mocha for unit tests, VS Code Extension Testing API for integration tests
- **Package Management**: npm

## Project Conventions

### Code Style

- Use TypeScript with strict mode enabled
- Use ESLint with Google configuration profile for consistent code quality
- Use Prettier for automatic code formatting
- Follow VS Code extension development best practices
- Naming conventions: camelCase for variables/functions, PascalCase for classes/interfaces
- File naming: kebab-case for files, PascalCase for class files
- Maximum line length: 120 characters
- Use 2 spaces for indentation (matching VS Code defaults)

### Architecture Patterns

- Follow VS Code extension architecture: activation events, commands, views, settings
- Use the Command pattern for user actions
- Implement proper disposal patterns for resources
- Separate concerns: UI logic, business logic, data persistence
- Use dependency injection where appropriate for testability

### Testing Strategy

- Unit tests for all utility functions and business logic
- Integration tests for extension activation and basic functionality
- Use VS Code's testing framework for extension-specific testing
- Aim for >80% code coverage
- Test both happy path and error scenarios
- Mock external dependencies and VS Code APIs

### Git Workflow

- Use GitHub Flow: main branch for production, feature branches for development
- Branch naming: `feature/`, `bugfix/`, `chore/` prefixes
- Commit messages: Use conventional commits format
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `refactor:` for code restructuring
  - `test:` for testing changes
- Pull requests required for all changes
- Use OpenSpec for managing change proposals and specifications

## Domain Context

This is a developer productivity tool and time tracking extension for VS Code. Key concepts include:

- Extension activation and lifecycle
- VS Code API usage (commands, views, settings, workspace)
- Time tracking mechanics (start/stop/pause timers, task association)
- User experience within the IDE context
- Data persistence for time logs and task information
- Performance considerations for IDE extensions
- Cross-platform compatibility (Windows, macOS, Linux)
- Integration with task/project management systems

## Important Constraints

- Must follow VS Code extension publishing guidelines
- Compatible with VS Code versions supporting the required APIs
- Respect user privacy and data security
- No external network dependencies unless explicitly approved
- Extension must be lightweight and not impact IDE performance

## External Dependencies

- VS Code Extension API (built-in)
- Node.js runtime (provided by VS Code)
- Potential: VS Code's built-in libraries for UI components
