/**
 * The SSML 1.1 vocabulary: the 20 elements of the SSML core profile that QTI imports, in the
 * synthesis namespace.
 *
 * SSML's `p`, `sub` and `audio` share their local names with HTML kinds (QTI's XSD declares no HTML
 * `mark`), so each handle is the element's local name prefixed `ssml:`, as `xi:include` is. A kind
 * resolves by its namespace and local name alone: no SSML element has two types, so no handle is
 * dotted. The roster lists the handles in code-point order, which is the inventory leaf's order.
 *
 * The data is read from the leaf `src/vocab/inventory/ssml.ts` and its XSDs. `ssml.test.ts`
 * checks it against the leaf, and `src/vocab/derive/ssml.test.ts` checks it against the XSDs.
 *
 * - **Registry.** Each row lists every attribute name the kind's leaf entry declares, in the entry's
 *   order and each name once.
 * - **Attribute names.** `attributes` lists the 32 names these kinds introduce, in first-appearance
 *   order over the roster.
 *
 *   - `src`, `xml:lang`, `type`, `name`, `format`, `version`, `xml:base`, `role` and `required` are
 *     already held by today's vocabularies, and stay theirs.
 *   - Neither the ASI XSDs nor the MathML XSDs declare any of the 32, so a later vocabulary cannot
 *     introduce them first.
 * - **Admission within SSML.** A kind admits each element child its leaf entry lists, as an `ssml:`
 *   handle and once, and then its content type's rows.
 *
 *   - A mixed type adds `text`, `ws`, `entityRef`, `comment` and `pi`. Every other SSML type is
 *     element-only (each holds at least a wildcard particle), and adds `ws`, `comment` and `pi`.
 *   - Spec reading 44 removes `voice` under `token` and `w`. The SSML Recommendation allows them only
 *     text, `audio`, `break`, `emphasis`, `mark`, `phoneme`, `prosody`, `say-as` and `sub`, though
 *     the XSD's `tokenType` also lists `voice`.
 * - **Admission under QTI.** The 12 {@link hosted} kinds are admitted under each host of an inventory
 *   leaf: each entry whose content model references them, which the leaves write `ssml11:<local>`
 *   ({@link ssmlHostRows}).
 *
 *   - The hosts are 69 kinds of 62 QTI elements: 65 kinds of today's composition, and four of the ASI
 *     remainder (`qti-html-content` of catalog cards, PCI's `qti-interaction-markup` and the test
 *     vocabulary's two content bodies).
 *   - Both versions get the same rows: the 3.0.0 and 3.0.1 ASI XSDs reference the same 12 under the
 *     same 69 (element, type) pairs.
 *
 * The spec readings about SSML other than 44 are not admission. Readings 39 and 42 constrain the
 * values of `speak/@version` and `voice/@languages`. Reading 40 orders `meta`, `metadata` and
 * `lexicon` first in `speak`. Readings 41 and 43 constrain which attributes `meta`, `voice` and
 * `prosody` carry. Reading 3 makes each `speak` the document for SSML's name rules. Those
 * readings belong to the value domains, `Order` and the laws, not to this file.
 *
 * @see {@link https://www.w3.org/TR/speech-synthesis11/ | Speech Synthesis Markup Language (SSML) Version 1.1}
 */
import { Array as Arr, Option } from "effect";

import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import type { InventoryLeaf } from "#pantry/schema/content/xsd-inventory.ts";
import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";
import { asiRemainderInventory } from "#pantry/vocab/inventory/asi-remainder.ts";
import { ssmlInventory } from "#pantry/vocab/inventory/ssml.ts";
import type { WildcardStatement } from "#pantry/vocab/open.ts";

/**
 * The SSML namespace: the target namespace of `ssml/ssmlv1p1-core.xsd`, which the ASI XSDs import.
 */
const namespace = "http://www.w3.org/2001/10/synthesis";

/**
 * The SSML kinds, in append-only order; each handle is the prefixed element name.
 */
export const kinds = [
  "ssml:audio",
  "ssml:break",
  "ssml:desc",
  "ssml:emphasis",
  "ssml:lang",
  "ssml:lexicon",
  "ssml:lookup",
  "ssml:mark",
  "ssml:meta",
  "ssml:metadata",
  "ssml:p",
  "ssml:phoneme",
  "ssml:prosody",
  "ssml:s",
  "ssml:say-as",
  "ssml:speak",
  "ssml:sub",
  "ssml:token",
  "ssml:voice",
  "ssml:w",
] as const;

/**
 * An SSML kind handle.
 */
export type SsmlKind = (typeof kinds)[number];

