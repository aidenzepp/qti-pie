/**
 * The LOM learning resource type's test kit (spec reading 122, QTI 3.0 Metadata §2.7.5.1): packages
 * sketched with learning resource types whose source and value vary by every way the law reads
 * them, the sketch's own verdict from the specification's sentence, and the database's laws over a
 * package's rows, judged on the host as PostgreSQL will judge them.
 *
 * - **The sketch.** A package holds LOM records in a resource's metadata, the manifest's own or an
 *   external record file. Each record's educational categories hold learning resource types, each
 *   with a value and a source, either absent, written plain, split by a comment, in a CDATA section
 *   or through a character reference, padded or not, and repeated past the binding's cap where the
 *   swarm draws it. Beside them stand the decoys the law must not read: a term in another namespace
 *   inside the type, and a `value` of another LOM vocabulary.
 * - **The specification's verdict** ({@link sketchRefusals}): a type is refused where its value is
 *   `exam` or `self assessment` and its source is the LOM vocabulary's, `LOMv1.0`, empty or not
 *   written, each compared collapsed. It is written from the sentence, apart from the module's
 *   constants and the law oracle's.
 * - **The database's laws** ({@link databaseRefusals}): the rows `rowsOf` builds and the tree's rows
 *   `rootInsertOf` writes, with `Node.stringValue` folded from the host's `stringPiece` as the
 *   database folds it, under every statement `metadataLaws` adds for the law: the copies both ways,
 *   the keys over each term, and the law's containment.
 */
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { keep, swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { collapse, rowsOf } from "#pantry/import/overlays/metadata.ts";
import type { MetadataRows } from "#pantry/import/overlays/metadata.ts";
import { rootInsertOf } from "#pantry/import/write.ts";
import type { NodeMember, NodeRoot } from "#pantry/import/write.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeId, XdmDocument } from "#pantry/model/xdm.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { forbiddenResourceTypes, lomVocabularySources } from "#pantry/qti/metadata.ts";
import type { LomResourceType, LomResourceTypeSource } from "#pantry/qti/metadata.ts";

/**
 * How a term's text is written: as one text, split by a comment, in a CDATA section, or with its
 * first character as a character reference. Each reads as the same string value.
 */
export type Spelling = "cdata" | "charref" | "comment" | "plain";

/**
 * A learning resource type's term as sketched: its text, the spelling it is written in, and how
 * many times it is written (two passes the binding's cap of one, which N7 refuses).
 */
export interface TermSketch {
  readonly copies: 1 | 2;
  readonly spelling: Spelling;
  readonly text: string;
}

/**
 * A learning resource type as sketched: its value and its source, each none where it writes none,
 * which it writes first, and whether it holds a term of another namespace named `value`.
 */
export interface TypeSketch {
  readonly foreign: boolean;
  readonly order: "source first" | "value first";
  readonly source: Option.Option<TermSketch>;
  readonly value: Option.Option<TermSketch>;
}

/**
 * A LOM record as sketched: where it stands, its educational categories' learning resource types,
 * and whether it holds a decoy, a `value` of another vocabulary (an interactivity type).
 */
export interface RecordSketch {
  readonly decoy: Option.Option<string>;
  readonly educational: readonly (readonly TypeSketch[])[];
  readonly placement: "external" | "manifest" | "resource";
}

/**
 * The features a case's swarm weighs.
 */
export type LomFeature =
  | "cdata"
  | "charref"
  | "comment"
  | "decoy"
  | "external"
  | "forbidden"
  | "foreign"
  | "lom source"
  | "manifest"
  | "no source"
  | "no value"
  | "other source"
  | "padding"
  | "repeat";

/**
 * Every feature, in the order the swarm draws them.
 */
export const lomFeatures = [
  "forbidden",
  "lom source",
  "other source",
  "no source",
  "no value",
  "padding",
  "comment",
  "cdata",
  "charref",
  "repeat",
  "foreign",
  "decoy",
  "external",
  "manifest",
] as const satisfies readonly [LomFeature, ...LomFeature[]];

/**
 * A package as sketched: the swarm it was drawn under, and its records.
 */
export interface PackageSketch {
  readonly records: readonly RecordSketch[];
  readonly swarm: Swarm<LomFeature>;
}

/**
 * The values a sketch writes that the specification forbids once collapsed, and the near misses
 * it allows: another case, a hyphen, a repetition, a longer word, and the values it advises.
 */
export const forbiddenCores = [
  "exam",
  "self assessment",
  "self  assessment",
  "self\tassessment",
] as const;

/**
 * The values the specification allows, each a near miss of a forbidden one or one it advises.
 */
export const allowedCores = [
  "exercise",
  "questionnaire",
  "Exam",
  "self-assessment",
  "exam exam",
  "examination",
  "",
] as const;

/**
 * The sources of the LOM vocabulary once collapsed: `LOMv1.0`, and the empty source.
 */
export const lomSourceCores = ["LOMv1.0", ""] as const;

/**
 * The sources of other vocabularies, each a near miss of the LOM's.
 */
export const otherSourceCores = [
  "MyVocab",
  "lomv1.0",
  "LOMv1.0x",
  "LOM v1.0",
  "LOMv1.0 LOMv1.0",
] as const;

/**
 * The whitespace a sketch writes around a term's text.
 */
export const pads = [" ", "\n\t", "\r\n "] as const;

/**
 * Draw a term's text: a core, padded where the swarm keeps padding.
 *
 * @param drawn - The case's swarm.
 * @param cores - The cores to draw from.
 * @returns The generator.
 */
const textOf =
  (drawn: Swarm<LomFeature>, cores: readonly [string, ...string[]]): Gen<string> =>
  (source) => {
    const core = element(cores)(source);
    if (!keep(drawn, "padding")(source)) {
      return core;
    }

    return `${element(pads)(source)}${core}${element(["", ...pads])(source)}`;
  };

/**
 * Draw a term's spelling: the first of a comment, a CDATA section and a character reference the
 * swarm keeps at this place, else plain text.
 *
 * @param drawn - The case's swarm.
 * @returns The generator.
 */
const spellingOf =
  (drawn: Swarm<LomFeature>): Gen<Spelling> =>
  (source) => {
    for (const spelling of ["comment", "cdata", "charref"] as const) {
      if (keep(drawn, spelling)(source)) {
        return spelling;
      }
    }

    return "plain";
  };

/**
 * Draw a term: its text, its spelling where the swarm weighs one, and two copies where it keeps
 * a repeat.
 *
 * @param drawn - The case's swarm.
 * @param text - The text's generator.
 * @returns The generator.
 */
const termOf =
  (drawn: Swarm<LomFeature>, text: Gen<string>): Gen<TermSketch> =>
  (source) => ({
    copies: keep(drawn, "repeat")(source) ? 2 : 1,
    spelling: spellingOf(drawn)(source),
    text: text(source),
  });

/**
 * Draw a learning resource type under a case's swarm.
 *
 * @param drawn - The case's swarm.
 * @returns The generator.
 */
const typeOf =
  (drawn: Swarm<LomFeature>): Gen<TypeSketch> =>
  (source) => {
    const valueKind = swarmChoice(drawn, ["forbidden", "no value"] as const)(source);
    const sourceKind = swarmChoice(drawn, ["lom source", "other source", "no source"] as const)(
      source,
    );
    const value =
      valueKind === "no value" && keep(drawn, "no value")(source)
        ? Option.none()
        : Option.some(
            termOf(
              drawn,
              textOf(drawn, keep(drawn, "forbidden")(source) ? forbiddenCores : allowedCores),
            )(source),
          );
    const sourceTerm =
      sourceKind === "no source"
        ? Option.none()
        : Option.some(
            termOf(
              drawn,
              textOf(drawn, sourceKind === "lom source" ? lomSourceCores : otherSourceCores),
            )(source),
          );

    return {
      foreign: keep(drawn, "foreign")(source),
      order: element(["value first", "source first"] as const)(source),
      source: sourceTerm,
      value,
    };
  };

/**
 * Draw where a record stands: in its own file or the manifest's metadata where the swarm keeps
 * either, else in the item resource's metadata.
 *
 * @param drawn - The case's swarm.
 * @returns The generator.
 */
const placementOf =
  (drawn: Swarm<LomFeature>): Gen<RecordSketch["placement"]> =>
  (source) => {
    for (const placement of ["external", "manifest"] as const) {
      if (keep(drawn, placement)(source)) {
        return placement;
      }
    }

    return "resource";
  };

/**
 * Draw a record under a case's swarm.
 *
 * @param drawn - The case's swarm.
 * @returns The generator.
 */
const recordOf =
  (drawn: Swarm<LomFeature>): Gen<RecordSketch> =>
  (source) => ({
    decoy: keep(drawn, "decoy")(source)
      ? Option.some(element(["exam", "self assessment"])(source))
      : Option.none(),
    educational: array(array(typeOf(drawn), { max: 3, min: 1 }), { max: 2, min: 1 })(source),
    placement: placementOf(drawn)(source),
  });

/**
 * Draw a package: its swarm, then one to three records drawn under it.
 *
 * @param source - The choice source.
 * @returns The package.
 */
export const packageSketches: Gen<PackageSketch> = (source) => {
  const drawn = swarm(lomFeatures)(source);

  return { records: array(recordOf(drawn), { max: 3, min: 1 })(source), swarm: drawn };
};

/**
 * Escape a text for XML character data: `&`, `<` and `>` as references, and a carriage return as
 * one, which a reader would otherwise normalize to a line feed (XML 1.0 §2.11).
 *
 * @param text - The text.
 * @returns The escaped text.
 */
const escaped = (text: string): string =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#13;");

/**
 * Write a term's text in its spelling: each reads as the text.
 *
 * @param text - The text.
 * @param spelling - The spelling.
 * @returns The XML of its content.
 */
export const spelled = (text: string, spelling: Spelling): string => {
  const half = Math.ceil(text.length / 2);
  const first = text.codePointAt(0);
  if (spelling === "cdata") {
    return text === "" ? "" : `<![CDATA[${text}]]>`;
  }

  if (spelling === "charref") {
    return first === undefined
      ? ""
      : `&#x${first.toString(16)};${escaped(text.slice(String.fromCodePoint(first).length))}`;
  }

  return spelling === "comment"
    ? `${escaped(text.slice(0, half))}<!-- c -->${escaped(text.slice(half))}`
    : escaped(text);
};

/**
 * The text a term's spelling reads as: its text, but a CDATA section's carriage returns, which the
 * reader's line-end normalization turns into line feeds (XML 1.0 §2.11).
 *
 * @param term - The term.
 * @returns Its string value.
 */
export const readText = ({ spelling, text }: TermSketch): string =>
  spelling === "cdata" ? text.replaceAll("\r\n", "\n").replaceAll("\r", "\n") : text;

/**
 * Write a learning resource type's term, as many times as it repeats, none where it is absent.
 *
 * @param name - The term's local name.
 * @param term - The term.
 * @returns Its XML.
 */
export const termXml = (name: "source" | "value", term: Option.Option<TermSketch>): string =>
  Option.match(term, {
    onNone: () => "",
    onSome: ({ copies, spelling, text }) =>
      `<imsmd:${name}>${spelled(text, spelling)}</imsmd:${name}>`.repeat(copies),
  });

/**
 * Write a learning resource type as the LOM binding spells it.
 *
 * @param type - The type.
 * @returns Its XML.
 */
export const typeXml = (type: TypeSketch): string => {
  const terms =
    type.order === "value first"
      ? `${termXml("value", type.value)}${termXml("source", type.source)}`
      : `${termXml("source", type.source)}${termXml("value", type.value)}`;
  const foreign = type.foreign ? `<x:value xmlns:x="urn:x-lom">exam</x:value>` : "";

  return `<imsmd:learningResourceType>${terms}${foreign}</imsmd:learningResourceType>`;
};

/**
 * Write a record's `lom` element, its namespace declared on it.
 *
 * @param record - The record.
 * @returns Its XML.
 */
const recordXml = (record: RecordSketch): string => {
  const decoy = Option.match(record.decoy, {
    onNone: () => "",
    onSome: (value) =>
      `<imsmd:interactivityType><imsmd:source>LOMv1.0</imsmd:source><imsmd:value>${value}</imsmd:value></imsmd:interactivityType>`,
  });
  const educational = record.educational
    .map(
      (types, at) =>
        `<imsmd:educational>${at === 0 ? decoy : ""}${types.map(typeXml).join("")}</imsmd:educational>`,
    )
    .join("");

  return `<imsmd:lom xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM">${educational}</imsmd:lom>`;
};

/**
 * The item every sketched package holds.
 */
const item = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false"><qti-item-body><p>x</p></qti-item-body></qti-assessment-item>`;

/**
 * Write a sketched package's files: its manifest, whose item resource carries the resource
 * records and whose own metadata the manifest records; its item; and each external record in a
 * file of its own, listed by a `resourcemetadata/xml` resource.
 *
 * @param sketch - The package.
 * @returns Its entries, sorted by path.
 */
export const filesOf = (sketch: PackageSketch): readonly PackageFile[] => {
  const placed = (placement: RecordSketch["placement"]) =>
    sketch.records.filter((record) => record.placement === placement);
  const external = placed("external");
  const manifestRecords = placed("manifest").map(recordXml).join("");
  const resourceRecords = placed("resource").map(recordXml).join("");
  const resourceMetadata = resourceRecords === "" ? "" : `<metadata>${resourceRecords}</metadata>`;
  const records = external
    .map(
      (_, at) =>
        `<resource identifier="X${String(at)}" type="resourcemetadata/xml" href="meta/r${String(at)}.xml"><file href="meta/r${String(at)}.xml"/></resource>`,
    )
    .join("");
  const manifest = `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion>${manifestRecords}</metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml">${resourceMetadata}<file href="item.xml"/></resource>${records}</resources></manifest>`;
  const encoder = new TextEncoder();

  return [
    { bytes: encoder.encode(manifest), kind: "manifest" as const, path: "imsmanifest.xml" },
    { bytes: encoder.encode(item), kind: "file" as const, path: "item.xml" },
    ...external.map((record, at) => ({
      bytes: encoder.encode(recordXml(record)),
      kind: "file" as const,
      path: `meta/r${String(at)}.xml`,
    })),
  ].toSorted((left, right) => (left.path < right.path ? -1 : 1));
};

/**
 * Collapse a text as XML Schema Part 2's `collapse` whitespace facet reads it: each tab, line feed
 * and carriage return a space, each run of spaces one, none at either end. Written here apart from
 * the builder's, so the sketch's verdict reads the specification alone.
 *
 * @param text - The text.
 * @returns Its collapsed value.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
const collapsedBySpec = (text: string): string =>
  text
    .replaceAll(/[\t\n\r]/gu, " ")
    .replaceAll(/ +/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * Decide whether the specification refuses one learning resource type: "the LOM-defined values
 * self assessment and exam are forbidden" (QTI 3.0 Metadata §2.7.5.1), of a term whose vocabulary
 * is the LOM's: its source `LOMv1.0`, or empty or not written, which the binding's
 * `default="LOMv1.0"` makes `LOMv1.0` (`imsmd_loose_v1p3p2.xsd` line 1288). The type's first value
 * and first source are read, the ones its rows hold.
 *
 * @param type - The type.
 * @returns Whether it is refused.
 */
export const typeRefused = (type: TypeSketch): boolean => {
  const value = type.value.pipe(Option.map((term) => collapsedBySpec(readText(term))));
  const source = type.source.pipe(Option.map((term) => collapsedBySpec(readText(term))));
  const lomDefined = Option.exists(value, (text) => text === "exam" || text === "self assessment");
  const ofLom = Option.match(source, {
    onNone: () => true,
    onSome: (text) => text === "LOMv1.0" || text === "",
  });

  return lomDefined && ofLom;
};

/**
 * Count the learning resource types the specification refuses in a sketch.
 *
 * @param sketch - The package.
 * @returns The count.
 */
export const sketchRefusals = (sketch: PackageSketch): number =>
  sketch.records.flatMap(({ educational }) => educational.flat()).filter(typeRefused).length;

/**
 * Whether a sketch writes a term past the binding's cap, which N7 refuses before this law.
 *
 * @param sketch - The package.
 * @returns Whether any term repeats.
 */
export const repeats = (sketch: PackageSketch): boolean =>
  sketch.records
    .flatMap(({ educational }) => educational.flat())
    .some(
      ({ source, value }) =>
        Option.exists(source, ({ copies }) => copies === 2) ||
        Option.exists(value, ({ copies }) => copies === 2),
    );

/**
 * One node of a document as the tree's insert writes it: its id, kind, parent and `stringPiece`.
 */
interface WrittenNode {
  readonly id: string;
  readonly kind: string;
  readonly parent: string;
  readonly parentKind: string;
  readonly stringPiece: string;
}

/**
 * Walk the tree's insert in document order, each node with its parent.
 *
 * @param root - The document node, its tree nested.
 * @returns Every node below it.
 */
const writtenNodes = (root: NodeRoot): readonly WrittenNode[] => {
  const out: WrittenNode[] = [];
  const stack: { readonly node: NodeMember; readonly parent: NodeRoot | NodeMember }[] =
    root.children.map((node) => ({ node, parent: root })).toReversed();

  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { node, parent } = next;
    out.push({
      id: node.id,
      kind: node.kind,
      parent: parent.id,
      parentKind: parent.kind,
      stringPiece: node.stringPiece,
    });
    stack.push(...node.children.map((child) => ({ node: child, parent: node })).toReversed());
  }

  return out;
};

