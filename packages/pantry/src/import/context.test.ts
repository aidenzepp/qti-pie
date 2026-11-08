import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { contextsOf } from "#pantry/import/context.ts";
import type { FlagHandle } from "#pantry/import/context.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId } from "#pantry/model/xdm.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 0.9 s at a load average of 75, under
 * V8 coverage, its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * How long one case may take: it shreds three small documents, so a minute only bounds a hang.
 */
const caseHang = Duration.minutes(1);

/**
 * The QTI 3 ASI namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The places an item includes `f.xml` at, each an item body with `{}` where the include stands,
 * with whether the include is a site there, and the flags and the interaction a site there stands
 * in, read off the vocabulary by hand: Enters gives a gap match `int` and `gap`, a hottext
 * interaction `int`, a feedback block `fb`. An include in a custom interaction's open content is
 * no site (spec reading 114: a wildcard holds no Include), so it places nothing.
 */
const positions = {
  body: { body: "{}", flags: [], interaction: undefined, site: true },
  custom: {
    body: '<qti-custom-interaction response-identifier="R">{}</qti-custom-interaction>',
    flags: [],
    interaction: undefined,
    site: false,
  },
  feedback: {
    body: '<qti-feedback-block outcome-identifier="FB" identifier="F" show-hide="show"><qti-content-body>{}</qti-content-body></qti-feedback-block>',
    flags: ["fb"],
    interaction: undefined,
    site: true,
  },
  gapMatch: {
    body: '<qti-gap-match-interaction response-identifier="R" max-associations="1"><qti-gap-text identifier="W" match-max="1">w</qti-gap-text>{}</qti-gap-match-interaction>',
    flags: ["gap", "int"],
    interaction: "qti-gap-match-interaction",
    site: true,
  },
  hottext: {
    body: '<qti-hottext-interaction response-identifier="R" max-choices="1">{}</qti-hottext-interaction>',
    flags: ["int"],
    interaction: "qti-hottext-interaction",
    site: true,
  },
} as const satisfies Readonly<
  Record<
    string,
    {
      readonly body: string;
      readonly flags: readonly FlagHandle[];
      readonly interaction: string | undefined;
      readonly site: boolean;
    }
  >
>;

/**
 * Write an item whose body is a position with `{}` replaced.
 *
 * @param body - The body's content.
 * @returns The item's text.
 */
const itemOf = (body: string): string =>
  `<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="I" title="Item" time-dependent="false"><qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

/**
 * Shred a document's text under 3.0.1.
 *
 * @param text - The document.
 * @returns Its tree.
 */
const treeOf = (text: string) =>
  Effect.gen(function* tree() {
    const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));

    return yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));
  });

/**
 * Draw the ids of one document, each index its own uuid under the document's number.
 *
 * @param document - The document's number.
 * @returns The ids.
 */
const idsOf =
  (document: number) =>
  (index: number): NodeId =>
    `00000000-0000-4000-8${document.toString(16).padStart(3, "0")}-${index.toString(16).padStart(12, "0")}`;

/**
 * Every ordered pair of positions, the first include's and the second's.
 */
const pairs = (() => {
  const names = [
    "body",
    "custom",
    "feedback",
    "gapMatch",
    "hottext",
  ] as const satisfies readonly (keyof typeof positions)[];
  const [first, ...rest] = names.flatMap((one) =>
    names.map((two) => ({ first: one, second: two })),
  );
  if (first === undefined) {
    throw new Error("The positions table is empty; it names four positions.");
  }

  return [first, ...rest] as const;
})();

/**
 * A case's feature: a site inside an interaction; sites outside every interaction, at one position
 * or at two whose flags unite; or no site, both includes in open content.
 */
type ContextSituation = "inside" | "no site" | "outside" | "union";

/**
 * Name a case's feature.
 *
 * @param inside - Whether a site stands inside an interaction.
 * @param sited - The positions of the includes that are sites.
 * @returns The feature.
 */
const noteOf = (inside: boolean, sited: readonly string[]): ContextSituation => {
  if (inside) {
    return "inside";
  }

  const distinct = new Set(sited).size;
  if (distinct === 0) {
    return "no site";
  }

  return distinct === 1 ? "outside" : "union";
};

describe("contextsOf", () => {
  it.effect(
    "gives an included fragment the flags and the interaction its sites stand in, the union of its sites' flags, its own document node where no site stands in an interaction, and its own context where no include of it is a site",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every pair of the five positions of one include, and the fragment a second fragment it includes inherits through",
            caseHang,
            coverage: requiredInSpace<ContextSituation>(["inside", "no site", "outside", "union"]),
            generator: (source) => source.draw(element(pairs)),
            limit: 25,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "readings 114 and 117, the Enters flags and N8's nearest interaction, by hand",
            },
            suite: "import/context",
          },
          ({ first, second }, c) =>
            Effect.gen(function* contextCase() {
              const one = positions[first];
              const two = positions[second];
              const item = yield* treeOf(
                itemOf(
                  `${one.body.replace("{}", '<xi:include href="f.xml"/>')}<div>${two.body.replace("{}", '<xi:include href="f.xml"/>')}</div>`,
                ),
              );
              const fragment = yield* treeOf(
                `<p xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude">a <xi:include href="g.xml"/></p>`,
              );
              const nested = yield* treeOf(`<span xmlns="${asi}">b</span>`);
              const { assembled, contexts, targeted } = contextsOf([
                { idOf: idsOf(1), named: true, path: "i.xml", tree: item },
                { idOf: idsOf(2), named: true, path: "f.xml", tree: fragment },
                { idOf: idsOf(3), named: true, path: "g.xml", tree: nested },
              ]);
              const itemNodes = flatten(item, idsOf(1)).nodes;
              const interactionOf = (kind: string | undefined) =>
                kind === undefined ? undefined : itemNodes.find((node) => node.kind === kind)?.id;
              const sited = [first, second].filter((name) => positions[name].site);
              const inside = sited
                .map((name) => positions[name])
                .find(({ interaction }) => interaction !== undefined);
              const expectedNearest = interactionOf(inside?.interaction) ?? idsOf(2)(0);
              const flags = new Set<FlagHandle>(sited.flatMap((name) => positions[name].flags));
              const placed = sited.length > 0 ? [idsOf(2)(0)] : [];
              c.note(noteOf(inside !== undefined, sited));

              for (const [document, self] of [
                ["f.xml", idsOf(2)(0)],
                ["g.xml", idsOf(3)(0)],
              ] as const) {
                const context = contexts.get(self) ?? ownContext(self);

                assert.deepStrictEqual(new Set(context.ancestry), flags, document);
                assert.strictEqual(
                  context.nearest,
                  document === "f.xml" || inside !== undefined ? expectedNearest : self,
                  document,
                );
                assert.strictEqual(
                  context.nearestKind,
                  inside?.interaction ?? "document",
                  document,
                );
              }

              assert.deepStrictEqual(contexts.get(idsOf(1)(0)), ownContext(idsOf(1)(0)));
              assert.deepStrictEqual(targeted, new Set([...placed, idsOf(3)(0)]));
              assert.deepStrictEqual(
                assembled,
                new Set([...(sited.length > 0 ? [idsOf(1)(0)] : []), idsOf(2)(0), idsOf(3)(0)]),
              );
            }),
        ),
      ),
    testTimeoutMs,
  );
});
