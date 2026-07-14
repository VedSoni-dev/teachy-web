#!/bin/bash
set -euo pipefail

# publish-academy.sh — Deploy academy/ to the gh-pages branch (no GitHub Actions).
# Site: https://vedsoni-dev.github.io/teachy/

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_BRANCH="$(git -C "$ROOT" branch --show-current)"
STAGING="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGING"
}
trap cleanup EXIT

echo "📦 Staging academy/ → temporary tree…"
cp -R "$ROOT/academy/." "$STAGING/"
touch "$STAGING/.nojekyll"

export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-Vedant Soni}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-176514956+VedSoni-dev@users.noreply.github.com}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-$GIT_AUTHOR_NAME}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-$GIT_AUTHOR_EMAIL}"

echo "🚀 Publishing to origin/gh-pages…"
git -C "$ROOT" fetch origin gh-pages 2>/dev/null || true

(
  cd "$STAGING"
  git init -q
  git checkout -q -b gh-pages
  git add -A
  git commit -qm "Deploy Teachy Academy site"
  git remote add origin "https://github.com/VedSoni-dev/teachy.git"
  git push -f origin gh-pages
)

echo "✅ Live: https://vedsoni-dev.github.io/teachy/"
echo "   (source branch unchanged: ${SOURCE_BRANCH})"
