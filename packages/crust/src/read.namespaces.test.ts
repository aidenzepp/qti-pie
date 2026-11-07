import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { element as oneOf } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option } from "effect";
import { SaxesParser } from "saxes";
import { readXml } from "#crust/read.ts";
import { caseHang, generatedTree, GENERATED_TIMEOUT_MS, situationsOf } from "#crust/test/trees.ts";
import type { Bounds, TreeFeature, TreeSituation } from "#crust/test/trees.ts";
import type { Child, Element, XmlDocument } from "#crust/tree.ts";
import { writeXml } from "#crust/write.ts";

/**
 * What a parse resolved, in document order: each element's name and namespace, then each of its
 * attributes', or where its first well-formedness error stands, as the line and column its message
 * opens with. The two readers word an error differently; they must refuse at the same place.
 */
type Resolved =
  | { readonly kind: "names"; readonly names: readonly string[] }
  | { readonly kind: "error"; readonly at: string };

/**
 * The `line:column` a well-formedness message opens with, as `saxes` and crust's namespace pass
 * both write it.
 *
 * @param message - The message.
 * @returns Its position, or the whole message when it opens with none.
 */
const positionIn = (message: string): string => /^\d+:\d+/u.exec(message)?.[0] ?? message;

/**
 * The oracle: the namespaces `saxes` resolves in its own namespace mode, a second
 * implementation of Namespaces in XML. crust reads with `saxes`'s namespaces off and resolves every
 * name in its own pass, after the attribute-list defaults are added (`#crust/namespaces.ts`); on a
 * document with no default, the two must resolve the same names and refuse at the same place.
 *
 * @param text - The document.
 * @returns What `saxes` resolved.
 */
const bySaxes = (text: string): Resolved => {
  const parser = new SaxesParser({ position: true, xmlns: true });
  const names: string[] = [];
  const errors: string[] = [];
  parser.on("opentag", (tag) => {
    names.push(`${tag.name} ${tag.uri}`);
    for (const attribute of Object.values(tag.attributes)) {
      names.push(`@${attribute.name} ${attribute.uri}`);
    }
  });
  parser.on("error", (error) => {
    errors.push(error.message);
  });
  parser.write(text).close();

  const [first] = errors;

  return first === undefined ? { kind: "names", names } : { at: positionIn(first), kind: "error" };
};

/**
 * Each element's name and namespace in document order, then each of its attributes'.
 *
 * @param root - The tree.
 * @returns The names, as {@link bySaxes} lists them.
 */
const namesOf = (root: Element): readonly string[] => [
  `${root.qname} ${root.namespace}`,
  ...root.attributes.map((attribute) => `@${attribute.qname} ${attribute.namespace}`),
  ...root.children.flatMap((child) => (child.kind === "element" ? namesOf(child) : [])),
];

/**
 * What `readXml` resolved for `text`.
 *
 * @param text - The document.
 * @returns The names it resolved, or its well-formedness error's message.
 */
const read = (text: string): Effect.Effect<Resolved> =>
  readXml(new TextEncoder().encode(text)).pipe(
    Effect.match({
      onFailure: (error): Resolved => ({
        at: error._tag === "WellFormednessError" ? positionIn(error.message) : error.detail,
        kind: "error",
      }),
      onSuccess: (doc): Resolved => ({ kind: "names", names: namesOf(doc.root) }),
    }),
  );

/**
 * The declarations one element of a chain may carry: none, the default bound, the default
 * undeclared, and the prefix `p` bound to either of two names, so a chain overrides and
 * undeclares what its ancestors bound.
 */
const DECLARATIONS = ["", ' xmlns="urn:a"', ' xmlns=""', ' xmlns:p="urn:a"', ' xmlns:p="urn:b"'];

/**
 * How one element of a chain uses a namespace: unprefixed, prefixed `p`, or unprefixed with an
 * attribute prefixed `p` and one under `xml`. Where `p` is bound nowhere the chain is not
 * well-formed, and both parses must refuse it with the same error.
 */
