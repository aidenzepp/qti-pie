import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import {
  materializeProcessing,
  processingFixtureNames,
  specOfProcessing,
} from "#pantry/processing/fixtures.ts";
import type { ProcessingFixtureName } from "#pantry/processing/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child, Element } from "@qti-pie/crust/tree.ts";

/**
 * The packages whose `choice.xml` is not a hand-written item: three keep `simple`'s own item root
 * and one has an outcome-processing root.
 */
const notHandWrittenItems: ReadonlySet<string> = new Set([
  "p29-test-variables-weight-integer",
  "large-program",
  "processing-item",
  "rptemplates",
  "template-item",
]);

/**
 * The elements of a tree with the given local name, in document order.
 */
const elementsNamed = (element: Element, local: string): readonly Element[] => [
  ...(element.local === local ? [element] : []),
  ...element.children.flatMap((child: Child) =>
    child.kind === "element" ? elementsNamed(child, local) : [],
  ),
];

/**
 * The text content of an element, trimmed.
 */
const textOf = (element: Element): string =>
  element.children
    .map((child: Child) => {
      if (child.kind === "text") {
        return child.value;
      }

      return child.kind === "element" ? textOf(child) : "";
    })
    .join("")
    .trim();

/**
 * An attribute's value, or `undefined`.
 */
const attributeOf = (element: Element, name: string): string | undefined =>
  element.attributes.find((a) => a.namespace === "" && a.local === name)?.value;

layer(NodeServices.layer, { excludeTestServices: true })("processing fixtures", (it) => {
  it.effect("the packages whose choice.xml is hand-written are the set the spec names", () =>
    Effect.sync(() => {
      const handWritten = new Set(
        processingFixtureNames.filter((name) =>
          specOfProcessing(name).edits.some(
            (edit) => edit._tag === "replaceFile" && edit.path === "choice.xml",
          ),
        ),
      );

      assert.deepStrictEqual(
        processingFixtureNames.filter((name) => !handWritten.has(name)).toSorted(),
        ["large-program", "processing-item", "rptemplates", "template-item"],
      );
    }),
  );

  it.effect("every derived item is named as simple's manifest names it", () =>
    Effect.gen(function* named() {
      const fs = yield* FileSystem.FileSystem;
      const names: readonly ProcessingFixtureName[] = processingFixtureNames.filter(
        (name) =>
          !notHandWrittenItems.has(name) &&
          specOfProcessing(name).edits.some(
            (edit) => edit._tag === "replaceFile" && edit.path === "choice.xml",
          ),
      );
      const checked: string[] = [];

      for (const name of names) {
        const dir = yield* materializeProcessing(name);
        const manifest = (yield* readXml(yield* fs.readFile(path.join(dir, "imsmanifest.xml"))))
          .root;
        const item = (yield* readXml(yield* fs.readFile(path.join(dir, "choice.xml")))).root;
        const resource = elementsNamed(manifest, "resource").find(
          (found) => attributeOf(found, "href") === "choice.xml",
        );

        assert.isDefined(resource, `${name}: no resource with href choice.xml`);

        const [entry] = elementsNamed(resource, "entry");
        const [string] = elementsNamed(resource, "string");

        assert.isDefined(entry, `${name}: no LOM identifier entry`);
        assert.isDefined(string, `${name}: no LOM title string`);
        assert.strictEqual(
          attributeOf(item, "identifier"),
          textOf(entry),
          `${name}: the item's identifier is not its manifest's LOM identifier`,
        );
        assert.strictEqual(
          attributeOf(item, "title"),
          textOf(string),
          `${name}: the item's title is not its manifest's LOM title`,
        );
        checked.push(name);
      }

      assert.deepStrictEqual(
        checked.toSorted(),
        processingFixtureNames.filter((name) => !notHandWrittenItems.has(name)).toSorted(),
      );
      assert.isTrue(checked.includes("else-before-if"));
    }),
  );
});
