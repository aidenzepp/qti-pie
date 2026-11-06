/**
 * The export's render of MathML (spec MA10): an item read with `readXml`, walked by `treeRows` and
 * built by `attributeRows`, `htmlRows`, `includeRows` and `contentRows` in the order
 * `import/item.ts` calls them, in memory and with no database, renders back to the canonical form
 * of its source. The MathML is written in the prefixed form (`m:math`) and in the
 * default-namespace form (`<math xmlns="...">`), with the attributes the readers keep apart from
 * the shared list: `class`, `dir`, `id`, `xref`, a padded `display`, `mathcolor`, and `width` on
 * `m:mspace`, `m:mpadded` and `m:mtable`, an `m:maction`, and an `m:cbytes` whose text wraps a
 * line.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Uuid } from "@bjornpagen/grizzle";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import { renderTree } from "#pantry/export/render.ts";
import { attributeRows } from "#pantry/import/attributes.ts";
import { contentRows } from "#pantry/import/content.ts";
import { htmlRows } from "#pantry/import/html.ts";
import { includeRows } from "#pantry/import/include.ts";
import { Rows, treeRows, withParents } from "#pantry/import/tree.ts";
import { indexOf, readersFor } from "#pantry/schema/attribute-homes.ts";
import { isMathmlKind } from "#pantry/schema/kinds/mathml.ts";

const documentId: Uuid = "11111111-1111-4111-8111-111111111111";

const itemNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const mathNamespace = "http://www.w3.org/1998/Math/MathML";

/**
 * The attributes of the math element, `display` padded.
 */
const rootAttributes = 'class="c d" dir="rtl" id="eq" xref="eq2" display=" block " mathcolor="red"';

/**
 * The same MathML in the prefixed form.
 */
const prefixed = `<m:math ${rootAttributes}><m:mrow id="r" class="k" dir="ltr" mathcolor="#00f" xref="r"><m:mi>x</m:mi><m:mspace width="1em"/><m:mpadded width="+1em" class="p"><m:mi xref="eq">y</m:mi></m:mpadded><m:maction actiontype="toggle"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction></m:mrow><m:mtable width="auto"/><m:cbytes>AQID\nAQID</m:cbytes></m:math>`;

/**
 * The same MathML in the default-namespace form.
 */
const defaulted = `<math xmlns="${mathNamespace}" ${rootAttributes}><mrow id="r" class="k" dir="ltr" mathcolor="#00f" xref="r"><mi>x</mi><mspace width="1em"/><mpadded width="+1em" class="p"><mi xref="eq">y</mi></mpadded><maction actiontype="toggle"><mi>a</mi><mi>b</mi></maction></mrow><mtable width="auto"/><cbytes>AQID\nAQID</cbytes></math>`;

/**
 * An item around `math`. Its root carries no attribute of its own: the item's builders write those,
 * and this test drives only the passes the MathML shares.
 */
const itemOf = (math: string): string =>
  `<qti-assessment-item xmlns="${itemNamespace}" xmlns:m="${mathNamespace}"><qti-item-body><p>${math}</p></qti-item-body></qti-assessment-item>`;

const textOf = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/**
 * Read an item, build its rows in the importer's pass order and render them back.
 */
const roundTrip = (text: string) =>
  Effect.gen(function* run() {
    const doc = yield* readXml(new TextEncoder().encode(text));
    const tree = yield* treeRows(
      doc,
      { charset: doc.charset, id: documentId, kind: "document", root: "item", version: "3.0.1" },
      Rows.empty(),
    );
    let { rows } = tree;
    rows = yield* attributeRows(doc.root, tree.nodes, documentId, rows);
    rows = yield* htmlRows(doc.root, tree.nodes, rows);
    rows = yield* includeRows(doc.root, tree.nodes, rows);
    rows = yield* contentRows(doc.root, tree.nodes, documentId, "item", new Map(), rows);

    return {
      doc,
      nodes: tree.nodes,
      rendered: textOf(canonicalize(renderTree(rows, documentId))),
      rows,
      source: textOf(canonicalize(doc)),
    };
  });

describe("export/render.ts on MathML, no database", () => {
  for (const [form, math] of [
    ["prefixed", prefixed],
    ["default-namespace", defaulted],
  ] as const) {
    it.effect(`renders the ${form} form back canonically equal`, () =>
      Effect.gen(function* run() {
        const { rendered, source } = yield* roundTrip(itemOf(math));

        assert.include(source, "AQID\nAQID");
        assert.strictEqual(rendered, source);
      }),
    );

    it.effect(`gives every MathML attribute of the ${form} form exactly one reader`, () =>
      Effect.gen(function* run() {
        const { doc, nodes, rows } = yield* roundTrip(itemOf(math));
        const readersOf = readersFor(indexOf(rows));
        let pairs = 0;

        for (const [element] of withParents(doc.root, Option.none())) {
          const kind = nodes.get(element)?.kind ?? "";
          if (!isMathmlKind(kind)) {
            continue;
          }

          for (const attribute of element.attributes) {
            if (attribute.prefix === "xmlns" || attribute.qname === "xmlns") {
              continue;
            }

            pairs += 1;
            assert.strictEqual(
              readersOf(kind).filter(([name]) => name === attribute.qname).length,
              1,
              `${kind} ${attribute.qname}`,
            );
          }
        }

        assert.isAbove(pairs, 15);
      }),
    );
  }
});
