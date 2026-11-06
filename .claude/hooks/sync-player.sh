#!/bin/bash
# PostToolUse hook: copies a file edited in <name>-player/custom-player/ to
# z_samples/<name>/custom-player/. Only the edited file is copied. Does nothing
# for other paths, or for a player whose sample course doesn't exist yet.

root="$(cd "$(dirname "$0")/../.." && pwd)"
file="$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')"
rel="${file#"$root"/}"

[[ "$rel" =~ ^([^/]+)-player/custom-player/(.+)$ ]] || exit 0
name="${BASH_REMATCH[1]}"
subpath="${BASH_REMATCH[2]}"

[ -d "$root/z_samples/$name" ] || exit 0

dest="$root/z_samples/$name/custom-player/$subpath"
if ! { mkdir -p "$(dirname "$dest")" && cp "$file" "$dest"; }; then
  # Exit 2 reports the failure to Claude, so the copies can't drift unnoticed.
  echo "sync-player: could not copy $rel to z_samples/$name/custom-player/" >&2
  exit 2
fi
