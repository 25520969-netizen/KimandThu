/**
 * Dependency-free test runner for the browser scripts. Run through scripts/test.sh,
 * which uses Node when installed and otherwise the `jsc` shell that ships with macOS:
 *   node tests/run_tests.js
 *   /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/run_tests.js
 * Source files attach to the global object (like <script> tags); test files use the
 * globals `test`, `asyncTest`, `assertEqual`, `assertTrue`, `assertThrows`, `readText`.
 * Exit code is non-zero when any test fails.
 */
const IS_JSC = typeof readFile === "function" && typeof print === "function";
const globalScope = (0, eval)("this");

if (typeof console === "undefined") {
  const log = (...args) => print(args.map(String).join(" "));
  globalScope.console = { log: log, warn: () => {}, error: () => {}, info: () => {} };
}

const SOURCE_FILES = [
  "src/utils/safe_url.js",
  "src/utils/local_date.js",
  "src/utils/drive_image.js",
  "src/services/period_cycle.js",
  "src/services/sync_merge.js",
  "src/services/sync_policy.js",
  "src/services/sync_engine.js",
  "src/services/spaced_queue.js",
  "src/services/geo_policy.js",
  "src/services/period_history.js",
  "src/services/milestones.js",
  "src/adapters/outbox_store.js",
  "src/ui/overlay_stack.js"
];
const TEST_FILES = [
  "tests/unit/utils/test_safe_url.js",
  "tests/unit/utils/test_local_date.js",
  "tests/unit/utils/test_drive_image.js",
  "tests/unit/services/test_period_cycle.js",
  "tests/unit/services/test_sync_merge.js",
  "tests/unit/services/test_sync_policy.js",
  "tests/unit/services/test_sync_engine.js",
  "tests/unit/services/test_spaced_queue.js",
  "tests/unit/services/test_geo_policy.js",
  "tests/unit/services/test_period_history.js",
  "tests/unit/services/test_milestones.js",
  "tests/unit/backend/test_apps_script.js",
  "tests/unit/ui/test_overlay_stack.js",
  "tests/unit/ui/test_static_assets.js",
  "tests/unit/app/test_journey_app.js"
];

function readText(relativePath) {
  return IS_JSC ? readFile(relativePath) : require("fs").readFileSync(relativePath, "utf8");
}

const results = { passed: 0, failed: [] };
const asyncTests = [];
const messageOf = (err) => (err && err.message ? err.message : String(err));

globalScope.readText = readText;
globalScope.test = function test(name, fn) {
  try {
    fn();
    results.passed += 1;
  } catch (err) {
    results.failed.push(`${name}\n      ${messageOf(err)}`);
  }
};
globalScope.asyncTest = function asyncTest(name, fn) { asyncTests.push({ name: name, fn: fn }); };
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

async function runAsyncTests() {
  for (const t of asyncTests) {
    try {
      await t.fn();
      results.passed += 1;
    } catch (err) {
      results.failed.push(`${t.name}\n      ${messageOf(err)}`);
    }
  }
}

function report() {
  let out = `\n${results.passed} passed, ${results.failed.length} failed\n`;
  results.failed.forEach((f) => { out += `  FAIL ${f}\n`; });
  console.log(out);
  const code = results.failed.length > 0 ? 1 : 0;
  if (IS_JSC) quit(code); // eslint-disable-line no-undef
  else process.exit(code);
}

SOURCE_FILES.forEach((file) => (0, eval)(readText(file)));
TEST_FILES.forEach((file) => (0, eval)(readText(file)));

let finished = false;
runAsyncTests().then(() => { finished = true; report(); });
// The jsc shell does not run promise jobs on its own: drain them until the async tests finish.
if (IS_JSC) {
  for (let i = 0; i < 1000 && !finished; i += 1) drainMicrotasks(); // eslint-disable-line no-undef
  if (!finished) {
    console.log("Async tests did not finish (unresolved promise).");
    quit(1);
  }
}
