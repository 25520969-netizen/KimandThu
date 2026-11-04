#!/bin/sh
# Runs the unit tests with Node when available, otherwise with the jsc shell bundled with macOS.
cd "$(dirname "$0")/.." || exit 1
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
if command -v node >/dev/null 2>&1; then
  exec node tests/run_tests.js
elif [ -x "$JSC" ]; then
  exec "$JSC" tests/run_tests.js
fi
echo "Need Node.js or macOS jsc to run the tests." >&2
exit 1
