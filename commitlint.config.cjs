module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'chore', 'ci', 'revert', 'build'
    ]],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    'scope-enum': [2, 'always', [
      'core', 'modules', 'config', 'deps', 'docs', 'ci', 'dx'
    ]],

    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],

    'header-max-length': [2, 'always', 72],

    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100]
  }
};
