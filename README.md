# NestJS CRUD Boilerplate

A minimal, production-ready NestJS boilerplate with essential developer tooling.

## Features

- ⚡ **Fast Development** - SWC compiler for instant compilation
- 📝 **Code Quality** - ESLint + Prettier with auto-fix on commit
- 🔍 **Type Safety** - TypeScript with strict mode
- 🪝 **Git Hooks** - Husky + lint-staged + commitlint
- 📊 **Logging** - Winston logger with CLS (request context)
- 🧪 **Testing** - Jest with e2e setup

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

## Configuration Files

### TypeScript Configs
- `tsconfig.json` - Base config for development & type-checking
- `tsconfig.build.json` - Production build config (excludes tests)

### Why SWC?
- **Development**: SWC transpiles TypeScript 20-70x faster than `tsc`
- **Type Safety**: Run `pnpm type-check` for type validation
- **Best of Both**: Fast iteration + type safety when needed

### Linting & Formatting
- ESLint runs on `.ts` files with TypeScript-specific rules
- Prettier handles all formatting consistently
- Pre-commit hooks auto-fix issues before commit

## VS Code Setup

Recommended extensions (see `.vscode/extensions.json`):
- ESLint - Real-time linting
- Prettier - Auto-formatting
- NestJS Snippets - Code shortcuts
- Pretty TypeScript Errors - Better error messages

Settings are pre-configured in `.vscode/settings.json`.

## Environment Variables

Create `.env` file in root:

```env
NODE_ENV=development
PORT=3000
```

## License

MIT License - See LICENSE file

> **Note:** This boilerplate is designed for learning and rapid prototyping. 
> For production apps, consider adding: database setup, authentication, validation, API documentation (Swagger), environment config (ConfigModule), etc.

## Simplified Design Philosophy

This boilerplate intentionally keeps things minimal:
- ❌ No versioning/changelog automation (add when needed)
- ❌ No complex commit rules (flexible for beginners)
- ❌ No monorepo setup (single package)
- ✅ Essential tooling only
- ✅ Easy onboarding for newcomers
- ✅ Production-ready foundation

**Get started in 5 minutes instead of 30.**

---

Built with ❤️ by [Dang Duc B. Dzung (David)](https://github.com/ddbdzung)
