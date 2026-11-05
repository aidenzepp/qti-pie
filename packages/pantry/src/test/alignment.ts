/**
 * The spec-alignment census as code (slice A12): every XSD rule the pinned schemas state and every
 * spec reading, each joined to the composed grammar's relation that owns it, with its status.
 *
 * The XSD rules are read from the content-model and attribute IR (`#pantry/vocab/inventory/`),
 * which the deriver writes from the 23 pinned XSDs and whose own tests check a re-run reproduces
 * it byte for byte, so the census reads the schemas without reading the cache. Each rule is one
 * of:
 *
 * - `content:admission`, per (version, kind): the children its model admits, element particles and
 *   what its wildcards read, against `Admission`'s children;
 * - `content:character`, per (version, kind): whether character data may stand among its children,
 *   against `Admission`'s `text` child;
 * - `content:automaton`, per (version, kind) with element content: order, required particles,
 *   at-most-once and exclusive choice, which the operator's ruling of 2026-11-05 gives one owner,
 *   the Glushkov automaton (`Follow` and `Last`);
 * - `content:count`, per particle whose bound lies in 2…n: the count law `Counted`, which the
 *   automaton relaxes;
 * - `attribute:admission`, `attribute:type` and `attribute:required`, per declared (version, kind,
 *   name): `AttributeAdmission`'s row, its domain's enumeration against the XSD type's, and its
 *   use;
 * - `attribute:undeclared`, per admitted (version, kind, name) no declaration and no wildcard of the
 *   kind explains;
 * - `attribute:wildcard`, per (version, kind) whose attribute wildcard admits the XML namespace:
 *   `xml.xsd`'s four global attributes admitted;
 * - `text:domain`, per simple-content (version, kind): `TextDomain`'s row;
 * - `reading`, per spec reading of `docs/spec-readings.md`, with the status the alignment audit gives
 *   it after the operator's rulings.
 *
 * A status is `G` (the grammar states the rule), `reading` (it departs from the XSD by a recorded
 * spec reading), `R` (a ruled gap: D12 and reading 50), `P` (a named slice owns it and nothing
 * states it yet), `RG` (a representation gap the operator has not ruled), `U` (nothing owns it:
 * XSD-invalid content is accepted) or `X` (contradicted: the grammar refuses XSD-valid content, or
 * states a rule with no reading behind it). The value domains' lexical spaces beyond their
 * enumerations are `lexical.oracle.test.ts`'s, against `xmllint`.
 */
import { Option } from "effect";
import type { Use, ValueDomain } from "#pantry/grammar/attributes.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { foreignKinds, isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import {
  attributeDeclarations,
  attributeWildcards,
  textTypes,
} from "#pantry/vocab/inventory/attributes.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
import type {
  AttributeDeclaration,
  ContentModel,
  Domain,
  NamespaceConstraint,
  Particle,
} from "#pantry/vocab/inventory/types.ts";
import { globalKinds } from "#pantry/vocab/inventory/vocabularies.ts";
import { namespaceClassesUnder } from "#pantry/vocab/namespaces.ts";

/**
 * A rule's status, as the alignment audit's §2 defines it.
 */
export type Status = "G" | "P" | "R" | "RG" | "U" | "X" | "meta" | "reading";

/**
 * The statuses, in the order the census reports them.
 */
export const statuses = [
  "G",
  "reading",
  "R",
  "P",
  "RG",
  "U",
  "X",
  "meta",
] as const satisfies readonly Status[];

/**
 * One rule of the census: its family, the version and parent kind it holds in (`both` when the
 * versions agree), what it is about, its owner, its status and what the grammar states of it.
 */
export interface Rule {
  readonly detail: string;
  readonly family: string;
  readonly owner: string;
  readonly parent: string;
  readonly status: Status;
  readonly subject: string;
  readonly version: SchemaVersion | "both";
}

/**
 * A spec reading's entry: its status after the operator's rulings of 2026-11-05 and the slice or
 * relation that owns it, from the alignment audit's Matrix B (§7).
 */
interface ReadingEntry {
  readonly owner: string;
  readonly status: Status;
}

