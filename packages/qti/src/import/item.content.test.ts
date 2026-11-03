import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { itemRows } from "#qti/import/item.ts";
import { ruleOfError } from "#qti/import/refusal.ts";
import { ItemRefusal, Rows } from "#qti/import/tree.ts";
import { Img } from "#qti/schema/html.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * Run `itemRows` over an inline 3.0.1 item whose body is one paragraph holding `img`.
 *
 * @param img - The `img` element's markup.
 * @returns The item's rows, or the importer's refusal.
 */
const itemWith = (img: string) =>
  Effect.gen(function* itemWithImg() {
    const doc = yield* readXml(
      new TextEncoder().encode(
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false">
  <qti-item-body><p>x${img}</p></qti-item-body>
</qti-assessment-item>`,
      ),
    );

    return yield* itemRows(
      {
        doc,
        packageId: crypto.randomUUID(),
        path: "i.xml",
        resource: "i",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_item_xmlv3p0",
        version: "3.0.1",
      },
      Rows.empty(),
    );
  });

describe("itemRows on img's required attributes", () => {
  for (const [name, markup] of [
    ["src", `<img alt="a"/>`],
    ["alt", `<img src="a.png"/>`],
  ] as const) {
    it.effect(`an img with no ${name} is refused under required-attribute`, () =>
      Effect.gen(function* refused() {
        const error = yield* Effect.flip(itemWith(markup));
        assert.instanceOf(error, ItemRefusal);
        assert.strictEqual(error.rule, "required-attribute");
        assert.strictEqual(ruleOfError(error).rule, "required-attribute");
      }),
    );
  }

  it.effect("an explicit empty alt is a value and is admitted", () =>
    Effect.gen(function* admitted() {
      const { rows } = yield* itemWith(`<img src="a.png" alt=""/>`);
      const imgs = Rows.of(rows, Img);
      assert.strictEqual(imgs.length, 1);
      assert.strictEqual(imgs[0]?.alt, "");
      assert.strictEqual(imgs[0]?.src, "a.png");
    }),
  );
});
