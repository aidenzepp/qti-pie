/**
 * The ASI remainder vocabulary: the 61 kinds of the 51 ASI elements the eleven composed
 * vocabularies hold no kind for, in the ASI namespace. Its kinds are not composed into today's
 * roster; the composition of every vocabulary reads them beside the eleven.
 *
 * The kinds, by group, are the test structure (20 elements, and the test vocabulary's kinds of
 * `qti-rubric-block` and `qti-content-body`), the companion materials (17 elements), the portable
 * custom interaction (6), the catalog (4), the stimulus (3) and `qti-custom-interaction`. The
 * registry and admission rows are derived at module load from the inventory leaf
 * (`inventory/asi-remainder.ts`, read from the 3.0.1 XSD) and from the facts below, which that
 * leaf's entries cannot hold. `src/vocab/derive/asi-remainder.test.ts` checks every fact against
 * both ASI XSDs.
 *
 * Reading rules of the derivation:
 *
 * - A host's element children are its leaf entry's `children`, each as a handle: an element of
 *   several types as the dotted kind its host resolves it to ({@link hosts}), a prefixed name with
 *   the handle prefix of its namespace (`m3:math` is `m:math`, `ssml11:p` is `ssml:p`, `xi:include`
 *   stays), and every other name as itself. `template` is the HTML kind, admitted as any other.
 * - An existing host (of the ASI, HTML and processing leaves) admits each child of its entry that is
 *   a remainder kind. Its other children, and its character data, are its own vocabulary's.
 * - The content class adds the rows phase-1's 4.3 states: an `element` host adds `ws`, `comment` and
 *   `pi`; a `mixed` or `simple` host adds `text`, `ws`, `entityRef`, `comment` and `pi`; an `empty`
 *   host admits `comment` and `pi` only.
 * - A row holds in both versions unless 3.0.1 adds it ({@link added301}). `qti-stimulus-body`
 *   declares no attribute in 3.0.0 ({@link attributeless300}), and one attribute's type differs
 *   ({@link attributeTypes300}).
 * - A host's rows are its whole content model, so a MathML or SSML child under a remainder host is
 *   admitted here too, as the MathML and SSML vocabularies admit it under the hosts they list; the
 *   composition keeps each `(version, parent, child)` once.
 */
import { Array as Arr, Option } from "effect";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import type { InventoryAttribute, InventoryEntry } from "#pantry/schema/content/xsd-inventory.ts";
import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";
import type { Content } from "#pantry/vocab/derive/asi-remainder.ts";
import { asiRemainderInventory } from "#pantry/vocab/inventory/asi-remainder.ts";

/**
 * The ASI namespace, which every remainder kind's element is in.
 */
const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The test structure: the 20 elements of an assessment test, its parts and sections, their
 * references and rules, and the test vocabulary's kinds of `qti-rubric-block` (a test or section
 * rubric) and `qti-content-body` (the body of a test feedback and of a test rubric).
 */
export const testKinds = [
  "qti-adaptive-engine-ref",
  "qti-adaptive-selection",
  "qti-adaptive-settings-ref",
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
  "qti-assessment-test",
  "qti-branch-rule",
  "qti-content-body.testFeedback",
  "qti-content-body.testRubric",
  "qti-item-session-control",
  "qti-metadata-ref",
  "qti-ordering",
  "qti-pre-condition",
  "qti-rubric-block.test",
  "qti-selection",
  "qti-template-default",
  "qti-test-feedback",
  "qti-test-part",
  "qti-time-limits",
  "qti-usagedata-ref",
  "qti-variable-mapping",
  "qti-weight",
] as const;

/**
 * The companion materials: the 17 elements of `qti-companion-materials-info`'s calculator, rule,
 * protractor and digital and physical materials, with the dotted kinds of `qti-file-href` and of
 * the two increments, whose types differ by host.
 */
export const companionKinds = [
  "qti-calculator",
  "qti-calculator-info",
  "qti-calculator-type",
  "qti-description",
  "qti-digital-material",
  "qti-file-href",
  "qti-file-href.card",
  "qti-increment-si",
  "qti-increment-us",
  "qti-major-increment.radialSI",
  "qti-major-increment.radialUS",
  "qti-major-increment.siLinear",
  "qti-major-increment.usLinear",
  "qti-minimum-length",
  "qti-minor-increment.radialSI",
  "qti-minor-increment.radialUS",
  "qti-minor-increment.siLinear",
  "qti-minor-increment.usLinear",
  "qti-physical-material",
  "qti-protractor",
  "qti-resource-icon",
  "qti-rule",
  "qti-rule-system-si",
  "qti-rule-system-us",
] as const;

/**
 * The portable custom interaction and its five parts.
 */