/**
 * Every spec reading's status and owner. Reading 14 is restated to follow the XSD (the text-entry
 * references are IDREFs), so the Idref family owns it; D4 is closed by the Glushkov ruling, so the
 * ruled gaps are D12 (reading 2's unknown rest) and reading 50, with reading 60, which extends
 * reading 50's limit to a simple `xsi:type`'s text. Readings 51 to 55, 58 and 59 bind plate, which
 * delivers and scores; pantry's part is to store the values they read as written, which the codec
 * does.
 */
export const readings: ReadonlyMap<number, ReadingEntry> = new Map<number, ReadingEntry>([
  [1, { owner: "every law", status: "meta" }],
  [
    2,
    {
      owner:
        "the automaton's restated `m:bvar` and `m:piecewise` (the RelaxNG's interleaves) and the MathML arity law; D12 for the rest, Sterling's B1 open",
      status: "R",
    },
  ],
  [
    3,
    {
      owner:
        "the oracle's SSML lexicon reference and SSML trim mark; the `fragment` copy on Node and the SSML overlay (W5)",
      status: "P",
    },
  ],
  [4, { owner: "Q5.10 O4, Q5.13 O7", status: "P" }],
  [5, { owner: "RG3: a containment whose source is a join", status: "RG" }],
  [6, { owner: "N5 admission (`open.ts` `foreignRoots`), shred", status: "G" }],
  [7, { owner: "Q5.08 O2, Q5.11 O5, G5", status: "P" }],
  [8, { owner: "Q5.11 O5", status: "P" }],
  [
    9,
    {
      owner:
        "the Schematron the ASI XSDs embed, each rule to its law (docs/research/unowned-readings.md §9); mastery-range, string-identifier-distinct and reading 23 in W5",
      status: "P",
    },
  ],
  [10, { owner: "AL1, AL4", status: "G" }],
  [11, { owner: "codec", status: "G" }],
  [12, { owner: "admission, TextDomain", status: "G" }],
  [13, { owner: "shred (`open.ts` `dataName`)", status: "G" }],
  [14, { owner: "the Idref family, contained in DocumentId (Q5.05)", status: "G" }],
  [15, { owner: "AttributeAdmission's domain, a kind reading (A5)", status: "X" }],
  [16, { owner: "AL1 (`positiveDouble`)", status: "G" }],
  [17, { owner: "AL1 (`viewList`)", status: "G" }],
  [18, { owner: "Q5.09 O3", status: "P" }],
  [19, { owner: "Q5.09 O3", status: "P" }],
  [20, { owner: "the automaton's model edit (`require`), Q1", status: "P" }],
  [21, { owner: "O4 arity", status: "G" }],
  [22, { owner: "N5 (admission omits it)", status: "G" }],
  [23, { owner: "Q5.10 O4 (an ancestry flag)", status: "P" }],
  [24, { owner: "N5", status: "G" }],
  [25, { owner: "N6 (ancestry flag `test`)", status: "G" }],
  [26, { owner: "the automaton (`readingStatements`)", status: "G" }],
  [27, { owner: "AL1", status: "G" }],
  [28, { owner: "Q5.10 O4 (D5)", status: "P" }],
  [29, { owner: "Q5.10, Q5.13", status: "P" }],
  [30, { owner: "N5, shred", status: "G" }],
  [31, { owner: "the automaton's model edit (`require`), Q1", status: "P" }],
  [32, { owner: "N5", status: "G" }],
  [33, { owner: "P1 to P3 (Q5.06)", status: "G" }],
  [34, { owner: "Q5.08 O2", status: "P" }],
  [35, { owner: "AL1", status: "G" }],
  [36, { owner: "P3 adds no key (Q5.06)", status: "G" }],
  [37, { owner: "AL1", status: "G" }],
  [38, { owner: "N6", status: "G" }],
  [39, { owner: "AL1 (`version.datatype`, reading 39)", status: "G" }],
  [40, { owner: "the automaton", status: "G" }],
  [41, { owner: "AL5 attribute count (`attributeCounts`)", status: "G" }],
  [42, { owner: "AL1 (`languages.datatype`, reading 42)", status: "G" }],
  [43, { owner: "AL5 attribute count (`attributeCounts`)", status: "G" }],
  [44, { owner: "N5", status: "G" }],
  [45, { owner: "G5, Q5.08", status: "P" }],
  [46, { owner: "G5's derived `int8`", status: "P" }],
  [
    47,
    {
      owner:
        "`xsi:nil` admitted only on the foreign kinds (A6); XsiType derived (Q11's `XsiType`); the governing type's content and attributes wait on Sterling's B4 and B5",
      status: "P",
    },
  ],
  [48, { owner: "RG4: exactly one reading resolves", status: "RG" }],
  [49, { owner: "N5", status: "G" }],
  [50, { owner: "a ruled limit (decision 227)", status: "R" }],
  [51, { owner: "plate runs the templates; pantry records the name, as written", status: "G" }],
  [52, { owner: "plate scores; pantry stores the mapping as written", status: "G" }],
  [53, { owner: "plate delivers; pantry stores `max-strings` as written", status: "G" }],
  [54, { owner: "plate checks responses; pantry stores `pattern-mask` as written", status: "G" }],
  [55, { owner: "plate checks responses; pantry stores `pattern-mask` as written", status: "G" }],
  [56, { owner: "G5's typed `xs:double` values (Q5.08)", status: "P" }],
  [57, { owner: "the W5 overlays over every node the walk checks (Q5.09)", status: "P" }],
  [58, { owner: "plate checks the pattern; pantry stores `pattern-mask` as written", status: "G" }],
  [59, { owner: "plate scores; pantry stores `coords` as written", status: "G" }],
  [60, { owner: "a known limit beside reading 50: the text is accepted unchecked", status: "R" }],
  [
    61,
    {
      owner: "the anyURI domain's pattern, RFC 2396 with RFC 2732 (Q3's builtinDomainOf, Q9)",
      status: "G",
    },
  ],
  [62, { owner: "LomObjectIdentifier", status: "G" }],
  [63, { owner: "Variable declared (P8)", status: "G" }],
  [64, { owner: "the derived unsigned domains", status: "G" }],
  [65, { owner: "Declaration key", status: "G" }],
  [66, { owner: "Binding declared", status: "G" }],
  [67, { owner: "Choice bounds (references.ts ChoiceBound)", status: "G" }],
  [
    68,
    { owner: "Feedback reference, Feedback outcome type, Printed variable reference", status: "G" },
  ],
  [69, { owner: "MappableBaseType", status: "G" }],
  [70, { owner: "Selection bound", status: "G" }],
  [71, { owner: "default hotspot last slot, Graphic gap match default hotspot", status: "G" }],
]);

