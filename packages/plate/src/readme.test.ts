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

describe("README.md", () => {
  it("opens with the rule's block, verbatim", () => {
    const readme = readFileSync(new URL("../README.md", import.meta.url), "utf-8");
    assert.strictEqual(readme.slice(0, opening.length), opening);
  });
});