const USES = [
  (level: number) => ({ attributes: "", name: `e${level}` }),
  (level: number) => ({ attributes: "", name: `p:e${level}` }),
  (level: number) => ({ attributes: ' p:x="1" xml:lang="en"', name: `e${level}` }),
];

/**
 * The depth of every chain in the box: three elements, so each of the 15 choices per element meets
 * each choice of its parent and its grandparent.
 */
const CHAIN_DEPTH = 3;

/**
 * Every chain of `depth` elements over the declarations and uses.
 *
 * @param depth - The chain's depth.
 * @returns The documents.
 */
const chains = (depth: number): readonly string[] => {
  let documents = [{ close: "", open: "" }];
  for (let level = 0; level < depth; level += 1) {
    documents = documents.flatMap(({ close, open }) =>
      DECLARATIONS.flatMap((declaration) =>
        USES.map((use) => {
          const { attributes, name } = use(level);

          return {
            close: `</${name}>${close}`,
            open: `${open}<${name}${declaration}${attributes}>`,
          };
        }),
      ),
    );
  }

  return documents.map(({ close, open }) => open + close);
};

/**
 * A document holding only `root`.
 *
 * @param root - The root element.
 * @returns The document.
 */
const bare = (root: Element): XmlDocument => ({
  charset: "utf-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  prolog: [],
  root,
});

/**
 * How many rotating cases each run's search reads, beside its floor and steered witnesses, and the
 * bounds each case draws its own within.
 */
const CASES = 400;

const CASE_BOUNDS: Bounds = { depth: 12, nodes: 64, width: 6 };

/**
 * The features the round trip draws: every one of `treeFeatures` but entity references, in an
 * attribute value or as a child, since the reader refuses an entity the document does not declare.
 */
const roundTripFeatures = [
  "text",
  "element",
  "cdata",
  "comment",
  "pi",
  "attribute",
  "declaration",
  "wild",
] as const satisfies readonly TreeFeature[];

/**
 * The situations the round trip's witnesses must reach: every one of `treeSituations` but those of
 * entity references.
 */
const roundTripSituations = [
  "text",
  "element",
  "cdata",
  "comment",
  "pi",
  "attribute",
  "bare root",
  "declaration",
  "deep",
  "wild",
] as const satisfies readonly TreeSituation[];

/**
 * Make line ends line feeds, as a parser does before it reads markup (XML 1.0 section 2.11): a
 * comment or a processing instruction cannot escape a carriage return, so it reads back this way.
 *
 * @param text - The characters as written.
 * @returns Them as read.
 */
const lineFeeds = (text: string): string => text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");

/**
 * A tree's children as XML's information set holds them (XML Infoset 1.0, sections 2.4, 2.6 and
 * 2.7; XML 1.0 section 2.11): each run of adjacent text, CDATA sections among it, is one run of
 * characters, and an empty run is none, since a CDATA boundary is no information item and the
 * writer splits a section around `]]>` and each carriage return; a comment's text and a processing
 * instruction's data with their line ends made line feeds; and the instruction's data without the
 * white space that follows its target, which its `[content]` excludes. An element-only tree is its
 * own form.
 *
 * @param element - The tree.
 * @returns It in that form.
 */
const infosetOf = (element: Element): Element => {
  const children: Child[] = [];
  for (const child of element.children) {
    const last = children.at(-1);
    switch (child.kind) {
      case "text": {
        if (last?.kind === "text") {
          children[children.length - 1] = { ...last, value: last.value + child.value };
        } else {
          children.push({ cdata: false, kind: "text", value: child.value });
        }

        break;
      }
      case "comment": {
        children.push({ kind: "comment", text: lineFeeds(child.text) });
        break;
      }
      case "pi": {
        children.push({ ...child, data: lineFeeds(child.data).replace(/^[ \t\n]+/u, "") });
        break;
      }
      case "element": {
        children.push(infosetOf(child));
        break;
      }
      case "entityRef": {
        children.push(child);
        break;
      }
      default: {
        return child satisfies never;
      }
    }
  }

  return {
    ...element,
    children: children.filter((child) => child.kind !== "text" || child.value !== ""),
  };
};

