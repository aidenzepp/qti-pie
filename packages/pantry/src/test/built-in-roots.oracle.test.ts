/**
 * A content reference resolves to a built-in variable only of the root of the assembly it resolves
 * in (spec reading 29, the UP audit's A63): an item's built-ins are `numAttempts`, `duration`,
 * `completionStatus` and `QTI_CONTEXT` (information model §2.2.2, §2.2.2.1), and a test's are its
 * own `duration` and `QTI_CONTEXT` (§2.2.2: "time spent on test parts or sections are treated as
 * built-in response variables"; §5.34: "There is one built-in context variable named
 * QTI_CONTEXT"), so a test's feedback that names `completionStatus` names no variable of the test,
 * and "Feedback reference" refuses it. The import once read every root's built-in as one name, so
 * that feedback resolved there and not in the law oracle.
 *
 * The box is every root, an item or a test, by where its reference stands, in its own document or
 * in one its assembly places (an included fragment under an item, a section document under a test,
 * spec reading 117), by every built-in name of either root, by each content reference and
 * variable reference its content makes ({@link referencesOf}): a feedback's outcome, a template's
 * variable, a printed variable's name and its `base`, and a portable custom interaction's context
 * variable. Every package declares none of the names, so each reference resolves
 * to its root's built-in or to nothing. Every case is judged by the law oracle and by the schema's
 * own laws over the import's rows (`#pantry/test/host-judge.ts`), and the laws each side breaks
 * must be one set; the oracle's verdict is held to the specification's table, written by hand.
 */
import type { Law } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readEntries } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/own.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge, judgedLaws } from "#pantry/test/host-judge.ts";
import { judge as judgeOracle, lawsOf } from "#pantry/test/oracle.ts";
import { schemaLawNameOf } from "#pantry/test/law-namer.ts";

/**
 * The declaration kinds each built-in variable stands as under each root, by hand from the
 * information model: an item's response variables `numAttempts` and `duration`, its outcome
 * `completionStatus` and its context `QTI_CONTEXT` (§2.2.2, §2.2.2.1, §2.2.2.3); a test's
 * response variable `duration` and its context `QTI_CONTEXT` (§2.2.2, §5.34).
 */
const builtInsOf = {
  item: new Map([
    ["QTI_CONTEXT", "context"],
    ["completionStatus", "outcome"],
    ["duration", "response"],
    ["numAttempts", "response"],
  ]),
  test: new Map([
    ["QTI_CONTEXT", "context"],
    ["duration", "response"],
  ]),
} as const;

/**
 * Every built-in name of either root.
 */
const names = ["QTI_CONTEXT", "completionStatus", "duration", "numAttempts"] as const;

/**
 * The declaration kinds each reference may name, by hand: a feedback's outcome (§5.49.1), a
 * template element's template variable (§5.145.1), a printed variable's outcome or template
 * variable, by its name and by its `base` (§7.30.6), and a context variable's context declaration
 * (reading 92).
 */
const namable = {
  context: ["context"],
  feedback: ["outcome"],
  printed: ["outcome", "template"],
  template: ["template"],
  variable: ["outcome", "template"],
} as const;

/**
 * The law each reference breaks where its name resolves to no variable it may name.
 */
const lawOf = {
  context: "Context variable reference",
  feedback: "Feedback reference",
  printed: "Printed variable reference",
  template: "Template reference",
  variable: "Printed variable reference",
} as const satisfies Readonly<Record<keyof typeof namable, string>>;

/**
 * The references each root's content makes in the box, own and placed: an item's every one; a
 * test's every one but a context variable's, a portable custom interaction's child, which only an
 * item's body holds; and a section document's those but a template element's, which N6 ancestry
 * refuses in a section's rubric, and which the import reads as no reference of a section document
 * at all, a disagreement of its own.
 */
const referencesOf = {
  item: {
    own: ["context", "feedback", "printed", "template", "variable"],
    placed: ["context", "feedback", "printed", "template", "variable"],
  },
  test: {
    own: ["feedback", "printed", "template", "variable"],
    placed: ["feedback", "printed", "variable"],
  },
} as const satisfies Readonly<
  Record<string, Readonly<Record<string, readonly (keyof typeof namable)[]>>>
>;

/**
 * One case: the root, where the reference stands, the name, and the reference.
 */
interface RootCase {
  readonly name: (typeof names)[number];
  readonly placement: "own" | "placed";
  readonly reference: keyof typeof namable;
  readonly root: keyof typeof builtInsOf;
}

/**
 * Every case of the box: an item's 4·(5 + 5), a test's 4·(4 + 3), 68 in all.
 */
const rootCases: Gen<RootCase> = (source) => {
  const root = source.draw(element(["item", "test"] as const));
  const placement = source.draw(element(["own", "placed"] as const));

  return {
    name: source.draw(element(names)),
    placement,
    reference: source.draw(element(referencesOf[root][placement])),
    root,
  };
};