/**
 * The admissions a spec reading removes from a model: (parent, child) pairs the XSD admits and
 * the grammar refuses on purpose.
 */
const readingOmissions: ReadonlyMap<string, number> = new Map([
  ["qti-template-else qti-template-constraint", 22],
  ["qti-template-else-if qti-template-constraint", 22],
  ["qti-template-if qti-template-constraint", 22],
  ["ssml:token ssml:voice", 44],
  ["ssml:w ssml:voice", 44],
]);

/**
 * The attribute rules a spec reading departs from the XSD in, by `family parent subject`.
 */
const readingDepartures: ReadonlyMap<string, number> = new Map([
  ["attribute:type qti-match-table-entry target-value", 8],
]);

/**
 * The rules nothing states yet that a named slice owns, by `family parent subject`, with the
 * slice.
 */
const planned: ReadonlyMap<string, string> = new Map([
  ["attribute:required qti-area-map-entry coords", "Q5.09, coords by shape"],
  ["attribute:required qti-associable-hotspot coords", "Q5.09, coords by shape"],
  ["attribute:required qti-hotspot-choice coords", "Q5.09, coords by shape"],
]);

/**
 * The attribute names the document layer admits on every kind, beside the open classes: XML's
 * and XML Schema's own (`xml:` and `xsi:`), which no kind's declarations list.
 *
 * @param name - The attribute handle.
 * @returns Whether the layer admits it.
 */
const isLayerName = (name: string): boolean =>
  name.startsWith("xml:") || name.startsWith("xsi:") || openClasses.some((open) => open === name);

/**
 * The children a particle admits: the kinds its element particles name, and its wildcards'
 * namespace constraints.
 */
interface Children {
  readonly kinds: readonly string[];
  readonly wildcards: readonly NamespaceConstraint[];
}

/**
 * The children of a model with no particle.
 */
const noChildren: Children = { kinds: [], wildcards: [] };

/**
 * The child kinds a particle names, its wildcards' included as `any` markers.
 *
 * @param particle - The particle.
 * @returns The element kinds, and the wildcards' namespace constraints.
 */