/**
 * The attribute names these kinds introduce, in first-appearance order over the roster.
 */
export const attributes = [
  "fetchtimeout",
  "fetchhint",
  "maxage",
  "maxstale",
  "time",
  "strength",
  "onlangfailure",
  "level",
  "uri",
  "xml:id",
  "ref",
  "content",
  "http-equiv",
  "ph",
  "alphabet",
  "pitch",
  "contour",
  "range",
  "rate",
  "duration",
  "volume",
  "interpret-as",
  "detail",
  "startmark",
  "endmark",
  "alias",
  "gender",
  "age",
  "variant",
  "languages",
  "ordering",
  "onvoicefailure",
] as const;

/**
 * The registry row of each SSML kind.
 */
export const registry: Readonly<Record<SsmlKind, RegistryRow>> = {
  "ssml:audio": {
    attributes: ["src", "fetchtimeout", "fetchhint", "maxage", "maxstale"],
    local: "audio",
    namespace,
    parent: Option.none(),
  },
  "ssml:break": {
    attributes: ["time", "strength"],
    local: "break",
    namespace,
    parent: Option.none(),
  },
  "ssml:desc": {
    attributes: ["xml:lang", "onlangfailure"],
    local: "desc",
    namespace,
    parent: Option.none(),
  },
  "ssml:emphasis": {
    attributes: ["level"],
    local: "emphasis",
    namespace,
    parent: Option.none(),
  },
  "ssml:lang": {
    attributes: ["xml:lang", "onlangfailure"],
    local: "lang",
    namespace,
    parent: Option.none(),
  },
  "ssml:lexicon": {
    attributes: ["uri", "xml:id", "type", "fetchtimeout", "maxage", "maxstale"],
    local: "lexicon",
    namespace,
    parent: Option.none(),
  },
  "ssml:lookup": {
    attributes: ["ref"],
    local: "lookup",
    namespace,
    parent: Option.none(),
  },
  "ssml:mark": {
    attributes: ["name"],
    local: "mark",
    namespace,
    parent: Option.none(),
  },
  "ssml:meta": {
    attributes: ["name", "content", "http-equiv"],
    local: "meta",
    namespace,
    parent: Option.none(),
  },
  "ssml:metadata": {
    attributes: [],
    local: "metadata",
    namespace,
    parent: Option.none(),
  },
  "ssml:p": {
    attributes: ["xml:lang", "xml:id", "onlangfailure"],
    local: "p",
    namespace,
    parent: Option.none(),
  },
  "ssml:phoneme": {
    attributes: ["ph", "alphabet", "type"],
    local: "phoneme",
    namespace,
    parent: Option.none(),
  },
  "ssml:prosody": {
    attributes: ["pitch", "contour", "range", "rate", "duration", "volume"],
    local: "prosody",
    namespace,
    parent: Option.none(),
  },
  "ssml:s": {
    attributes: ["xml:lang", "xml:id", "onlangfailure"],
    local: "s",
    namespace,
    parent: Option.none(),
  },
  "ssml:say-as": {
    attributes: ["interpret-as", "format", "detail"],
    local: "say-as",
    namespace,
    parent: Option.none(),
  },
  "ssml:speak": {
    attributes: ["version", "xml:lang", "xml:base", "onlangfailure", "startmark", "endmark"],
    local: "speak",
    namespace,
    parent: Option.none(),
  },
  "ssml:sub": {
    attributes: ["alias"],
    local: "sub",
    namespace,
    parent: Option.none(),
  },
  "ssml:token": {
    attributes: ["xml:id", "xml:lang", "onlangfailure", "role"],
    local: "token",
    namespace,
    parent: Option.none(),
  },
  "ssml:voice": {
    attributes: [
      "gender",
      "age",
      "variant",
      "name",
      "languages",
      "required",
      "ordering",
      "onvoicefailure",
    ],
    local: "voice",
    namespace,
    parent: Option.none(),
  },
  "ssml:w": {
    attributes: ["xml:id", "xml:lang", "onlangfailure", "role"],
    local: "w",
    namespace,
    parent: Option.none(),
  },
};

/**
 * The 12 SSML kinds QTI content admits: those the ASI XSDs reference from QTI and HTML content
 * models. The other eight (`desc`, `lang`, `lexicon`, `lookup`, `meta`, `metadata`, `token` and
 * `w`) occur only inside SSML.
 */
export const hosted = [
  "ssml:audio",
  "ssml:break",
  "ssml:emphasis",
  "ssml:mark",
  "ssml:p",
  "ssml:phoneme",
  "ssml:prosody",
  "ssml:s",
  "ssml:say-as",
  "ssml:speak",
  "ssml:sub",
  "ssml:voice",
] as const satisfies readonly SsmlKind[];

