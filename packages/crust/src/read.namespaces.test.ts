import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { SaxesParser } from "saxes";
import { readXml } from "#crust/read.ts";
import {
  arbitrarySwarm,
  arbitraryTree,
  runSeed,
  GENERATED_TIMEOUT_MS,
  seeded,
} from "#crust/test/trees.ts";
import type { Bounds } from "#crust/test/trees.ts";
import type { Child, Element, XmlDocument } from "#crust/tree.ts";
import { writeXml } from "#crust/write.ts";

/**
 * What a parse resolved, in document order: each element's name and namespace, then each of its
 * attributes', or the first well-formedness error's message, which carries its line and column.
 */
type Resolved =
  | { readonly kind: "names"; readonly names: readonly string[] }
  | { readonly kind: "error"; readonly message: string };

/**
 * The oracle: the namespaces `saxes` resolves with nothing seeded, its own walk over the open
 * elements answering every prefix. The reader at 1854123 copied exactly these into its tree, so
 * the property proves the seed changes no name the reader resolves and no error it raises.
 *
 * @param text - The document.
 * @returns What `saxes` resolved.
 */
const unseeded = (text: string): Resolved => {
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

  return first === undefined ? { kind: "names", names } : { kind: "error", message: first };
};

/**
 * Each element's name and namespace in document order, then each of its attributes'.
 *
 * @param root - The tree.
 * @returns The names, as {@link unseeded} lists them.
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
        kind: "error",
        message: error._tag === "WellFormednessError" ? error.message : error.detail,
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
 * How many swarmed trees each run reads, and their bounds.
 */
const CASES = 400;

const CASE_BOUNDS: Bounds = { depth: 12, nodes: 64, width: 6 };

/**
 * The kinds of child a tree holds, a CDATA section apart from text: what the swarm reached.
 *
 * @param root - The tree.
 * @returns Each kind once.
 */
const kindsOf = (root: Element): ReadonlySet<string> =>
  new Set(
    root.children.flatMap((child) => {
      if (child.kind === "element") {
        return ["element", ...kindsOf(child)];
      }

      return [child.kind === "text" && child.cdata ? "cdata" : child.kind];
    }),
  );

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

describe("readXml resolves every namespace as saxes does unseeded", () => {
  it.effect(
    `for every chain ${CHAIN_DEPTH} deep over ${DECLARATIONS.length} declarations and ${USES.length} uses, well-formed or not`,
    () =>
      Effect.gen(function* everyChain() {
        const documents = chains(CHAIN_DEPTH);
        let refused = 0;
        for (const text of documents) {
          const oracle = unseeded(text);
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
    `and reads back the tree, by the generator's namespace model and XML's information set, for ${CASES} swarmed trees of elements, text, CDATA, comments and processing instructions, at most ${CASE_BOUNDS.nodes} nodes, depth ${CASE_BOUNDS.depth} and width ${CASE_BOUNDS.width}`,
    () =>
      // Oracle: a universal one, the round trip read ∘ write, each side compared in the information set's
      // form (`infosetOf`), which is the identity on an element-only tree; and saxes with nothing
      // seeded as a second implementation of the names.
      Effect.gen(function* everyCase() {
        const mixed = new Set<string>();
        for (let index = 0; index < CASES; index += 1) {
          const seed = `${runSeed}/${index}`;
          const name = `seed ${seed} (replay: CRUST_SEED=${runSeed})`;
          // No entity references: the reader refuses an entity the document does not declare.
          const tree = yield* seeded(seed, (choices) => {
            const swarm = arbitrarySwarm(choices);

            return arbitraryTree(
              choices,
              { ...swarm, kinds: { ...swarm.kinds, entityRef: 0 }, references: 0 },
              CASE_BOUNDS,
            );
          });
          const text = yield* writeXml(bare(tree));
          const doc = yield* readXml(new TextEncoder().encode(text));
          for (const kind of kindsOf(tree)) {
            mixed.add(kind);
          }

          assert.deepStrictEqual(infosetOf(doc.root), infosetOf(tree), name);
          assert.deepStrictEqual(unseeded(text), { kind: "names", names: namesOf(tree) }, name);
        }

        assert.deepStrictEqual(
          [...mixed].toSorted(),
          ["cdata", "comment", "element", "pi", "text"],
          "the cases held every kind of child but entity references",
        );
      }),
    GENERATED_TIMEOUT_MS,
  );
});
