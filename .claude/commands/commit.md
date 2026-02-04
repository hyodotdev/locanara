# Commit Skill

Automates commit and PR creation workflow.

## Usage

```text
/commit                    # Commit on current branch
/commit --pr               # New branch + commit + create PR
/commit --pr "PR title"    # Specify PR title
```

## Workflow

### Basic Commit (`/commit`)

1. Check changes with `git status`
2. Analyze changes and compose commit message
3. Run `git add -A && git commit`
4. Run `git push`

### Create PR (`/commit --pr`)

1. Check changes with `git status`
2. Analyze changes for branch name and commit message
3. Create new branch (`feat/`, `fix/`, `docs/`, etc.)
4. Run `git add -A && git commit`
5. Run `git push -u origin <branch>`
6. Run `gh pr create`

## Commit Message Format

```text
<type>: <description>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance
- `ci`: CI/CD changes

**IMPORTANT**: NEVER add Co-Authored-By

## Examples

### Basic Commit

```bash
# Agent executes:
git add -A
git commit -m "feat: add new summarize API"
git push
```

### Create PR

```bash
# Agent executes:
git checkout -b feat/new-summarize-api
git add -A
git commit -m "feat: add new summarize API"
git push -u origin feat/new-summarize-api
gh pr create --title "feat: add new summarize API" --body "..."
```

## Important Notes

- Never commit sensitive files (.env, credentials, etc.)
- Never push directly to main branch (use PR)
- Split large changes into multiple commits
