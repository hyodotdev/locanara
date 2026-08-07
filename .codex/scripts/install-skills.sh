#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
codex_home="${CODEX_HOME:-$HOME/.codex}"
skills_dir="$codex_home/skills"

mkdir -p "$skills_dir"

install_skill() {
  local skill_name="$1"
  local source_path="$repo_root/.codex/skills/$skill_name"
  local target_path="$skills_dir/$skill_name"

  if [[ -e "$target_path" && ! -L "$target_path" ]]; then
    echo "Cannot install $skill_name: $target_path exists and is not a symlink." >&2
    echo "Move or remove that path explicitly, then rerun this script." >&2
    return 1
  fi

  ln -sfn "$source_path" "$target_path"

  if [[ ! -L "$target_path" || "$(readlink "$target_path")" != "$source_path" ]]; then
    echo "Failed to verify installed skill: $skill_name" >&2
    return 1
  fi

  echo "Installed Codex skill: $skill_name"
  echo "Target: $target_path"
}

install_skill "locanara-workflows"
install_skill "locanara-docs"

# Keep review-pr, review-self, and rebase-main repository-local. Their common
# names are intentionally provided by multiple repositories with
# project-specific rules.