const childrenOf = (particle: Particle): Children => {
  switch (particle._tag) {
    case "element": {
      return Option.contains(particle.occurs.max, 0)
        ? { kinds: [], wildcards: [] }
        : { kinds: particle.kinds, wildcards: [] };
    }
    case "any": {
      return {
        kinds: [],
        wildcards: Option.contains(particle.occurs.max, 0) ? [] : [particle.namespace],
      };
    }
    case "group": {
      const held = particle.particles.map(childrenOf);

      return Option.contains(particle.occurs.max, 0)
        ? { kinds: [], wildcards: [] }
        : {
            kinds: held.flatMap(({ kinds }) => kinds),
            wildcards: held.flatMap(({ wildcards }) => wildcards),
          };
    }
    default: {
      return particle satisfies never;
    }
  }
};

/**
 * The particles of a model numbered as the content grammar numbers positions: its element and
 * wildcard particles from 1, in tree order.
 *
 * @param particle - The model's particle.
 * @returns Each element and wildcard particle with its position.
 */
const positionsOf = (particle: Particle): readonly (readonly [Particle, number])[] => {
  const out: (readonly [Particle, number])[] = [];
  const visit = (at: Particle): void => {
    if (at._tag === "group") {
      for (const inner of at.particles) {
        visit(inner);
      }
    } else {
      out.push([at, out.length + 1]);
    }
  };
  visit(particle);

  return out;
};

/**
 * Whether a wildcard's namespace constraint admits a namespace, `target` being the namespace of
 * the schema it is written in (XML Schema Part 1, 3.10.4).
 *
 * @param constraint - The constraint.
 * @param namespace - The namespace, empty for none.
 * @param target - The schema's target namespace.
 * @returns Whether it admits it.
 */
const admits = (constraint: NamespaceConstraint, namespace: string, target: string): boolean => {
  switch (constraint) {
    case "##any": {
      return true;
    }
    case "##local": {
      return namespace === "";
    }
    case "##other": {
      return namespace !== "" && namespace !== target;
    }
    default: {
      return constraint satisfies never;
    }
  }
};

/**
 * The enumeration values a resolved XSD domain lists, when it is an enumeration: an atomic type
 * whose facets enumerate, or a union of such.
 *
 * @param domain - The domain.
 * @returns The values, or none when the domain is no enumeration.
 */
const enumerationOf = (domain: Domain): Option.Option<ReadonlySet<string>> => {
  const own = domain.facets
    .filter(({ facet }) => facet === "enumeration")
    .map(({ value }) => value);

  if (domain._tag === "atomic") {
    return own.length === 0 ? Option.none() : Option.some(new Set(own));
  }

  if (domain._tag === "union") {
    const members = domain.members.map(enumerationOf);

    return members.every(Option.isSome)
      ? Option.some(
          new Set(
            members.flatMap((member) => [...Option.getOrElse(member, () => new Set<string>())]),
          ),
        )
      : Option.none();
  }

  return Option.none();
};

/**
 * Merge rules that hold alike in both versions into one row each, `version` `both`.
 *
 * @param rules - The rules, one per version.
 * @returns The rules, each identical pair merged.
 */
const merged = (rules: readonly Rule[]): readonly Rule[] => {
  const byKey = new Map<string, Rule>();
  for (const rule of rules) {
    const key = [rule.family, rule.parent, rule.subject, rule.status, rule.owner, rule.detail].join(
      "\u0000",
    );
    const held = byKey.get(key);
    byKey.set(
      key,
      held === undefined || held.version === rule.version ? rule : { ...rule, version: "both" },
    );
  }

  return [...byKey.values()];
};

/**
 * What the census reads of a composed grammar, indexed once: each (version, parent)'s admitted
 * children, each element kind's namespace, which (version, parent)s have an automaton, `Counted`'s
 * rows, the domains, `AttributeAdmission`'s rows and `TextDomain`'s keys.
 */
interface Index {
  readonly admitted: ReadonlyMap<
    string,
    ComposedGrammar["attributes"]["admission"]["rows"][number]
  >;
  readonly automata: ReadonlySet<string>;
  readonly children: ReadonlyMap<string, ReadonlySet<string>>;
  readonly counted: ReadonlyMap<string, ComposedGrammar["content"]["counted"]["rows"][number]>;
  readonly domains: ReadonlyMap<string, ValueDomain>;
  readonly namespaces: ReadonlyMap<string, string>;
  readonly texts: ReadonlySet<string>;
}

