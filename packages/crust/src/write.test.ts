/* oxlint-disable unicorn/prefer-code-point -- The oracle's byte writers need UTF-16 code units, as `encode.ts` does. */
/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the encoder is given. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { classify } from "#crust/charset.ts";
import type { EncoderClass } from "#crust/charset.ts";
import { encode } from "#crust/encode.ts";
import { EncodeError } from "#crust/errors.ts";
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
import type { Attribute, Child, XmlDeclaration, XmlDocument } from "#crust/tree.ts";
import { writeXml } from "#crust/write.ts";

// The oracle: `write.ts` and `encode.ts` as they were at 1854123, the recursive writer, kept
// verbatim but for names and comments. It overflows the stack from about 2,000 levels, so the
// trees below stay far shallower. Its escaping is the code under test's own, so what the
// differential proves is the walk: the order the iterative writer visits, renders and searches a
// tree in, which is the writer's contract.

/**
 * The characters an attribute value always escapes, with the reference each becomes.
 */
const attributeEscapes: ReadonlyMap<string, string> = new Map([
  ["&", "&amp;"],
  ["<", "&lt;"],
  ['"', "&quot;"],
  ["\t", "&#x9;"],
  ["\n", "&#xA;"],
  ["\r", "&#xD;"],
]);

/**
 * The text of a numeric character reference to `codePoint`.
 */
const characterReference = (codePoint: number): string =>
  `&#x${codePoint.toString(16).toUpperCase()};`;

/**
 * Whether `character` lies above the threshold.
 */
const isAbove = (character: string, threshold: number): boolean =>
  (character.codePointAt(0) ?? 0) > threshold;

/**
 * Escape an attribute value, each code point above `threshold` as a character reference.
 */
const escapeAttribute = (value: string, threshold: number): string => {
  let escaped = "";

  for (const character of value) {
    escaped += isAbove(character, threshold)
      ? characterReference(character.codePointAt(0) ?? 0)
      : (attributeEscapes.get(character) ?? character);
  }

  return escaped;
};

/**
 * Render an attribute value with each recorded reference as `&name;`.
 */
const renderValue = (attribute: Attribute, threshold: number): string => {
  let rendered = "";
  let position = 0;

  for (const reference of attribute.references) {
    rendered += escapeAttribute(attribute.value.slice(position, reference.offset), threshold);
    rendered += `&${reference.name};`;
    position = reference.offset + reference.name.length + 2;
  }

  return rendered + escapeAttribute(attribute.value.slice(position), threshold);
};

/**
 * Escape a plain text run.
 */
const escapeText = (value: string, threshold: number): string => {
  let escaped = "";
  let previous = "";

  for (const character of value) {
    if (isAbove(character, threshold)) {
      escaped += characterReference(character.codePointAt(0) ?? 0);
    } else if (character === "&") {
      escaped += "&amp;";
    } else if (character === "<") {
      escaped += "&lt;";
    } else if (character === ">" && previous.endsWith("]]")) {
      escaped += "&gt;";
    } else if (character === "\r") {
      escaped += "&#xD;";
    } else {
      escaped += character;
    }

    previous = (previous + character).slice(-2);
  }

  return escaped;
};

/**
 * One CDATA section, a `]]>` inside it split across two.
 */
