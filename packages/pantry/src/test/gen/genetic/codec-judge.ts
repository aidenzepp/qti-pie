/* oxlint-disable unicorn/text-encoding-identifier-case -- The codec search spells encoding labels (`UTF-8`, `UTF-16LE`) as XML 1.0 section 4.3.3 and crust's trees spell them: they are the data under test, not names passed to a Node encoding API. */
/**
 * The codec search's judge: the oracles every bred document is held to, each independent of the
 * code it judges, run over one generation at once.
 *
 * - **O1, well-formedness:** crust's reader accepts a document exactly when libxml2's (`xmllint
 *   --noout --nonet`) does, a namespace error counting as a refusal (Namespaces in XML 1.0, section
 *   7: a conforming document is namespace-well-formed). A document whose declaration names another
 *   encoding than its bytes are in is a class of its own (XML 1.0 section 4.3.3).
 * - **O2, crust's own cycle:** a tree crust reads, written by crust in the label it was read under
 *   and read again, is the same tree, field for field; and the bytes crust writes decode, under
 *   Node's own decoder for that label, to the text crust's writer wrote.
 * - **O3, canonical XML:** for a document libxml2 can expand fully, one with no external subset whose
 *   every reference crust expanded, crust's `canonicalize` of its tree is the bytes `xmllint --c14n
 *   --nonet` writes (Canonical XML 1.0: entities expanded, defaults added).
 * - **O4, the codec:** for each version, a tree shred admits is written by unshred and read back by
 *   crust and shred to the same rows (`flatten`), to the same canonical form, and with each
 *   element's attributes and namespace declarations in the order they were read (spec reading 137);
 *   unshred's erasures (a CDATA section as text, one run per stretch of character data,
 *   declarations before attributes) are exactly what canonical XML erases.
 * - **O5, crust's decoder:** the tree crust reads from the bytes is the tree it reads from the same
 *   text decoded by Node's decoders, by the byte order mark, XML 1.0 Appendix F's patterns and the
 *   declared label, and written as UTF-8.
 * - **O6, the references crust keeps:** for a document with an external subset, each reference crust
 *   keeps unexpanded stands where libxml2 reads one, judged by declaring each such entity with a
 *   marker as its text and comparing canonical forms.
 *
 * Every oracle's outcome is also a feature, the comparison logged (a refusal's rule, libxml2's
 * message class, the codec's verdict), so the search is steered toward the boundaries where the
 * implementations decide.
 */
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { Effect, FileSystem, Option, Result } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { encode } from "@qti-pie/crust/encode.ts";
import type { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Attribute, Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { writeXml } from "@qti-pie/crust/write.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import type { ShredGrammar } from "#pantry/model/shred.ts";
import { unshred } from "#pantry/model/unshred.ts";
import type { XdmNames } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import {
  declaredEntities,
  genomeFeatures,
  mapPiecesOf,
  predefinedNames,
  rendered,
} from "#pantry/test/gen/genetic/codec-genome.ts";
import type { CodecGenome, Declaration, Piece } from "#pantry/test/gen/genetic/codec-genome.ts";
import type { Judgment } from "#pantry/test/gen/genetic/engine.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { xmllintRun } from "#pantry/xml/oracle.ts";

/**
 * Which oracle a disagreement breaks.
 */
export type OracleName = "O1" | "O2" | "O3" | "O4" | "O5" | "O6";

/**
 * One disagreement: the oracle, its class (the signature a run keys its findings by, coarse enough
 * that one cause is one class), and what each side said.
 */
export interface CodecDisagreement {
  readonly detail: string;
  readonly oracle: OracleName;
  readonly signature: string;
}

/**
 * What the judge reads beside the genomes: the folder it writes each document to, the grammar
 * shred reads through and the names unshred writes, and how many `xmllint` processes run at once.
 */
export interface CodecWorld {
  readonly concurrency: number;
  readonly directory: string;
  readonly grammar: ShredGrammar<Composed>;
  readonly names: XdmNames<Composed>;
}

/**
 * What one oracle found: the features its outcome shows and the disagreements it found.
 */
interface Found {
  readonly disagreements: readonly CodecDisagreement[];
  readonly features: readonly string[];
}

/**
 * The namespace name of namespace declarations, which crust reads as attributes.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * Run `xmllint` through the oracle's one runner; an `xmllint` that does not start is a defect of
 * the machine, not of a document, and dies.
 *
 * @param args - The arguments, the file last.
 * @returns Its exit status, standard output and standard error.
 */
const xmllint = (args: readonly string[]) => xmllintRun(args).pipe(Effect.orDie);

/**
 * Blank one `xmllint` error line's names and numbers, so one rule of libxml2's is one class however
 * the document names things.
 *
 * @param line - The line.
 * @returns The message's class.
 */
const messageClass = (line: string): string =>
  line
    .replace(/^.*? (?:parser|namespace) error : /u, "")
    .replaceAll(/'[^']*'/gu, "'_'")
    .replaceAll(/%[^\s;%]+;/gu, "%_;")
    .replaceAll(/"[^"]*"/gu, '"_"')
    .replaceAll(/\b\d+\b/gu, "N")
    .replaceAll(
      /\b(?:prefix|on|of|for|tag|element|attribute|entity) \S+/gu,
      (match) => `${match.split(" ")[0] ?? ""} _`,
    )
    .trim()
    .slice(0, 80);

/**
 * Class an `xmllint` refusal by its errors' messages: every error's class once, sorted, a run that
 * exits 0 having refused for its namespace errors alone. libxml2's report does not mark which error
 * was fatal, so the class is the set.
 *
 * @param stderr - What it wrote.
 * @param exited - Its exit status.
 * @returns The class.
 */
export const libxml2Class = (stderr: string, exited: number): string => {
  const errors = stderr.split("\n").filter((held) => / (?:parser|namespace) error : /u.test(held));
  const lines = exited === 0 ? errors.filter((held) => / namespace error : /u.test(held)) : errors;
  const classes = new Set(
    (lines.length === 0 ? [stderr.split("\n")[0] ?? ""] : lines).map((line) => messageClass(line)),
  );
  // An entity whose text fails to parse for an undeclared reference in it is its own class: the
  // reference's WFC holds only where no external subset can declare it (XML 1.0 section 4.1).
  if (classes.has("Entity '_' failed to parse") && classes.has("Entity '_' not defined")) {
    classes.delete("Entity '_' failed to parse");
    classes.delete("Entity '_' not defined");
    classes.add("Entity '_' not defined in an entity's replacement text");
  }

  return [...classes].toSorted().join(" + ");
};

/**
 * Write a reader's refusal as one line: its rule and detail, or its message.
 *
 * @param failure - The refusal.
 * @returns The line.
 */
const refusalText = (failure: ReaderRefusal | WellFormednessError): string =>
  failure._tag === "ReaderRefusal" ? `${failure.rule}: ${failure.detail}` : failure.message;

/**
 * Name a reader's refusal by its rule, `well-formedness` for the parser's own.
 *
 * @param failure - The refusal.
 * @returns The rule.
 */
const refusalRule = (failure: ReaderRefusal | WellFormednessError): string =>
  failure._tag === "ReaderRefusal" ? failure.rule : "well-formedness";

/**
 * The encoding a document's first bytes say it is in, by its byte order mark or XML 1.0 Appendix
 * F's UTF-16 patterns, none for bytes of the ASCII-compatible family.
 *
 * @param bytes - The document.
 * @returns The encoding.
 */
const familyOf = (bytes: Uint8Array): Option.Option<string> => {
  const starts = (prefix: readonly number[]): boolean =>
    prefix.every((byte, at) => bytes[at] === byte);
  if (starts([0xef, 0xbb, 0xbf])) {
    return Option.some("UTF-8");
  }

  if (starts([0xfe, 0xff]) || starts([0x00, 0x3c, 0x00, 0x3f])) {
    return Option.some("UTF-16BE");
  }

  return starts([0xff, 0xfe]) || starts([0x3c, 0x00, 0x3f, 0x00])
    ? Option.some("UTF-16LE")
    : Option.none();
};

/**
 * The label a document's XML declaration names, read in the encoding its first bytes say.
 *
 * @param bytes - The document.
 * @param family - Its encoding by its first bytes.
 * @returns The label, none when it names none.
 */
const declaredLabel = (bytes: Uint8Array, family: Option.Option<string>): Option.Option<string> => {
  const head = bytes.subarray(0, 400);
  const text = Option.match(family, {
    onNone: () => Array.from(head, (byte) => String.fromCodePoint(byte)).join(""),
    onSome: (held) => new TextDecoder(held === "UTF-8" ? "utf-8" : held.toLowerCase()).decode(head),
  });

  return Option.fromNullishOr(
    /^\uFEFF?<\?xml\s[^?]*?encoding\s*=\s*["'](?<label>[^"']*)["']/u.exec(text)?.groups?.["label"],
  );
};

/**
 * Whether a document's declaration names an encoding other than the one its bytes are in: a UTF-8
 * mark declaring anything but UTF-8, a UTF-16 mark or pattern declaring no UTF-16 label or the
 * other byte order, or bytes of the ASCII-compatible family declaring UTF-16. XML 1.0 section 4.3.3
 * makes each a fatal error, so every disagreement on such a document is its own class.
 *
 * @param bytes - The document.
 * @returns The mismatch, as `bytes declare label`, or none.
 */
export const declaredAgainstBytes = (bytes: Uint8Array): Option.Option<string> => {
  const family = familyOf(bytes);

  return declaredLabel(bytes, family).pipe(
    Option.flatMap((label) => {
      const upper = label.toUpperCase();
      const utf16 = upper === "UTF-16" || upper === "UTF-16LE" || upper === "UTF-16BE";
      const agrees = Option.match(family, {
        onNone: () => !utf16,
        onSome: (held) =>
          held === "UTF-8" ? upper === "UTF-8" : upper === "UTF-16" || upper === held,
      });

      return agrees
        ? Option.none()
        : Option.some(`${Option.getOrElse(family, () => "ASCII-family")} bytes declare ${label}`);
    }),
  );
};

/**
 * Whether a document crust read names an external subset, which libxml2 under `--nonet` never
 * reads: its doctype's text names a `SYSTEM` or `PUBLIC` identifier.
 *
 * @param tree - The tree crust read.
 * @returns Whether it names one.
 */
const hasExternal = (tree: XmlDocument): boolean =>
  Option.exists(tree.doctype, (text) => /^<!DOCTYPE\s+\S+\s+(?:SYSTEM|PUBLIC)\b/u.test(text));

/**
 * Every element of a tree, in document order, without recursion.
 *
 * @param root - The root.
 * @returns The elements.
 */
const elementsIn = (root: Element): readonly Element[] => {
  const out: Element[] = [];
  const stack: Element[] = [root];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    out.push(next);
    stack.push(
      ...next.children.filter((child): child is Element => child.kind === "element").toReversed(),
    );
  }

  return out;
};

