import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";

/**
 * The README's opening, rule `17b156bd`: the title, the quoted tagline and the one-line summary,
 * blank lines and the bare `>` quote line included, each ended by a line feed.
 */
const opening = [
  "# plate",
  "",
  "> *You eat with your eyes first.*",
  ">",
  "> plate serves it up: it renders QTI items to HTML, takes the answers, and scores what comes back.",
  "",
  "Render QTI 3.0 items and tests for candidates, on the server and in the browser.",
  "",
].join("\n");

/**
 * The command that writes the conformance ledger, which the README gives on a line of its own.
 */
const ledgerCommand = "pnpm --filter @qti-pie/plate ledger";

/**
 * The headings of the sections that say what the interactions, the scoring and the conformance
 * ledger give a host.
 */
const headings = ["## Interactions", "## Scoring", "## Conformance ledger"] as const;

/**
 * Read the README.
 *
 * @returns Its text.
 */
const readme = (): string => readFileSync(new URL("../README.md", import.meta.url), "utf-8");

describe("README.md", () => {
  it("opens with the rule's block, verbatim", () => {
    assert.strictEqual(readme().slice(0, opening.length), opening);
  });

  it("gives the ledger command on a line of its own and holds each section's heading", () => {
    const lines = readme().split("\n");

    assert.include(lines, ledgerCommand);
    for (const heading of headings) {
      assert.include(lines, heading);
    }
  });
});