export const pciKinds = [
  "qti-context-variable",
  "qti-interaction-markup",
  "qti-interaction-module",
  "qti-interaction-modules",
  "qti-portable-custom-interaction",
  "qti-template-variable",
] as const;

/**
 * The catalog: `qti-catalog`'s cards and their content.
 */
export const catalogKinds = [
  "qti-card",
  "qti-card-entry",
  "qti-catalog",
  "qti-html-content",
] as const;

/**
 * The stimulus: an assessment stimulus, its body, and an item's reference to it.
 */
export const stimulusKinds = [
  "qti-assessment-stimulus",
  "qti-assessment-stimulus-ref",
  "qti-stimulus-body",
] as const;

/**
 * The remainder kinds, in append-only order: the groups in the order above, each in code-point
 * order, `qti-custom-interaction` last. A plain handle is the element's local name; a dotted one
 * names the element and the type its host gives it.
 */
export const kinds = [
  ...testKinds,
  ...companionKinds,
  ...pciKinds,
  ...catalogKinds,
  ...stimulusKinds,
  "qti-custom-interaction",
] as const;

/**
 * A remainder kind's handle.
 */
export type RemainderKind = (typeof kinds)[number];

/**
 * The remainder's interaction kinds, which join the `Interaction` set: each enters the `int`
 * ancestry flag and carries the interaction bans.
 */
export const interactions = [
  "qti-custom-interaction",
  "qti-portable-custom-interaction",
] as const satisfies readonly RemainderKind[];

/**
 * The attribute names the remainder kinds introduce, in first-appearance order over the kinds in
 * handle order: the names of their inventory entries that none of the eleven composed
 * vocabularies holds.
 */
export const attributes = [
  "category",
  "visible",
  "keep-together",
  "target",
  "mime-type",
  "support",
  "primary-path",
  "fallback-path",
  "primary-configuration",
  "secondary-configuration",
  "max-attempts",
  "show-feedback",
  "allow-review",
  "show-solution",
  "allow-comment",
  "allow-skipping",
  "validate-responses",
  "unit",
  "custom-interaction-type-identifier",
  "module",
  "select",
  "with-replacement",
  "access",
  "navigation-mode",
  "submission-mode",
  "min-time",
  "max-time",
  "allow-late-submission",
  "source-identifier",
  "target-identifier",
] as const;

/**
 * The hosts under which an element of several types resolves to each remainder dotted kind: the
 * kinds whose content model declares the element with that kind's type, in code-point order.
 *
 * `qti-file-href` resolves to its plain kind under its other hosts, `qti-calculator-info` and
 * `qti-digital-material`. `qti-major-increment` and `qti-minor-increment` have no plain kind.
 */
export const hosts = {
  "qti-content-body.testFeedback": ["qti-test-feedback"],
  "qti-content-body.testRubric": ["qti-rubric-block.test"],
  "qti-file-href.card": ["qti-card", "qti-card-entry"],
  "qti-major-increment.radialSI": ["qti-increment-si"],
  "qti-major-increment.radialUS": ["qti-increment-us"],
  "qti-major-increment.siLinear": ["qti-rule-system-si"],
  "qti-major-increment.usLinear": ["qti-rule-system-us"],
  "qti-minor-increment.radialSI": ["qti-increment-si"],
  "qti-minor-increment.radialUS": ["qti-increment-us"],
  "qti-minor-increment.siLinear": ["qti-rule-system-si"],
  "qti-minor-increment.usLinear": ["qti-rule-system-us"],
  "qti-rubric-block.test": ["qti-assessment-section", "qti-assessment-test", "qti-test-part"],
} as const satisfies Readonly<
  Partial<Record<RemainderKind, readonly [RemainderKind, ...RemainderKind[]]>>
>;

/**
 * The parents, beside the one its registry row names, under which a remainder dotted kind's
 * element resolves to it: every host of {@link hosts} after the first, which the row names.
 */
export const alsoUnder: ReadonlyMap<string, readonly string[]> = new Map(
  Object.entries(hosts).flatMap(([handle, [, ...rest]]) =>
    rest.length === 0 ? [] : [[handle, rest] as const],
  ),
);

/**
 * The remainder kinds whose content is character data of a simple type: elements declared with a
 * simple type, and the `simpleContent` types of `qti-file-href.card` and the eight increments.
 */
export const simpleContent = [
  "qti-calculator-type",
  "qti-description",
  "qti-file-href",
  "qti-file-href.card",
  "qti-major-increment.radialSI",
  "qti-major-increment.radialUS",
  "qti-major-increment.siLinear",
  "qti-major-increment.usLinear",
  "qti-minimum-length",
  "qti-minor-increment.radialSI",
  "qti-minor-increment.radialUS",
  "qti-minor-increment.siLinear",
  "qti-minor-increment.usLinear",
  "qti-physical-material",
  "qti-resource-icon",
] as const satisfies readonly RemainderKind[];