/**
 * Whether a tree holds an unexpanded entity reference, in content or in a value.
 *
 * @param root - The root.
 * @returns Whether one stands anywhere below it.
 */
const holdsReferences = (root: Element): boolean =>
  elementsIn(root).some(
    (element) =>
      element.attributes.some(({ references }) => references.length > 0) ||
      element.children.some((child) => child.kind === "entityRef"),
  );

/**
 * One difference between two crust trees: its class and what each side holds.
 */
interface TreeDifference {
  readonly detail: string;
  readonly what: string;
}

/**
 * The most differences {@link treeDifferences} reports, so one tree's many differences of one
 * class never flood a report, while differences of other classes stay visible.
 */
const mostDifferences = 6;

/**
 * Whether two attributes, or two elements, have the same name parts.
 *
 * @param left - The first.
 * @param right - The second.
 * @returns Whether their qualified names, local names, prefixes and namespaces agree.
 */
const sameName = (left: Attribute | Element, right: Attribute | Element): boolean =>
  left.qname === right.qname &&
  left.namespace === right.namespace &&
  left.local === right.local &&
  left.prefix === right.prefix;

/**
 * Find where two elements' own parts differ, their attributes and their non-element children, and
 * pair their element children for the walk to compare next.
 *
 * @param left - The first element.
 * @param right - The second.
 * @param add - Records a difference by its class.
 * @returns The element children to compare, in pairs.
 */
const elementDifferences = (
  left: Element,
  right: Element,
  add: (what: string, detail: string) => void,
): readonly (readonly [Element, Element])[] => {
  if (!sameName(left, right)) {
    add(
      "element name",
      `<${left.qname}> in {${left.namespace}} against <${right.qname}> in {${right.namespace}}`,
    );
  }

  if (left.attributes.length === right.attributes.length) {
    for (const [at, attribute] of left.attributes.entries()) {
      const other = right.attributes[at];
      if (other !== undefined && !sameName(attribute, other)) {
        add(
          "attribute name",
          `<${left.qname}> ${attribute.qname} {${attribute.namespace}}${attribute.local} against ${other.qname} {${other.namespace}}${other.local}`,
        );
      } else if (other !== undefined && attribute.value !== other.value) {
        add(
          "attribute value",
          `<${left.qname}> ${attribute.qname}=${JSON.stringify(attribute.value)} against ${JSON.stringify(other.value)}`,
        );
      } else if (
        other !== undefined &&
        !isDeepStrictEqual(attribute.references, other.references)
      ) {
        add(
          "attribute references",
          `<${left.qname}> ${attribute.qname}=${JSON.stringify(attribute.value)} references ${JSON.stringify(attribute.references)} against ${JSON.stringify(other.references)}`,
        );
      }
    }
  } else {
    add(
      "attribute count",
      `<${left.qname}> ${left.attributes.map(({ qname }) => qname).join(" ")} against ${right.attributes.map(({ qname }) => qname).join(" ")}`,
    );
  }

  if (left.children.length !== right.children.length) {
    add(
      "children",
      `<${left.qname}> holds ${JSON.stringify(left.children)} against ${JSON.stringify(right.children)}`.slice(
        0,
        400,
      ),
    );

    return [];
  }

  const pairs: (readonly [Element, Element])[] = [];
  for (const [at, child] of left.children.entries()) {
    const other = right.children[at];
    if (child.kind === "element" && other?.kind === "element") {
      pairs.push([child, other]);
    } else if (!isDeepStrictEqual(child, other)) {
      add(
        `child ${child.kind}`,
        `<${left.qname}> child ${String(at)}: ${JSON.stringify(child)} against ${JSON.stringify(other)}`,
      );
    }
  }

  return pairs;
};

