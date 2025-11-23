# NestJS CRUD Boilerplate

A minimal, production-ready NestJS boilerplate with essential developer tooling.

## Quick Start

```bash
# Install dependencies
pnpm install

# Development (fast reload with SWC)
pnpm dev

# Type check
pnpm type-check

# Build for production
pnpm build

# Start production
pnpm start:prod
```

## Project Structure

```
src/
├── core/               # Core utilities (logger, helpers, constants)
│   ├── logger/        # Winston logger with CLS context
│   ├── helpers/       # Response & error helpers
│   └── constants/     # App-wide constants
├── modules/           # Feature modules
├── config/            # Configuration files
└── main.ts           # Application entry point

test/                  # E2E tests
scripts/               # Utility scripts
```

## Development Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start dev server with SWC hot-reload |
| `pnpm build` | Build for production |
| `pnpm type-check` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format code with Prettier |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run e2e tests |

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) with simplified rules:

### Format
```
<type>: <subject>
<type>(scope): <subject>
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting (no logic change)
- `refactor` - Code refactoring
- `test` - Test changes
- `chore` - Build, tooling, dependencies

### Examples
```bash
git commit -m "feat: add user authentication"
git commit -m "fix(logger): handle null context"
git commit -m "docs: update README"
```

**Helper:** Use `pnpm commit` for interactive commit wizard (commitizen).
