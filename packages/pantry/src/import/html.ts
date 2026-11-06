/**
 * The rows of the HTML elements a tree holds, for any root (item, test, section or stimulus): each
 * element's arm with its own required columns, the optional relation of every own optional
 * attribute the element writes, the version copy of the media booleans, and the markers of the
 * defaults a `track` and a `param` take. `p` and `img` are written here too: the paragraph's arm,
 * and the image's arm with its `longdesc`, `height` and `width` rows.
 *
 * The family attributes
 * (`class`, `id`, `lang`, `dir`, `label` and the rest) and a cell's `headers` belong to the
 * attribute pass.
 */
import { judgedLater } from "#pantry/import/judged.ts";
import type { AnyRelation, Fact, Relation, uuid, Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import { attributeReader } from "#pantry/import/interactions.ts";
import type { AttributeReader } from "#pantry/import/interactions.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import {
  closedOf,
  Rows,
  typedAttribute,
  UnmodeledVocabulary,
  withParents,
} from "#pantry/import/tree.ts";
import type { IndexedNode, ItemRefusal, NodeIndex, WhiteSpace } from "#pantry/import/tree.ts";
import {
  CellAlign,
  CellScope,
  CellValign,
  CrossOrigin,
  MediaAutoplay,
  MediaControls,
  MediaLoop,
  MediaMuted,
  MediaPreload,
  ParamValuetype,
  TrackDefaultValue,
  TrackKind,
  XsBoolean,
} from "#pantry/schema/content/rosters.ts";
import { EmbedSourceUri, LongDescriptionUri } from "#pantry/schema/contracts.ts";
import { Img, ImgHeight, ImgLongdesc, ImgWidth, P } from "#pantry/schema/html.ts";
import { entryOf } from "#pantry/schema/content/xsd-inventory.ts";
import * as media from "#pantry/schema/html/media.ts";
import * as structure from "#pantry/schema/html/structure.ts";
import * as text from "#pantry/schema/html/text.ts";
import { Node } from "#pantry/schema/node.ts";
import type {
  AttributeNameHandle,
  NodeKindHandle,
  SchemaVersionHandle,
} from "#pantry/schema/node.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * What a step reads of the element it writes for: the element, its node, the node it sits under,
 * the schema version of its tree, and the reader that processes each attribute under its
 * whitespace class.
 */
interface Subject {
  readonly attributes: AttributeReader;
  readonly element: Element;
  readonly node: IndexedNode;
  readonly parent: IndexedNode;
  readonly version: SchemaVersionHandle;
}

/**
 * The rows a step adds once every attribute of the element is read, so the `AttributeLexical`
 * rows those reads produced are in the rows it extends.
 */
type Write = (rows: Rows) => Rows;

/**
 * One part of an element's rows: the own attributes it reads and the step that reads and records
 * them. A step reads every attribute it records before it returns its `Write`, because the
 * `AttributeLexical` rows are taken once every step has run. A step that reads a required
 * attribute fails with `ItemRefusal` where the element omits it, and a step that reads a closed
 * attribute fails with `ImportRefused` under `attribute-lexical` for a value outside its roster.
 */
interface Piece {
  readonly reads: readonly AttributeNameHandle[];
  readonly step: (subject: Subject) => Effect.Effect<Write, ItemRefusal | ImportRefused>;
}

/**
 * A relation of one `id` column that no attribute adds to.
 */
type ThinRelation = Relation<string, { readonly id: typeof uuid }, readonly ["id"]>;

/**
 * The columns of an optional attribute's row: its node, its value and, where its value is judged
 * by schema version, that version.
 */
interface ValueRow {
  readonly node: Uuid;
  readonly value: string;
  readonly version?: SchemaVersionHandle;
}

/**
 * The fact `row` of `relation`, whose open columns its regex laws judge at commit and whose closed
 * columns the caller narrowed to a handle through `closedOf` before the call.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `R` is the relation the caller adds the fact to; the call site names it by inference.
const factOf = <R extends AnyRelation>(_relation: R, row: ValueRow): Fact<R> => {
  const written: object = row;

  // SAFETY: the caller builds `row` from the relation's own columns, and the column laws judge each open value at commit, which is the importer's refusal for it, and each closed value is a handle `closedOf` returned (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  return written as Fact<R>;
};

/**
 * The piece of an element whose arm holds its id alone.
 */
