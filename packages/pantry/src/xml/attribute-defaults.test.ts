/**
 * Attribute defaults as crust's reader reads them, held to libxml2 on generated internal subsets
 * (matklad's differential oracle: `xmllint --c14n` and crust implement one specification, XML 1.0
 * sections 3.3.3 and 4.1).
 *
 * Each case declares one attribute `a` of the root `r`: a default written from tokens drawn under a
 * swarm (text, spaces, tabs, a semicolon, the predefined entities, character references, an entity
 * declared before the list, one declared after it, one declared with an undeclared reference in its
 * text, and one declared nowhere), under a type and in a context, the default used, overridden or
 * shadowed by an earlier declaration. Crust and libxml2 must agree on whether the document is well
 * formed, and on the root's attributes where it is. libxml2 expands a reference it cannot resolve
 * to nothing, where crust keeps it as a reference, so crust's values are compared with each kept
 * reference cut out and, for a tokenized type, collapsed again; and crust's tree reads back from
 * its own writing.
 *
 * One verdict is the reading's, not libxml2's: a default that names an entity the subset declares
 * after it (`&f;`) breaks section 4.1's "the declaration of a general entity MUST precede any
 * reference to it which appears in a default value", a validity constraint beside an external
 * subset, which libxml2 without `--valid` reports only as the warning "Entity 'f' not defined".
 * Crust refuses it in every context, as reading 1 refuses content that is not valid.
 */
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter, Layer } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Attribute, XmlDocument } from "@qti-pie/crust/tree.ts";
import { writeXml } from "@qti-pie/crust/write.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { OracleLayer, xmllintC14n } from "#pantry/xml/oracle.ts";

/**
 * The layer the oracle runs in: the process spawner, the file system and paths.
 */
const TestLayer = OracleLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The tokens a default is written with, by class: each class a swarm feature, so a case leans on
 * some and leaves others out.
 *
 * - `text`: a letter, a semicolon, so text can spell `&a;` once an ampersand stands before it;
 * - `space`: a space and a literal tab, which section 3.3.3's first step makes a space;
 * - `predefined`: the five predefined entities;
 * - `character`: an ampersand, a tab, a no-break space, a space and a less-than sign by character
 *   reference;
 * - `declared`: `&e;`, declared before the list;
 * - `later`: `&f;`, declared after it;
 * - `nested`: `&h;`, declared with an undeclared reference in its text;
 * - `undeclared`: `&u;`, declared nowhere.
 */
const TOKEN_CLASSES = {
  character: ["&#38;", "&#x26;", "&#9;", "&#xA0;", "&#32;", "&#60;"],
  declared: ["&e;"],
  later: ["&f;"],
  nested: ["&h;"],
  predefined: ["&amp;", "&lt;", "&gt;", "&quot;", "&apos;"],
  space: [" ", "\t"],
  text: ["a", ";"],
  undeclared: ["&u;"],
} as const;

/**
 * A token class.
 */
type TokenClass = keyof typeof TOKEN_CLASSES;

/**
 * The token classes, in the order a swarm draws them.
 */
const TOKEN_CLASS_NAMES = [
  "text",
  "space",
  "predefined",
  "character",
  "declared",
  "later",
  "nested",
  "undeclared",
] as const satisfies readonly TokenClass[];

/**
 * The replacement texts `&e;` is declared with: text, spaces a tokenized type collapses, and an
 * ampersand by a doubly escaped character reference and by `&amp;`.
 */
const DECLARED = ["q", " q  w ", "x&#38;#38;y;", "x&#38;amp;y"] as const;

/**
 * The attribute types a default is declared under.
 */
const TYPES = ["CDATA", "NMTOKENS", "ID"] as const;

/**
 * Where the subset stands: alone, beside an external subset named `SYSTEM` or `PUBLIC`, and either
 * of the first two in a `standalone="yes"` document.
 */
const CONTEXTS = ["internal", "system", "public", "standalone", "standalone-system"] as const;

/**
 * How the root meets the default: it lacks the attribute, so the default applies; it writes the
 * attribute; or the document's root is another element, so the default is declared and never used.
 */
const USES = ["defaulted", "written", "unused"] as const;

/**
 * One case.
 */
