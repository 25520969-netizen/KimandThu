/**
 * Dependency-free test runner.
 *   macOS:  osascript -l JavaScript tests/run_tests.js
 *   Node:   node tests/run_tests.js
 * Loads the browser scripts (which attach to the global object) and runs every
 * file listed in TEST_FILES. Exit code is non-zero when any test fails.
 */
ObjC.import("Foundation");

const ROOT = $.NSFileManager.defaultManager.currentDirectoryPath.js;
const SOURCE_FILES = [
  "src/utils/safe_url.js",
  "src/utils/local_date.js",
  "src/services/period_cycle.js"
];
const TEST_FILES = [
  "tests/unit/utils/test_safe_url.js",
  "tests/unit/utils/test_local_date.js",
  "tests/unit/services/test_period_cycle.js",
  "tests/unit/app/test_journey_app.js"
];

function readText(relativePath) {
  const full = `${ROOT}/${relativePath}`;
  const text = $.NSString.stringWithContentsOfFileEncodingError(full, $.NSUTF8StringEncoding, null);
  if (!text || text.isNil()) throw new Error(`Cannot read ${full}`);
  return text.js;
}

const globalScope = (0, eval)("this");
// JavaScriptCore (JXA) has a bare console: add the methods the app uses.
["warn", "error", "info"].forEach((m) => { if (!console[m]) console[m] = () => {}; });
const results = { passed: 0, failed: [] };

globalScope.readText = readText;
globalScope.test = function test(name, fn) {
  try {
    fn();
    results.passed += 1;
  } catch (err) {
    results.failed.push(`${name}\n      ${err && err.message ? err.message : err}`);
  }
};
globalScope.assertEqual = function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label || "assertEqual"}: expected ${e}, got ${a}`);
};
globalScope.assertTrue = function assertTrue(value, label) {
  if (value !== true) throw new Error(`${label || "assertTrue"}: expected true, got ${JSON.stringify(value)}`);
};
globalScope.assertThrows = function assertThrows(fn, label) {
  try {
    fn();
  } catch (err) {
    return;
  }
  throw new Error(`${label || "assertThrows"}: expected an exception`);
};

SOURCE_FILES.forEach((file) => (0, eval)(readText(file)));
TEST_FILES.forEach((file) => (0, eval)(readText(file)));

let report = `\n${results.passed} passed, ${results.failed.length} failed\n`;
results.failed.forEach((f) => { report += `  FAIL ${f}\n`; });
console.log(report);
// osascript exits non-zero when the script throws.
if (results.failed.length > 0) throw new Error(`${results.failed.length} test(s) failed`);