const section = (value: string): string =>
  `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;

/**
 * Write a CDATA run, closed around each reference it needs.
 */
const renderCdata = (value: string, threshold: number): string => {
  let rendered = "";
  let current = "";

  for (const character of value) {
    if (isAbove(character, threshold) || character === "\r") {
      rendered += current === "" ? "" : section(current);
      rendered += characterReference(character.codePointAt(0) ?? 0);
      current = "";
    } else {
      current += character;
    }
  }

  return current === "" && rendered !== "" ? rendered : rendered + section(current);
};

/**
 * Render a node, an element by recursion.
 */
const renderNode = (node: Child, threshold: number): string => {
  if (node.kind === "text") {
    return node.cdata ? renderCdata(node.value, threshold) : escapeText(node.value, threshold);
  }

  if (node.kind === "comment") {
    return `<!--${node.text}-->`;
  }

  if (node.kind === "pi") {
    return `<?${node.target}${node.data === "" ? "" : ` ${node.data}`}?>`;
  }

  if (node.kind === "entityRef") {
    return `&${node.name};`;
  }

  const attributes = node.attributes
    .map((attribute) => ` ${attribute.qname}="${renderValue(attribute, threshold)}"`)
    .join("");

  if (node.children.length === 0) {
    return `<${node.qname}${attributes}/>`;
  }

  const children = node.children.map((child) => renderNode(child, threshold)).join("");

  return `<${node.qname}${attributes}>${children}</${node.qname}>`;
};

/**
 * Render the XML declaration.
 */
const renderDeclaration = (declaration: XmlDeclaration): string => {
  const encoding = Option.match(declaration.encoding, {
    onNone: () => "",
    onSome: (value) => ` encoding="${value}"`,
  });
  const standalone = Option.match(declaration.standalone, {
    onNone: () => "",
    onSome: (value) => ` standalone="${value}"`,
  });

  return `<?xml version="${declaration.version}"${encoding}${standalone}?>`;
};

/**
 * The first code point of `value` above `threshold`.
 */
const firstAbove = (value: string, threshold: number): number | undefined => {
  for (const character of value) {
    if (isAbove(character, threshold)) {
      return character.codePointAt(0);
    }
  }

  return undefined;
};

/**
 * An `EncodeError` for the first code point of `value` above `threshold`.
 */
const unwritable = (
  value: string,
  where: EncodeError["where"],
  threshold: number,
): EncodeError | undefined => {
  const codePoint = firstAbove(value, threshold);

  return codePoint === undefined ? undefined : new EncodeError({ codePoint, threshold, where });
};

/**
 * The first unwritable construct under `node`, by recursion.
 */
const findInNode = (node: Child, threshold: number): EncodeError | undefined => {
  if (node.kind === "text") {
    return undefined;
  }

  if (node.kind === "comment") {
    return unwritable(node.text, "comment", threshold);
  }

  if (node.kind === "pi") {
    return unwritable(node.target, "pi", threshold) ?? unwritable(node.data, "pi", threshold);
  }

  if (node.kind === "entityRef") {
    return unwritable(node.name, "name", threshold);
  }

  const own = unwritable(node.qname, "name", threshold);

  if (own !== undefined) {
    return own;
  }

  for (const attribute of node.attributes) {
    const found =
      unwritable(attribute.qname, "name", threshold) ??
      attribute.references
        .map((reference) => unwritable(reference.name, "name", threshold))
        .find((error) => error !== undefined);

    if (found !== undefined) {
      return found;
    }
  }

  return node.children
    .map((child) => findInNode(child, threshold))
    .find((error) => error !== undefined);
};

/**
 * The first unwritable construct in the document.
 */
const findUnwritable = (doc: XmlDocument, threshold: number): EncodeError | undefined => {
  const doctype = Option.getOrUndefined(doc.doctype);

  return (
    (doctype === undefined ? undefined : unwritable(doctype, "doctype", threshold)) ??
    [...doc.prolog, doc.root, ...doc.epilog]
      .map((node) => findInNode(node, threshold))
      .find((error) => error !== undefined)
  );
};

/**
 * The recursive `writeXml`.
 */
const recursiveWriteXml = (
  doc: XmlDocument,
  options?: { readonly threshold: number },
): Effect.Effect<string, EncodeError> => {
  const threshold = options?.threshold ?? Number.POSITIVE_INFINITY;
  const failure = findUnwritable(doc, threshold);

  if (failure !== undefined) {
    return Effect.fail(failure);
  }

  const declaration = Option.match(doc.declaration, {
    onNone: () => "",
    onSome: (value) => `${renderDeclaration(value)}\n`,
  });
  const doctype = Option.match(doc.doctype, {
    onNone: () => "",
    onSome: (value) => `${value}\n`,
  });
  const prolog = doc.prolog.map((misc) => `${renderNode(misc, threshold)}\n`).join("");
  const epilog = doc.epilog.map((misc) => `\n${renderNode(misc, threshold)}`).join("");

  return Effect.succeed(
    `${declaration}${doctype}${prolog}${renderNode(doc.root, threshold)}${epilog}`,
  );
};

/**
 * Write `text` as one byte per UTF-16 code unit.
 */
const singleBytes = (text: string): Uint8Array => {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index += 1) {
    bytes[index] = text.charCodeAt(index);
  }

  return bytes;
};

/**
 * Write `text` as UTF-16 in the given byte order, led by its byte order mark.
 */
const utf16Bytes = (text: string, littleEndian: boolean): Uint8Array => {
  const bytes = new Uint8Array(2 + 2 * text.length);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 0xfe_ff, littleEndian);
  for (let index = 0; index < text.length; index += 1) {
    view.setUint16(2 + 2 * index, text.charCodeAt(index), littleEndian);
  }

  return bytes;
};

/**
 * The writer of each encoder class, over the recursive writer.
 */
const encoders: Record<
  EncoderClass,
  (doc: XmlDocument, label: string) => Effect.Effect<Uint8Array, EncodeError>
> = {
  ascii: (doc) => Effect.map(recursiveWriteXml(doc, { threshold: 0x7f }), singleBytes),
  "decode-only": () => Effect.fail(new EncodeError({ codePoint: 0, threshold: 0, where: "label" })),
  latin1: (doc) => Effect.map(recursiveWriteXml(doc, { threshold: 0xff }), singleBytes),
  utf16: (doc, label) =>
    Effect.map(recursiveWriteXml(doc), (text) =>
      utf16Bytes(text, classify(label).canonical !== "UTF-16BE"),
    ),
  utf8: (doc) => Effect.map(recursiveWriteXml(doc), (text) => new TextEncoder().encode(text)),
};

/**
 * The recursive `encode`.
 */
const recursiveEncode = (doc: XmlDocument, label: string): Effect.Effect<Uint8Array, EncodeError> =>
  encoders[classify(label).class](doc, label);

// The tests.

/**
 * One label of each encoder class, and both byte orders, so every writer and threshold is compared.
 */
const LABELS = ["UTF-8", "UTF-16", "UTF-16BE", "UTF-16LE", "ISO-8859-1", "US-ASCII", "Shift_JIS"];

/**
 * What one encode gave: its bytes in hex, or its failure's fields.
 */
type Outcome =
  | { readonly bytes: string; readonly kind: "bytes" }
  | {
      readonly codePoint: number;
      readonly kind: "failure";
      readonly threshold: number;
      readonly where: EncodeError["where"];
    };

/**
 * Run an encode and record what it gave, so two encoders' outcomes compare as plain values.
 *
 * @param effect - The encode.
 * @returns Its outcome.
 */
const outcomeOf = (effect: Effect.Effect<Uint8Array, EncodeError>): Effect.Effect<Outcome> =>
  Effect.match(effect, {
    onFailure: ({ codePoint, threshold, where }): Outcome => ({
      codePoint,
      kind: "failure",
      threshold,
      where,
    }),
    onSuccess: (bytes): Outcome => ({
      bytes: Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(""),
      kind: "bytes",
    }),
  });

/**
 * Check that `encode` and the recursive one give the same outcome for `doc` under every label, and
 * that `writeXml` with no threshold gives the recursive one's text.
 *
 * @param doc - The document.
 * @param name - What to name the case by in a failure: its seed or its tree.
 * @returns Nothing; fails the test at the first label whose outcomes differ.
 */
const agrees = Effect.fnUntraced(function* agreesWithRecursive(doc: XmlDocument, name: string) {
  for (const label of LABELS) {
    assert.deepStrictEqual(
      yield* outcomeOf(encode(doc, label)),
      yield* outcomeOf(recursiveEncode(doc, label)),
      `${name}, label ${label}`,
    );
  }

  assert.strictEqual(yield* writeXml(doc), yield* recursiveWriteXml(doc), `${name}, writeXml`);
});

/**
 * A document holding only `root`.
 *
 * @param root - The root element.
 * @returns The document.
 */
const bare = (root: XmlDocument["root"]): XmlDocument => ({
  charset: "UTF-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  prolog: [],
  root,
});

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

describe("encode gives the recursive writer's bytes", () => {
  it.effect(
    `for every plane tree of 1 to ${BOX_NODES} nodes, labelled, under every encoder class`,
    () =>
      Effect.gen(function* everyPlaneTree() {
        let compared = 0;
        for (let nodes = 1; nodes <= BOX_NODES; nodes += 1) {
          for (const [index, tree] of planeTrees(nodes).entries()) {
            yield* agrees(bare(labelled(tree)), `plane tree ${index} of ${nodes} nodes`);
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
          yield* agrees(doc, `seed ${seed} (replay: CRUST_SEED=${runSeed})`);
        }
      }),
    GENERATED_TIMEOUT_MS,
  );
});
