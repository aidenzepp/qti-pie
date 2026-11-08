/**
 * A binding to a response declaration whose cardinality spells nothing is declared (spec reading
 * 159): the binding resolves by name to every response declaration whose identifier names
 * something, whatever its `cardinality` spells, so "Binding declared" and "Binding unique" judge it
 * as any other, while the laws over the bound variable's cardinality ("BindingFit",
 * "RecordBindingFit", "Binding cardinality" and "Max strings required") read the binding's
 * `BindingCardinality` or `PlacedBindingCardinality` row, which it has only where the declaration
 * has a `DeclarationCardinality`, and judge nothing where it has none: AL3 or the declaration's
 * value domain refuses the attribute alone (spec reading 158). The import resolved a binding
 * through `DeclarationName` before, which such a declaration does not have, so its rows broke
 * "Binding declared" beside the AL3 or value domain the law oracle alone raised.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows a disagreement but a class a lane's open fix owns (`known`).
 *
 * Bound: an item whose response declaration `V` writes each of {@link cardinalities} and each of
 * {@link baseTypes}, bound at each of {@link sites}: 8 × 4 × 6 = 192 packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement, signatureOf } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside.
 */
const recorded: ReadonlySet<string> = new Set(Object.keys(known));

/**
 * What the declaration's cardinality is: unwritten, written as no code of its enumeration, or a
 * code.
 */
type Typing = "a code" | "no code" | "unwritten";

/**
 * One value of an attribute the box writes: its text in the start tag, empty where it is
 * unwritten, and what it is.
 */
interface Written {
  readonly attribute: string;
  readonly typing: Typing;
}

/**
 * Write an attribute's values: none, then each that spells no code, then each code.
 *
 * @param name - The attribute's name.
 * @param none - The values that spell no code.
 * @param codes - The codes.
 * @returns The values.
 */
const writtenOf = (
  name: string,
  none: readonly string[],
  codes: readonly string[],
): readonly Written[] => [
  { attribute: "", typing: "unwritten" },
  ...none.map((value) => ({ attribute: ` ${name}="${value}"`, typing: "no code" as const })),
  ...codes.map((value) => ({ attribute: ` ${name}="${value}"`, typing: "a code" as const })),
];

/**
 * The cardinalities the declaration writes: none; the empty one, `many` and a padded `single`,
 * which spell no code, since the enumeration restricts `xs:string`; and the four codes, a record
 * among them, which `RecordBindingFit` and a string binding's `BindingFit` judge.
 */
const cardinalities = writtenOf(
  "cardinality",
  ["", "many", "single "],
  ["single", "multiple", "ordered", "record"],
);

/**
 * The base types the declaration writes: none; `bogus`, which spells no code; `identifier`, which
 * a choice binds; and `string`, which a text binds.
 */
const baseTypes = writtenOf("base-type", ["bogus"], ["identifier", "string"]);

/**
 * A choice interaction bound to `V`, with its most of choices and one choice of a name of its own.
 *
 * @param most - Its `max-choices`.
 * @param choice - Its choice's identifier.
 * @returns The interaction.
 */
const choiceOf = (most: string, choice: string): string =>
  `<qti-choice-interaction response-identifier="V" max-choices="${most}"><qti-simple-choice identifier="${choice}">a</qti-simple-choice></qti-choice-interaction>`;

/**
 * The XInclude namespace.
 */
const xi = "http://www.w3.org/2001/XInclude";

/**
 * The ASI namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Where `V` is bound: a choice of one most ("BindingFit", "RecordBindingFit"), and of a most of 2
 * ("Binding cardinality"); an extended text ("Max strings required"); a text entry's string
 * identifier, beside its own response `T` (the string binding's "BindingFit"); two choices
 * ("Binding unique"); and a choice in a fragment the item includes, bound in place ("Binding
 * declared" over `PlacedBinding`).
 */
