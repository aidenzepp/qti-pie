/**
 * The rows of the HTML elements an item holds: each element's arm with its own required columns,
 * the optional relation of every own optional attribute the element writes, the version copy of
 * the media booleans, and the markers of the defaults a `track` and a `param` take.
 *
 * `p` and `img` are written by the item pass and are not touched here. The family attributes
 * (`class`, `id`, `lang`, `dir`, `label` and the rest) and a cell's `headers` belong to the
 * attribute pass.
 */
import type { AnyRelation, Fact, Relation, uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import { attributeReader } from "#qti/import/interactions.ts";
import type { AttributeReader, NodeRef } from "#qti/import/interactions.ts";
import { withParents } from "#qti/import/item.ts";
import { Rows, typedAttribute, UnmodeledVocabulary } from "#qti/import/tree.ts";
import type { NodeIndex, WhiteSpace } from "#qti/import/tree.ts";
import { entryOf } from "#qti/schema/content/xsd-inventory.ts";
import * as media from "#qti/schema/html/media.ts";
import * as structure from "#qti/schema/html/structure.ts";
import * as text from "#qti/schema/html/text.ts";
import { Node } from "#qti/schema/node.ts";
import type { AttributeNameHandle, NodeKindHandle, SchemaVersionHandle } from "#qti/schema/node.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * What a step reads of the element it writes for: the element, its node, the node it sits under,
 * the schema version of its tree, and the reader that processes each attribute under its
 * whitespace class.
 */
interface Subject {
  readonly attributes: AttributeReader;
  readonly element: Element;
  readonly node: NodeRef;
  readonly parent: NodeRef;
  readonly version: SchemaVersionHandle;
}

/**
 * The rows a step adds once every attribute of the element is read, so the `AttributeLexical`
 * rows those reads produced are in the rows it extends.
 */
type Write = (rows: Rows) => Rows;

/**
 * One part of an element's rows: the own attributes it reads and the step that reads and records
 * them.
 */
interface Piece {
  readonly reads: readonly AttributeNameHandle[];
  readonly step: (subject: Subject) => Write;
}

/**
 * A relation of one `id` column that no attribute adds to.
 */
type ThinRelation = Relation<string, { readonly id: typeof uuid }, readonly ["id"]>;

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of booleans,
 * lengths and enumerations are template-literal types, and the value read is a string until that
 * pattern says it fits, so the cast narrows only the type; a value the pattern refuses is refused
 * there.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;

/**
 * The columns of an optional attribute's row: its node, its value and, where its value is judged
 * by schema version, that version.
 */
interface ValueRow {
  readonly node: string;
  readonly value: string;
  readonly version?: SchemaVersionHandle;
}

/**
 * The fact `row` of `relation`, whose columns its regex laws judge at commit.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `R` is the relation the caller adds the fact to; the call site names it by inference.
const factOf = <R extends AnyRelation>(_relation: R, row: ValueRow): Fact<R> => {
  const written: object = row;

  // SAFETY: the caller builds `row` from the relation's own columns, and the column laws judge each value at commit, which is the importer's refusal for it (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  return written as Fact<R>;
};

/**
 * The value of a required attribute, empty where the element omits it: the column's pattern
 * refuses the empty value at commit, which is the importer's refusal for an element without it.
 */
const required = (attributes: AttributeReader, name: AttributeNameHandle): string =>
  Option.getOrElse(attributes.read(name), () => "");

/**
 * The piece of an element whose arm holds its id alone.
 */
const thin = (relation: ThinRelation): Piece => ({
  reads: [],
  step:
    ({ node }) =>
    (rows) =>
      Rows.add(rows, relation, [{ id: node.id }]),
});

/**
 * The piece of an own optional attribute: its `(node, value)` row where the element writes it.
 *
 * @param name - The attribute.
 * @param relation - The relation of `node` and `value` that holds it.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `R` types the fact that `factOf` makes for the relation; the signature names it once because the relation is the only argument it comes from.
const optional = <R extends AnyRelation>(name: AttributeNameHandle, relation: R): Piece => ({
  reads: [name],
  step: ({ attributes, node }) => {
    const value = attributes.read(name);

    return (rows) =>
      Rows.add(
        rows,
        relation,
        Option.match(value, {
          onNone: () => [],
          onSome: (own) => [factOf(relation, { node: node.id, value: own })],
        }),
      );
  },
});

/**
 * The whitespace class the media booleans and `track/@default` take in each schema version: 3.0.0
 * declares them `xs:boolean`, which collapses, and 3.0.1 an enumeration, which is kept as read
 * (spec 3.9).
 */
const booleanClass: Readonly<Record<SchemaVersionHandle, WhiteSpace>> = {
  "3.0.0": "collapse",
  "3.0.1": "preserve",
};

/**
 * The piece of an own optional attribute judged against its element's schema version: its
 * `(node, value, version)` row where the element writes it, the value after the class the version
 * gives it.
 *
 * @param name - The attribute.
 * @param relation - The relation of `node`, `value` and `version` that holds it.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `R` types the fact that `factOf` makes for the relation; the signature names it once because the relation is the only argument it comes from.
const versioned = <R extends AnyRelation>(name: AttributeNameHandle, relation: R): Piece => ({
  reads: [name],
  step: ({ element, node, version }) => {
    const lexical = Option.fromNullishOr(
      element.attributes.find((found) => found.namespace === "" && found.local === name),
    ).pipe(Option.map((found) => found.value));

    return (rows) =>
      Option.match(lexical, {
        onNone: () => rows,
        onSome: (own) => {
          const typed = typedAttribute(rows, node.id, node.kind, name, own, booleanClass[version]);

          return Rows.add(typed.rows, relation, [
            factOf(relation, { node: node.id, value: typed.value, version }),
          ]);
        },
      });
  },
});

/**
 * The piece of a marker: its `(node)` row where the element writes the attribute whose default the
 * arm took otherwise.
 */
const marker = (name: AttributeNameHandle, relation: ThinMarker): Piece => ({
  reads: [],
  step:
    ({ element, node }) =>
    (rows) =>
      element.attributes.some((found) => found.namespace === "" && found.local === name)
        ? Rows.add(rows, relation, [{ node: node.id }])
        : rows,
});

/**
 * A relation of one `node` column: the marker that says the source wrote a defaulted attribute.
 */
type ThinMarker = Relation<string, { readonly node: typeof uuid }, readonly ["node"]>;

/**
 * The piece of an anchor's arm: `href`, required.
 */
const anchor: Piece = {
  reads: ["href"],
  step:
    ({ attributes, node }) =>
    (rows) =>
      Rows.add(rows, text.A, [{ href: judgedLater(required(attributes, "href")), id: node.id }]),
};

/**
 * The piece of an `audio` or `video` arm, which holds the schema version of its tree.
 */
const mediaArm = (relation: typeof media.Audio | typeof media.Video): Piece => ({
  reads: [],
  step:
    ({ node, version }) =>
    (rows) =>
      Rows.add(rows, relation, [{ id: node.id, version }]),
});

/**
 * The piece of a `source` arm: `src`, required, and the kind of the element that holds it.
 */
const sourceArm: Piece = {
  reads: ["src"],
  step:
    ({ attributes, node, parent }) =>
    (rows) =>
      Rows.add(rows, media.Source, [
        {
          id: node.id,
          parentKind: parent.kind,
          src: judgedLater(required(attributes, "src")),
        },
      ]),
};

/**
 * The piece of a `track` arm: `src`, required, and `kind`, which is `subtitles` where the source
 * wrote none.
 */
const trackArm: Piece = {
  reads: ["kind", "src"],
  step: ({ attributes, node }) => {
    const kind = Option.getOrElse(attributes.read("kind"), () => "subtitles");
    const src = required(attributes, "src");

    return (rows) =>
      Rows.add(rows, media.Track, [
        { id: node.id, kind: judgedLater(kind), src: judgedLater(src) },
      ]);
  },
};

/**
 * The piece of an `object` arm: `data` and `type`, required.
 */
const objectArm: Piece = {
  reads: ["data", "type"],
  step: ({ attributes, node }) => {
    const data = required(attributes, "data");
    const type = required(attributes, "type");

    return (rows) =>
      Rows.add(rows, media.relations.Object, [
        { data: judgedLater(data), id: node.id, type: judgedLater(type) },
      ]);
  },
};

/**
 * The piece of a `param` arm: `name` and `value`, required, and `valuetype`, which is `DATA` where
 * the source wrote none.
 */
const paramArm: Piece = {
  reads: ["name", "value", "valuetype"],
  step: ({ attributes, node }) => {
    const name = required(attributes, "name");
    const value = required(attributes, "value");
    const valuetype = Option.getOrElse(attributes.read("valuetype"), () => "DATA");

    return (rows) =>
      Rows.add(rows, media.Param, [
        {
          id: node.id,
          name: judgedLater(name),
          value: judgedLater(value),
          valuetype: judgedLater(valuetype),
        },
      ]);
  },
};

/**
 * The attributes of a table cell that carry an optional row: `headers` is the attribute pass's.
 */
const cellPieces = (
  scope: AnyRelation,
  abbr: AnyRelation,
  axis: AnyRelation,
  rowspan: AnyRelation,
  colspan: AnyRelation,
  align: AnyRelation,
  valign: AnyRelation,
): readonly Piece[] => [
  optional("scope", scope),
  optional("abbr", abbr),
  optional("axis", axis),
  optional("rowspan", rowspan),
  optional("colspan", colspan),
  optional("align", align),
  optional("valign", valign),
];

/**
 * The elements whose arm holds an id alone, by kind. `a` has a column of its own, and `p` and
 * `img` are the item pass's.
 */
const { a: _anchorArm, ...thinText } = text.arms;

const thinArms = new Map<string, ThinRelation>(
  Object.entries({ ...thinText, ...structure.arms, picture: media.Picture }),
);

/**
 * The pieces of each kind that has more than the thin arm: its own column arm and its optional
 * rows, by kind.
 */
const extras = new Map<string, readonly Piece[]>(
  Object.entries({
    a: [anchor, optional("type", text.AType)],
    audio: [
      mediaArm(media.Audio),
      optional("src", media.AudioSrc),
      optional("crossorigin", media.AudioCrossorigin),
      optional("preload", media.AudioPreload),
      optional("mediagroup", media.AudioMediagroup),
      versioned("autoplay", media.AudioAutoplay),
      versioned("controls", media.AudioControls),
      versioned("loop", media.AudioLoop),
      versioned("muted", media.AudioMuted),
    ],
    bdo: [optional("title", text.BdoTitle)],
    blockquote: [optional("cite", text.BlockquoteCite)],
    col: [optional("span", structure.ColSpan)],
    colgroup: [optional("span", structure.ColgroupSpan)],
    details: [optional("open", structure.DetailsOpen)],
    object: [
      objectArm,
      optional("width", media.ObjectWidth),
      optional("height", media.ObjectHeight),
    ],
    param: [
      paramArm,
      marker("valuetype", media.DeclaredValuetype),
      optional("type", media.ParamType),
    ],
    q: [optional("cite", text.QCite)],
    source: [
      sourceArm,
      optional("type", media.SourceType),
      optional("srcset", media.SourceSrcset),
      optional("media", media.SourceMedia),
      optional("sizes", media.SourceSizes),
    ],
    table: [optional("summary", structure.TableSummary)],
    td: cellPieces(
      structure.TdScope,
      structure.TdAbbr,
      structure.TdAxis,
      structure.TdRowspan,
      structure.TdColspan,
      structure.TdAlign,
      structure.TdValign,
    ),
    th: cellPieces(
      structure.ThScope,
      structure.ThAbbr,
      structure.ThAxis,
      structure.ThRowspan,
      structure.ThColspan,
      structure.ThAlign,
      structure.ThValign,
    ),
    track: [
      trackArm,
      marker("kind", media.DeclaredTrackKind),
      optional("srclang", media.TrackSrclang),
      versioned("default", media.TrackDefault),
    ],
    video: [
      mediaArm(media.Video),
      optional("src", media.VideoSrc),
      optional("crossorigin", media.VideoCrossorigin),
      optional("preload", media.VideoPreload),
      optional("mediagroup", media.VideoMediagroup),
      optional("poster", media.VideoPoster),
      optional("width", media.VideoWidth),
      optional("height", media.VideoHeight),
      versioned("autoplay", media.VideoAutoplay),
      versioned("controls", media.VideoControls),
      versioned("loop", media.VideoLoop),
      versioned("muted", media.VideoMuted),
    ],
  }),
);

/**
 * The attributes the attribute pass reads for an element of an HTML kind though the inventory
 * lists them as the element's own.
 */
const attributePass: ReadonlySet<string> = new Set(["headers"]);

/**
 * The pieces that write the rows of an element of `kind`, none for a kind with no arm of this
 * module.
 */
const piecesOf = (kind: NodeKindHandle): readonly Piece[] => {
  const arm = thinArms.get(kind);

  return [...(arm === undefined ? [] : [thin(arm)]), ...(extras.get(kind) ?? [])];
};

/**
 * The own attributes of `element` that no piece of its kind reads.
 */
const unread = (
  element: Element,
  kind: NodeKindHandle,
  pieces: readonly Piece[],
): Option.Option<string> => {
  const read = new Set<string>(pieces.flatMap((piece) => piece.reads));
  const own = new Set<string>(
    entryOf(kind).pipe(
      Option.match({
        onNone: () => [],
        onSome: (entry) =>
          entry.attributes.filter((found) => found.family === "own").map((found) => found.name),
      }),
    ),
  );

  return Option.fromNullishOr(
    element.attributes.find(
      (found) =>
        found.namespace === "" &&
        own.has(found.local) &&
        !read.has(found.local) &&
        !attributePass.has(found.local),
    )?.qname,
  );
};

/**
 * Write the rows of every HTML element of an item's tree that has an arm in this module: the arm,
 * the optional rows of its own attributes, the version copy of the media booleans, and the markers
 * of the defaults.
 *
 * Every attribute passes through `typedAttribute` under the whitespace class its kind's inventory
 * entry gives it, except the media booleans and `track/@default`, whose class depends on the
 * schema version of the tree (3.0.0 `xs:boolean` collapses, 3.0.1's enumerations are kept).
 *
 * @param root - The root element of the tree.
 * @param nodes - The node index of the tree, which the walk read.
 * @param rows - The rows so far, which hold the tree's `Node` rows.
 * @returns The rows with the HTML arms; `UnmodeledVocabulary` for an HTML element that is the
 *   tree's root or has no node above it, and for an own attribute of an element that this module
 *   does not model.
 */
export const htmlRows = Effect.fn("import.htmlRows")(function* htmlRows(
  root: Element,
  nodes: NodeIndex,
  rows: Rows,
): Effect.fn.Return<Rows, UnmodeledVocabulary> {
  const versions = new Map(Rows.of(rows, Node).map((found) => [found.id, found.version]));
  let built = rows;
  for (const [element, parent] of withParents(root, Option.none())) {
    const node = nodes.get(element);
    const pieces = node === undefined ? [] : piecesOf(node.kind);
    if (node === undefined || pieces.length === 0) {
      continue;
    }

    const above = Option.flatMapNullishOr(parent, (found) => nodes.get(found));
    const version = versions.get(node.id);
    if (Option.isNone(above) || version === undefined) {
      return yield* new UnmodeledVocabulary({
        kind: "element",
        name: element.qname,
        parent: parent.pipe(Option.map((found) => found.qname)),
      });
    }

    const loose = unread(element, node.kind, pieces);
    if (Option.isSome(loose)) {
      return yield* new UnmodeledVocabulary({
        kind: "attribute",
        name: loose.value,
        parent: Option.some(element.qname),
      });
    }

    const attributes = attributeReader(built, element, node);
    const writes = pieces.map((piece) =>
      piece.step({ attributes, element, node, parent: above.value, version }),
    );
    built = attributes.rows();
    for (const write of writes) {
      built = write(built);
    }
  }

  return built;
});