describe("readXml resolves every namespace as saxes does in its namespace mode", () => {
  it.effect(
    `for every chain ${CHAIN_DEPTH} deep over ${DECLARATIONS.length} declarations and ${USES.length} uses, well-formed or not`,
    () =>
      Effect.gen(function* everyChain() {
        const documents = chains(CHAIN_DEPTH);
        let refused = 0;
        for (const text of documents) {
          const oracle = bySaxes(text);
          assert.deepStrictEqual(yield* read(text), oracle, text);
          refused += oracle.kind === "error" ? 1 : 0;
        }

        assert.strictEqual(documents.length, 15 ** CHAIN_DEPTH);
        assert.isAbove(refused, 0);
        assert.isBelow(refused, documents.length);
      }),
    GENERATED_TIMEOUT_MS,
  );

  it.effect(
    `and reads back the tree, by the generator's namespace model and XML's information set, for swarmed trees of elements, text, CDATA, comments and processing instructions, each within ${CASE_BOUNDS.nodes} nodes, depth ${CASE_BOUNDS.depth} and width ${CASE_BOUNDS.width}: ${CASES} rotating cases a run beside the witnesses`,
    (ctx) =>
      // Bound: the drawn trees, each with its own swarm over `roundTripFeatures` and bounds within
      // CASE_BOUNDS; the witnesses reach every situation of `roundTripSituations`.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<TreeSituation>(roundTripSituations, {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn(generatedTree(CASE_BOUNDS, roundTripFeatures)),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "universal",
              name: "read ∘ write = id in the information set's form (infosetOf), and saxes's namespace mode resolving the generator's names",
            },
            runs: CASES,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "crust/read/namespaces",
          },
          ({ root: tree }, c) =>
            Effect.gen(function* roundTrip() {
              c.noteAll(situationsOf(tree));

              const text = yield* writeXml(bare(tree));
              const doc = yield* readXml(new TextEncoder().encode(text));

              assert.deepStrictEqual(infosetOf(doc.root), infosetOf(tree));
              assert.deepStrictEqual(bySaxes(text), { kind: "names", names: namesOf(tree) });
            }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );
});

/**
 * The attribute names an attribute-list default is declared under: a name in the `xml` namespace,
 * two prefixed names, the default and two prefixed namespace declarations, the two reserved
 * declarations, a plain name and one that is no qualified name.
 */
const DEFAULT_NAMES = [
  "xml:space",
  "p:a",
  "q:a",
  "xmlns",
  "xmlns:p",
  "xmlns:q",
  "xmlns:xml",
  "xmlns:xmlns",
  "a",
  "a:b:c",
] as const;

/**
 * The values a default gives: two namespace names, the empty value, the `xml` namespace's name and
 * a plain token.
 */
const DEFAULT_VALUES = [
  "urn:p",
  "urn:q",
  "",
  "http://www.w3.org/XML/1998/namespace",
  "preserve",
] as const;

/**
 * What the root writes beside the default: nothing, a declaration of `p` or of `q` to the name
 * `urn:p` or of both, an attribute named `p:a` or `q:a`, the default namespace, or `q:a` beside the
 * declarations that give it the expanded name a default `p:a` would have.
 */
const WRITTEN = [
  "",
  ' xmlns:p="urn:p"',
  ' xmlns:q="urn:p"',
  ' xmlns:p="urn:p" xmlns:q="urn:p"',
  ' p:a="1"',
  ' q:a="1"',
  ' xmlns="urn:x"',
  ' xmlns:q="urn:p" q:a="1"',
  ' xmlns:p="urn:p" xmlns:q="urn:p" q:a="1"',
] as const;

/**
 * The root's names: unprefixed, and prefixed `p`.
 */
const ROOTS = ["r", "p:r"] as const;