const thin = (relation: ThinRelation): Piece => ({
  reads: [],
  step: ({ node }) => Effect.succeed((rows) => Rows.add(rows, relation, [{ id: node.id }])),
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

    return Effect.succeed((rows: Rows) =>
      Rows.add(
        rows,
        relation,
        Option.match(value, {
          onNone: () => [],
          onSome: (own) => [factOf(relation, { node: node.id, value: own })],
        }),
      ),
    );
  },
});

/**
 * The piece of an own optional attribute whose column is a closed roster: its `(node, value)` row
 * where the element writes it, the value a handle of `handles`.
 *
 * @param name - The attribute.
 * @param relation - The relation of `node` and `value` that holds it.
 * @param handles - The roster's handles.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `R` types the fact that `factOf` makes for the relation; the signature names it once because the relation is the only argument it comes from.
const closedOptional = <R extends AnyRelation>(
  name: AttributeNameHandle,
  relation: R,
  handles: readonly string[],
): Piece => ({
  reads: [name],
  step: Effect.fn("import.html.closedOptional")(function* closedOptionalStep({
    attributes,
    element,
    node,
  }) {
    const value = attributes.read(name);
    const handle = Option.isSome(value)
      ? Option.some(
          yield* closedOf(
            handles,
            value.value,
            "attribute-lexical",
            `the ${name} attribute of ${element.local}`,
          ),
        )
      : Option.none();

    return (rows: Rows) =>
      Rows.add(
        rows,
        relation,
        Option.match(handle, {
          onNone: () => [],
          onSome: (own) => [factOf(relation, { node: node.id, value: own })],
        }),
      );
  }),
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
const versioned = <R extends AnyRelation>(
  name: AttributeNameHandle,
  relation: R,
  handles: readonly string[],
): Piece => ({
  reads: [name],
  step: Effect.fn("import.html.versioned")(function* versionedStep({ element, node, version }) {
    const lexical = Option.fromNullishOr(
      element.attributes.find((found) => found.namespace === "" && found.local === name),
    ).pipe(Option.map((found) => found.value));
    const handle = Option.isSome(lexical)
      ? Option.some(
          yield* closedOf(
            handles,
            typedAttribute(
              Rows.empty(),
              node.id,
              node.kind,
              name,
              lexical.value,
              booleanClass[version],
            ).value,
            "attribute-lexical",
            `the ${name} attribute of ${element.local}`,
          ),
        )
      : Option.none();

    return (rows: Rows) =>
      Option.match(lexical, {
        onNone: () => rows,
        onSome: (own) => {
          const typed = typedAttribute(rows, node.id, node.kind, name, own, booleanClass[version]);

          return Rows.add(typed.rows, relation, [
            factOf(relation, {
              node: node.id,
              value: Option.getOrElse(handle, () => typed.value),
              version,
            }),
          ]);
        },
      });
  }),
});

/**
 * The piece of a marker: its `(node)` row where the element writes the attribute whose default the
 * arm took otherwise.
 */