/**
 * Index a composed grammar for the census.
 *
 * @param grammar - The grammar.
 * @returns The index.
 */
const indexOf = (grammar: ComposedGrammar): Index => {
  const children = new Map<string, Set<string>>();
  for (const row of grammar.admission.rows) {
    const key = `${row.version} ${row.parent}`;
    children.set(key, (children.get(key) ?? new Set()).add(row.child));
  }

  return {
    admitted: new Map(
      grammar.attributes.admission.rows.map((row) => [
        `${row.version} ${row.kind} ${row.name}`,
        row,
      ]),
    ),
    automata: new Set(
      [...grammar.content.follow.rows, ...grammar.content.last.rows].map(
        (row) => `${row.version} ${row.parent}`,
      ),
    ),
    children,
    counted: new Map(
      grammar.content.counted.rows.map((row) => [
        `${row.version} ${row.parent} ${row.position}`,
        row,
      ]),
    ),
    domains: new Map(grammar.attributes.domains.map((domain) => [domain.handle, domain])),
    namespaces: new Map(grammar.kinds.elementName.rows.map((row) => [row.kind, row.namespace])),
    texts: new Set(grammar.attributes.text.rows.map((row) => `${row.version} ${row.kind}`)),
  };
};

/**
 * The kinds each version declares globally.
 */
const globals: ReadonlyMap<SchemaVersion, ReadonlySet<string>> = new Map(
  (["3.0.0", "3.0.1"] as const).map((version) => [
    version,
    new Set(
      globalKinds.filter(({ versions }) => versions.includes(version)).map(({ kind }) => kind),
    ),
  ]),
);

/**
 * The kinds a schema declares globally in a version, which a `lax` or `strict` wildcard reads.
 *
 * @param version - The version.
 * @returns The kinds.
 */
const globalsIn = (version: SchemaVersion): ReadonlySet<string> =>
  globals.get(version) ?? new Set<string>();

/**
 * The element-content particle of a model, none for empty or simple content.
 *
 * @param model - The model.
 * @returns Its particle.
 */
const particleOf = (model: ContentModel): Option.Option<Particle> =>
  model.content._tag === "element-only" || model.content._tag === "mixed"
    ? Option.some(model.content.particle)
    : Option.none();

/**
 * Write an occurrence's bounds, `n` for unbounded.
 *
 * @param min - The least count.
 * @param max - The greatest, none for unbounded.
 * @returns The bounds as `min..max`.
 */
const boundsText = (min: number, max: Option.Option<number>): string =>
  `${String(min)}..${Option.match(max, { onNone: () => "n", onSome: String })}`;

/**
 * The census of one model in one version: its admission, its character content, its automaton and
 * its counted particles.
 *
 * @param index - The grammar's index.
 * @param model - The model.
 * @param version - The version.
 * @returns The rules.
 */
