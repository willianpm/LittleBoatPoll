module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'test', 'refactor', 'perf', 'ci', 'chore', 'style']],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-empty': [1, 'never'],
    'subject-empty': [2, 'never'],
    'subject-case': [0],
    'header-max-length': [2, 'always', 72],
  },
};
