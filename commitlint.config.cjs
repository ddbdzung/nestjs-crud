module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Simplified rules - more flexible for newbies
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
    'scope-empty': [0], // Allow commits without scope
    'subject-case': [0], // Allow any case
    'header-max-length': [1, 'always', 100], // Warning only, increased limit
  },
}
