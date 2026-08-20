#!/bin/bash
set -e

INPUT_FILE="${1:-resume.tex}"
OUTPUT_DIR="${2:-.}"
TIMEOUT="${3:-30}"

cd "$OUTPUT_DIR"

# Compile with restricted shell escape, timeout, and limited runs
timeout "$TIMEOUT" pdflatex \
  -interaction=nonstopmode \
  -no-shell-escape \
  -output-directory="$OUTPUT_DIR" \
  "$INPUT_FILE" 2>&1 || {
    echo "COMPILATION_FAILED"
    exit 1
  }

# Run twice for references
timeout "$TIMEOUT" pdflatex \
  -interaction=nonstopmode \
  -no-shell-escape \
  -output-directory="$OUTPUT_DIR" \
  "$INPUT_FILE" 2>&1 || true

echo "COMPILATION_SUCCESS"