const marker = (name: AttributeNameHandle, relation: ThinMarker): Piece => ({
  reads: [],
  step: ({ element, node }) =>
    Effect.succeed((rows) =>
      element.attributes.some((found) => found.namespace === "" && found.local === name)
        ? Rows.add(rows, relation, [{ node: node.id }])
        : rows,
    ),
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
  step: Effect.fn("import.html.anchor")(function* anchorStep({ attributes, element, node }) {
    const href = yield* requiredAttribute(element, "href", attributes.read("href"));

    return (rows: Rows) => Rows.add(rows, text.A, [{ href: judgedLater(href), id: node.id }]);
  }),
};

/**
 * The piece of an `audio` or `video` arm, which holds the schema version of its tree.
 */
const mediaArm = (relation: typeof media.Audio | typeof media.Video): Piece => ({
  reads: [],
  step: ({ node, version }) =>
    Effect.succeed((rows) => Rows.add(rows, relation, [{ id: node.id, version }])),
});

/**
 * The piece of a `source` arm: `src`, required, and the kind of the element that holds it.
 */
const sourceArm: Piece = {
  reads: ["src"],
  step: Effect.fn("import.html.source")(function* sourceStep({
    attributes,
    element,
    node,
    parent,
  }) {
    // Rule 11 has two clauses: a `source` under `audio` or `video` has `src`, and a `source` in a
    // `picture` has `srcset` instead, so only a source outside `audio` and `video` (the `picture`
    // one) may omit `src`, and it is stored as the empty fill.
    const src =
      parent.kind === "audio" || parent.kind === "video"
        ? yield* requiredAttribute(element, "src", attributes.read("src"))
        : Option.getOrElse(attributes.read("src"), () => "");

    return (rows: Rows) =>
      Rows.add(rows, media.Source, [
        { id: node.id, parentKind: parent.kind, src: judgedLater(src) },
      ]);
  }),
};

/**
 * The piece of a `track` arm: `src`, required, and `kind`, which is `subtitles` where the source
 * wrote none.
 */
const trackArm: Piece = {
  reads: ["kind", "src"],
  step: Effect.fn("import.html.track")(function* trackStep({ attributes, element, node }) {
    const kind = yield* closedOf(
      TrackKind.handles,
      Option.getOrElse(attributes.read("kind"), () => "subtitles"),
      "attribute-lexical",
      "the kind attribute of track",
    );
    const src = yield* requiredAttribute(element, "src", attributes.read("src"));

    return (rows: Rows) =>
      Rows.add(rows, media.Track, [{ id: node.id, kind, src: judgedLater(src) }]);
  }),
};

/**
 * The piece of an `object` arm: `data` and `type`, required.
 */
const objectArm: Piece = {
  reads: ["data", "type"],
  step: Effect.fn("import.html.object")(function* objectStep({ attributes, element, node }) {
    const data = yield* requiredAttribute(element, "data", attributes.read("data"));
    const type = yield* requiredAttribute(element, "type", attributes.read("type"));

    return (rows: Rows) =>
      Rows.add(rows, media.relations.Object, [
        { data: judgedLater(data), id: node.id, type: judgedLater(type) },
      ]);
  }),
};

/**
 * The piece of a `param` arm: `name` and `value`, required, and `valuetype`, which is `DATA` where
 * the source wrote none.
 */
const paramArm: Piece = {
  reads: ["name", "value", "valuetype"],
  step: Effect.fn("import.html.param")(function* paramStep({ attributes, element, node }) {
    const name = yield* requiredAttribute(element, "name", attributes.read("name"));
    const value = yield* requiredAttribute(element, "value", attributes.read("value"));
    const valuetype = yield* closedOf(
      ParamValuetype.handles,
      Option.getOrElse(attributes.read("valuetype"), () => "DATA"),
      "attribute-lexical",
      "the valuetype attribute of param",
    );

    return (rows: Rows) =>
      Rows.add(rows, media.Param, [
        {
          id: node.id,
          name: judgedLater(name),
          value: judgedLater(value),
          valuetype,
        },
      ]);
  }),
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
  closedOptional("scope", scope, CellScope.handles),
  optional("abbr", abbr),
  optional("axis", axis),
  optional("rowspan", rowspan),
  optional("colspan", colspan),
  closedOptional("align", align, CellAlign.handles),
  closedOptional("valign", valign, CellValign.handles),
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
      closedOptional("crossorigin", media.AudioCrossorigin, CrossOrigin.handles),
      closedOptional("preload", media.AudioPreload, MediaPreload.handles),
      optional("mediagroup", media.AudioMediagroup),
      versioned("autoplay", media.AudioAutoplay, MediaAutoplay.handles),
      versioned("controls", media.AudioControls, MediaControls.handles),
      versioned("loop", media.AudioLoop, MediaLoop.handles),
      versioned("muted", media.AudioMuted, MediaMuted.handles),
    ],
    bdo: [optional("title", text.BdoTitle)],
    blockquote: [optional("cite", text.BlockquoteCite)],
    col: [optional("span", structure.ColSpan)],
    colgroup: [optional("span", structure.ColgroupSpan)],
    details: [closedOptional("open", structure.DetailsOpen, XsBoolean.handles)],
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
      versioned("default", media.TrackDefault, TrackDefaultValue.handles),
    ],
    video: [
      mediaArm(media.Video),
      optional("src", media.VideoSrc),
      closedOptional("crossorigin", media.VideoCrossorigin, CrossOrigin.handles),
      closedOptional("preload", media.VideoPreload, MediaPreload.handles),
      optional("mediagroup", media.VideoMediagroup),
      optional("poster", media.VideoPoster),
      optional("width", media.VideoWidth),
      optional("height", media.VideoHeight),
      versioned("autoplay", media.VideoAutoplay, MediaAutoplay.handles),
      versioned("controls", media.VideoControls, MediaControls.handles),
      versioned("loop", media.VideoLoop, MediaLoop.handles),
      versioned("muted", media.VideoMuted, MediaMuted.handles),
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
 * The text of the attribute `name` an element writes in no namespace, as written.
 */
const lexicalOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === name),
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * One attribute of an element, processed under its whitespace class, with the rows its
 * processing adds.
 */