/**
 * Find where two crust trees differ, as classes and details: the document's charset, declaration,
 * doctype, prolog or epilog, and, element by element in document order, its name or namespace,
 * its attributes (each one's name parts, value or recorded references), and its children (their
 * number, kind, text or CDATA form). Every class is reported, not only the first, so a defect of
 * one class does not hide another's.
 *
 * @param left - The first tree.
 * @param right - The second.
 * @returns The differences, none when they are the same tree; at most one per class and
 *   {@link mostDifferences} in all.
 */
export const treeDifferences = (
  left: XmlDocument,
  right: XmlDocument,
): readonly TreeDifference[] => {
  const found = new Map<string, string>();
  const add = (what: string, detail: string): void => {
    if (!found.has(what) && found.size < mostDifferences) {
      found.set(what, detail);
    }
  };
  if (left.charset !== right.charset) {
    add("charset", `${left.charset} against ${right.charset}`);
  }

  for (const field of ["declaration", "doctype", "prolog", "epilog"] as const) {
    if (!isDeepStrictEqual(left[field], right[field])) {
      add(field, `${JSON.stringify(left[field])} against ${JSON.stringify(right[field])}`);
    }
  }

  const stack: (readonly [Element, Element])[] = [[left.root, right.root]];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    stack.push(...elementDifferences(next[0], next[1], add).toReversed());
  }

  return [...found].map(([what, detail]) => ({ detail, what }));
};

/**
 * Class where a byte offset of a serialization falls: in an attribute value, in a tag, or in
 * character data.
 *
 * @param before - The text before the offset.
 * @returns The construct.
 */
