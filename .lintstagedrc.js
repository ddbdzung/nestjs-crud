const path = require('path')

const buildEslintCommand = (filenames) => {
  const ignoreTrigger = process.env.HUSKY_LINT_STAGED_IGNORE?.toString()
  if (ignoreTrigger === '0') {
    return 'echo "✅ ESLint is disabled via HUSKY_LINT_STAGED_IGNORE"'
  }

  // Run ESLint fix on the staged files
  return `npx eslint ${filenames.join(' ')} --fix --cache`
}

// single Prettier builder that works for _all_ file types
const buildPrettierCommand = (filenames) => {
  const ignoreTrigger = process.env.HUSKY_LINT_STAGED_IGNORE?.toString()
  if (ignoreTrigger === '0') {
    return 'echo "✅ Prettier is disabled via HUSKY_LINT_STAGED_IGNORE"'
  }

  const prettierConfig = path.join(__dirname, '.prettierrc')
  // Quote each filename to protect potential spaces & special chars
  const escaped = filenames.map((f) => `"${f}"`).join(' ')
  return `npx prettier --config ${prettierConfig} --write ${escaped}`
}

// optional: lightweight incremental type-check – comment out if too slow
// const buildTypeCheckCommand = () => {
//   const ignoreTrigger = process.env.HUSKY_LINT_STAGED_IGNORE?.toString()
//   if (ignoreTrigger === '0') {
//     return 'echo "✅ Type-check disabled via HUSKY_LINT_STAGED_IGNORE"'
//   }
//   return 'npm run type-check'
// }

module.exports = {
  // JS / TS first pass: ESLint (--fix & cache) then Prettier
  '*.{js,jsx,ts,tsx}': [buildEslintCommand, buildPrettierCommand],

  // Everything else that Prettier understands
  '*.{json,jsonc,md,markdown,yml,yaml,css,scss,sass,less,html,htm,rc,config}': [
    buildPrettierCommand,
  ],

  // lock-files & manifest files
  '{package.json,package-lock.json,pnpm-lock.yaml,yarn.lock}': [
    buildPrettierCommand,
  ],

  // optional: uncomment next line if you want type-checking during commit
  // '*': [buildTypeCheckCommand],
}
