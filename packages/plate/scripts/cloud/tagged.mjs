// The cloud agents' done-when check: does a Vitest JSON report prove a slice's tests ran and passed?
//
// Usage: node tagged.mjs <vitest json report> <text>
//
// It counts, over every test in the report:
//   tagged  - tests whose full name includes <text> and that passed
//   skipped - tests whose full name includes <text> that neither passed nor failed
//   failed  - tests that failed, tagged or not
// It prints one JSON line, { tagged, failed, skipped }, and exits 0 only when tagged > 0, failed is 0 and
// skipped is 0; otherwise it exits 1. It exits 2 with a one-line reason when the report cannot be read or parsed.
//
// A skipped tagged test fails the check on purpose: plate skips the tests of a missing cache, and a slice whose
// tests were skipped has not been proven.
/* oxlint-disable workspace/no-built-in-try-catch, typescript/no-unsafe-assignment, typescript/no-unsafe-call, typescript/no-unsafe-member-access, typescript/no-unsafe-argument, typescript/strict-boolean-expressions -- a standalone, dependency-free script run on cloud machines: the type-aware rules cannot see Node's types here, and the report is untyped JSON. */
import { readFileSync } from "node:fs";

const [file, text] = process.argv.slice(2);

if (file === undefined || text === undefined) {
  console.error("usage: node tagged.mjs <vitest json report> <text>");
  process.exit(2);
}

let report;

try {
  report = JSON.parse(readFileSync(file, "utf-8"));
} catch (error) {
  console.error(`cannot read the report ${file}: ${error.message}`);
  process.exit(2);
}

if (!Array.isArray(report?.testResults)) {
  console.error(`the report ${file} has no testResults list`);
  process.exit(2);
}

let tagged = 0;

let failed = 0;

let skipped = 0;

for (const entry of report.testResults) {
  for (const test of entry.assertionResults ?? []) {
    if (test.status === "failed") {
      failed += 1;
    } else if (test.fullName.includes(text)) {
      if (test.status === "passed") {
        tagged += 1;
      } else {
        skipped += 1;
      }
    }
  }
}

console.log(JSON.stringify({ failed, skipped, tagged }));

process.exit(tagged > 0 && failed === 0 && skipped === 0 ? 0 : 1);