interface DefaultCase {
  readonly context: (typeof CONTEXTS)[number];
  readonly declared: (typeof DECLARED)[number];
  readonly fixed: boolean;
  readonly shadowed: boolean;
  readonly tokens: readonly string[];
  readonly type: (typeof TYPES)[number];
  readonly use: (typeof USES)[number];
}

/**
 * Draw a case's default under a swarm over the token classes: up to 8 tokens, each of a class the
 * swarm turns on.
 *
 * @param mix - The case's swarm.
 * @returns The generator.
 */
const tokensOf =
  (mix: Swarm<TokenClass>): Gen<readonly string[]> =>
  (source) =>
    Array.from({ length: source.draw(int(0, 8)) }, () =>
      source.draw(element(TOKEN_CLASSES[source.draw(swarmChoice(mix, TOKEN_CLASS_NAMES))])),
    );

/**
 * Draw a case under a fresh swarm.
 */
const caseOf: Gen<DefaultCase> = (source) => ({
  context: source.draw(element(CONTEXTS)),
  declared: source.draw(element(DECLARED)),
  fixed: source.draw(element([false, true])),
  shadowed: source.draw(element([false, false, true])),
  tokens: tokensOf(source.draw(swarm(TOKEN_CLASS_NAMES)))(source),
  type: source.draw(element(TYPES)),
  use: source.draw(element(USES)),
});

/**
 * Write a case's document.
 *
 * @param drawnCase - The case.
 * @returns The document's text.
 */
const textOf = (drawnCase: DefaultCase): string => {
  const subset = [
    `<!ENTITY e "${drawnCase.declared}">`,
    '<!ENTITY h "p&u;q">',
    ...(drawnCase.shadowed ? ['<!ATTLIST r a CDATA "first">'] : []),
    `<!ATTLIST r a ${drawnCase.type} ${drawnCase.fixed ? "#FIXED " : ""}"${drawnCase.tokens.join("")}">`,
    '<!ENTITY f "later">',
  ].join("");
  const root = drawnCase.use === "unused" ? "s" : "r";
  const body = drawnCase.use === "written" ? `<${root} a="b"/>` : `<${root}/>`;
  const declaration = drawnCase.context.startsWith("standalone")
    ? '<?xml version="1.0" standalone="yes"?>'
    : "";
  const external = {
    internal: "",
    public: ' PUBLIC "-//qti-pie//attribute defaults//EN" "r.dtd"',
    standalone: "",
    "standalone-system": ' SYSTEM "r.dtd"',
    system: ' SYSTEM "r.dtd"',
  }[drawnCase.context];

  return `${declaration}<!DOCTYPE ${root}${external} [${subset}]>${body}`;
};

/**
 * The type the case's root declares `a` with: `CDATA` where an earlier declaration shadows the
 * drawn one, since the first declaration of an attribute binds (XML 1.0 section 3.3).
 *
 * @param drawnCase - The case.
 * @returns The type that governs `a`.
 */
const boundType = (drawnCase: DefaultCase): string =>
  drawnCase.shadowed ? "CDATA" : drawnCase.type;

/**
 * An attribute's value as libxml2 writes it: each reference crust keeps cut out, as libxml2 expands
 * a reference it cannot resolve to nothing, and a tokenized type's value collapsed again, because
 * libxml2 normalizes after that expansion (section 3.3.3: runs of U+0020 made one, one at either
 * end removed).
 *
 * @param attribute - The attribute as crust reads it.
 * @param type - The type the attribute is declared with, if any.
 * @returns The attribute with that value and no references.
 */
const erased = (attribute: Attribute, type: string | undefined): Attribute => {
  let value = "";
  let from = 0;
  for (const { name, offset } of attribute.references) {
    value += attribute.value.slice(from, offset);
    from = offset + name.length + 2;
  }
  value += attribute.value.slice(from);

  return {
    ...attribute,
    references: [],
    value:
      type === undefined || type === "CDATA"
        ? value
        : value.replaceAll(/ +/gu, " ").replace(/^ /u, "").replace(/ $/u, ""),
  };
};

/**
 * What a case exercises.
 */
type Reached =
  | "refused by both"
  | "accepted by both"
  | "kept reference"
  | "ampersand as text"
  | "nested reference"
  | "later reference"
  | "tokenized"
  | "shadowed"
  | "standalone"
  | "unused";