/**
 * One document's rows as the laws read them: its learning resource types' two overlays, and each
 * term's string value as the database folds it, the concatenation of its children's `stringPiece`.
 */
export interface DocumentRows {
  readonly sources: ReadonlyMap<string, Addition<typeof LomResourceTypeSource>>;
  readonly terms: readonly {
    readonly id: string;
    readonly kind: string;
    readonly parent: string;
    readonly stringValue: string;
  }[];
  readonly values: ReadonlyMap<string, Addition<typeof LomResourceType>>;
}

/**
 * Build one document's rows as the importer will: the builder's overlay rows and the tree's insert,
 * under one id per node.
 *
 * @param tree - The document's tree.
 * @param idOf - Its ids.
 * @returns Its rows.
 */
export const documentRowsOf = (
  tree: XdmDocument<Composed>,
  idOf: (index: number) => NodeId,
): DocumentRows => {
  const rows: MetadataRows = rowsOf(tree, {
    idOf,
    package: "00000000-0000-4000-8000-00000000c0de" satisfies Uuid,
  });
  const nodes = writtenNodes(rootInsertOf(tree, { idOf }));
  const folded = new Map<string, string>();
  for (const node of nodes) {
    folded.set(node.parent, `${folded.get(node.parent) ?? ""}${node.stringPiece}`);
  }

  return {
    sources: rows.LomResourceTypeSource,
    terms: nodes
      .filter(
        ({ kind, parentKind }) =>
          (kind === "lom:value" || kind === "lom:source") &&
          parentKind === "lom:learningResourceType",
      )
      .map(({ id, kind, parent }) => ({ id, kind, parent, stringValue: folded.get(id) ?? "" })),
    values: rows.LomResourceType,
  };
};

