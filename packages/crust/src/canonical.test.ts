/* oxlint-disable unicorn/text-encoding-identifier-case -- The trees carry XML encoding labels (`UTF-8`) as documents spell them. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { canonicalize } from "#crust/canonical.ts";
import {
  arbitraryDocument,
  arbitrarySwarm,
  labelled,
  runSeed,
  GENERATED_TIMEOUT_MS,
  seeded,
  planeTrees,
} from "#crust/test/trees.ts";
import type { Bounds } from "#crust/test/trees.ts";
import type { Attribute, Child, Element, Misc, XmlDocument } from "#crust/tree.ts";

// The oracle: `canonical.ts` as it was at 1854123, the recursive canonicalizer, kept verbatim but
// for names and comments. It overflows the stack within a few thousand levels, so the trees below
// stay far shallower. Its escaping and sorting are the code under test's own, so what the
// differential proves is the walk: the order the iterative canonicalizer visits a tree in, and the
// scope it hands each element.

/**
 * The namespace name every namespace declaration's attribute is in.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * The namespace declarations in scope.
 */
type Scope = ReadonlyMap<string, string>;

/**
 * Compare two strings by code point.
 */
const compareCodePoints = (left: string, right: string): number => {
  const a = Array.from(left, (character) => character.codePointAt(0) ?? 0);
  const b = Array.from(right, (character) => character.codePointAt(0) ?? 0);
  const shared = Math.min(a.length, b.length);

  for (let index = 0; index < shared; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);

    if (difference !== 0) {
      return difference;
    }
  }

  return a.length - b.length;
};

/**
 * Escape a text run.
 */
const escapeText = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#xD;");

/**
 * Escape an attribute value.
 */
const escapeAttribute = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#x9;")
    .replaceAll("\n", "&#xA;")
    .replaceAll("\r", "&#xD;");

/**
 * Render an attribute value with each recorded reference as `&name;`.
 */
const renderValue = (attribute: Attribute): string => {
  let rendered = "";
  let position = 0;

  for (const reference of attribute.references) {
    rendered += escapeAttribute(attribute.value.slice(position, reference.offset));
    rendered += `&${reference.name};`;
    position = reference.offset + reference.name.length + 2;
  }

  return rendered + escapeAttribute(attribute.value.slice(position));
};

/**
 * The scope an element's own declarations make on top of its parent's.
 */
const scopeOf = (element: Element, parent: Scope): Scope => {
  const declared = new Map(parent);

  for (const attribute of element.attributes) {
    if (attribute.namespace === xmlnsNamespace) {
      declared.set(attribute.prefix === "xmlns" ? attribute.local : "", attribute.value);
    }
  }

  return declared;
};

/**
 * The declarations an element renders.
 */
const renderNamespaces = (scope: Scope, parent: Scope): string =>
  [...scope]
    .filter(([prefix, name]) => (parent.get(prefix) ?? "") !== name)
    .toSorted(([left], [right]) => compareCodePoints(left, right))
    .map(([prefix, name]) => (prefix === "" ? ` xmlns="${name}"` : ` xmlns:${prefix}="${name}"`))
    .join("");

/**
 * Render the attribute axis.
 */
const renderAttributes = (element: Element): string =>
  element.attributes
    .filter((attribute) => attribute.namespace !== xmlnsNamespace)
    .toSorted(
      (left, right) =>
        compareCodePoints(left.namespace, right.namespace) ||
        compareCodePoints(left.local, right.local),
    )
    .map((attribute) => ` ${attribute.qname}="${renderValue(attribute)}"`)
    .join("");

/**
 * Render a comment or a processing instruction.
 */
const renderMisc = (item: Misc): string =>
  item.kind === "comment"
    ? `<!--${item.text}-->`
    : `<?${item.target}${item.data === "" ? "" : ` ${item.data}`}?>`;

/**
 * Render an element and its children, by recursion.
 */
const renderElement = (element: Element, parent: Scope): string => {
  const scope = scopeOf(element, parent);
  const children = element.children
    .map((child: Child): string => {
      if (child.kind === "element") {
        return renderElement(child, scope);
      }

      if (child.kind === "text") {
        return escapeText(child.value);
      }

      if (child.kind === "entityRef") {
        return `&${child.name};`;
      }

      return renderMisc(child);
    })
    .join("");

  return `<${element.qname}${renderNamespaces(scope, parent)}${renderAttributes(element)}>${children}</${element.qname}>`;
};

/**
 * The recursive `canonicalize`.
 */
const recursiveCanonicalize = (doc: XmlDocument): Uint8Array => {
  const prolog = doc.prolog.map((item) => `${renderMisc(item)}\n`).join("");
  const epilog = doc.epilog.map((item) => `\n${renderMisc(item)}`).join("");

  return new TextEncoder().encode(`${prolog}${renderElement(doc.root, new Map())}${epilog}`);
};

// The tests.

/**
 * The text of canonical bytes, which are UTF-8, so two forms compare as strings.
 *
 * @param bytes - The canonical form.
 * @returns Its text.
 */
const text = (bytes: Uint8Array): string => new TextDecoder("utf-8", { fatal: true }).decode(bytes);

/**
 * The largest node count the box holds every tree tree of: the 197 ordered trees of 1 to 7 nodes.
 */
const BOX_NODES = 7;

/**
 * How many random documents each run compares, and the trees' bounds: depth and width small
 * enough for the recursive oracle, nodes enough for every kind and declaration to meet.
 */
const CASES = 400;

const CASE_BOUNDS: Bounds = { depth: 12, nodes: 64, width: 6 };

describe("canonicalize gives the recursive canonicalizer's bytes", () => {
  it.effect(
    `for every plane tree of 1 to ${BOX_NODES} nodes, labelled`,
    () =>
      Effect.sync(() => {
        let compared = 0;
        for (let nodes = 1; nodes <= BOX_NODES; nodes += 1) {
          for (const [index, tree] of planeTrees(nodes).entries()) {
            const doc: XmlDocument = {
              charset: "UTF-8",
              declaration: Option.none(),
              doctype: Option.none(),
              epilog: [],
              prolog: [],
              root: labelled(tree),
            };

            assert.strictEqual(
              text(canonicalize(doc)),
              text(recursiveCanonicalize(doc)),
              `plane tree ${index} of ${nodes} nodes`,
            );
            compared += 1;
          }
        }

        assert.strictEqual(compared, 197);
      }),
    GENERATED_TIMEOUT_MS,
  );

  it.effect(
    `for ${CASES} swarmed documents of at most ${CASE_BOUNDS.nodes} nodes, depth ${CASE_BOUNDS.depth} and width ${CASE_BOUNDS.width}`,
    () =>
      Effect.gen(function* everyCase() {
        for (let index = 0; index < CASES; index += 1) {
          const seed = `${runSeed}/${index}`;
          const doc = yield* seeded(seed, (choices) =>
            arbitraryDocument(choices, arbitrarySwarm(choices), CASE_BOUNDS),
          );

          assert.strictEqual(
            text(canonicalize(doc)),
            text(recursiveCanonicalize(doc)),
            `seed ${seed} (replay: CRUST_SEED=${runSeed})`,
          );
        }
      }),
    GENERATED_TIMEOUT_MS,
  );
});