/**
 * Decide, by the specification's table, whether a case's reference resolves: its name is a
 * built-in of its root that stands as a declaration kind the reference may name.
 *
 * @param drawn - The case.
 * @returns Whether it resolves.
 */
const resolves = (drawn: RootCase): boolean => {
  const kind = builtInsOf[drawn.root].get(drawn.name);

  return namable[drawn.reference].some((held) => held === kind);
};

/**
 * The QTI 3.0 namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Write a case's reference as content: a paragraph holding it, or, for a context variable, a
 * portable custom interaction binding the item's `WIDGET` that reads it. A printed variable's
 * `base` stands on one that prints the declared `SCORE`.
 *
 * @param drawn - The case.
 * @returns The content.
 */
const contentOf = (drawn: RootCase): string => {
  const { name } = drawn;
  const written = {
    context: `<qti-portable-custom-interaction response-identifier="WIDGET" custom-interaction-type-identifier="urn:example:portable" module="portable"><qti-interaction-markup><div>A widget.</div></qti-interaction-markup><qti-context-variable identifier="${name}"/></qti-portable-custom-interaction>`,
    feedback: `<p><qti-feedback-inline outcome-identifier="${name}" identifier="SHOWN" show-hide="show">Shown.</qti-feedback-inline></p>`,
    printed: `<p><qti-printed-variable identifier="${name}"/></p>`,
    template: `<p><qti-template-inline template-identifier="${name}" identifier="SHOWN" show-hide="show">Shown.</qti-template-inline></p>`,
    variable: `<p><qti-printed-variable identifier="SCORE" base="${name}"/></p>`,
  } as const;

  return written[drawn.reference];
};

/**
 * Write an XML document: its declaration, then its text.
 *
 * @param text - The document's root element.
 * @returns The document's bytes.
 */
const xml = (text: string): Uint8Array =>
  new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>\n${text}\n`);

/**
 * Write a manifest listing each document once, under its resource type.
 *
 * @param resources - Each document's path and type.
 * @returns The manifest's bytes.
 */
const manifestOf = (resources: readonly (readonly [path: string, type: string])[]): Uint8Array =>
  xml(
    `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>${resources
      .map(
        ([path, type], at) =>
          `<resource identifier="R${String(at)}" type="${type}" href="${path}"><file href="${path}"/></resource>`,
      )
      .join("")}</resources></manifest>`,
  );

/**
 * Write an item that declares an outcome `SCORE` and a response `WIDGET`, its body the content
 * given.
 *
 * @param body - The body's content.
 * @returns The item's bytes.
 */
const itemOf = (body: string): Uint8Array =>
  xml(
    `<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="item" title="Item" adaptive="false" time-dependent="false"><qti-response-declaration identifier="WIDGET" cardinality="single" base-type="string"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
  );

/**
 * Write a rubric block holding the content given.
 *
 * @param content - The content.
 * @returns The rubric block.
 */
const rubricOf = (content: string): string =>
  `<qti-rubric-block use="instructions" view="candidate"><qti-content-body>${content}</qti-content-body></qti-rubric-block>`;

/**
 * Write a test that declares an outcome `SCORE`, its one section holding the content given and an
 * item ref.
 *
 * @param content - The section's content before its item ref.
 * @returns The test's bytes.
 */