/**
 * What the root holds: nothing, an unprefixed child, or a child prefixed `p`.
 */
const CHILDREN = ["", "<c/>", "<p:c/>"] as const;

/**
 * One case of the box: a root that is given one attribute-list default and writes some attributes
 * and a child of its own.
 */
interface Defaulted {
  readonly child: (typeof CHILDREN)[number];
  readonly name: (typeof DEFAULT_NAMES)[number];
  readonly root: (typeof ROOTS)[number];
  readonly value: (typeof DEFAULT_VALUES)[number];
  readonly written: (typeof WRITTEN)[number];
}

/**
 * Every case: each default name and value, root, written set and child.
 */
const defaulted: Gen<Defaulted> = (source) => ({
  child: source.draw(oneOf(CHILDREN)),
  name: source.draw(oneOf(DEFAULT_NAMES)),
  root: source.draw(oneOf(ROOTS)),
  value: source.draw(oneOf(DEFAULT_VALUES)),
  written: source.draw(oneOf(WRITTEN)),
});

/**
 * The size of {@link defaulted}'s box.
 */
const DEFAULTED =
  DEFAULT_NAMES.length * DEFAULT_VALUES.length * ROOTS.length * WRITTEN.length * CHILDREN.length;

/**
 * Write a case twice: with the default declared and left to the reader, and with the same
 * attribute written last in the root's start tag, unless the root writes it already, where XML 1.0
 * section 3.3.2 adds no default.
 *
 * @param cased - The case.
 * @param cased.child - The root's child.
 * @param cased.name - The default's attribute name.
 * @param cased.root - The root's name.
 * @param cased.value - The default's value.
 * @param cased.written - The attributes the root writes.
 * @returns The two documents.
 */
const documentsOf = ({ child, name, root, value, written }: Defaulted) => {
  const doctype = `<!DOCTYPE ${root} [<!ATTLIST ${root} ${name} CDATA "${value}">]>`;
  const writes = written.includes(` ${name}=`);
  const end = child === "" ? "/>" : `>${child}</${root}>`;

  return {
    defaulted: `${doctype}<${root}${written}${end}`,
    explicit: `${doctype}<${root}${written}${writes ? "" : ` ${name}="${value}"`}${end}`,
  };
};

describe("readXml resolves namespaces over the attributes it defaults", () => {
  it.effect(
    `as saxes resolves the same attributes written, for every default name, value, root, written set and child, exhausted: ${String(DEFAULTED)} documents`,
    (ctx) =>
      // Oracle: XML 1.0 section 3.3.2 ("the processor MUST behave as though the attribute were
      // present with the declared default value") with Namespaces in XML section 3 (declarations
      // "may be provided directly or by default"): the defaulted document resolves as `saxes`'s
      // namespace mode, a second implementation, resolves the document with the default written.
      // The written form is longer, so a refusal is compared as a refusal, not by position.
      searched(
        ctx,
        exhaust(
          {
            box: "every default of 10 names and 5 values, on 2 roots writing 9 attribute sets around 3 children",
            caseHang,
            coverage: requiredInSpace<(typeof DEFAULT_NAMES)[number] | "refused" | "read">([
              "refused",
              "read",
              ...DEFAULT_NAMES,
            ]),
            generator: defaulted,
            limit: DEFAULTED,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "saxes's namespace mode on the document with the default written, by XML 1.0 section 3.3.2",
            },
            suite: "crust/read/namespaces-defaulted",
          },
          (cased, c) =>
            Effect.gen(function* resolvesAsWritten() {
              const { defaulted: text, explicit } = documentsOf(cased);
              const expected = bySaxes(explicit);
              const actual = yield* read(text);
              c.note(cased.name);
              c.note(expected.kind === "error" ? "refused" : "read");

              assert.deepStrictEqual(
                actual.kind === "error" ? "refused" : actual,
                expected.kind === "error" ? "refused" : expected,
                `${text} against ${explicit}`,
              );
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, DEFAULTED);
          }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );
});