/**
 * The remainder kinds whose element-only content is a wildcard and nothing else, so their entries
 * list no child. No vocabulary models the elements a wildcard admits, so these kinds admit only
 * whitespace, comments and instructions.
 */
export const wildcardContent = [
  "qti-custom-interaction",
  "qti-ordering",
  "qti-selection",
] as const satisfies readonly RemainderKind[];

/**
 * The child elements the 3.0.1 XSD adds over 3.0.0 under a remainder host, as handles.
 */
export const added301 = {
  "qti-portable-custom-interaction": ["qti-stylesheet", "qti-catalog-info"],
  "qti-stimulus-body": ["xi:include"],
} as const satisfies Readonly<Partial<Record<RemainderKind, readonly string[]>>>;

/**
 * The remainder kinds that declare no attribute in 3.0.0, and in 3.0.1 every attribute of their
 * entry: 3.0.0's `StimulusBodyDType` is a bare sequence, and 3.0.1's extends
 * `BaseSequenceDType`.
 */
export const attributeless300 = ["qti-stimulus-body"] as const satisfies readonly RemainderKind[];

/**
 * The attribute types 3.0.0 declares where they differ from the 3.0.1 entry's, by kind and name:
 * a context variable's `identifier` is an IDREF in 3.0.0 and an identifier in 3.0.1.
 */
export const attributeTypes300 = {
  "qti-context-variable": { identifier: "UniqueIdentifierRefDType" },
} as const satisfies Readonly<Partial<Record<RemainderKind, Readonly<Record<string, string>>>>>;

/**
 * Both schema versions, which every remainder row holds in unless a fact above says otherwise.
 */
const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

/**
 * Whether a handle is a remainder kind.
 *
 * @param handle - A kind handle.
 * @returns Whether {@link kinds} lists it.
 */
const isRemainderKind = (handle: string): handle is RemainderKind =>
  kinds.some((kind) => kind === handle);

/**
 * Each remainder kind with its inventory entry, in {@link kinds} order.
 */
const entries: readonly (readonly [RemainderKind, InventoryEntry])[] = kinds.flatMap((kind) =>
  Option.toArray(Option.fromNullishOr(asiRemainderInventory[kind])).map(
    (entry) => [kind, entry] as const,
  ),
);

/**
 * Look up a fact keyed by remainder kind.
 *
 * @param fact - A fact keyed by some remainder kinds.
 * @param handle - A kind handle.
 * @returns The fact's value for the handle, `None` when it names none.
 */
const factOf = <Value>(
  fact: Readonly<Partial<Record<RemainderKind, Value>>>,
  handle: string,
): Option.Option<Value> =>
  isRemainderKind(handle) ? Option.fromNullishOr(fact[handle]) : Option.none();

/**
 * The content class of a remainder kind, from its entry and the two content facts.
 *
 * @param entry - The kind's inventory entry.
 * @returns `mixed` by the entry; `simple` by {@link simpleContent}; `element` for an entry with
 *   children or a kind of {@link wildcardContent}; else `empty`.
 */
export const contentOf = (entry: InventoryEntry): Content => {
  const among = (listed: readonly string[]): boolean => listed.includes(entry.handle);

  if (entry.mixed) {
    return "mixed";
  }

  if (among(simpleContent)) {
    return "simple";
  }

  return entry.children.length > 0 || among(wildcardContent) ? "element" : "empty";
};

/**
 * The generic kinds each content class admits.
 */
const characterRows = {
  element: ["ws", "comment", "pi"],
  empty: ["comment", "pi"],
  mixed: ["text", "ws", "entityRef", "comment", "pi"],
  simple: ["text", "ws", "entityRef", "comment", "pi"],
} as const satisfies Readonly<Record<Content, readonly string[]>>;

/**
 * The handle prefix of each namespace prefix the ASI XSDs write an element reference with: the
 * ASI namespace's is none, and the MathML 3, SSML 1.1 and XInclude vocabularies prefix their
 * handles `m:`, `ssml:` and `xi:`.
 */
const handlePrefixes: ReadonlyMap<string, string> = new Map([
  ["", ""],
  ["m3", "m:"],
  ["ssml11", "ssml:"],
  ["xi", "xi:"],
]);

/**
 * The handle each typed reference resolves to, keyed `host|element`: {@link hosts} inverted.
 */
