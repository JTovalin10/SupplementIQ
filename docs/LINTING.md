# Linting & Code Quality Setup

This project includes comprehensive linting and code quality tools to maintain high standards and catch issues early.

## 🛠️ Installed Tools

### ESLint
- **Core**: ESLint with Next.js and TypeScript support
- **Plugins**:
  - `@typescript-eslint/eslint-plugin` - TypeScript-specific rules
  - `eslint-plugin-react` - React best practices
  - `eslint-plugin-react-hooks` - React Hooks rules
  - `eslint-plugin-jsx-a11y` - Accessibility rules
  - `eslint-plugin-import` - Import/export rules
  - `eslint-plugin-unused-imports` - Remove unused imports
  - `eslint-plugin-security` - Security-focused rules
  - `eslint-plugin-sonarjs` - Code quality rules
  - `eslint-plugin-promise` - Promise best practices
  - `eslint-plugin-n` - Node.js best practices
  - `eslint-plugin-no-secrets` - Detect potential secrets

### Prettier
- **Core**: Prettier for code formatting
- **Plugins**:
  - `prettier-plugin-tailwindcss` - Tailwind CSS class sorting
  - `@trivago/prettier-plugin-sort-imports` - Import sorting

### Git Hooks
- **Husky**: Git hooks management
- **lint-staged**: Run linters on staged files
- **Commitlint**: Enforce conventional commit messages

### VS Code Integration
- **Settings**: Auto-format on save, ESLint integration
- **Extensions**: Recommended extensions for optimal development experience

## 📜 Available Scripts

```bash
# Linting
npm run lint              # Run ESLint on all files
npm run lint:fix          # Run ESLint with auto-fix
npm run lint:check        # Run ESLint with zero warnings tolerance

# Formatting
npm run format            # Format all files with Prettier
npm run format:check      # Check if files are formatted correctly

# Type Checking
npm run type-check        # Run TypeScript compiler check
npm run type-check:watch  # Run TypeScript check in watch mode

# Comprehensive Checks
npm run check-all         # Run type-check + lint:check + format:check
npm run fix-all           # Run lint:fix + format

# Git Hooks (automatically set up)
npm run prepare           # Set up Husky hooks
```

## 🔧 Configuration Files

### ESLint (`eslint.config.mjs`)
- Extends Next.js and TypeScript configurations
- Custom rules for import ordering, unused variables, and code quality
- Ignores build directories and config files

### Prettier (`.prettierrc`)
- Single quotes, semicolons, 2-space indentation
- 80 character line width
- Tailwind CSS class sorting
- Import sorting with custom order

### Git Hooks
- **Pre-commit**: Runs lint-staged (ESLint + Prettier on staged files)
- **Commit-msg**: Validates commit message format

### VS Code (`.vscode/settings.json`)
- Auto-format on save
- ESLint integration
- TypeScript preferences
- Tailwind CSS support

## 🚀 Usage

### Development Workflow
1. **Automatic**: Files are automatically formatted and linted on save in VS Code
2. **Pre-commit**: Linting runs automatically before commits
3. **Manual**: Use `npm run fix-all` to fix all auto-fixable issues

### Commit Messages
Follow conventional commit format:
```
type(scope): description

feat(auth): add user login functionality
fix(api): resolve data validation error
docs(readme): update installation instructions
```

### Ignoring Files
- **ESLint**: Configured in `eslint.config.mjs` ignores section
- **Prettier**: Configured in `.prettierignore`
- **TypeScript**: Configured in `tsconfig.json` exclude section

## 🎯 Key Rules

### TypeScript
- No unused variables
- No explicit `any` types (warnings)
- No non-null assertions (warnings)
- Proper import/export usage

### React
- React Hooks rules enforced
- No unused React imports
- Proper prop validation (TypeScript)

### Security
- No hardcoded secrets
- Object injection protection
- Non-literal regex warnings

### Code Quality
- Cognitive complexity limits
- No duplicate strings
- Proper promise handling
- Import organization

## 🔍 Troubleshooting

### Common Issues

1. **ESLint errors on build files**: Ensure `.next/` is in ignore patterns
2. **Prettier conflicts**: Run `npm run format` to resolve
3. **TypeScript errors**: Check `tsconfig.json` excludes
4. **Git hooks not working**: Run `npm run prepare`

### VS Code Issues
- Install recommended extensions
- Reload window after installing extensions
- Check ESLint and Prettier are enabled

## 📊 Quality Metrics

The linting setup helps maintain:
- **Consistency**: Uniform code style across the project
- **Reliability**: Catch potential bugs and issues early
- **Security**: Identify potential security vulnerabilities
- **Accessibility**: Ensure proper accessibility practices
- **Performance**: Optimize imports and detect unused code

## 🔄 Continuous Integration

For CI/CD pipelines, use:
```bash
npm run check-all  # Comprehensive quality check
```

This ensures all code meets quality standards before deployment.
