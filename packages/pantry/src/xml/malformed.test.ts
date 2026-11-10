/* oxlint-disable unicorn/text-encoding-identifier-case -- The faults spell encoding labels (`UTF-8`, `UTF-16LE`) as XML 1.0 section 4.3.3 and the codec genome's charsets spell them: they are the data under test, not names passed to a Node encoding API. */
/**
 * Crust's reader on malformed documents, held to libxml2's well-formedness verdict (matklad's
 * differential oracle: `xmllint --noout` and crust implement one specification, XML 1.0 with
 * Namespaces in XML 1.0, so they must agree on whether each document is well formed).
 *
 * Seeds: well-formed documents both readers accept. They are the codec search's generic seeds and
 * its QTI seeds (`#pantry/test/gen/genetic/codec-genome.ts`, the XDM generator's documents), and
 * the lawful seeds (`#pantry/test/gen/genetic/lawful.ts`), each an XML 1.0 document in its
 * genome's charset.
 *
 * Faults: {@link faults}, each one edit of one class, by characters or by bytes, applied at up to
 * two sites of every seed that has the site. A class holds the faults that break one production or
 * constraint, and lawful edits beside them at the same sites, so a reader that refuses too much
 * fails as surely as one that refuses too little.
 *
 * Judgment: for every faulted document, crust accepts it exactly when libxml2 does. libxml2's
 * verdicts are taken in batches of files, each error line attributed by the path it starts with.
 * A document the batch judges against crust is judged again alone, and that run's verdict stands.
 * Coverage requires every class to be refused by both readers and accepted by both.
 */
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { floorSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, FileSystem, Layer, Option, pipe, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { names as documentNames } from "#pantry/model/names.ts";
import { toXmlDocument } from "#pantry/model/unshred.ts";
import {
  encodedIn,
  genericGenome,
  genomeOfTree,
  sourceText,
} from "#pantry/test/gen/genetic/codec-genome.ts";
import type { Charset, CodecGenome } from "#pantry/test/gen/genetic/codec-genome.ts";
import { declaredAgainstBytes, libxml2Class } from "#pantry/test/gen/genetic/codec-judge.ts";
import { lawfulDocuments } from "#pantry/test/gen/genetic/lawful.ts";
import { xdmDocument } from "#pantry/test/gen/xdm.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { OracleLayer, xmllintRun } from "#pantry/xml/oracle.ts";

/**
 * The layer the oracle runs in: the process spawner, the file system and paths.
 */
const TestLayer = OracleLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The classes of fault, each named for the production or constraint its faults break: XML 1.0's
 * element, end-tag, character-reference, character-data, attribute, comment, processing
 * instruction, prolog, name, character and encoding rules, and Namespaces in XML 1.0's
 * declarations and qualified names.
 */
const faultClasses = [
  "unclosed tag",
  "mismatched name",
  "character reference",
  "stray less-than",
  "stray ampersand",
  "doubled attribute",
  "comment",
  "processing instruction",
  "misplaced markup",
  "XML declaration",
  "attribute syntax",
  "name",
  "CDATA end in text",
  "forbidden character",
  "encoding",
  "namespace",
] as const;

/**
 * One of {@link faultClasses}.
 */
type FaultClass = (typeof faultClasses)[number];

/**
 * What a case reaches: its class refused by both readers, or accepted by both.
 */
type Reached = `${FaultClass}: refused by both` | `${FaultClass}: accepted by both`;

/**
 * A span of a seed's text, from its first character to the one after its last.
 */
type Span = readonly [start: number, end: number];

/**
 * One attribute of a start tag as written: the whole `name="value"`, its name and its value
 * between the quotes.
 */
interface WrittenAttribute {
  readonly name: Span;
  readonly value: Span;
  readonly whole: Span;
}

/**
 * One start tag or empty-element tag: its span, its name, its attributes, whether it is empty,
 * where its closing `/>` or `>` begins, and its element's end tag, none for an empty element.
 */
interface StartTag {
  readonly attributes: readonly WrittenAttribute[];
  readonly close: number;
  readonly empty: boolean;
  readonly end: Option.Option<Span>;
  readonly name: Span;
  readonly span: Span;
}

/**
 * A seed as the faults edit it: its name, charset, text, the start tags and end tags of its
 * elements in document order, its comments, where its root begins and ends, and where its XML
 * declaration ends, if it has one.
 */
interface Seed {
  readonly charset: Charset;
  readonly comments: readonly Span[];
  readonly declaration: Option.Option<Span>;
  readonly ends: readonly Span[];
  readonly name: string;
  readonly root: Span;
  readonly starts: readonly StartTag[];
  readonly text: string;
}

/**
 * A start tag's name, attributes and close, at the start of the text it is matched against.
 */
const startTagPattern =
  /^<(?<name>[^\s/>]+)(?<attributes>(?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(?<slash>\/?)>/u;

/**
 * One attribute inside a start tag's attribute text.
 */
const attributePattern = /(?<name>[^\s=/>]+)\s*=\s*(?<quote>["'])(?<value>[^"']*)\k<quote>/gu;

/**
 * The markup the reading steps over whole, by the text that opens and the text that closes it:
 * comments, processing instructions (the XML declaration among them) and CDATA sections.
 */
const delimiters = [
  ["comment", "<!--", "-->"],
  ["pi", "<?", "?>"],
  ["cdata", "<![CDATA[", "]]>"],
] as const;

/**
 * A comment, processing instruction or CDATA section: which it is, and the offset after it, -1
 * for one that never closes.
 */
interface Delimited {
  readonly end: number;
  readonly kind: (typeof delimiters)[number][0];
}

/**
 * Read the comment, processing instruction or CDATA section that opens at an offset.
 *
 * @param text - The text.
 * @param at - The offset.
 * @returns It, none where none opens there.
 */
const delimitedAt = (text: string, at: number): Option.Option<Delimited> =>
  Option.fromUndefinedOr(delimiters.find(([, opener]) => text.startsWith(opener, at))).pipe(
    Option.map(([kind, opener, closer]) => {
      const found = text.indexOf(closer, at + opener.length);

      return { end: found === -1 ? -1 : found + closer.length, kind };
    }),
  );

/**
 * Read the start tag or empty-element tag that opens at an offset, its element's end tag not yet
 * known.
 *
 * @param text - The text.
 * @param at - The offset of its `<`.
 * @returns The tag, none where the text there is no tag this reading follows.
 */
const startTagAt = (text: string, at: number): Option.Option<Omit<StartTag, "end">> => {
  const match = startTagPattern.exec(text.slice(at));
  const groups = match?.groups;
  if (match === null || groups === undefined) {
    return Option.none();
  }

  const nameEnd = at + 1 + (groups["name"] ?? "").length;
  const attributes = [...(groups["attributes"] ?? "").matchAll(attributePattern)].map(
    (held): WrittenAttribute => {
      const from = nameEnd + held.index;
      const to = from + held[0].length;

      return {
        name: [from, from + (held.groups?.["name"] ?? "").length],
        value: [to - 1 - (held.groups?.["value"] ?? "").length, to - 1],
        whole: [from, to],
      };
    },
  );
  const empty = groups["slash"] === "/";

  return Option.some({
    attributes,
    close: at + match[0].length - (empty ? 2 : 1),
    empty,
    name: [at + 1, nameEnd],
    span: [at, at + match[0].length],
  });
};

/**
 * Where a document type declaration stands in a text, an empty span at -1 where there is none.
 *
 * @param text - The text.
 * @param doctype - The declaration as written.
 * @returns Its span, none where the text does not hold it as written.
 */
const doctypeSpan = (text: string, doctype: Option.Option<string>): Option.Option<Span> =>
  Option.match(doctype, {
    onNone: () => Option.some([-1, -1] as const),
    onSome: (written) => {
      const at = text.indexOf(written);

      return at === -1 ? Option.none() : Option.some([at, at + written.length] as const);
    },
  });

/**
 * Read the markup of a well-formed document's text, outside its document type declaration: its
 * tags, comments and declaration.
 *
 * @param name - The seed's name.
 * @param charset - The charset its bytes are written in.
 * @param text - Its text.
 * @param doctype - Its document type declaration as written, which is skipped whole.
 * @returns The seed, none for text the reading does not follow.
 */
const seedOf = (
  name: string,
  charset: Charset,
  text: string,
  doctype: Option.Option<string>,
): Option.Option<Seed> => {
  const skipped = doctypeSpan(text, doctype);
  if (Option.isNone(skipped)) {
    return Option.none();
  }

  const starts: StartTag[] = [];
  const ends: Span[] = [];
  const comments: Span[] = [];
  const open: number[] = [];
  let declaration = Option.none<Span>();
  let at = 0;
  while (at < text.length) {
    const delimited = delimitedAt(text, at);
    if (at === skipped.value[0]) {
      [, at] = skipped.value;
    } else if (Option.isSome(delimited)) {
      if (delimited.value.end === -1) {
        return Option.none();
      }

      if (delimited.value.kind === "comment") {
        comments.push([at, delimited.value.end]);
      } else if (delimited.value.kind === "pi" && at === 0 && /^<\?xml\s/u.test(text)) {
        declaration = Option.some([0, delimited.value.end]);
      }

      at = delimited.value.end;
    } else if (text.startsWith("</", at)) {
      const end = text.indexOf(">", at) + 1;
      const opened = open.pop() ?? -1;
      const start = starts[opened];
      if (end === 0 || start === undefined) {
        return Option.none();
      }

      ends.push([at, end]);
      starts[opened] = { ...start, end: Option.some([at, end]) };
      at = end;
    } else if (text[at] === "<") {
      const tag = startTagAt(text, at);
      if (Option.isNone(tag)) {
        return Option.none();
      }

      if (!tag.value.empty) {
        open.push(starts.length);
      }

      starts.push({ ...tag.value, end: Option.none() });
      [, at] = tag.value.span;
    } else {
      const next = text.indexOf("<", at);
      at = next === -1 ? text.length : next;
    }
  }

  // A well-formed document's first element is its root: the prolog holds none.
  return Option.fromUndefinedOr(starts[0]).pipe(
    Option.map((first) => ({
      charset,
      comments,
      declaration,
      ends,
      name,
      root: [first.span[0], Option.getOrElse(first.end, () => first.span)[1]] as const,
      starts,
      text,
    })),
  );
};

/**
 * Replace a span of text.
 *
 * @param text - The text.
 * @param span - The span replaced.
 * @param by - What stands there instead.
 * @returns The edited text.
 */
const spliced = (text: string, span: Span, by: string): string =>
  text.slice(0, span[0]) + by + text.slice(span[1]);

/**
 * Insert text at an offset.
 *
 * @param text - The text.
 * @param at - The offset.
 * @param addition - What is inserted.
 * @returns The edited text.
 */
const inserted = (text: string, at: number, addition: string): string =>
  spliced(text, [at, at], addition);

/**
 * The first and the last of some sites, the two a fault is applied at.
 *
 * @param sites - The sites, in document order.
 * @returns At most two of them.
 */
const firstAndLast = <A>(sites: readonly A[]): readonly A[] =>
  sites.length <= 2 ? sites : [...sites.slice(0, 1), ...sites.slice(-1)];

/**
 * Where character data may stand in a seed's elements: after each start tag of an element with
 * content, and before each end tag.
 *
 * @param seed - The seed.
 * @returns The offsets, in document order.
 */
const contentSites = (seed: Seed): readonly number[] =>
  [
    ...seed.starts.filter((tag) => !tag.empty).map((tag) => tag.span[1]),
    ...seed.ends.map(([start]) => start),
  ].toSorted((a, b) => a - b);

/**
 * The attributes of one start tag that are not namespace declarations.
 *
 * @param seed - The seed.
 * @param tag - The start tag.
 * @returns Them, in the order written.
 */
const plainOf = (seed: Seed, tag: StartTag): readonly WrittenAttribute[] =>
  tag.attributes.filter(({ name }) => !seed.text.slice(...name).startsWith("xmlns"));

/**
 * The attributes of a seed that are not namespace declarations.
 *
 * @param seed - The seed.
 * @returns Them, in document order.
 */
const plainAttributes = (seed: Seed): readonly WrittenAttribute[] =>
  seed.starts.flatMap((tag) => plainOf(seed, tag));

/**
 * The elements of a seed whose names have no prefix.
 *
 * @param seed - The seed.
 * @returns Their start tags, in document order.
 */
const unprefixed = (seed: Seed): readonly StartTag[] =>
  seed.starts.filter((tag) => !seed.text.slice(...tag.name).includes(":"));

/**
 * Rename an element, its start tag and its end tag alike.
 *
 * @param seed - The seed.
 * @param tag - The element's start tag.
 * @param name - The name it is given, from its current name.
 * @param added - Attributes written into its start tag, as text that begins with white space.
 * @returns The edited text.
 */
const renamed = (
  seed: Seed,
  tag: StartTag,
  name: (current: string) => string,
  added = "",
): string => {
  const current = seed.text.slice(...tag.name);
  const ended = Option.match(tag.end, {
    onNone: () => seed.text,
    onSome: ([start, end]) => spliced(seed.text, [start, end], `</${name(current)}>`),
  });

  return spliced(inserted(ended, tag.close, added), tag.name, name(current));
};

/**
 * The highest code point each single-byte charset writes. Every other charset writes every
 * character.
 */
const singleByteHighest: ReadonlyMap<Charset, number> = new Map([
  ["ISO-8859-1", 0xff],
  ["US-ASCII", 0x7f],
]);

/**
 * Whether a charset can write every character of a text.
 *
 * @param text - The text.
 * @param charset - The charset.
 * @returns Whether it can.
 */
const writable = (text: string, charset: Charset): boolean => {
  const highest = singleByteHighest.get(charset) ?? 0x10_ff_ff;
  for (const character of text) {
    if ((character.codePointAt(0) ?? 0) > highest) {
      return false;
    }
  }

  return true;
};

/**
 * One fault: its class, what it does, and the documents it makes of a seed, one per site.
 */
interface Fault {
  readonly faultClass: FaultClass;
  readonly name: string;
  readonly of: (seed: Seed) => readonly Uint8Array[];
}

/**
 * A fault by characters: its texts are written in the seed's charset, each only where the charset
 * can write it.
 *
 * @param faultClass - Its class.
 * @param name - What it does.
 * @param texts - The texts it makes of a seed.
 * @returns The fault.
 */
const byText = (
  faultClass: FaultClass,
  name: string,
  texts: (seed: Seed) => readonly string[],
): Fault => ({
  faultClass,
  name,
  of: (seed) =>
    texts(seed)
      .filter((text) => writable(text, seed.charset))
      .map((text) => encodedIn(text, seed.charset)),
});

/**
 * A fault that inserts text into character data, after a start tag or before an end tag.
 *
 * @param faultClass - Its class.
 * @param text - What it inserts.
 * @returns The fault.
 */
const inContent = (faultClass: FaultClass, text: string): Fault =>
  byText(faultClass, `${JSON.stringify(text)} in content`, (seed) =>
    firstAndLast(contentSites(seed)).map((at) => inserted(seed.text, at, text)),
  );

/**
 * A fault that inserts text at the start of an attribute's value.
 *
 * @param faultClass - Its class.
 * @param text - What it inserts.
 * @returns The fault.
 */
const inValue = (faultClass: FaultClass, text: string): Fault =>
  byText(faultClass, `${JSON.stringify(text)} in an attribute value`, (seed) =>
    firstAndLast(plainAttributes(seed)).map(({ value }) => inserted(seed.text, value[0], text)),
  );

/**
 * A fault that writes text into a start tag, after its last attribute.
 *
 * @param faultClass - Its class.
 * @param text - What it writes, from the white space before it.
 * @returns The fault.
 */
const inTag = (faultClass: FaultClass, text: string): Fault =>
  byText(faultClass, `${JSON.stringify(text)} in a start tag`, (seed) =>
    firstAndLast(seed.starts).map((tag) => inserted(seed.text, tag.close, text)),
  );

/**
 * A fault that inserts text after the root element.
 *
 * @param faultClass - Its class.
 * @param text - What it inserts.
 * @returns The fault.
 */
const afterRoot = (faultClass: FaultClass, text: string): Fault =>
  byText(faultClass, `${JSON.stringify(text)} after the root`, (seed) => [
    inserted(seed.text, seed.root[1], text),
  ]);

/**
 * A fault that renames elements without a prefix, start and end tags alike.
 *
 * @param faultClass - Its class.
 * @param name - What it does.
 * @param to - The new name, from the current one.
 * @param added - Attributes it writes into the start tag.
 * @returns The fault.
 */
const renaming = (
  faultClass: FaultClass,
  name: string,
  to: (current: string) => string,
  added = "",
): Fault =>
  byText(faultClass, name, (seed) =>
    firstAndLast(unprefixed(seed)).map((tag) => renamed(seed, tag, to, added)),
  );

/**
 * A fault that replaces the XML declaration of a UTF-8 seed, or writes one where it has none.
 *
 * @param declaration - The declaration written.
 * @returns The fault.
 */
const declaring = (declaration: string): Fault =>
  byText("XML declaration", `the declaration ${declaration}`, (seed) =>
    seed.charset === "UTF-8"
      ? [
          Option.match(seed.declaration, {
            onNone: () => declaration + seed.text,
            onSome: (span) => spliced(seed.text, span, declaration),
          }),
        ]
      : [],
  );

/**
 * A fault by bytes: bytes inserted where character data stands, in the charsets it names.
 *
 * @param name - What it does.
 * @param bytes - The bytes it inserts, by the charsets they apply to.
 * @returns The fault.
 */
const inBytes = (name: string, bytes: ReadonlyMap<Charset, readonly number[]>): Fault => ({
  faultClass: "encoding",
  name,
  of: (seed) => {
    const held = bytes.get(seed.charset);
    if (held === undefined) {
      return [];
    }

    return firstAndLast(contentSites(seed)).map((at) => {
      const before = encodedIn(seed.text.slice(0, at), seed.charset);
      const whole = encodedIn(seed.text, seed.charset);

      return Uint8Array.from([...before, ...held, ...whole.subarray(before.length)]);
    });
  },
});

/**
 * The same bytes in each charset of the UTF-8 family.
 *
 * @param bytes - The bytes.
 * @returns Them, by charset.
 */
const utf8 = (bytes: readonly number[]): ReadonlyMap<Charset, readonly number[]> =>
  new Map([
    ["UTF-8", bytes],
    ["UTF-8 BOM", bytes],
  ]);

/**
 * One UTF-16 code unit in each charset of the UTF-16 family, in its byte order.
 *
 * @param units - The code units.
 * @returns Their bytes, by charset.
 */
const utf16 = (units: readonly number[]): ReadonlyMap<Charset, readonly number[]> => {
  const little = units.flatMap((unit) => [unit % 0x1_00, Math.floor(unit / 0x1_00)]);
  const big = units.flatMap((unit) => [Math.floor(unit / 0x1_00), unit % 0x1_00]);

  return new Map([
    ["UTF-16LE", little],
    ["UTF-16LE BOM", little],
    ["UTF-16BE", big],
    ["UTF-16BE BOM", big],
  ]);
};

/**
 * Every fault, by class, the lawful edits of each class beside the faults.
 */
const faults: readonly Fault[] = [
  byText("unclosed tag", "an end tag dropped", (seed) =>
    firstAndLast(seed.ends).map((span) => spliced(seed.text, span, "")),
  ),
  byText("unclosed tag", "an empty-element tag opened", (seed) =>
    firstAndLast(seed.starts.filter((tag) => tag.empty)).map((tag) =>
      spliced(seed.text, [tag.close, tag.close + 1], ""),
    ),
  ),
  byText("unclosed tag", "the text cut after a start tag", (seed) =>
    firstAndLast(seed.starts.filter((tag) => !tag.empty)).map((tag) =>
      seed.text.slice(0, tag.span[1]),
    ),
  ),
  byText("unclosed tag", "the text cut inside a start tag", (seed) =>
    firstAndLast(seed.starts).map((tag) => seed.text.slice(0, tag.name[1])),
  ),
  byText("unclosed tag", "white space before an end tag's >", (seed) =>
    firstAndLast(seed.ends).map(([, end]) => inserted(seed.text, end - 1, " ")),
  ),
  byText("mismatched name", "an end tag renamed", (seed) =>
    firstAndLast(seed.ends).map(([, end]) => inserted(seed.text, end - 1, "z")),
  ),
  byText("mismatched name", "a start tag renamed", (seed) =>
    firstAndLast(seed.starts.filter((tag) => !tag.empty)).map((tag) =>
      inserted(seed.text, tag.name[1], "z"),
    ),
  ),
  byText("mismatched name", "an end tag's name in capitals", (seed) =>
    firstAndLast(
      seed.ends.filter(([start, end]) => {
        const name = seed.text.slice(start + 2, end - 1);

        return name.toUpperCase() !== name;
      }),
    ).map(([start, end]) =>
      spliced(seed.text, [start, end], seed.text.slice(start, end).toUpperCase()),
    ),
  ),
  byText("mismatched name", "two adjacent end tags swapped", (seed) =>
    firstAndLast(
      seed.ends.flatMap((first, index) => {
        const second = seed.ends[index + 1];

        return second !== undefined &&
          second[0] === first[1] &&
          seed.text.slice(...first) !== seed.text.slice(...second)
          ? [[first, second] as const]
          : [];
      }),
    ).map(([first, second]) =>
      spliced(
        seed.text,
        [first[0], second[1]],
        seed.text.slice(...second) + seed.text.slice(...first),
      ),
    ),
  ),
  renaming("mismatched name", "an element renamed in both its tags", (name) => `${name}z`),
  ...[
    "&#0;",
    "&#x1;",
    "&#xB;",
    "&#xD800;",
    "&#xDFFF;",
    "&#xFFFE;",
    "&#xFFFF;",
    "&#x110000;",
    "&#;",
    "&#x;",
    "&#12a;",
    "&#xG1;",
    "&#X41;",
    "&# 65;",
    "&#65",
    "&#x41;",
    "&#65;",
    "&#x9;",
    "&#x85;",
    "&#x10FFFF;",
    "&#0065;",
  ].flatMap((reference) => [
    inContent("character reference", reference),
    inValue("character reference", reference),
  ]),
  inValue("stray less-than", "<"),
  inContent("stray less-than", "< z"),
  inContent("stray less-than", "<>"),
  inContent("stray less-than", "<![CDATA[<]]>"),
  inContent("stray less-than", "<!--<-->"),
  inContent("stray less-than", "&lt;"),
  inValue("stray less-than", ">"),
  inContent("stray less-than", ">"),
  inContent("stray ampersand", "& "),
  inContent("stray ampersand", "&;"),
  inContent("stray ampersand", "&1z;"),
  inContent("stray ampersand", "&z"),
  inValue("stray ampersand", "&"),
  inValue("stray ampersand", "& z;"),
  inContent("stray ampersand", "&amp;"),
  inValue("stray ampersand", "&amp;"),
  inContent("stray ampersand", "<![CDATA[&]]>"),
  inContent("stray ampersand", "<!--&-->"),
  byText("doubled attribute", "an attribute written twice", (seed) =>
    firstAndLast(
      seed.starts.flatMap((tag) =>
        plainOf(seed, tag).map((attribute) => [tag, attribute] as const),
      ),
    ).map(([tag, attribute]) =>
      inserted(seed.text, tag.close, ` ${seed.text.slice(...attribute.whole)}`),
    ),
  ),
  inTag("doubled attribute", ' zq="1" zq="2"'),
  inTag("doubled attribute", ' zq="1" zr="1"'),
  inContent("comment", "<!-- a -- b -->"),
  inContent("comment", "<!-- a --->"),
  inContent("comment", "<!-- a"),
  inContent("comment", "<!- a -->"),
  inContent("comment", "<!-- a - b -->"),
  inContent("comment", "<!---->"),
  byText("comment", "two hyphens inside a comment", (seed) =>
    firstAndLast(seed.comments).map(([start]) => inserted(seed.text, start + 4, "--")),
  ),
  afterRoot("comment", "<!-- a -- b -->"),
  inContent("processing instruction", '<?xml version="1.0"?>'),
  inContent("processing instruction", "<?XmL a?>"),
  inContent("processing instruction", "<? a?>"),
  inContent("processing instruction", "<?zq:a b?>"),
  inContent("processing instruction", "<?1a b?>"),
  inContent("processing instruction", "<?a b"),
  inContent("processing instruction", "<?xml-zq a?>"),
  inContent("processing instruction", "<?zq?>"),
  inContent("processing instruction", "<?zq ?>"),
  byText("misplaced markup", "white space before the XML declaration", (seed) =>
    Option.isSome(seed.declaration) && seed.charset === "UTF-8" ? [` ${seed.text}`] : [],
  ),
  byText("misplaced markup", "a comment before the XML declaration", (seed) =>
    Option.isSome(seed.declaration) && seed.charset === "UTF-8" ? [`<!---->${seed.text}`] : [],
  ),
  byText("misplaced markup", "a second XML declaration", (seed) =>
    Option.match(seed.declaration, {
      onNone: () => [],
      onSome: ([, end]) => [inserted(seed.text, end, '<?xml version="1.0"?>')],
    }),
  ),
  afterRoot("misplaced markup", '<?xml version="1.0"?>'),
  byText("misplaced markup", "the root removed", (seed) => [spliced(seed.text, seed.root, "")]),
  afterRoot("misplaced markup", "<zq/>"),
  afterRoot("misplaced markup", "zq"),
  afterRoot("misplaced markup", "&#65;"),
  afterRoot("misplaced markup", "<![CDATA[x]]>"),
  afterRoot("misplaced markup", "<!DOCTYPE zq>"),
  inContent("misplaced markup", "<!DOCTYPE zq>"),
  afterRoot("misplaced markup", "\n"),
  afterRoot("misplaced markup", "<!--zq-->"),
  afterRoot("misplaced markup", "<?zq?>"),
  declaring("<?xml?>"),
  declaring('<?xml encoding="UTF-8"?>'),
  declaring('<?xml version="1.0" standalone="maybe"?>'),
  declaring('<?xml standalone="yes" version="1.0"?>'),
  declaring('<?xml version="1.0" standalone="yes" encoding="UTF-8"?>'),
  declaring("<?xml version='1.0\"?>"),
  declaring('<?xml version="1.0"encoding="UTF-8"?>'),
  declaring('<?xml version="1.0" encoding="UTF-8" encoding="UTF-8"?>'),
  declaring('<?xml version="1.0" zq="1"?>'),
  declaring('<?xml version="1.0" encoding="UTF 8"?>'),
  declaring('<?xml  version = "1.0"  encoding = "UTF-8" ?>'),
  declaring('<?xml version="1.0" encoding="utf-8"?>'),
  declaring('<?xml version="1.0" standalone="no"?>'),
  inTag("attribute syntax", " zq=1"),
  inTag("attribute syntax", " zq"),
  inTag("attribute syntax", ' zq="1"zr="2"'),
  inTag("attribute syntax", " zq=\"1'"),
  inTag("attribute syntax", ' zq "1"'),
  inTag("attribute syntax", " zq="),
  inTag("attribute syntax", ' zq = "1"'),
  inTag("attribute syntax", " zq='1'"),
  inTag("attribute syntax", '\n\tzq="1"'),
  renaming("name", "an element named from a digit", (name) => `1${name}`),
  renaming("name", "an element named from a hyphen", (name) => `-${name}`),
  renaming("name", "an element named from a full stop", (name) => `.${name}`),
  renaming("name", "an element named from a low line", (name) => `_${name}`),
  renaming(
    "name",
    "an element named with a full stop, a hyphen and a digit",
    (name) => `${name}.-1`,
  ),
  renaming("name", "an element named from a letter outside ASCII", (name) => `é${name}`),
  inTag("name", ' 1zq="1"'),
  inTag("name", ' -zq="1"'),
  inTag("name", ' _zq="1"'),
  inTag("name", ' zq.-1="1"'),
  inContent("CDATA end in text", "]]>"),
  inContent("CDATA end in text", "]]"),
  inValue("CDATA end in text", "]]>"),
  inContent("CDATA end in text", "]]&gt;"),
  ...[
    "\u0000",
    "\u0001",
    "\u000B",
    "\u001F",
    "￾",
    "￿",
    "\t",
    "\u0085",
    "\u007F",
    "\u{10FFFF}",
    "�",
  ].flatMap((character) => [
    inContent("forbidden character", character),
    inValue("forbidden character", character),
    inContent("forbidden character", `<!--${character}-->`),
    inContent("forbidden character", `<?zq ${character}?>`),
  ]),
  inBytes("a byte no UTF-8 sequence holds", utf8([0xff])),
  inBytes("a continuation byte alone", utf8([0x80])),
  inBytes("a sequence cut short", utf8([0xc3])),
  inBytes("an overlong sequence", utf8([0xc0, 0xbc])),
  inBytes("a surrogate encoded", utf8([0xed, 0xa0, 0x80])),
  inBytes("a code point past U+10FFFF", utf8([0xf4, 0x90, 0x80, 0x80])),
  inBytes("a two-byte sequence", utf8([0xc3, 0xa9])),
  inBytes("a four-byte sequence", utf8([0xf0, 0x9d, 0x84, 0x9e])),
  inBytes("a high surrogate alone", utf16([0xd8_00])),
  inBytes("a low surrogate alone", utf16([0xdc_00])),
  inBytes("a surrogate pair", utf16([0xd8_34, 0xdd_1e])),
  inBytes("a byte past ASCII", new Map([["US-ASCII", [0xe9]]])),
  renaming("namespace", "an element given an unbound prefix", (name) => `zq:${name}`),
  inTag("namespace", ' zq:a="1"'),
  inTag("namespace", ' xmlns:zq=""'),
  inTag("namespace", ' xmlns:xml="urn:zq"'),
  inTag("namespace", ' xmlns="http://www.w3.org/XML/1998/namespace"'),
  inTag("namespace", ' xmlns:xmlns="urn:zq"'),
  inTag("namespace", ' xmlns:zq="http://www.w3.org/2000/xmlns/"'),
  inTag("namespace", ' xmlns:zq="urn:zq" xmlns:zr="urn:zq" zq:a="1" zr:a="2"'),
  inTag("namespace", ' xmlns:zq="urn:zq" zq:a:b="1"'),
  renaming(
    "namespace",
    "an element named with two colons",
    (name) => `zq:${name}:b`,
    ' xmlns:zq="urn:zq"',
  ),
  renaming("namespace", "an element given the xmlns prefix", (name) => `xmlns:${name}`),
  inTag("namespace", ' xmlns:zq="urn:zq" zq:a="1"'),
  inTag("namespace", ' xmlns:xml="http://www.w3.org/XML/1998/namespace"'),
  inTag("namespace", ' xml:lang="en"'),
  renaming(
    "namespace",
    "an element given a bound prefix",
    (name) => `zq:${name}`,
    ' xmlns:zq="urn:zq"',
  ),
];

/**
 * The composed grammar the QTI and lawful seeds are built from.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The root kinds whose lawful minimal documents are seeds.
 */
const lawfulRoots: ReadonlySet<string> = new Set(["qti-assessment-item", "qti-assessment-test"]);

/**
 * The seeds' genomes, named: the codec search's generic seeds and QTI seeds, each on a stream
 * this suite's label fixes, and the lawful minimal documents of {@link lawfulRoots}.
 */
const genomes: readonly (readonly [string, CodecGenome])[] = [
  ...sample(genericGenome, floorSeed("pantry/xml/malformed/generic-seeds"), 160).map(
    (genome, at) => [`generic seed ${String(at)}`, genome] as const,
  ),
  ...sample(xdmDocument(grammar), floorSeed("pantry/xml/malformed/qti-seeds"), 8).map(
    ({ document }, at) =>
      [`QTI seed ${String(at)}`, genomeOfTree(toXmlDocument(document, documentNames))] as const,
  ),
  ...lawfulDocuments(grammar, (kind) => lawfulRoots.has(kind))
    .filter(({ name }) => name.includes(" minimal "))
    .map(({ doc, name }) => [name, genomeOfTree(doc)] as const),
];

/**
 * The fewest seeds both readers accept that the box runs on, so a generator that changes under it
 * cannot leave it judging almost nothing.
 */
const fewestSeeds = 24;

/**
 * Libxml2's verdict on one document: whether it accepts it, and the class of its refusal
 * ({@link libxml2Class}), empty where it accepts.
 */
interface Verdict {
  readonly accepted: boolean;
  readonly why: string;
}

/**
 * How many files one `xmllint` run judges.
 */
const batchSize = 200;

/**
 * Judge one file with `xmllint --noout --nonet` alone, as the codec search's O1 does: libxml2
 * accepts a document when it exits 0 and reports no namespace error.
 *
 * @param file - The file.
 * @returns Libxml2's verdict.
 */
const judgedAlone = Effect.fnUntraced(function* judgedAlone(file: string) {
  const run = yield* xmllintRun(["--noout", "--nonet", file]).pipe(Effect.orDie);
  const accepted = run.code === 0 && !/ namespace error : /u.test(run.stderr);

  return { accepted, why: accepted ? "" : libxml2Class(run.stderr, run.code) } satisfies Verdict;
});

/**
 * Judge files with `xmllint --noout --nonet`, many to a run. libxml2 starts each parser and
 * namespace error line with the path of the file it reads, so a file is refused when an error line
 * starts with its path. Its encoding errors (`encoding error : input conversion failed`, then
 * `I/O error : encoder error`) start with no path, and it writes them before the parser error
 * that ends that file's parse, so a line without a path is the next path's. A batch whose last
 * error line has no path is judged file by file instead.
 *
 * @param files - The files, by absolute path.
 * @returns Libxml2's verdict on each.
 */
const judgedInBatches = Effect.fnUntraced(function* judgedInBatches(files: readonly string[]) {
  const verdicts = new Map<string, Verdict>();
  for (const batch of Arr.chunksOf(files, batchSize)) {
    const run = yield* xmllintRun(["--noout", "--nonet", ...batch]).pipe(Effect.orDie);
    const byFile = new Map<string, string[]>();
    let pending: string[] = [];
    for (const line of run.stderr.split("\n").filter((held) => / error : /u.test(held))) {
      const file = /^(?<file>\/[^:]+\.xml):/u.exec(line)?.groups?.["file"];
      if (file !== undefined && batch.includes(file)) {
        byFile.set(file, [...(byFile.get(file) ?? []), ...pending, line]);
        pending = [];
      } else {
        pending.push(line);
      }
    }

    for (const file of batch) {
      const own = byFile.get(file) ?? [];
      verdicts.set(
        file,
        pending.length > 0
          ? yield* judgedAlone(file)
          : {
              accepted: own.length === 0,
              why: own.length === 0 ? "" : libxml2Class(own.join("\n"), 1),
            },
      );
    }
  }

  return verdicts;
});

/**
 * The seeds both readers accept: each genome's text in its charset, where the charset writes it
 * whole and the bytes are in the encoding they declare, read by crust as an XML 1.0 document whose
 * markup {@link seedOf} follows, and accepted by libxml2.
 *
 * @param directory - Where the seeds' files are written for `xmllint`.
 * @returns The seeds.
 */
const acceptedSeeds = Effect.fnUntraced(function* acceptedSeeds(directory: string) {
  const fs = yield* FileSystem.FileSystem;
  const read: Seed[] = [];
  for (const [name, genome] of genomes) {
    const text = sourceText(genome);
    const bytes = encodedIn(text, genome.charset);
    if (!writable(text, genome.charset) || Option.isSome(declaredAgainstBytes(bytes))) {
      continue;
    }

    const document = yield* Effect.result(readXml(bytes));
    if (Result.isFailure(document)) {
      continue;
    }

    const version = Option.match(document.success.declaration, {
      onNone: () => "1.0",
      onSome: (declared) => declared.version,
    });
    const seed = seedOf(name, genome.charset, text, document.success.doctype);
    if (version === "1.0" && Option.isSome(seed) && !read.some((held) => held.text === text)) {
      read.push(seed.value);
    }
  }

  const files = read.map((_, at) => `${directory}/seed-${String(at)}.xml`);
  yield* Effect.forEach(
    read,
    (seed, at) => fs.writeFile(files[at] ?? "", encodedIn(seed.text, seed.charset)),
    { discard: true },
  );

  const verdicts = yield* judgedInBatches(files);

  return read.filter((_, at) => verdicts.get(files[at] ?? "")?.accepted === true);
});

/**
 * One case of the box: a fault, the seed it is applied to, and the document it makes.
 */
interface FaultCase {
  readonly bytes: Uint8Array;
  readonly fault: Fault;
  readonly seed: string;
}

/**
 * How long the search may take: it reads the seeds, writes and judges every case's file, and
 * reads each case with crust (the grammar is composed when the file loads, before the test).
 * Measured 2026-11-07: 25.3 s at a load average of 83 to 90, and the budget is over four times
 * that.
 */
const searchTimeout = 120_000;

/**
 * Write a case's document for a failure message: its text as UTF-8 reads it, quoted.
 *
 * @param bytes - The document.
 * @returns The text, cut to 600 characters.
 */
const shown = (bytes: Uint8Array): string =>
  JSON.stringify(new TextDecoder().decode(bytes)).slice(0, 600);

describe("crust's reader on malformed documents", () => {
  it.effect(
    "agrees with xmllint on whether each faulted document is well formed, every fault at two sites of each seed, exhausted",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* searchFaults() {
          const fs = yield* FileSystem.FileSystem;
          const directory = yield* scratchDirectory("malformed-");
          const seeds = yield* acceptedSeeds(directory);

          assert.isAtLeast(seeds.length, fewestSeeds, "the seeds both readers accept");

          const cases: readonly FaultCase[] = seeds.flatMap((seed) =>
            faults.flatMap((fault) =>
              fault.of(seed).map((bytes) => ({ bytes, fault, seed: seed.name })),
            ),
          );
          const files = cases.map((_, at) => `${directory}/case-${String(at)}.xml`);
          yield* Effect.forEach(cases, ({ bytes }, at) => fs.writeFile(files[at] ?? "", bytes), {
            discard: true,
          });

          const batched = yield* judgedInBatches(files);

          return yield* exhaust(
            {
              box: `every one of ${String(faults.length)} faults at up to two sites of each of ${String(seeds.length)} seeds: ${String(cases.length)} documents`,
              caseHang: Duration.seconds(30),
              coverage: requiredInSpace<Reached>(
                pipe(
                  faultClasses,
                  Arr.flatMap(
                    (faultClass) =>
                      [
                        `${faultClass}: refused by both`,
                        `${faultClass}: accepted by both`,
                      ] as const,
                  ),
                ),
              ),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => `${cases[at]?.fault.name ?? ""} on ${cases[at]?.seed ?? ""}`,
              oracle: {
                kind: "second-implementation",
                name: "libxml2's xmllint --noout --nonet, its namespace errors refusals (XML 1.0, Namespaces in XML 1.0)",
              },
              suite: "pantry/xml/malformed-against-xmllint",
            },
            (at, c) =>
              Effect.gen(function* agrees() {
                const drawnCase = cases[at];
                const file = files[at];
                if (drawnCase === undefined || file === undefined) {
                  return;
                }

                const read = yield* Effect.result(readXml(drawnCase.bytes));
                const first = batched.get(file) ?? (yield* judgedAlone(file));
                const verdict =
                  first.accepted === Result.isSuccess(read) ? first : yield* judgedAlone(file);
                if (verdict.accepted === Result.isSuccess(read)) {
                  c.note(
                    `${drawnCase.fault.faultClass}: ${verdict.accepted ? "accepted by both" : "refused by both"}`,
                  );
                }

                assert.strictEqual(
                  Result.isSuccess(read),
                  verdict.accepted,
                  `${drawnCase.fault.faultClass}, ${drawnCase.fault.name}, on ${drawnCase.seed}: ${shown(drawnCase.bytes)}: crust ${Result.match(read, { onFailure: (failure) => `refuses (${failure._tag === "ReaderRefusal" ? `${failure.rule}: ${failure.detail}` : failure.message})`, onSuccess: () => "accepts" })}, xmllint ${verdict.accepted ? "accepts" : `refuses (${verdict.why})`}`,
                );
              }),
          ).pipe(
            Effect.tap((done) =>
              Effect.sync(() => {
                assert.strictEqual(done.cases, cases.length);
              }),
            ),
          );
        }).pipe(Effect.scoped, Effect.provide(TestLayer)),
      ),
    searchTimeout,
  );
});