const constructAt = (before: string): string => {
  const open = before.lastIndexOf("<");
  if (open <= before.lastIndexOf(">")) {
    return "character data";
  }

  return (before.slice(open).match(/"/gu) ?? []).length % 2 === 1 ? "attribute value" : "tag";
};

/**
 * Find where two byte strings first differ, with the text around it, and class the difference by
 * the construct it falls in.
 *
 * @param left - The first bytes.
 * @param right - The second.
 * @returns None when they are equal; the construct and the text around the first difference.
 */
const bytesDifference = (left: Uint8Array, right: Uint8Array): Option.Option<TreeDifference> => {
  const a = new TextDecoder().decode(left);
  const b = new TextDecoder().decode(right);
  if (a === b) {
    return Option.none();
  }

  let at = 0;
  while (at < a.length && a[at] === b[at]) {
    at += 1;
  }

  const window = (text: string): string =>
    JSON.stringify(text.slice(Math.max(0, at - 40), at + 40));

  const construct = constructAt(a.slice(0, at));
  // A namespace declaration one side writes and the other does not is its own class.
  const declaration =
    construct === "tag" &&
    ([a, b].some((text) => /^\s?xmlns/u.test(text.slice(at))) ||
      /(?:^|\s)xmlns\S*$/u.test(a.slice(0, at)));

  return Option.some({
    detail: `${window(a)} against ${window(b)}`,
    what: declaration ? "namespace declaration" : construct,
  });
};

/**
 * Whether an attribute is a namespace declaration.
 *
 * @param attribute - The attribute.
 * @returns Whether it is in the `xmlns` namespace.
 */
const isDeclaration = (attribute: Attribute): boolean => attribute.namespace === xmlnsNamespace;

/**
 * An element as the XDM records it, the erasures unshred states made: each CDATA section as text,
 * each stretch of character data as one run, and its namespace declarations before its
 * attributes, each family in its order (spec reading 137).
 *
 * @param held - The element.
 * @returns The element with the erasures made.
 */
const erasedElement = (held: Element): Element => {
  const children: Child[] = [];
  for (const child of held.children) {
    const last = children.at(-1);
    if (child.kind === "text" && last?.kind === "text") {
      children[children.length - 1] = { ...last, value: last.value + child.value };
    } else if (child.kind === "text") {
      children.push({ ...child, cdata: false });
    } else {
      children.push(child.kind === "element" ? erasedElement(child) : child);
    }
  }

  return {
    ...held,
    attributes: [
      ...held.attributes.filter((attribute) => isDeclaration(attribute)),
      ...held.attributes.filter((attribute) => !isDeclaration(attribute)),
    ],
    children,
  };
};

/**
 * A tree with {@link erasedElement}'s erasures made at every element.
 *
 * @param tree - The tree.
 * @returns The tree.
 */
const codecErased = (tree: XmlDocument): XmlDocument => ({
  ...tree,
  root: erasedElement(tree.root),
});

/**
 * Class a value's characters for the codec's features: empty, holding a CR, holding another line
 * end or a tab, holding a character markup escapes, outside the BMP, above ASCII, or plain.
 *
 * @param value - The value.
 * @returns The class.
 */
const valueArm = (value: string): string => {
  const classes: readonly (readonly [RegExp, string])[] = [
    [/^$/u, "empty"],
    [/\r/u, "cr"],
    [/[\t\n]/u, "ws"],
    [/[&<>"']/u, "markup"],
    [/[\u{10000}-\u{10FFFF}]/u, "astral"],
    [/[\u0080-\uFFFF]/u, "nonascii"],
  ];

  return classes.find(([pattern]) => pattern.test(value))?.[1] ?? "plain";
};

/**
 * The namespace classes the codec's features name: XML's own namespaces and XLink, each by name.
 */
const namespaceClasses: ReadonlyMap<string, string> = new Map([
  ["http://www.w3.org/1999/xlink", "xlink"],
  ["http://www.w3.org/2000/xmlns/", "xmlns"],
  ["http://www.w3.org/2001/XMLSchema-instance", "xsi"],
  ["http://www.w3.org/XML/1998/namespace", "xml"],
]);

/**
 * Class a namespace name for the codec's features.
 *
 * @param namespace - The namespace name.
 * @returns `none`, one of {@link namespaceClasses}, or `other`.
 */
const namespaceClass = (namespace: string): string =>
  namespace === "" ? "none" : (namespaceClasses.get(namespace) ?? "other");

/**
 * Class an element's attribute order for the codec's features: by count, and for two or more
 * whether they are written in sorted order, which an export that sorts them would keep.
 *
 * @param names - The attributes' qualified names, in order.
 * @returns The class.
 */
const orderClass = (names: readonly string[]): string => {
  if (names.length < 2) {
    return String(names.length);
  }

  return names.every((name, at) => at === 0 || (names[at - 1] ?? "") <= name)
    ? "sorted"
    : "unsorted";
};

/**
 * The features of a tree shred admitted, which the codec's round trip then reads: each element by
 * the namespace class of its name and its attributes' order, each attribute by its namespace and
 * its value's class and references, and each child by its kind and text class. They steer the
 * search toward what reaches the codec, which the genome's features alone do not see.
 *
 * @param read - The tree crust read.
 * @returns The features, the family `codec`.
 */
const codecFeatures = (read: XmlDocument): readonly string[] =>
  elementsIn(read.root).flatMap((element) => [
    `codec element ${namespaceClass(element.namespace)} ${orderClass(element.attributes.filter((attribute) => !isDeclaration(attribute)).map(({ qname }) => qname))}`,
    ...element.attributes.map(
      (attribute) =>
        `codec attribute ${namespaceClass(attribute.namespace)} ${valueArm(attribute.value)}${attribute.references.length > 0 ? " references" : ""}`,
    ),
    ...element.children.flatMap((child): readonly string[] => {
      if (child.kind === "text") {
        return [`codec ${child.cdata ? "cdata" : "text"} ${valueArm(child.value)}`];
      }

      return child.kind === "element" ? [] : [`codec ${child.kind}`];
    }),
  ]);

/**
 * Name an element's attributes, or its namespace declarations, in order.
 *
 * @param element - The element, none past the end of a tree.
 * @param declarations - Whether to name its declarations rather than its attributes.
 * @returns The names, space-separated.
 */
const familyNames = (element: Element | undefined, declarations: boolean): string =>
  (element?.attributes ?? [])
    .filter((attribute) => isDeclaration(attribute) === declarations)
    .map(({ qname }) => qname)
    .join(" ");

/**
 * Reading 137's order: each element of the tree read back holds its attributes, and its namespace
 * declarations, in the order the tree read first held them.
 *
 * @param read - The tree read first.
 * @param reread - The tree read back.
 * @returns A disagreement for each family whose order changed.
 */
const orderDisagreements = (
  read: XmlDocument,
  reread: XmlDocument,
): readonly CodecDisagreement[] => {
  const after = elementsIn(reread.root);

  return elementsIn(read.root).flatMap((element, at) =>
    [true, false].flatMap((declarations): readonly CodecDisagreement[] =>
      familyNames(element, declarations) === familyNames(after[at], declarations)
        ? []
        : [
            {
              detail: `<${element.qname}> ${declarations ? "declarations" : "attributes"} ${familyNames(element, declarations)} come back as ${familyNames(after[at], declarations)}`,
              oracle: "O4",
              signature: `O4 order ${declarations ? "declarations" : "attributes"}`,
            },
          ],
    ),
  );
};

/**
 * Judge one tree by O4 in one version: shred, unshred, read back, shred again, and compare.
 *
 * @param read - The tree crust read.
 * @param version - The version.
 * @param world - The judge's world.
 * @param prefix - The class its disagreements' signatures begin with.
 * @returns The features the codec's verdict shows and the disagreements it breaks.
 */
const codecRoundTrip = Effect.fnUntraced(function* codecRoundTrip(
  read: XmlDocument,
  version: SchemaVersion,
  world: CodecWorld,
  prefix: string,
) {
  const tree = yield* Effect.result(shred(read, version, world.grammar));
  if (Result.isFailure(tree)) {
    const { failure } = tree;

    return {
      disagreements: [],
      features: [
        `o4 ${version} ${failure._tag} ${failure._tag === "NotQti3" ? failure.reason : `${failure.kind} ${failure.reason}`}`,
      ],
    } satisfies Found;
  }

  const features = [`o4 ${version} shredded`, ...codecFeatures(read)];
  const out = yield* Effect.result(unshred(tree.success, world.names));
  if (Result.isFailure(out)) {
    return {
      disagreements: [
        {
          detail: `unshred cannot write a tree shred read in ${tree.success.exportCharset}: ${out.failure.where} holds U+${out.failure.codePoint.toString(16).toUpperCase()}`,
          oracle: "O4",
          signature: `${prefix} unwritable ${out.failure.where}`,
        },
      ],
      features,
    } satisfies Found;
  }

  const reread = yield* Effect.result(readXml(out.success));
  if (Result.isFailure(reread)) {
    return {
      disagreements: [
        {
          detail: `crust refuses unshred's bytes: ${refusalText(reread.failure)}; the bytes: ${JSON.stringify(new TextDecoder().decode(out.success).slice(0, 400))}`,
          oracle: "O4",
          signature: `${prefix} reread refused ${refusalRule(reread.failure)}`,
        },
      ],
      features,
    } satisfies Found;
  }

  const again = yield* Effect.result(shred(reread.success, version, world.grammar));
  if (Result.isFailure(again)) {
    return {
      disagreements: [
        {
          detail: `shred refuses unshred's bytes: ${again.failure.message}`,
          oracle: "O4",
          signature: `${prefix} reshred refused ${again.failure._tag}`,
        },
      ],
      features,
    } satisfies Found;
  }

  if (!isDeepStrictEqual(flatten(again.success, idOf), flatten(tree.success, idOf))) {
    const differences = treeDifferences(codecErased(read), codecErased(reread.success));
    const named = differences.map(({ what }) => what).join(", ");

    return {
      disagreements: [
        {
          detail: `the rows differ after the round trip: ${differences.map(({ detail, what }) => `${what}: ${detail}`).join("; ") || "(the crust trees agree)"}`,
          oracle: "O4",
          signature: `${prefix} rows differ${named === "" ? "" : `: ${named}`}`,
        },
      ],
      features,
    } satisfies Found;
  }

  const canonical = bytesDifference(canonicalize(reread.success), canonicalize(read));

  return {
    disagreements: Option.match(canonical, {
      onNone: () => orderDisagreements(read, reread.success),
      onSome: ({ detail, what }): readonly CodecDisagreement[] => [
        {
          detail: `canonical forms differ in ${what}: ${detail}`,
          oracle: "O4",
          signature: `${prefix} canonical ${what}`,
        },
      ],
    }),
    features,
  } satisfies Found;
});

/**
 * The independent decoder of one charset label: Node's WHATWG decoder for UTF-8 and UTF-16, or
 * byte to code point for ISO-8859-1 and ASCII, with the threshold crust's writer escapes above.
 */
interface LabelDecoder {
  readonly decode: (bytes: Uint8Array) => string;
  readonly name: string;
  readonly threshold: number;
}

/**
 * Read bytes as code points one to one, as ISO-8859-1 and ASCII are defined.
 *
 * @param bytes - The bytes.
 * @returns The text.
 */
const codePointsOf = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");

/**
 * Decode bytes with Node's WHATWG decoder for an encoding, every error fatal.
 *
 * @param encoding - The decoder's encoding.
 * @returns The decoder.
 */
const whatwg =
  (encoding: string) =>
  (bytes: Uint8Array): string =>
    new TextDecoder(encoding, { fatal: true }).decode(bytes);

/**
 * The independent decoders, by the label's upper case.
 */
const labelDecoders: ReadonlyMap<string, LabelDecoder> = new Map([
  [
    "UTF-8",
    { decode: whatwg("utf-8"), name: "TextDecoder(utf-8)", threshold: Number.POSITIVE_INFINITY },
  ],
  [
    "UTF-16",
    {
      decode: whatwg("utf-16le"),
      name: "TextDecoder(utf-16le)",
      threshold: Number.POSITIVE_INFINITY,
    },
  ],
  [
    "UTF-16LE",
    {
      decode: whatwg("utf-16le"),
      name: "TextDecoder(utf-16le)",
      threshold: Number.POSITIVE_INFINITY,
    },
  ],
  [
    "UTF-16BE",
    {
      decode: whatwg("utf-16be"),
      name: "TextDecoder(utf-16be)",
      threshold: Number.POSITIVE_INFINITY,
    },
  ],
  ["ISO-8859-1", { decode: codePointsOf, name: "bytes as code points", threshold: 0xff }],
  ["LATIN1", { decode: codePointsOf, name: "bytes as code points", threshold: 0xff }],
  ["US-ASCII", { decode: codePointsOf, name: "bytes as code points", threshold: 0x7f }],
]);

/**
 * O2's second half: the bytes crust wrote for a tree, decoded by Node's own decoder for the tree's
 * label (a leading byte order mark of the label's order dropped), are the text crust's writer
 * wrote.
 *
 * @param tree - The tree crust read.
 * @param bytes - The bytes crust wrote for it.
 * @returns What the decoder found.
 */
const decodedDisagreements = (tree: XmlDocument, bytes: Uint8Array): Found => {
  const decoder = labelDecoders.get(tree.charset.toUpperCase());
  if (decoder === undefined) {
    return { disagreements: [], features: ["o2 decoded unjudged"] };
  }

  const expected = Effect.runSyncExit(writeXml(tree, { threshold: decoder.threshold }));
  if (expected._tag === "Failure") {
    return { disagreements: [], features: ["o2 decoded unjudged"] };
  }

  const actual = Result.try(() => decoder.decode(bytes));
  if (Result.isSuccess(actual) && actual.success === expected.value) {
    return { disagreements: [], features: ["o2 decoded equal"] };
  }

  return {
    disagreements: [
      {
        detail: `crust wrote ${tree.charset} bytes that ${decoder.name} decodes to other text than crust's writer wrote: ${Result.isFailure(actual) ? `the bytes do not decode: ${String(actual.failure)}` : `${JSON.stringify(actual.success.slice(0, 60))} against ${JSON.stringify(expected.value.slice(0, 60))}`}`,
        oracle: "O2",
        signature: `O2 bytes are not ${tree.charset}`,
      },
    ],
    features: ["o2 decoded differs"],
  };
};

/**
 * O1: crust's verdict and libxml2's, compared.
 *
 * @param bytes - The document.
 * @param file - Where its bytes are written.
 * @param read - What crust read.
 * @returns What O1 found, and whether libxml2 accepts the document.
 */
const wellFormedness = Effect.fnUntraced(function* wellFormedness(
  bytes: Uint8Array,
  file: string,
  read: Result.Result<XmlDocument, ReaderRefusal | WellFormednessError>,
) {
  const linted = yield* xmllint(["--noout", "--nonet", file]);
  const libxml2Accepts = linted.code === 0 && !/ namespace error : /u.test(linted.stderr);
  const crustVerdict = Result.match(read, {
    onFailure: (failure) => `refused-${refusalRule(failure)}`,
    onSuccess: () => "accepted",
  });
  const libxml2Verdict = libxml2Accepts
    ? "accepted"
    : `refused ${libxml2Class(linted.stderr, linted.code)}`;
  const mismatch = declaredAgainstBytes(bytes);
  const features = [
    `o1 crust ${crustVerdict}`,
    `o1 libxml2 ${libxml2Verdict}`,
    `o1 pair ${crustVerdict} ${libxml2Accepts ? "accepted" : "refused"}`,
    `o1 encoding ${Option.isSome(mismatch) ? "declared-against-bytes" : "agrees"}`,
  ];
  if (Result.isSuccess(read) === libxml2Accepts) {
    return { found: { disagreements: [], features } satisfies Found, libxml2Accepts };
  }

  const crustSide = Result.match(read, {
    onFailure: (failure) => `refuses (${refusalText(failure)})`,
    onSuccess: () => "accepts",
  });
  const libxml2Side = libxml2Accepts
    ? "accepts"
    : `refuses: ${linted.stderr.split("\n").slice(0, 2).join(" | ")}`;
  const signature = Option.match(mismatch, {
    onNone: () =>
      libxml2Accepts
        ? `O1 crust ${crustVerdict}, libxml2 accepts`
        : `O1 crust accepts, libxml2 refuses: ${libxml2Class(linted.stderr, linted.code)}`,
    onSome: () =>
      `O1 crust ${Result.isSuccess(read) ? "accepts" : "refuses"}, libxml2 ${libxml2Accepts ? "accepts" : "refuses"}`,
  });
  const detail = `${Option.getOrElse(
    mismatch.pipe(Option.map((held) => `${held}: `)),
    () => "",
  )}crust ${crustSide}; xmllint ${libxml2Side}`;

  return {
    found: { disagreements: [{ detail, oracle: "O1", signature }], features } satisfies Found,
    libxml2Accepts,
  };
});

/**
 * O2: crust's tree written in its own label, read again, and its bytes decoded independently.
 *
 * @param tree - The tree crust read.
 * @returns What O2 found.
 */
const crustCycle = Effect.fnUntraced(function* crustCycle(tree: XmlDocument) {
  const prefix = "O2";
  const written = yield* Effect.result(encode(tree, tree.charset));
  const relabelled: XmlDocument = Result.isSuccess(written)
    ? tree
    : {
        ...tree,
        declaration: tree.declaration.pipe(
          Option.map((held) => ({ ...held, encoding: Option.some("UTF-8") })),
        ),
      };
  const out = Result.isSuccess(written)
    ? written.success
    : yield* Effect.orDie(encode(relabelled, "UTF-8"));
  const features = [
    Result.isSuccess(written) ? "o2 written" : `o2 relabelled ${written.failure.where}`,
  ];
  const decoded: Found = Result.isSuccess(written)
    ? decodedDisagreements(tree, out)
    : { disagreements: [], features: ["o2 decoded unjudged"] };
  const reread = yield* Effect.result(readXml(out));
  if (Result.isFailure(reread)) {
    return {
      disagreements: [
        {
          detail: `crust refuses what crust wrote: ${refusalText(reread.failure)}; written: ${JSON.stringify(new TextDecoder().decode(out).slice(0, 300))}`,
          oracle: "O2",
          signature: `${prefix} reread refused ${refusalRule(reread.failure)}`,
        },
        ...decoded.disagreements,
      ],
      features: [...features, ...decoded.features],
    } satisfies Found;
  }

  const expected = Result.isSuccess(written)
    ? tree
    : { ...relabelled, charset: reread.success.charset };
  const differences = treeDifferences(expected, reread.success);

  return {
    disagreements: [
      ...differences.map(({ detail, what }): CodecDisagreement => ({
        detail,
        oracle: "O2",
        signature: `${prefix} ${what} changes`,
      })),
      ...decoded.disagreements,
    ],
    features: [
      ...features,
      ...decoded.features,
      `o2 ${differences.length === 0 ? "same" : "differs"}`,
      ...differences.map(({ what }) => `o2 differs ${what}`),
    ],
  } satisfies Found;
});

/**
 * O3: crust's canonical form against libxml2's, for a document libxml2 accepts and can expand.
 *
 * @param tree - The tree crust read.
 * @param file - Where the document's bytes are written.
 * @param libxml2Accepts - Whether libxml2 accepts the document.
 * @returns What O3 found.
 */
const canonicalDifferential = Effect.fnUntraced(function* canonicalDifferential(
  tree: XmlDocument,
  file: string,
  libxml2Accepts: boolean,
) {
  if (!libxml2Accepts) {
    return { disagreements: [], features: ["o3 skipped libxml2-refused"] } satisfies Found;
  }

  if (hasExternal(tree) || holdsReferences(tree.root)) {
    return { disagreements: [], features: ["o3 skipped unexpandable"] } satisfies Found;
  }

  const canonical = yield* xmllint(["--c14n", "--nonet", file]);
  if (canonical.code !== 0) {
    return {
      disagreements: [],
      features: [`o3 c14n-refused ${libxml2Class(canonical.stderr, canonical.code)}`],
    } satisfies Found;
  }

  return Option.match(bytesDifference(canonicalize(tree), canonical.stdout), {
    onNone: (): Found => ({ disagreements: [], features: ["o3 equal"] }),
    onSome: ({ detail, what }): Found => ({
      disagreements: [
        {
          detail: `crust's canonical form against xmllint --c14n: ${detail}`,
          oracle: "O3",
          signature: `O3 ${what}`,
        },
      ],
      features: [`o3 differs ${what}`],
    }),
  });
});

/**
 * What the independent decoder made of a document: its text as UTF-8 bytes, a refusal, or nothing
 * to judge.
 */
type Independent =
  | { readonly _tag: "decoded"; readonly bytes: Uint8Array }
  | { readonly _tag: "refused" }
  | { readonly _tag: "unjudged" };

/**
 * Decode a document's body without crust: a UTF-16 one by Node's decoder for its byte order, any
 * other by its declared label's decoder, refusing a byte above 0x7F in ASCII.
 *
 * @param body - The bytes after any byte order mark.
 * @param family - The encoding the first bytes say.
 * @param label - The declared label, upper case, UTF-8 when none.
 * @returns The text, or none for a label no independent decoder holds; a `RangeError` for bytes
 *   the encoding does not hold.
 */
const decodedBody = (
  body: Uint8Array,
  family: Option.Option<string>,
  label: string,
): Option.Option<string> => {
  if (Option.isSome(family) && family.value !== "UTF-8") {
    return Option.some(
      new TextDecoder(family.value.toLowerCase(), { fatal: true, ignoreBOM: true }).decode(body),
    );
  }

  if (label === "US-ASCII" && body.some((byte) => byte >= 0x80)) {
    throw new RangeError("A byte above 0x7F is no ASCII character.");
  }

  return Option.map(Option.fromNullishOr(labelDecoders.get(label)), (decoder) =>
    decoder.decode(body),
  );
};

/**
 * Name UTF-8 as a document text's declared encoding, where its declaration names one.
 *
 * @param text - The text.
 * @returns The text, relabelled.
 */
const relabelledText = (text: string): string => {
  const groups = /^(?<head><\?xml\s[^?]*?encoding\s*=\s*)(?<quote>["'])[^"']*\k<quote>/u.exec(
    text,
  )?.groups;
  const head = groups?.["head"];
  const quote = groups?.["quote"];

  return head === undefined || quote === undefined
    ? text
    : text.replace(/^<\?xml\s[^?]*?encoding\s*=\s*["'][^"']*["']/u, `${head}${quote}UTF-8${quote}`);
};

/**
 * Decode a document's bytes without crust: by its byte order mark or Appendix F pattern, else by
 * its declared label (UTF-8 when it names none), through Node's WHATWG decoders, every error fatal,
 * or byte to code point for ISO-8859-1 and ASCII; and name its declared encoding UTF-8, so crust
 * reads the text again in the one encoding it cannot sniff wrongly.
 *
 * @param bytes - The document.
 * @returns The text as UTF-8 bytes; `refused` when the decoder refuses the bytes; `unjudged` for a
 *   declaration naming another encoding than the bytes', a label the independent decoders do not
 *   hold, or UTF-16 with no mark and no byte order named, whose classes O1 judges.
 */
const independentlyRead = (bytes: Uint8Array): Independent => {
  const family = familyOf(bytes);
  const declared = declaredLabel(bytes, family);
  const marked = bytes[0] === 0xef || bytes[0] === 0xfe || bytes[0] === 0xff;
  const label = Option.getOrElse(declared, () => "UTF-8").toUpperCase();
  const unmarkedUtf16 = Option.exists(family, (held) => held !== "UTF-8") && !marked;
  // An unmarked UTF-16 document that names no byte order is UTF-16 by Appendix F alone, the
  // bare-utf16 class O1 judges.
  if (
    Option.isSome(declaredAgainstBytes(bytes)) ||
    (unmarkedUtf16 && (Option.isNone(declared) || label === "UTF-16"))
  ) {
    return { _tag: "unjudged" };
  }

  const body = marked ? bytes.subarray(Option.contains(family, "UTF-8") ? 3 : 2) : bytes;
  const decoded = Result.try(() => decodedBody(body, family, label));
  if (Result.isFailure(decoded)) {
    return { _tag: "refused" };
  }

  return Option.match(decoded.success, {
    onNone: (): Independent => ({ _tag: "unjudged" }),
    onSome: (text): Independent => ({
      _tag: "decoded",
      bytes: new TextEncoder().encode(relabelledText(text)),
    }),
  });
};

/**
 * A tree with its label and its declaration's encoding blanked, the two parts O5's second read
 * changes on purpose.
 *
 * @param tree - The tree.
 * @returns The tree.
 */
const unlabelled = (tree: XmlDocument): XmlDocument => ({
  ...tree,
  charset: "",
  declaration: tree.declaration.pipe(Option.map((held) => ({ ...held, encoding: Option.none() }))),
});

/**
 * Write the independent read's verdict.
 *
 * @param independent - What the independent decoder made of the bytes.
 * @param again - What crust read from its text, when it decoded.
 * @returns The verdict.
 */
const independentVerdict = (
  independent: Independent,
  again: Result.Result<XmlDocument, unknown> | undefined,
): string => {
  if (independent._tag === "refused") {
    return "does not decode";
  }

  return again !== undefined && Result.isSuccess(again) ? "reads" : "is refused";
};

/**
 * O5, crust's decoder: the tree crust reads from a document's bytes is the tree it reads from the
 * same text decoded by Node's own decoders and written as UTF-8 ({@link independentlyRead}), but
 * for its charset label and its declaration's encoding.
 *
 * @param bytes - The document.
 * @param read - What crust read from it.
 * @returns What O5 found.
 */
const decodeDifferential = Effect.fnUntraced(function* decodeDifferential(
  bytes: Uint8Array,
  read: Result.Result<XmlDocument, ReaderRefusal | WellFormednessError>,
) {
  const independent = independentlyRead(bytes);
  if (independent._tag === "unjudged") {
    return { disagreements: [], features: ["o5 unjudged"] } satisfies Found;
  }

  const again =
    independent._tag === "decoded" ? yield* Effect.result(readXml(independent.bytes)) : undefined;
  const verdict = independentVerdict(independent, again);
  if (Result.isSuccess(read) !== (verdict === "reads")) {
    const crustSide = Result.isSuccess(read) ? "reads" : "refuses";

    return {
      disagreements: [
        {
          detail:
            `crust ${crustSide} the bytes${Result.isFailure(read) ? ` (${refusalText(read.failure)})` : ""}; the independently decoded text ${verdict}`.slice(
              0,
              400,
            ),
          oracle: "O5",
          signature: `O5 decode: crust ${crustSide}, the decoded text ${verdict}`,
        },
      ],
      features: ["o5 verdicts differ"],
    } satisfies Found;
  }

  if (Result.isFailure(read) || again === undefined || Result.isFailure(again)) {
    return { disagreements: [], features: ["o5 both refuse"] } satisfies Found;
  }

  const differences = treeDifferences(unlabelled(read.success), unlabelled(again.success));

  return {
    disagreements: differences.map(({ detail, what }): CodecDisagreement => ({
      detail,
      oracle: "O5",
      signature: `O5 decode: ${what} differs`,
    })),
    features: [`o5 ${differences.length === 0 ? "same" : "differs"}`],
  } satisfies Found;
});

/**
 * The classes of input a tree crust read can fall in whose every disagreement has one cause:
 *
 * - `defaulted name in no namespace`: crust appended an attribute-list default whose name has a
 *   prefix, or is `xmlns`, as a name in no namespace, the cause GEN-B/codec's N1 names;
 * - `namespace name holds a reference`: a namespace declaration's value keeps an unexpanded
 *   reference, whose namespace name no reader knows (XML 1.0 section 4.4.3: the processor reports
 *   the reference it did not read).
 */
type TreeClass = "defaulted name in no namespace" | "namespace name holds a reference";

/**
 * A class of input whose every disagreement has one cause: a {@link TreeClass}, or a document
 * whose declaration names another encoding than its bytes are in.
 */
export type InputClass = TreeClass | "encoding declared against the bytes";

/**
 * Find the class of input a tree crust read falls in, if any.
 *
 * @param tree - The tree.
 * @returns The class, undefined for none.
 */
const treeClassOf = (tree: XmlDocument): TreeClass | undefined => {
  const attributes = elementsIn(tree.root).flatMap((element) => element.attributes);
  if (
    attributes.some(
      ({ local, namespace }) => namespace === "" && (local.includes(":") || local === "xmlns"),
    )
  ) {
    return "defaulted name in no namespace";
  }

  return attributes.some((attribute) => isDeclaration(attribute) && attribute.references.length > 0)
    ? "namespace name holds a reference"
    : undefined;
};

/**
 * Find the class of input a document falls in: a declaration naming another encoding than its
 * bytes' first, as XML 1.0 section 4.3.3 makes it a fatal error, so whatever crust makes of it is
 * that defect's; else the class of the tree crust read.
 *
 * @param bytes - The document.
 * @param read - What crust read from it.
 * @returns The class, undefined for none.
 */
const inputClassOf = (
  bytes: Uint8Array,
  read: Result.Result<XmlDocument, ReaderRefusal | WellFormednessError>,
): InputClass | undefined => {
  if (Option.isSome(declaredAgainstBytes(bytes))) {
    return "encoding declared against the bytes";
  }

  return Result.isSuccess(read) ? treeClassOf(read.success) : undefined;
};

/**
 * Whether a disagreement's signature already names its input's class.
 *
 * @param held - The disagreement.
 * @returns Whether it does.
 */
const isClassed = (held: CodecDisagreement): boolean =>
  /^O\d (?:defaulted name in no namespace|namespace name holds a reference|encoding declared against the bytes): /u.test(
    held.signature,
  );

/**
 * Key a disagreement by its input's class, where the tree falls in one: the class follows the
 * oracle's name in its signature.
 *
 * @param held - The disagreement.
 * @param inputClass - The input's class, undefined for none.
 * @returns The disagreement.
 */
export const classed = (
  held: CodecDisagreement,
  inputClass: InputClass | undefined,
): CodecDisagreement =>
  inputClass === undefined
    ? held
    : {
        ...held,
        signature: held.signature.replace(/^(?<oracle>O\d) /u, `$<oracle> ${inputClass}: `),
      };

/**
 * Judge one document's bytes by O1, O2, O3, O4 in each version, and O5.
 *
 * @param bytes - The document.
 * @param file - Where its bytes are written for `xmllint`.
 * @param world - The judge's world.
 * @returns Its oracles' outcomes as features, and the disagreements.
 */
export const judgeBytes = Effect.fnUntraced(function* judgeBytes(
  bytes: Uint8Array,
  file: string,
  world: CodecWorld,
) {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.writeFile(file, bytes);

  const read = yield* Effect.result(readXml(bytes));
  const { found: formed, libxml2Accepts } = yield* wellFormedness(bytes, file, read);
  const decoded = yield* decodeDifferential(bytes, read);
  const parts: Found[] = [formed, decoded];
  const codecPrefix = "O4";
  if (Result.isSuccess(read)) {
    parts.push(
      yield* crustCycle(read.success),
      yield* canonicalDifferential(read.success, file, libxml2Accepts),
    );
    for (const version of schemaVersions) {
      parts.push(yield* codecRoundTrip(read.success, version, world, codecPrefix));
    }
  }

  // A document whose declaration names another encoding than its bytes' is that class first: XML
  // 1.0 section 4.3.3 makes it a fatal error, so whatever crust makes of it is that defect's.
  const inputClass = inputClassOf(bytes, read);

  return {
    disagreements: parts
      .flatMap(({ disagreements }) => disagreements)
      .map((held) => classed(held, inputClass)),
    features: new Set(parts.flatMap(({ features }) => features)),
  } satisfies Judgment<string, CodecDisagreement>;
});

/**
 * The marker an undeclared entity's reference becomes in O6: the name between two U+2063
 * INVISIBLE SEPARATOR characters, which no dictionary of the genome holds.
 *
 * @param name - The entity's name.
 * @returns The marker.
 */
const markerOf = (name: string): string => `\u2063${name}\u2063`;

/**
 * An attribute's value with each reference it records replaced by its entity's marker.
 *
 * @param attribute - The attribute.
 * @returns The value.
 */
const markedValue = (attribute: Attribute): string => {
  let out = "";
  let position = 0;
  for (const reference of attribute.references) {
    out += attribute.value.slice(position, reference.offset) + markerOf(reference.name);
    position = reference.offset + reference.name.length + 2;
  }

  return out + attribute.value.slice(position);
};

/**
 * Replace every unexpanded reference of a crust tree by its entity's marker: an `EntityRef` child
 * by a text run, and each reference an attribute value records by the marker in its place.
 *
 * @param root - The root.
 * @returns The tree with no reference left.
 */
const markedTree = (root: Element): Element => ({
  ...root,
  attributes: root.attributes.map((attribute) => ({
    ...attribute,
    references: [],
    value: markedValue(attribute),
  })),
  children: root.children.map((child): Child => {
    if (child.kind === "element") {
      return markedTree(child);
    }

    return child.kind === "entityRef"
      ? { cdata: false, kind: "text", value: markerOf(child.name) }
      : child;
  }),
});

/**
 * The entities a genome's pieces reference that no subset declares and none is predefined.
 *
 * @param genome - The genome.
 * @returns Their names.
 */
const undeclaredOf = (genome: CodecGenome): ReadonlySet<string> => {
  const declared = new Set(declaredEntities(genome));
  const named = new Set<string>();
  mapPiecesOf(genome, (pieces: readonly Piece[]) => {
    for (const piece of pieces) {
      if (piece._tag === "ref" && !declared.has(piece.name) && !predefinedNames.has(piece.name)) {
        named.add(piece.name);
      }
    }

    return pieces;
  });

  return named;
};

/**
 * Declare each of a set of entities with its marker as its text, as character references, so the
 * marker reads the same in whatever encoding the bytes are.
 *
 * @param named - The entities' names.
 * @returns The declarations.
 */
const markerDeclarations = (named: ReadonlySet<string>): readonly Declaration[] =>
  [...named].map((name): Declaration => ({
    _tag: "entity",
    name,
    parameter: false,
    pieces: [
      { _tag: "charref", code: 0x20_63, hex: true },
      { _tag: "text", value: name },
      { _tag: "charref", code: 0x20_63, hex: true },
    ],
    quote: '"',
  }));

/**
 * O6, the references crust keeps unexpanded: for a document with an external subset whose
 * references name entities no subset declares, crust's tree with each kept reference replaced by
 * its entity's marker is, in canonical form, what libxml2's `--c14n` reads from the same document
 * with no external subset and each such entity declared, first in the internal subset, with its
 * marker as its text. So each reference crust keeps stands where libxml2 reads one, and no other
 * text of the tree is read as one.
 *
 * @param genome - The genome.
 * @param read - The tree crust read from it.
 * @param file - Where the declared document is written for `xmllint`.
 * @returns What O6 found.
 */
const referenceDifferential = Effect.fnUntraced(function* referenceDifferential(
  genome: CodecGenome,
  read: XmlDocument,
  file: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const named = undeclaredOf(genome);
  if (!Option.exists(genome.doctype, ({ external }) => external) || named.size === 0) {
    return { disagreements: [], features: ["o6 unjudged"] } satisfies Found;
  }

  const doctype = genome.doctype.pipe(
    Option.map((held) => ({
      ...held,
      external: false,
      subset: Option.some([
        ...markerDeclarations(named),
        ...Option.getOrElse(held.subset, (): readonly Declaration[] => []),
      ]),
    })),
  );
  yield* fs.writeFile(file, rendered({ ...genome, doctype }));

  const canonical = yield* xmllint(["--c14n", "--nonet", file]);
  if (canonical.code !== 0) {
    return {
      disagreements: [],
      features: [`o6 c14n-refused ${libxml2Class(canonical.stderr, canonical.code)}`],
    } satisfies Found;
  }

  return Option.match(
    bytesDifference(canonicalize({ ...read, root: markedTree(read.root) }), canonical.stdout),
    {
      onNone: (): Found => ({ disagreements: [], features: ["o6 equal"] }),
      onSome: ({ detail, what }): Found => ({
        disagreements: [
          {
            detail: `crust's kept references against libxml2's, each a marker: ${detail}`,
            oracle: "O6",
            signature: `O6 references: ${what}`,
          },
        ],
        features: [`o6 differs ${what}`],
      }),
    },
  );
});

/**
 * Whether a genome's internal subset declares a default for an attribute named with a prefix or
 * as `xmlns`, which crust adds in no namespace (GEN-B/codec's N1).
 *
 * @param genome - The genome.
 * @returns Whether it does.
 */
const namespacedDefault = (genome: CodecGenome): boolean =>
  genome.doctype
    .pipe(
      Option.flatMap(({ subset }) => subset),
      Option.getOrElse((): readonly Declaration[] => []),
    )
    .some(
      (declaration) =>
        declaration._tag === "attlist" &&
        declaration.default._tag === "value" &&
        (declaration.attribute.includes(":") || declaration.attribute === "xmlns"),
    );

/**
 * Whether a genome's internal subset references a parameter entity that no declaration before the
 * reference declares, which a non-validating processor does not read (XML 1.0 section 5.1).
 *
 * @param genome - The genome.
 * @returns Whether it does.
 */
const hasUnreadParameter = (genome: CodecGenome): boolean => {
  const declared = new Set<string>();
  for (const declaration of genome.doctype.pipe(
    Option.flatMap(({ subset }) => subset),
    Option.getOrElse((): readonly Declaration[] => []),
  )) {
    if (declaration._tag === "peref" && !declared.has(declaration.name)) {
      return true;
    }

    if (declaration._tag === "entity" && declaration.parameter) {
      declared.add(declaration.name);
    }
  }

  return false;
};

/**
 * Judge one genome: its own features, its bytes by every oracle, and O6 where crust and libxml2
 * both read it.
 *
 * @param genome - The genome.
 * @param file - Where its bytes are written for `xmllint`.
 * @param world - The judge's world.
 * @returns Its features and disagreements.
 */
const judgeOne = Effect.fnUntraced(function* judgeOne(
  genome: CodecGenome,
  file: string,
  world: CodecWorld,
) {
  const bytes = rendered(genome);
  const judged = yield* judgeBytes(bytes, file, world);
  const read = yield* Effect.result(readXml(bytes));
  const references: Found =
    Result.isSuccess(read) && judged.features.has("o1 pair accepted accepted")
      ? yield* referenceDifferential(genome, read.success, `${file}.declared.xml`)
      : { disagreements: [], features: ["o6 unjudged"] };

  // After a parameter entity it has not read, crust stops checking the subset's declarations, so a
  // refusal libxml2 makes there is that one class, whatever its message, but for the refusal of
  // the unread reference alone, which is libxml2's own class.
  const unread = hasUnreadParameter(genome);

  return {
    disagreements: [
      ...judged.disagreements,
      ...references.disagreements.map((held) => classed(held, inputClassOf(bytes, read))),
    ]
      .map((held) =>
        // A default named with a prefix or as xmlns, which crust adds in no namespace, is that
        // class even where crust refused the document over it and left no tree to see it in.
        namespacedDefault(genome) && Result.isFailure(read) && !isClassed(held)
          ? classed(held, "defaulted name in no namespace")
          : held,
      )
      .map((held) =>
        unread &&
        held.signature.startsWith("O1 crust accepts, libxml2 refuses") &&
        held.signature !== "O1 crust accepts, libxml2 refuses: PEReference: %_; not found"
          ? {
              ...held,
              signature: "O1 crust accepts after an unread parameter entity, libxml2 refuses",
            }
          : held,
      ),
    features: new Set([...genomeFeatures(genome), ...judged.features, ...references.features]),
  } satisfies Judgment<string, CodecDisagreement>;
});

/**
 * Judge one generation: each genome's bytes written to its own file under the world's folder, and
 * judged by every oracle, `world.concurrency` at once.
 *
 * @param world - The judge's world.
 * @returns The batched judge the engine calls.
 */
export const judgeOf = (world: CodecWorld) => (genomes: readonly CodecGenome[]) =>
  Effect.gen(function* judgeGeneration() {
    const fs = yield* FileSystem.FileSystem;
    yield* fs.makeDirectory(world.directory, { recursive: true });

    return yield* Effect.forEach(
      genomes,
      (genome, at) => judgeOne(genome, path.join(world.directory, `case-${String(at)}.xml`), world),
      { concurrency: world.concurrency },
    );
  });

/**
 * The family a feature belongs to: its first word.
 *
 * @param feature - The feature.
 * @returns The family.
 */
export const featureFamily = (feature: string): string => feature.split(" ")[0] ?? feature;