const testOf = (content: string): Uint8Array =>
  xml(
    `<qti-assessment-test xmlns="${asi}" identifier="test" title="Test"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-test-part identifier="part" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="first" title="First" visible="true">${content}<qti-assessment-item-ref identifier="ref" href="item.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
  );

/**
 * Build a case's package: an item that holds the reference in its body or in a fragment it
 * includes, or a test that holds it in its section's rubric or in the rubric of a section document
 * its section ref places.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: RootCase): PackageEntries => {
  const content = contentOf(drawn);
  const item = "imsqti_item_xmlv3p0";
  if (drawn.root === "item") {
    return drawn.placement === "own"
      ? new Map([
          ["imsmanifest.xml", manifestOf([["item.xml", item]])],
          ["item.xml", itemOf(content)],
        ])
      : new Map([
          [
            "imsmanifest.xml",
            manifestOf([
              ["item.xml", item],
              ["fragment.xml", "imsqti_fragment_xmlv3p0"],
            ]),
          ],
          ["item.xml", itemOf('<xi:include href="fragment.xml"/>')],
          ["fragment.xml", xml(`<div xmlns="${asi}">${content}</div>`)],
        ]);
  }

  return drawn.placement === "own"
    ? new Map([
        [
          "imsmanifest.xml",
          manifestOf([
            ["test.xml", "imsqti_test_xmlv3p0"],
            ["item.xml", item],
          ]),
        ],
        ["test.xml", testOf(rubricOf(content))],
        ["item.xml", itemOf("<p>An item.</p>")],
      ])
    : new Map([
        [
          "imsmanifest.xml",
          manifestOf([
            ["test.xml", "imsqti_test_xmlv3p0"],
            ["section.xml", "imsqti_section_xmlv3p0"],
            ["item.xml", item],
          ]),
        ],
        [
          "test.xml",
          testOf('<qti-assessment-section-ref identifier="placement" href="section.xml"/>'),
        ],
        [
          "section.xml",
          xml(
            `<qti-assessment-section xmlns="${asi}" identifier="placed" title="Placed" visible="true">${rubricOf(content)}<qti-assessment-item-ref identifier="placedRef" href="item.xml"/></qti-assessment-section>`,
          ),
        ],
        ["item.xml", itemOf("<p>An item.</p>")],
      ]);
};

/**
 * Name the laws a host judgment lists, each by its law's name.
 *
 * @param laws - The broken or skipped laws.
 * @returns Their names.
 */
const named = (laws: readonly { readonly law: Law }[]): ReadonlySet<string> =>
  new Set(laws.flatMap(({ law }) => Option.toArray(schemaLawNameOf(law))));

/**
 * The oracle's law tables over the installed grammar.
 */
const oracleLaws = lawsOf(grammar);

/**
 * Every law the host judges, read once.
 */
const hostLaws = judgedLaws(Qti);

/**
 * A situation the box must reach: each root's own and placed references resolved and unresolved,
 * but a test's resolved, which only a context variable's `QTI_CONTEXT` would be, and a test holds
 * none.
 */
type Situation = `${RootCase["root"]} ${RootCase["placement"]}, ${"resolved" | "unresolved"}`;

layer(NodeServices.layer, { excludeTestServices: true })(
  "a content reference to a built-in variable",
  (it) => {
    it.effect(
      "resolves only to a built-in of its own assembly's root, the law oracle and the import's rows alike",
      (ctx) =>
        // Oracle: two implementations side by side, the law oracle's content references, which
        // read `BuiltInVariable` under the document's root, and the schema's laws over the
        // import's rows; and the specification's table of each root's built-ins, by hand. Bound:
        // four names by an item's five own and five placed references and a test's four own and
        // three placed: 68 packages.
        searched(
          ctx,
          exhaust(
            {
              box: "an item's or a test's own or placed feedback, template, printed variable, printed variable base or context variable reference naming each built-in variable of either root",
              caseHang: Duration.minutes(1),
              coverage: requiredInSpace<Situation>([
                "item own, resolved",
                "item own, unresolved",
                "item placed, resolved",
                "item placed, unresolved",
                "test own, unresolved",
                "test placed, unresolved",
              ]),
              generator: rootCases,
              limit: 96,
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle's content references, the schema's laws over the import's rows, and the information model's built-ins by root, by hand",
              },
              suite: "test/built-in-roots",
            },
            (drawn, c) =>
              Effect.scoped(
                Effect.gen(function* oneCase() {
                  const dir = yield* scopedPackage(packageOf(drawn));
                  const judgment = yield* judgeOracle(yield* readEntries(dir), grammar, oracleLaws);
                  assert.strictEqual(judgment._tag, "Judged", Formatter.format(drawn));

                  const oracle = new Set<string>(
                    judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [],
                  );
                  const program = yield* readProgram(dir);
                  const host = judge(hostRowsOf(program.inputs), hostLaws);
                  const broken = named(host.broken);
                  const unjudged = named(host.skipped);
                  const shown = [
                    ...[...broken]
                      .filter((law) => !oracle.has(law))
                      .map((law) => `import-only-law: ${law}`),
                    ...[...oracle]
                      .filter((law) => !broken.has(law) && !unjudged.has(law))
                      .map((law) => `oracle-only-law: ${law}`),
                  ].toSorted();
                  const unresolved = oracle.has(lawOf[drawn.reference]);
                  c.note(
                    `${drawn.root} ${drawn.placement}, ${unresolved ? "unresolved" : "resolved"}`,
                  );
                  // A context variable's identifier is also an IDREF of the item's context
                  // declarations (`ContextUniqueIDRefDType`), so its `QTI_CONTEXT` breaks Idref
                  // target beside resolving; the reference's own law is the table's alone.
                  assert.strictEqual(
                    unresolved,
                    !resolves(drawn),
                    `${Formatter.format(drawn)}: the oracle breaks ${[...oracle].toSorted().join(", ") || "no law"}`,
                  );
                  assert.deepStrictEqual(
                    shown,
                    [],
                    `${Formatter.format(drawn)}: ${shown.join("; ")}; the oracle breaks ${[...oracle].toSorted().join(", ") || "no law"}; the import's rows break ${[...broken].toSorted().join(", ") || "no law"}`,
                  );
                }),
              ),
          ),
        ),
    );
  },
);