const sites: readonly {
  readonly body: string;
  readonly fragment?: string;
  readonly name: string;
  readonly text?: true;
}[] = [
  { body: choiceOf("1", "c1"), name: "a choice of one" },
  { body: choiceOf("2", "c1"), name: "a choice of two" },
  { body: `<qti-extended-text-interaction response-identifier="V"/>`, name: "an extended text" },
  {
    body: `<p><qti-text-entry-interaction response-identifier="T" string-identifier="V"/></p>`,
    name: "a string identifier",
    text: true,
  },
  { body: `${choiceOf("1", "c1")}${choiceOf("1", "c2")}`, name: "two choices" },
  {
    body: `<div><xi:include href="f.xml"/></div>`,
    fragment: `<div xmlns="${asi}">${choiceOf("1", "c1")}</div>`,
    name: "a placed choice",
  },
];

/**
 * Every case: a cardinality, a base type and a site.
 */
const cases = cardinalities.flatMap((cardinality) =>
  baseTypes.flatMap((baseType) => sites.map((site) => ({ baseType, cardinality, site }))),
);

/**
 * A case of the box.
 */
type Case = (typeof cases)[number];

/**
 * Name a case.
 *
 * @param drawn - The case.
 * @returns Its name.
 */
const nameOf = ({ baseType, cardinality, site }: Case): string =>
  `${cardinality.attribute.trim() || "no cardinality"} ${baseType.attribute.trim() || "no base-type"}, ${site.name}`;

/**
 * Write a case's package: its item, the fragment its site includes, if any, and the manifest that
 * lists them.
 *
 * @param drawn - The case.
 * @returns Its entries.
 */
const packageOf = ({ baseType, cardinality, site }: Case): PackageEntries => {
  const text = site.text === true;
  const declarations = `<qti-response-declaration identifier="V"${cardinality.attribute}${baseType.attribute}/>${text ? '<qti-response-declaration identifier="T" cardinality="single" base-type="string"/>' : ""}`;
  const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${asi}" xmlns:xi="${xi}" identifier="i" title="t" adaptive="false" time-dependent="false">${declarations}<qti-item-body>${site.body}</qti-item-body></qti-assessment-item>`;
  const fragment =
    site.fragment === undefined
      ? ""
      : `<resource identifier="F" type="imsqti_fragment_xmlv3p0" href="f.xml"><file href="f.xml"/></resource>`;
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource>${fragment}</resources></manifest>`;
  const encoder = new TextEncoder();

  return new Map([
    ...(site.fragment === undefined ? [] : [["f.xml", encoder.encode(site.fragment)] as const]),
    ["imsmanifest.xml", encoder.encode(manifest)],
    ["item.xml", encoder.encode(item)],
  ]);
};

/**
 * A feature a case notes: its cardinality's typing, and its site.
 */
type Noted = `cardinality ${Typing}` | `site ${string}`;

layer(NodeServices.layer, { excludeTestServices: true })(
  "a binding to a response declaration whose cardinality spells nothing",
  (it) => {
    it.effect(
      "is declared, judged by no law over a cardinality, and judged alike on the import's rows and in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* untypedBindingRuns() {
            const directory = yield* scratchDirectory("untyped-bindings-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "an item's response declaration, its cardinality unwritten, spelling no code or each code, its base type unwritten, bogus, identifier or string, bound by a choice of one or of two, an extended text, a string identifier, two choices or a placed choice",
                caseHang: Duration.minutes(5),
                coverage: requiredInSpace<Noted>([
                  "cardinality a code",
                  "cardinality no code",
                  "cardinality unwritten",
                  ...sites.map(({ name }): Noted => `site ${name}`),
                ]),
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => {
                  const held = cases[at];

                  return held === undefined ? String(at) : nameOf(held);
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/untyped-bindings",
              },
              (at: number, c) =>
                Effect.gen(function* untypedBindingCase() {
                  const held = cases[at];
                  assert.isDefined(held, `no case ${String(at)}`);
                  if (held === undefined) {
                    return;
                  }

                  c.note(`cardinality ${held.cardinality.typing}`);
                  c.note(`site ${held.site.name}`);

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(held)), bench, at);

                  assert.deepStrictEqual(
                    judged.disagreements
                      .filter((disagreement) => !recorded.has(signatureOf(disagreement)))
                      .map(shownDisagreement),
                    [],
                    `${nameOf(held)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