const typedChildren: ReadonlyMap<string, string> = new Map(
  Object.entries(hosts).flatMap(([handle, parents]) => {
    const element = handle.slice(0, handle.indexOf("."));

    return parents.map((parent) => [`${parent}|${element}`, handle] as const);
  }),
);

/**
 * The handle an element reference stands for under a host.
 *
 * @param host - The host's handle.
 * @param name - The reference as the XSD spells it.
 * @returns The handle, or `None` for a name whose namespace prefix has no vocabulary; the deriver's
 *   test proves the pinned XSDs write none.
 */
export const childHandleOf = (host: string, name: string): Option.Option<string> => {
  const colon = name.indexOf(":");

  return Option.map(
    Option.fromNullishOr(handlePrefixes.get(colon === -1 ? "" : name.slice(0, colon))),
    (prefix) =>
      colon === -1
        ? (typedChildren.get(`${host}|${name}`) ?? name)
        : `${prefix}${name.slice(colon + 1)}`,
  );
};

/**
 * The admission rows of one host's children.
 *
 * @param host - The host's handle.
 * @param children - Its admitted children's handles; a handle listed twice is admitted once.
 * @returns One row per child and version it holds in: 3.0.1 alone for a child {@link added301}
 *   lists under the host, both versions otherwise.
 */
const rowsOf = (host: string, children: readonly string[]): readonly AdmissionRow[] => {
  const added = Option.getOrElse(
    factOf<readonly string[]>(added301, host),
    (): readonly string[] => [],
  );

  return [...new Set(children)].flatMap((child) =>
    (added.includes(child) ? (["3.0.1"] as const) : versions).map((version) => ({
      child,
      parent: host,
      version,
    })),
  );
};

/**
 * An entry's attribute rows, the first of each name.
 *
 * @param entry - The entry.
 * @returns Its rows in entry order, each name once.
 */
const attributesOf = (entry: InventoryEntry): readonly InventoryAttribute[] =>
  Arr.dedupeWith(entry.attributes, (left, right) => left.name === right.name);

/**
 * The registry row of each remainder kind: its element in the ASI namespace, the first of its
 * {@link hosts} as its parent, and every attribute name of its entry in entry order, each once.
 */
export const registry: Readonly<Record<string, RegistryRow>> = Object.fromEntries(
  entries.map(([kind, entry]) => [
    kind,
    {
      attributes: attributesOf(entry).map((row) => row.name),
      local: entry.element,
      namespace,
      parent: Option.map(
        factOf<readonly [RemainderKind, ...RemainderKind[]]>(hosts, kind),
        ([first]) => first,
      ),
    },
  ]),
);

/**
 * The remainder's admission rows: each remainder host's children and character data, then each
 * existing host's remainder children.
 */
export const admission: readonly AdmissionRow[] = [
  ...entries.flatMap(([kind, entry]) =>
    rowsOf(kind, [
      ...entry.children.flatMap((child) => Option.toArray(childHandleOf(kind, child.name))),
      ...characterRows[contentOf(entry)],
    ]),
  ),
  ...Object.values(inventory).flatMap((entry) =>
    rowsOf(entry.handle, entry.children.map((child) => child.name).filter(isRemainderKind)),
  ),
];

/**
 * One attribute a remainder kind may carry under one version, with the type it is declared with
 * there.
 */
export interface AttributeAdmission {
  readonly attribute: string;
  readonly kind: RemainderKind;
  readonly type: string;
  readonly version: SchemaVersionHandle;
}

/**
 * The type a remainder attribute is declared with under a version.
 *
 * @param version - The version.
 * @param kind - The kind that carries the attribute.
 * @param row - The attribute's 3.0.1 row.
 * @returns Under 3.0.0, the type {@link attributeTypes300} names where it names one; else the
 *   row's.
 */
const typeIn = (
  version: SchemaVersionHandle,
  kind: RemainderKind,
  row: InventoryAttribute,
): string =>
  version === "3.0.0"
    ? Option.getOrElse(
        Option.flatMap(factOf<Readonly<Record<string, string>>>(attributeTypes300, kind), (types) =>
          Option.fromNullishOr(types[row.name]),
        ),
        () => row.type,
      )
    : row.type;

/**
 * The remainder's attribute rows by version: every attribute of each kind's entry, under 3.0.1,
 * and under 3.0.0 for every kind but {@link attributeless300}'s.
 */
export const attributeAdmission: readonly AttributeAdmission[] = entries.flatMap(([kind, entry]) =>
  versions
    .filter((version) => version === "3.0.1" || !attributeless300.some((bare) => bare === kind))
    .flatMap((version) =>
      attributesOf(entry).map((row) => ({
        attribute: row.name,
        kind,
        type: typeIn(version, kind, row),
        version,
      })),
    ),
);
