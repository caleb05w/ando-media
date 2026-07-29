#!/usr/bin/env bash
# Vercel Ignored Build Step (wired up via "ignoreCommand" in vercel.json).
# Exit 1 → proceed with the build. Exit 0 → skip it.

# Production (pushes to main) always builds.
if [ "$VERCEL_ENV" = "production" ]; then
  exit 1
fi

# Previews are opt-in: only branches named preview/<anything> get a build.
case "$VERCEL_GIT_COMMIT_REF" in
  preview/*)
    exit 1
    ;;
  *)
    echo "Skipping: '$VERCEL_GIT_COMMIT_REF' has no preview/ prefix."
    exit 0
    ;;
esac