const modelRules = (index: Index, model: ContentModel, version: SchemaVersion): readonly Rule[] => {
  const parent = model.kind;
  const held = index.children.get(`${version} ${parent}`) ?? new Set<string>();
  const particle = particleOf(model);
  const { kinds, wildcards } = Option.match(particle, {
    onNone: () => noChildren,
    onSome: childrenOf,
  });
  const target = index.namespaces.get(parent) ?? "";
  const explained = (kind: string): boolean =>
    kinds.includes(kind) ||
    // A foreign kind is its namespace class (§3.10.1): a wildcard explains the classes its
    // constraint admits.
    wildcards.some((constraint) =>
      namespaceClassesUnder[constraint].some(
        (namespaceClass) => foreignKinds[namespaceClass] === kind,
      ),
    ) ||
    wildcards.some(
      (constraint) =>
        globalsIn(version).has(kind) &&
        admits(constraint, index.namespaces.get(kind) ?? "", target),
    );
  const elementChildren = [...held].filter(
    (kind) => index.namespaces.has(kind) || isForeignKind(kind),
  );
  const missing = [...new Set(kinds)].filter((kind) => !held.has(kind));
  const unread = missing.filter((kind) => !readingOmissions.has(`${parent} ${kind}`));
  const extra = elementChildren.filter((kind) => !explained(kind));
  const admission = ((): Status => {
    if (unread.length > 0 || extra.length > 0) {
      return "X";
    }

    return missing.length > 0 ? "reading" : "G";
  })();
  const wantsText = model.content._tag === "mixed" || model.content._tag === "simple";
  const base = { parent, subject: parent, version };
  const automaton = index.automata.has(`${version} ${parent}`);

  return [
    {
      ...base,
      detail: `refused [${unread.join(" ")}]; by reading [${missing.filter((kind) => !unread.includes(kind)).join(" ")}]; unexplained [${extra.join(" ")}]`,
      family: "content:admission",
      owner: "Admission",
      status: admission,
    },
    {
      ...base,
      detail: `${model.content._tag}; text admitted: ${String(held.has("text"))}`,
      family: "content:character",
      owner: "Admission (text)",
      status: wantsText === held.has("text") ? "G" : "X",
    },
    ...Option.toArray(particle).flatMap((found): readonly Rule[] => [
      {
        ...base,
        detail: automaton ? "automaton installed" : "no automaton",
        family: "content:automaton",
        owner: "Follow, Last (Glushkov)",
        status: automaton ? "G" : "P",
      },
      ...positionsOf(found).flatMap(([at, position]): readonly Rule[] => {
        const max = Option.getOrElse(at.occurs.max, () => Number.POSITIVE_INFINITY);
        if (at.occurs.min < 2 && !(max >= 2 && Number.isFinite(max))) {
          return [];
        }

        const row = index.counted.get(`${version} ${parent} ${String(position)}`);
        const stated =
          row !== undefined &&
          row.min === at.occurs.min &&
          (!Number.isFinite(max) || row.max === max);

        return [
          {
            ...base,
            detail: `position ${String(position)}: ${boundsText(at.occurs.min, at.occurs.max)}; ${row === undefined ? "no Counted row" : `Counted ${String(row.min)}..${String(row.max)}`}`,
            family: "content:count",
            owner: "Counted",
            status: stated ? "G" : "U",
            subject: at._tag === "element" ? at.kinds.join(" ") : "##any",
          },
        ];
      }),
    ]),
  ];
};

/**
 * The `Counted` rows the XSD does not state: a count whose particle the XSD bounds otherwise.
 *
 * @param grammar - The grammar.
 * @returns One contradicted rule per such row.
 */
const countsBeyond = (grammar: ComposedGrammar): readonly Rule[] =>
  grammar.content.counted.rows.flatMap((row): readonly Rule[] => {
    const model = contentModels.find(
      ({ kind, versions }) => kind === row.parent && versions.includes(row.version),
    );
    const found = Option.flatMap(Option.fromNullishOr(model), particleOf).pipe(
      Option.flatMap((particle) =>
        Option.fromNullishOr(
          positionsOf(particle).find(([, position]) => String(position) === row.position),
        ),
      ),
      Option.map(([particle]) => particle),
    );
    const same = Option.exists(
      found,
      ({ occurs }) =>
        occurs.min === row.min &&
        Option.getOrElse(occurs.max, () => Number.POSITIVE_INFINITY) === row.max,
    );
    if (same) {
      return [];
    }

    return [
      {
        detail: `Counted ${String(row.min)}..${String(row.max)} at position ${row.position}; XSD ${Option.match(found, { onNone: () => "no particle", onSome: ({ occurs }) => boundsText(occurs.min, occurs.max) })}`,
        family: "content:count-beyond",
        owner: "Counted",
        parent: row.parent,
        status: "X",
        subject: Option.match(found, {
          onNone: () => row.position,
          onSome: (particle) => (particle._tag === "element" ? particle.kinds.join(" ") : "##any"),
        }),
        version: row.version,
      },
    ];
  });

/**
 * The status of a declared attribute's use against the grammar's.
 *
 * @param declared - The XSD's use.
 * @param stated - The grammar's.
 * @param key - The rule's `family parent subject`, which a planned owner is looked up by.
 * @returns The status.
 */
const useStatus = (declared: Use, stated: Use, key: string): Status => {
  if (declared === stated) {
    return "G";
  }

  if (declared === "required") {
    return planned.has(key) ? "P" : "U";
  }

  return "X";
};

/**
 * The status of a domain's enumeration against the XSD type's.
 *
 * @param same - Whether they agree.
 * @param reading - The reading that departs from the XSD here, if any.
 * @returns The status.
 */
const typeStatus = (same: boolean, reading: number | undefined): Status => {
  if (same) {
    return "G";
  }

  return reading === undefined ? "X" : "reading";
};