const processed = (
  rows: Rows,
  element: Element,
  node: IndexedNode,
  name: AttributeNameHandle,
  whiteSpace: WhiteSpace,
): { readonly rows: Rows; readonly value: Option.Option<string> } =>
  Option.match(lexicalOf(element, name), {
    onNone: () => ({ rows, value: Option.none<string>() }),
    onSome: (lexical) => {
      const typed = typedAttribute(rows, node.id, node.kind, name, lexical, whiteSpace);

      return { rows: typed.rows, value: Option.some(typed.value) };
    },
  });

/**
 * Write the rows of an `img`: its arm with the required `alt` and `src`, and the optional rows of
 * `longdesc`, `height` and `width`.
 *
 * `src` and `longdesc` collapse; `alt`, `height` and `width` are kept as written.
 *
 * @param rows - The rows so far.
 * @param element - The `img`.
 * @param node - The node it became.
 * @returns The rows with the image's added; `ItemRefusal` under `required-attribute` for an `img`
 *   that omits `alt` or `src`.
 */
const imageRows = Effect.fn("import.html.imageRows")(function* imageRows(
  rows: Rows,
  element: Element,
  node: IndexedNode,
): Effect.fn.Return<Rows, ItemRefusal> {
  const src = processed(rows, element, node, "src", "collapse");
  const longdesc = processed(src.rows, element, node, "longdesc", "collapse");
  const height = lexicalOf(element, "height");
  const width = lexicalOf(element, "width");
  const alt = yield* requiredAttribute(element, "alt", lexicalOf(element, "alt"));
  const imgSrc = yield* requiredAttribute(element, "src", src.value);

  let built = Rows.add(longdesc.rows, Img, [{ alt, id: node.id, src: EmbedSourceUri(imgSrc) }]);
  built = Rows.add(
    built,
    ImgLongdesc,
    Option.match(longdesc.value, {
      onNone: () => [],
      onSome: (value) => [{ node: node.id, value: LongDescriptionUri(value) }],
    }),
  );
  built = Rows.add(
    built,
    ImgHeight,
    Option.match(height, {
      onNone: () => [],
      onSome: (value) => [{ node: node.id, value: judgedLater(value) }],
    }),
  );

  return Rows.add(
    built,
    ImgWidth,
    Option.match(width, {
      onNone: () => [],
      onSome: (value) => [{ node: node.id, value: judgedLater(value) }],
    }),
  );
});

/**
 * Write the rows of every HTML element of a tree that has an arm: the arm, the optional rows of
 * its own attributes, the version copy of the media booleans, and the markers of the defaults.
 *
 * Every attribute passes through `typedAttribute` under the whitespace class its kind's inventory
 * entry gives it, except the media booleans and `track/@default`, whose class depends on the
 * schema version of the tree (3.0.0 `xs:boolean` collapses, 3.0.1's enumerations are kept).
 *
 * @param root - The root element of the tree.
 * @param nodes - The node index of the tree, which the walk read.
 * @param rows - The rows so far, which hold the tree's `Node` rows.
 * @returns The rows with the HTML arms, `p` and `img` included; `UnmodeledVocabulary` for an HTML
 *   element that is the tree's root or has no node above it, and for an own attribute of an element
 *   that this module does not model; `ItemRefusal` under `required-attribute` for an `a`, `img`,
 *   `track`, `object` or `param` that omits a required attribute; `ImportRefused` under
 *   `attribute-lexical` for a closed attribute whose value is outside its roster.
 */
export const htmlRows = Effect.fn("import.htmlRows")(function* htmlRows(
  root: Element,
  nodes: NodeIndex,
  rows: Rows,
): Effect.fn.Return<Rows, UnmodeledVocabulary | ItemRefusal | ImportRefused> {
  const versions = new Map(Rows.of(rows, Node).map((found) => [found.id, found.version]));
  let built = rows;
  for (const [element, parent] of withParents(root, Option.none())) {
    const node = nodes.get(element);
    if (node?.kind === "p") {
      built = Rows.add(built, P, [{ id: node.id }]);
      continue;
    }

    if (node?.kind === "img") {
      built = yield* imageRows(built, element, node);
      continue;
    }

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
    const writes: Write[] = [];
    for (const piece of pieces) {
      writes.push(yield* piece.step({ attributes, element, node, parent: above.value, version }));
    }

    built = attributes.rows();
    for (const write of writes) {
      built = write(built);
    }
  }

  return built;
});
