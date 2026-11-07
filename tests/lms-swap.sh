#!/bin/bash
# Puts one player into every LMS sample package in z_scorm_samples/
# (SCORM 1.2, SCORM 2004, cmi5), replacing whichever player was there before.
#
#   tests/lms-swap.sh <name>            e.g. tests/lms-swap.sh arcade
#   tests/lms-swap.sh <name> --zip DIR  also write an LMS-ready zip per package
#
# For each package it:
#   - replaces custom-player/ with <name>-player/custom-player/ (no .md files)
#   - adds the two player lines to index_lms.html (the page the LMS runs) and
#     story.html, once
#   - lists the player files in imsmanifest.xml (SCORM only), once
# The packages stay one copy each: running it again swaps the player in place.

set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
name="${1:-}"
zipdir=""
[ "${2:-}" = "--zip" ] && zipdir="${3:?--zip needs a folder}"

src="$root/$name-player/custom-player"
if [ -z "$name" ] || [ ! -d "$src" ]; then
  echo "usage: tests/lms-swap.sh <name> [--zip DIR]   (players: $(cd "$root" && ls -d *-player | sed 's/-player//' | tr '\n' ' '))" >&2
  exit 1
fi

shopt -s nullglob
pkgs=("$root"/z_scorm_samples/*/)
[ ${#pkgs[@]} -gt 0 ] || { echo "no packages in z_scorm_samples/" >&2; exit 1; }

for pkg in "${pkgs[@]}"; do
  pkg="${pkg%/}"
  rm -rf "$pkg/custom-player"
  rsync -a --exclude '*.md' --exclude '.DS_Store' "$src/" "$pkg/custom-player/"

  python3 -I - "$pkg" <<'PY'
import os, re, sys
pkg = sys.argv[1]
css = '<link rel="stylesheet" href="custom-player/player.css"/>'
js = '<script src="custom-player/player.js"></script>'

for page in ("index_lms.html", "story.html"):
    p = os.path.join(pkg, page)
    if not os.path.exists(p):
        continue
    s = open(p, encoding="utf-8-sig").read()
    if css not in s:
        s, n = re.subn(r'(<link rel="stylesheet" href="html5/data/css/output\.min\.css"[^>]*>)', r'\1\n  ' + css, s, count=1)
        if not n: sys.exit(f"{p}: output.min.css link not found")
    if js not in s:
        s, n = re.subn(r'(<script src="html5/lib/scripts/bootstrapper\.min\.js"></script>)', r'\1\n' + js, s, count=1)
        if not n: sys.exit(f"{p}: bootstrapper script not found")
    open(p, "w", encoding="utf-8").write(s)

m = os.path.join(pkg, "imsmanifest.xml")
if os.path.exists(m):
    s = open(m, encoding="utf-8-sig").read()
    s = re.sub(r'\n\s*<file href="custom-player/[^"]*" />', "", s)  # drop the last player's files
    files = sorted(os.path.relpath(os.path.join(d, f), pkg).replace(os.sep, "/")
                   for d, _, fs in os.walk(os.path.join(pkg, "custom-player")) for f in fs)
    entry = re.search(r'(\n(\s*)<file href="index_lms\.html" />)', s)
    if not entry: sys.exit(f"{m}: index_lms.html file entry not found")
    add = "".join(f'\n{entry.group(2)}<file href="{f}" />' for f in files)
    s = s[:entry.end()] + add + s[entry.end():]
    open(m, "w", encoding="utf-8").write(s)
PY

  echo "$name -> $(basename "$pkg")"

  if [ -n "$zipdir" ]; then
    mkdir -p "$zipdir"
    out="$(cd "$zipdir" && pwd)/$(basename "$pkg") - $name.zip"
    rm -f "$out"
    (cd "$pkg" && zip -qr -X "$out" . -x '.DS_Store' '*/.DS_Store')
    echo "   zip: $out"
  fi
done

echo "$name" > "$root/z_scorm_samples/.current-player"
