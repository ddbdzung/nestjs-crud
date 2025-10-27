# Commit Message Guidelines (Commitlint)

![GitHub stars](https://img.shields.io/github/stars/conventional-changelog/commitlint)
![npm version](https://img.shields.io/npm/v/@commitlint/cli)

## Table of Contents
- [What is Commitlint?](#what-is-commitlint)
- [Why Use It?](#why-use-it)
- [Installation](#installation)
- [Configuration](#configuration)
- [Commit Message Rules](#commit-message-rules)
- [Husky Integration](#husky-integration)
- [Custom Rules](#custom-rules)
- [References](#references)

---

## What is Commitlint?
Commitlint is an automated linter for Git commit messages. It validates that each commit follows the [Conventional Commits](https://www.conventionalcommits.org/) specification (or your custom ruleset) to keep project history clean and predictable.

---

## Why Use It?
- **Consistent commit messages** across the team
- **Automatic CHANGELOG generation** when paired with tools like standard-version or semantic-release
- **Prevent malformed commits** locally and in CI/CD pipelines
- **Enable semantic versioning** for automated releases

---

## Installation
```bash
# Recommended package manager for this repo
pnpm add -D @commitlint/cli @commitlint/config-conventional

# Initialise Husky hooks if you haven’t yet
pnpm dlx husky-init && pnpm install
```
After the script Husky adds a `pre-commit` hook. We’ll add a `commit-msg` hook in the next section.

---

## Configuration
`commitlint.config.cjs` at the project root:
```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'chore', 'ci', 'revert', 'build'
    ]],
    'scope-enum': [2, 'always', [
      'core', 'modules', 'config', 'deps', 'docs', 'ci'
    ]],
    'header-max-length': [2, 'always', 72]
  }
};
```
If you add new scopes, remember to extend the `scope-enum` list to avoid lint errors.

---

## Commit Message Rules
Canonical format:
```text
<type>(<scope>): <subject>

<body>

<footer>
```
1. **type** – nature of the change (required).
2. **scope** – affected part of the codebase (required and must be listed in `scope-enum`).
3. **subject** – concise imperative description, lower-case, no trailing period.
4. **body** – detailed explanation (optional), separated by a blank line.
5. **footer** – metadata such as BREAKING CHANGE or issue references (optional).

### Allowed `type` values
| type     | Description                  |
|----------|-----------------------------|
| feat     | New feature                 |
| fix      | Bug fix                     |
| perf     | Performance improvement     |
| refactor | Code change without feature |
| docs     | Documentation               |
| style    | Formatting, whitespace      |
| test     | Adding or fixing tests      |
| chore    | Build tasks, tooling        |
| ci       | CI/CD configuration         |
| build    | Build system or deps        |
| revert   | Revert previous commit      |

### Allowed `scope` values
| scope   | Description                               |
|---------|-------------------------------------------|
| core    | `src/core` utilities                      |
| modules | Feature modules under `src/modules`       |
| config  | Build or runtime configuration            |
| deps    | Dependency management                     |
| docs    | Documentation files                       |
| ci      | Pipelines / GitHub Actions workflow files |
| dx      | Developers experience changes             |

### Examples
```text
feat(core): add authentication guard

- Implement JwtAuthGuard
- Add unit tests
```
```text
fix(modules): handle null user profile response

Closes #42
```

---

## Husky Integration
Add a commit-msg hook so Commitlint runs automatically:
```bash
npx husky add .husky/commit-msg 'pnpm commitlint --edit $1'
```
Ensure the hook file is executable.

---

## Custom Rules
You can extend or override rules via the `rules` block. Example: allow empty scopes
```js
'rules': {
  'scope-empty': [0]
}
```
Full rule reference: https://commitlint.js.org/#/reference-rules

---

## References
- Conventional Commits – https://www.conventionalcommits.org/
- Commitlint Documentation – https://commitlint.js.org/
- Semantic Release – https://semantic-release.gitbook.io/