/**
 * The census of a declared attribute's enumeration against its domain's compiled pattern: every
 * XSD value is matched. That the pattern matches nothing else is the lexical oracle's, against
 * `xmllint`.
 *
 * @param base - The rule's place.
 * @param base.parent - The kind.
 * @param base.subject - The attribute.
 * @param base.version - The version.
 * @param domain - The grammar's domain.
 * @param theirs - The XSD type's values.
 * @param row - The declaration.
 * @returns The rule.
 */
const typeRule = (
  base: Pick<Rule, "parent" | "subject" | "version">,
  domain: ValueDomain,
  theirs: ReadonlySet<string>,
  row: AttributeDeclaration,
): Rule => {
  const pattern = new RegExp(domain.pattern, patternFlags);
  const refused = [...theirs].filter((value) => !pattern.test(value));
  const reading = readingDepartures.get(`attribute:type ${row.kind} ${row.name}`);
  const read = refused.length === 0 || reading === undefined ? "" : `; reading ${String(reading)}`;

  return {
    ...base,
    detail: `${String(theirs.size)} XSD values; refused [${refused.join(" ")}]${read}`,
    family: "attribute:type",
    owner: "ValueDomain pattern (enumeration)",
    status: typeStatus(refused.length === 0, reading),
  };
};

/**
 * The census of one declared attribute in one version: its admission, its enumeration and its use.
 *
 * @param index - The grammar's index.
 * @param row - The declaration.
 * @param version - The version.
 * @returns The rules.
 */
const attributeRules = (
  index: Index,
  row: AttributeDeclaration,
  version: SchemaVersion,
): readonly Rule[] => {
  const held = index.admitted.get(`${version} ${row.kind} ${row.name}`);
  const base = { parent: row.kind, subject: row.name, version };
  const admission: Rule = {
    ...base,
    detail: held === undefined ? "not admitted" : `domain ${held.domain}`,
    family: "attribute:admission",
    owner: "AttributeAdmission",
    status: held === undefined ? "X" : "G",
  };
  if (held === undefined) {
    return [admission];
  }

  const domain = index.domains.get(held.domain);
  const theirs = enumerationOf(row.domain);
  const types =
    Option.isSome(theirs) && domain !== undefined
      ? [typeRule(base, domain, theirs.value, row)]
      : [];
  const key = `attribute:required ${row.kind} ${row.name}`;
  const status = useStatus(row.use, held.use, key);
  const uses: readonly Rule[] =
    row.use === "required" || held.use === "required"
      ? [
          {
            ...base,
            detail: `XSD ${row.use}; grammar ${held.use}${status === "P" ? `; ${planned.get(key) ?? ""}` : ""}`,
            family: "attribute:required",
            owner: "Required",
            status,
          },
        ]
      : [];

  return [admission, ...types, ...uses];
};

/**
 * The attributes the grammar admits that no declaration states and no wildcard of the kind admits,
 * the document layer's names aside.
 *
 * @param grammar - The grammar.
 * @param index - Its index.
 * @param declared - The declared `version kind name` keys.
 * @returns One contradicted rule per such attribute.
 */
const undeclaredRules = (
  grammar: ComposedGrammar,
  index: Index,
  declared: ReadonlySet<string>,
): readonly Rule[] =>
  grammar.attributes.admission.rows.flatMap((row): readonly Rule[] => {
    const { version } = row;
    if (!grammar.kinds.versions.has(version)) {
      return [];
    }

    const wildcard = attributeWildcards.find(
      ({ kind, versions }) => kind === row.kind && versions.includes(version),
    );
    const namespace = row.name.startsWith("xlink:") ? "http://www.w3.org/1999/xlink" : "";
    const viaWildcard =
      wildcard !== undefined &&
      admits(wildcard.namespace, namespace, index.namespaces.get(row.kind) ?? "");
    if (
      declared.has(`${row.version} ${row.kind} ${row.name}`) ||
      isLayerName(row.name) ||
      viaWildcard
    ) {
      return [];
    }

    return [
      {
        detail: `domain ${row.domain}`,
        family: "attribute:undeclared",
        owner: "AttributeAdmission",
        parent: row.kind,
        status: "X",
        subject: row.name,
        version,
      },
    ];
  });

/**
 * The namespace of XML's own attributes, which `xml.xsd` declares globally.
 */
