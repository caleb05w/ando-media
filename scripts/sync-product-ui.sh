#!/usr/bin/env bash
# Re-vendor the Ando product design system CSS into product-ui/.
#
# CSS only, on purpose: app/ando-stage applies the .ando-* classes by hand, so
# the stage renders on the real stylesheet without pulling packages/ui's React
# tree (and its Radix/Base UI dependencies) into this repo.
#
#   ./scripts/sync-product-ui.sh [path-to-ando-checkout]
set -euo pipefail

SRC="${1:-$HOME/Documents/Github/ando}"
DST="$(cd "$(dirname "$0")/.." && pwd)/product-ui"

[ -d "$SRC/packages/ui/src/components" ] || { echo "no ando checkout at $SRC" >&2; exit 1; }

rm -rf "$DST"
mkdir -p "$DST/components"
cp "$SRC/packages/design-tokens/dist/css/ando-tailwind-theme.css" "$DST/ando-tailwind-theme.css"
cp "$SRC/packages/design-tokens/dist/css/ando-theme.css" "$DST/ando-theme.css"
cp "$SRC/packages/ui/src/styles/foundations.css" "$DST/foundations.css"
cp "$SRC/packages/ui/src/styles/motion.css" "$DST/motion.css"

cd "$SRC/packages/ui/src/components"
find . -name "styles.css" | while read -r f; do
  mkdir -p "$DST/components/$(dirname "$f")"
  cp "$f" "$DST/components/$f"
done

SHA="$(cd "$SRC" && git rev-parse --short HEAD)"
{
  echo "/* Ando product design system — CSS only."
  echo " * Vendored from Ando-Corporation/ando @ $SHA:"
  echo " *   packages/design-tokens/dist/css/ando-tailwind-theme.css"
  echo " *   packages/ui/src/styles/{foundations,motion}.css"
  echo " *   packages/ui/src/components/<name>/styles.css"
  echo " *"
  echo " * Same pattern as landing-ui/: the marketing design system is already"
  echo " * copied in, and this is the product one. No JS is vendored — the .ando-*"
  echo " * classes are applied by hand in app/ando-stage, so the stage renders on"
  echo " * the real stylesheet rather than an approximation of it."
  echo " *"
  echo " * The @theme block lives in app/globals.css instead, because Tailwind v4"
  echo " * only generates ando-* utilities from the CSS entry it processes."
  echo " * Regenerate with scripts/sync-product-ui.sh."
  echo " */"
  echo '@import "./ando-theme.css";'
  echo '@import "./foundations.css";'
  echo '@import "./motion.css";'
  cd "$DST/components"
  find . -name "styles.css" | sed 's|^\./||' | sort | while read -r f; do
    echo "@import \"./components/$f\";"
  done
} > "$DST/index.css"

echo "product-ui synced from $SHA ($(find "$DST" -name '*.css' | wc -l | tr -d ' ') files)"