/**
 * What the database's statements find over one document's rows: the copies that break, each named
 * (`E1 derived`), and the learning resource types the law refuses, by node.
 */
export interface Judged {
  readonly derived: readonly string[];
  readonly refused: ReadonlySet<string>;
}

/**
 * Judge the law's statements over one document's rows as PostgreSQL will, each as `metadataLaws`
 * states it:
 *
 * - Each term's `(id, parent, stringValue)` is a row's `(term, node, text)` (the copy from `Node`);
 * - Each row's `term` is a term of its relation's kind (the copy back), and no two rows share one
 *   (the key over `term`);
 * - Each row whose value collapses into `forbiddenResourceTypes` has its type's source row, whose
 *   text collapses outside `lomVocabularySources` (the law's containment).
 *
 * @param rows - The document's rows.
 * @returns The copies that break (`E1 derived`), and the types the law refuses, by node.
 */
export const databaseRefusals = (rows: DocumentRows): Judged => {
  const derived: string[] = [];
  for (const [kind, relation] of [
    ["lom:value", rows.values],
    ["lom:source", rows.sources],
  ] as const) {
    const terms = rows.terms.filter((term) => term.kind === kind);
    for (const term of terms) {
      const row = [...relation.values()].find(
        (held) =>
          held.term === term.id && held.node === term.parent && held.text === term.stringValue,
      );
      if (row === undefined) {
        derived.push(`${kind} ${term.id} has no row`);
      }
    }

    const ids = new Set(terms.map(({ id }) => id));
    const held = [...relation.values()].map(({ term }) => term);
    for (const term of held) {
      if (!ids.has(term)) {
        derived.push(`a ${kind} row names ${term}, no ${kind} of a type`);
      }
    }

    if (new Set(held).size !== held.length) {
      derived.push(`two ${kind} rows name one term`);
    }
  }

  const forbidden: ReadonlySet<string> = new Set(forbiddenResourceTypes);
  const lom: ReadonlySet<string> = new Set(lomVocabularySources);
  const refused = new Set(
    [...rows.values.values()].flatMap(({ node, text }) => {
      const source = rows.sources.get(node);

      return forbidden.has(collapse(text)) &&
        (source === undefined || lom.has(collapse(source.text)))
        ? [node]
        : [];
    }),
  );

  return { derived, refused };
};