const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The attributes `xml.xsd` declares globally, which a wildcard that admits the XML namespace
 * admits on its kind.
 */
const xmlGlobals = ["xml:base", "xml:id", "xml:lang", "xml:space"] as const;

/**
 * The census of the attribute wildcards that admit the XML namespace: each admits `xml.xsd`'s four
 * global attributes on its kind (validated against their declarations under `lax` and `strict`,
 * unvalidated under `skip`), so `AttributeAdmission` must hold each.
 *
 * @param index - The grammar's index.
 * @returns One rule per (version, kind, name).
 */
const wildcardXmlRules = (index: Index): readonly Rule[] =>
  attributeWildcards.flatMap((wildcard) =>
    admits(wildcard.namespace, xmlNamespace, index.namespaces.get(wildcard.kind) ?? "")
      ? wildcard.versions.flatMap((version) =>
          xmlGlobals.map((name): Rule => {
            const held = index.admitted.has(`${version} ${wildcard.kind} ${name}`);

            return {
              detail: `${wildcard.namespace} ${wildcard.processing}; ${held ? "admitted" : "not admitted"}`,
              family: "attribute:wildcard",
              owner: "AttributeAdmission (the document layer's xml: names)",
              parent: wildcard.kind,
              status: held ? "G" : "X",
              subject: name,
              version,
            };
          }),
        )
      : [],
  );

/**
 * The census of the spec readings: each reading's entry, reading 15's status read from the grammar
 * (its attribute's domain), every other's as recorded.
 *
 * @param index - The grammar's index.
 * @returns One rule per reading.
 */
const readingRules = (index: Index): readonly Rule[] => {
  const variableRef = index.admitted.get("3.0.1 qti-outcome-declaration variable-identifier-ref");

  return [...readings].map(([reading, entry]): Rule => {
    const fifteen = reading === 15;
    const resolved = fifteen && variableRef !== undefined && !/idref/iu.test(variableRef.domain);

    return {
      detail: fifteen ? `domain ${variableRef?.domain ?? "none"}` : "",
      family: "reading",
      owner: entry.owner,
      parent: "",
      status: resolved ? "G" : entry.status,
      subject: String(reading),
      version: "both",
    };
  });
};

/**
 * Take the census of the XSD rules and spec readings against a composed grammar.
 *
 * @param grammar - The composed grammar.
 * @returns Every rule, identical rules of both versions merged.
 */
export const census = (grammar: ComposedGrammar): readonly Rule[] => {
  const index = indexOf(grammar);
  const declared = new Set(
    attributeDeclarations.flatMap((row) =>
      row.versions.map((version) => `${version} ${row.kind} ${row.name}`),
    ),
  );

  return merged([
    ...contentModels.flatMap((model) =>
      model.versions.flatMap((version) => modelRules(index, model, version)),
    ),
    ...countsBeyond(grammar),
    ...attributeDeclarations.flatMap((row) =>
      row.versions.flatMap((version) => attributeRules(index, row, version)),
    ),
    ...undeclaredRules(grammar, index, declared),
    ...wildcardXmlRules(index),
    ...textTypes.flatMap((row) =>
      row.versions.map((version): Rule => {
        const held = index.texts.has(`${version} ${row.kind}`);

        return {
          detail: held ? "TextDomain row" : "no TextDomain row",
          family: "text:domain",
          owner: "TextDomain",
          parent: row.kind,
          status: held ? "G" : "U",
          subject: row.kind,
          version,
        };
      }),
    ),
    ...readingRules(index),
  ]);
};

/**
 * The census's counts: per family and status, and the rules that are contradicted or unowned.
 */
export interface Counts {
  readonly byFamily: Readonly<Record<string, Partial<Readonly<Record<Status, number>>>>>;
  readonly total: number;
  readonly unowned: number;
}

/**
 * Count a census by family and status.
 *
 * @param rules - The census.
 * @returns The counts.
 */
export const countsOf = (rules: readonly Rule[]): Counts => {
  const byFamily: Record<string, Partial<Record<Status, number>>> = {};
  for (const rule of rules) {
    const family = byFamily[rule.family] ?? {};
    family[rule.status] = (family[rule.status] ?? 0) + 1;
    byFamily[rule.family] = family;
  }

  return {
    byFamily,
    total: rules.length,
    unowned: rules.filter(({ status }) => status === "U").length,
  };
};
