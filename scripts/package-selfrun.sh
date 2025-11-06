#!/bin/bash

set -euo pipefail

# Determine repository root based on this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_NAME="$(basename "$REPO_ROOT")"

# Resolve output path. Default to repo root.
OUTPUT_RELATIVE="${1:-verno-platform.run}"
if [[ "$OUTPUT_RELATIVE" = /* ]]; then
  OUTPUT_PATH="$OUTPUT_RELATIVE"
else
  OUTPUT_PATH="$REPO_ROOT/$OUTPUT_RELATIVE"
fi
OUTPUT_DIR="$(dirname "$OUTPUT_PATH")"
OUTPUT_BASENAME="$(basename "$OUTPUT_PATH")"
mkdir -p "$OUTPUT_DIR"

WORK_DIR="$(mktemp -d)"
ARCHIVE_PATH="$WORK_DIR/${PROJECT_NAME}.tar.gz"
trap 'rm -rf "$WORK_DIR"' EXIT

PARENT_DIR="$(dirname "$REPO_ROOT")"

EXCLUDES=(
  "--exclude=${PROJECT_NAME}/.git"
  "--exclude=${PROJECT_NAME}/.DS_Store"
  "--exclude=${PROJECT_NAME}/cache"
  "--exclude=${PROJECT_NAME}/artifacts"
  "--exclude=${PROJECT_NAME}/logs"
  "--exclude=${PROJECT_NAME}/go-service.log"
  "--exclude=${PROJECT_NAME}/hardhat.log"
  "--exclude=${PROJECT_NAME}/node_modules"
  "--exclude=${PROJECT_NAME}/frontend/node_modules"
  "--exclude=${PROJECT_NAME}/frontend/.vite"
  "--exclude=${PROJECT_NAME}/frontend/dist"
)

# Avoid packing the generated executable back into the archive
if [[ "$OUTPUT_PATH" == "$REPO_ROOT"* ]]; then
  RELATIVE_OUT="${OUTPUT_PATH#$REPO_ROOT/}"
  if [[ -n "$RELATIVE_OUT" ]]; then
    EXCLUDES+=("--exclude=${PROJECT_NAME}/${RELATIVE_OUT}")
  fi
fi

tar -C "$PARENT_DIR" "${EXCLUDES[@]}" -czf "$ARCHIVE_PATH" "$PROJECT_NAME"

cat >"$OUTPUT_PATH" <<EOF
#!/bin/bash
set -euo pipefail

PROJECT_NAME="$PROJECT_NAME"

cleanup() {
  if [[ -n "\${TMPDIR:-}" && -d "\$TMPDIR" ]]; then
    rm -rf "\$TMPDIR"
  fi
}

trap cleanup EXIT INT TERM

ARCHIVE_LINE=\$(awk '/^__ARCHIVE_BELOW__/ {print NR + 1; exit 0}' "\$0")
TMPDIR=\$(mktemp -d)

if base64 --decode </dev/null >/dev/null 2>&1; then
  BASE64_DEC=(base64 --decode)
else
  BASE64_DEC=(base64 -d)
fi

tail -n +"\$ARCHIVE_LINE" "\$0" | "\${BASE64_DEC[@]}" | tar -C "\$TMPDIR" -xz

PROJECT_DIR="\$TMPDIR/\$PROJECT_NAME"

if [[ ! -d "\$PROJECT_DIR" ]]; then
  echo "Archive extraction failed: directory \$PROJECT_NAME missing" >&2
  exit 1
fi

cd "\$PROJECT_DIR"

if [[ ! -x "./start-platform.sh" ]]; then
  echo "start-platform.sh not found or not executable inside archive" >&2
  exit 1
fi

exec ./start-platform.sh "\$@"

exit 0

__ARCHIVE_BELOW__
EOF

base64 <"$ARCHIVE_PATH" >>"$OUTPUT_PATH"
chmod +x "$OUTPUT_PATH"

echo "✅ Self-extracting executable created at: $OUTPUT_PATH"
