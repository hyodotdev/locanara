# /resolve-issue

Inspect or resolve a GitHub issue with evidence from the current default branch.

## Usage

```text
/resolve-issue 14
/resolve-issue https://github.com/hyodotdev/locanara/issues/14
```

## Workflow

1. Fetch the issue body, comments, labels, state, linked PRs, and repository
   default branch.
2. Update the local checkout only with a safe fast-forward that preserves
   existing work, or inspect the current default-branch files remotely.
3. Turn the issue body into an explicit acceptance matrix.
4. Verify every row against implementation, tests, docs, examples, and history.
5. Classify the outcome:
   - `completed`: every substantive criterion exists and is verified.
   - `not planned`: maintainers deliberately reject or supersede the scope.
   - `duplicate`: another issue owns the same outcome; link it and follow the
     repository's labeling convention.
   - `open`: at least one substantive criterion remains.
6. If implementation was requested, make the smallest scoped change and run the
   affected verification matrix.
7. Before closing, post a concise evidence comment with files/tests or the
   superseding issue. GitHub close reasons are `completed` and `not planned`;
   use only the one supported by the verified disposition.

## Rules

- Age, inactivity, a merged PR, or a `Closes #N` commit message is not proof.
- Do not dilute acceptance criteria merely because partial documentation exists.
- Verify code examples against public signatures; compile them where practical.
- Do not comment or mutate issue state for an inspection-only request unless the
  user explicitly authorized the GitHub action.
- Never close when correctness work remains. Report the smallest remaining scope.

## Report

Return the disposition, acceptance matrix, exact evidence, commands run, and any
external mutation performed.
