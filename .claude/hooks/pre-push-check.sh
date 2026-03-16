#!/bin/sh
# Claude hook: runs before any Bash tool call.
# If the command is a git push, runs tests + build first.
# Exit 2 blocks the tool call and shows the message to Claude.

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only act on git push commands
if ! echo "$COMMAND" | grep -q 'git push'; then
  exit 0
fi

echo "--- Pre-push checks ---"
cd "$CLAUDE_PROJECT_DIR" || exit 1

echo "Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo ""
  echo "BLOCKED: Tests failed. Fix failures before pushing."
  exit 2
fi

echo ""
echo "Running build (TypeScript type check)..."
npm run build
if [ $? -ne 0 ]; then
  echo ""
  echo "BLOCKED: Build failed. Fix type errors before pushing."
  exit 2
fi

echo ""
echo "All checks passed. Proceeding with push."
exit 0
