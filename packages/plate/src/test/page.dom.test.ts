/**
 * The first in-page file: it proves that a page of each engine runs plate's code under the DOM
 * program. The page has the DOM that Node lacks, imports a plate browser module through `#plate/*`,
 * reads that module's HTML back with the engine's own parser, and is served from `127.0.0.1` off
 * the reserved ports.
 *
 * It runs only inside the engine's page, under Vitest's browser mode in the in-page project of
 * `vite.browser.config.ts` (`test:browser`), and never in Node: plate's unit run excludes it, and
 * the root program excludes it, so only `src/tsconfig.json` types it, with the DOM lib.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), so each result's first
 * ancestor title is the engine's name, which the ledger and the G-probe count read to tell the two
 * engines' results apart.
 */
import { assert, describe, it } from "@effect/vitest";
import { server } from "vite-plus/test/browser/context";
import { h, text } from "#plate/emit/node.ts";
import { toHtml } from "#plate/emit/serialise.ts";

/**
 * The HTML `toHtml` writes for a `p` holding `a & <b>`, as `src/emit/serialise.test.ts` pins it.
 */
const written = "<p>a &amp; &lt;b&gt;</p>";

describe(server.browser, () => {
  it("has the DOM that Node lacks", () => {
    assert.instanceOf(document.createElement("template"), HTMLTemplateElement);
  });

  it("runs a plate browser module", () => {
    assert.strictEqual(toHtml(h("p", {}, [text("a & <b>")])), written);
  });

  it("parses the string back", () => {
    const template = document.createElement("template");

    template.innerHTML = written;

    const [first] = template.content.children;

    assert.strictEqual(template.content.children.length, 1);
    assert.strictEqual(first?.outerHTML, written);
  });

  it("is served from 127.0.0.1 off the reserved ports", () => {
    assert.strictEqual(location.hostname, "127.0.0.1");
    assert.notInclude(["5190", "5191", "5192", "5433", "5435"], location.port);
  });
});