/**
 * Name what a case reaches.
 *
 * @param drawnCase - The case.
 * @param document - Crust's tree, where it accepts the document.
 * @returns The situations.
 */
const reachedBy = (
  drawnCase: DefaultCase,
  document: XmlDocument | undefined,
): readonly Reached[] => [
  document === undefined ? "refused by both" : "accepted by both",
  ...(document?.root.attributes.some((attribute) => attribute.references.length > 0) === true
    ? (["kept reference"] as const)
    : []),
  ...(drawnCase.tokens.some((token) => ["&amp;", "&#38;", "&#x26;"].includes(token)) &&
  drawnCase.tokens.includes(";")
    ? (["ampersand as text"] as const)
    : []),
  ...(drawnCase.tokens.includes("&h;") ? (["nested reference"] as const) : []),
  ...(drawnCase.tokens.includes("&f;") ? (["later reference"] as const) : []),
  ...(drawnCase.type === "CDATA" ? [] : (["tokenized"] as const)),
  ...(drawnCase.shadowed ? (["shadowed"] as const) : []),
  ...(drawnCase.context.startsWith("standalone") ? (["standalone"] as const) : []),
  ...(drawnCase.use === "unused" ? (["unused"] as const) : []),
];

describe("crust's reader on attribute defaults", () => {
  it.effect(
    "agrees with xmllint --c14n on whether each document is well formed, and on its root's attributes",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* searchDefaults() {
          const fs = yield* FileSystem.FileSystem;
          const directory = yield* scratchDirectory("attribute-defaults-");

          return yield* explore(
            {
              caseHang: Duration.seconds(30),
              concurrency: 1,
              coverage: required<Reached>(
                [
                  "refused by both",
                  "accepted by both",
                  "kept reference",
                  "ampersand as text",
                  "nested reference",
                  "later reference",
                  "tokenized",
                  "shadowed",
                  "standalone",
                  "unused",
                ],
                { cases: 300, sense: notesOnly },
              ),
              draw: drawn(caseOf),
              kept: [],
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "libxml2's xmllint --c14n (XML 1.0 sections 3.3.3 and 4.1), its unresolved references expanded to nothing",
              },
              runs: 400,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/xml/attribute-defaults-against-xmllint",
            },
            (drawnCase, c) =>
              Effect.gen(function* agree() {
                const text = textOf(drawnCase);
                const file = `${directory}/case.xml`;
                yield* fs.writeFileString(file, text);

                const oracle = yield* Effect.result(xmllintC14n(file));
                const read = yield* Effect.result(readXml(new TextEncoder().encode(text)));
                const document = read._tag === "Success" ? read.success : undefined;
                c.noteAll(reachedBy(drawnCase, document));

                const expected =
                  drawnCase.tokens.includes("&f;") && oracle._tag === "Success"
                    ? "Failure"
                    : oracle._tag;

                assert.strictEqual(
                  read._tag,
                  expected,
                  `${text}: crust ${read._tag === "Success" ? "accepts" : `refuses (${Formatter.format(read.failure)})`}, xmllint ${oracle._tag === "Success" ? "accepts" : `refuses (${Formatter.format(oracle.failure)})`}`,
                );
                if (document === undefined || oracle._tag === "Failure" || expected === "Failure") {
                  return;
                }

                const types = new Map([["a", boundType(drawnCase)]]);
                const asLibxml2 = {
                  ...document,
                  root: {
                    ...document.root,
                    attributes: document.root.attributes.map((attribute) =>
                      erased(
                        attribute,
                        document.root.qname === "r" ? types.get(attribute.qname) : undefined,
                      ),
                    ),
                  },
                };

                assert.strictEqual(
                  new TextDecoder().decode(canonicalize(asLibxml2)),
                  new TextDecoder().decode(oracle.success),
                  text,
                );

                const again = yield* readXml(new TextEncoder().encode(yield* writeXml(document)));

                assert.deepStrictEqual(again.root, document.root, `${text}: the round trip`);
              }),
          );
        }).pipe(Effect.scoped, Effect.provide(TestLayer)),
      ),
    { timeout: 300_000 },
  );
});