/**
 * The QTI schema versions the SSML rows hold in.
 */
const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

/**
 * The prefix the ASI XSDs bind to the SSML namespace, which the inventory leaves keep in each
 * SSML reference of a QTI content model, such as `ssml11:speak`.
 */
export const asiPrefix = "ssml11";

/**
 * The admission rows that put the SSML elements under every host an inventory holds: under each
 * entry, the `ssml:` kind of each reference it writes `ssml11:<local>`, once, in both versions.
 *
 * Public so that a composition that adds hosts admits the SSML elements under them by the same
 * rule. The ASI XSDs reference all twelve {@link hosted} kinds, and only those, under each of their
 * 69 hosts, kinds of 62 elements, alike in 3.0.0 and 3.0.1; `src/vocab/derive/ssml.test.ts` reads
 * them from the XSDs.
 *
 * @param leaf - The inventory to read the hosts from.
 * @returns One row per host, SSML child and version, in the inventory's order.
 */
export const ssmlHostRows = (leaf: InventoryLeaf): readonly AdmissionRow[] =>
  Object.values(leaf).flatMap((entry) => {
    const children = Arr.dedupe(
      entry.children.flatMap(({ name }) =>
        name.startsWith(`${asiPrefix}:`) ? [`ssml:${name.slice(asiPrefix.length + 1)}`] : [],
      ),
    );

    return versions.flatMap((version) =>
      children.map((child) => ({ child, parent: entry.handle, version })),
    );
  });

/**
 * The attribute wildcards of the SSML elements, in the shape of `open.ts`'s statements, which
 * `openNameOf` reads.
 *
 * Every SSML type admits attributes beyond those it declares. All but `metadata`'s admit an
 * attribute in a namespace other than SSML's (never one in no namespace), laxly. So a foreign
 * attribute is an open name, and an `xml:` attribute is validated by `xml.xsd`'s declaration.
 * `metadata` admits any attribute, strictly, so only a globally declared one is valid on it.
 * `src/vocab/derive/ssml.test.ts` reads these from the pinned XSDs.
 */
export const wildcards = [
  {
    elements: [
      "audio",
      "break",
      "desc",
      "emphasis",
      "lang",
      "lexicon",
      "lookup",
      "mark",
      "meta",
      "p",
      "phoneme",
      "prosody",
      "s",
      "say-as",
      "speak",
      "sub",
      "token",
      "voice",
      "w",
    ],
    namespace,
    versions,
    wildcard: { namespaces: "other", processing: "lax" },
  },
  {
    elements: ["metadata"],
    namespace,
    versions,
    wildcard: { namespaces: "any", processing: "strict" },
  },
] as const satisfies readonly WildcardStatement[];

/**
 * The character-data and markup rows a mixed type adds.
 */
const mixedContent = ["text", "ws", "entityRef", "comment", "pi"] as const;

/**
 * The rows an element-only type adds: whitespace between its children, comments and processing
 * instructions.
 */
const elementOnly = ["ws", "comment", "pi"] as const;

/**
 * The children the SSML Recommendation refuses where the XSD admits them, by parent: spec reading
 * 44 removes `voice` under `token` and `w`.
 */
const refusedChildren: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ["ssml:token", new Set(["ssml:voice"])],
  ["ssml:w", new Set(["ssml:voice"])],
]);

/**
 * The admission rows under SSML parents, the same for both versions: each leaf entry's element
 * children as `ssml:` handles, each once and without the refused ones, then its content type's
 * rows.
 */
const ssmlAdmission: readonly AdmissionRow[] = Object.values(ssmlInventory).flatMap((entry) => {
  const refused = refusedChildren.get(entry.handle) ?? new Set();
  const elements = [...new Set(entry.children.map((child) => `ssml:${child.name}`))].filter(
    (child) => !refused.has(child),
  );
  const kids = [...elements, ...(entry.mixed ? mixedContent : elementOnly)];

  return versions.flatMap((version) =>
    kids.map((child) => ({ child, parent: entry.handle, version })),
  );
});

/**
 * The SSML admission rows: 240 per version under SSML parents, then the {@link hosted} kinds under
 * the hosts of today's composition (65 kinds) and of the ASI remainder (4), 828 per version. The
 * remainder states its four hosts' SSML rows too, and the composition keeps each row once.
 */
export const admission: readonly AdmissionRow[] = [
  ...ssmlAdmission,
  ...ssmlHostRows(inventory),
  ...ssmlHostRows(asiRemainderInventory),
];
