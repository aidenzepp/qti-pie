/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * The XSD oracle: libxml2's schema validator, `xmllint`, judging generated documents against the
 * pinned XSDs, so a test can compare what the derived vocabulary says with what the XSDs say
 * through an implementation that shares no code with the deriver.
 *
 * A probe is one element, written on one line, with its attributes and content: a kind's element
 * itself when a schema declares it globally with the kind's type, and otherwise an element of the
 * kind's type that a driver schema declares globally in the namespace `urn:probe`. Its attributes
 * and content are read against the type as the kind's own element's would be, a wildcard's own
 * namespace included, since that is the namespace of the schema the wildcard is written in. Probes
 * go in batches, one document of many lines under an element whose content is a lax `##any`
 * wildcard, so each probe is assessed against its global declaration, and an error's line names its
 * probe.
 *
 * The validator reads only the pinned files: the driver imports every vocabulary's namespace at the
 * URL the XSDs themselves import it from, and an XML catalog maps each pin's URL to its cached
 * file, with `--nonet` refusing anything else.
 *
 * @see {@link https://gnome.pages.gitlab.gnome.org/libxml2/xmllint.html | xmllint}
 */
import { Array as Arr, Effect, FileSystem, Match, Option, Schema } from "effect";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { attributeOf, resolve } from "#pantry/vocab/derive/derive.ts";
import { declarationsIn, handleOf, loadWorld, typeNameOf } from "#pantry/vocab/derive/models.ts";
import { sources, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import type {
  AttributeDeclaration,
  ContentModel,
  ContentType,
  Particle,
  RosterKind,
  VocabularyRoster,
} from "#pantry/vocab/inventory/types.ts";
import type { Cost } from "#pantry/test/gen/vocab.ts";
import { catalogText } from "#pantry/test/xsd-catalog.ts";
import { xsNamespace } from "#pantry/vocab/namespaces.ts";
import {
  cachedReport,
  pinDigestsOf,
  verdictCacheRoot,
  verdictKey,
  xmllintVersion,
} from "#pantry/test/gen/verdict-cache.ts";
import { verdictsOfReport, xmllintReportOf } from "#pantry/xml/oracle.ts";
import type { XsdMessage } from "#pantry/xml/oracle.ts";

/**
 * The validator ran, but its report is not one the oracle reads: a line it cannot attribute, or an
 * error that says a batch is not well-formed, which is the probe writer's fault, not the XSDs'.
 */
export class XmllintUnreadable extends Schema.TaggedError<XmllintUnreadable>()(
  "XmllintUnreadable",
  { batch: Schema.String, line: Schema.String },
) {
  /**
   * The line the oracle could not read, and where to look.
   */
  override get message(): string {
    return `xmllint reported, for ${this.batch}, a line the oracle cannot attribute to a probe: ${this.line}. Read the batch under work/ to see the probe it names.`;
  }
}

/**
 * The prefix each namespace is written with in the probes, every probe's namespace bound on its
 * batch's root.
 */
export const probePrefixes: ReadonlyMap<string, string> = new Map([
  ["urn:probe", "p"],
  ["urn:x", "x"],
  ["http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "q"],
  ["http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1", "cp"],
  ["http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2", "cpx"],
  ["http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1", "csm"],
  ["http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0", "drd"],
  ["http://ltsc.ieee.org/xsd/LOM", "lom"],
  ["http://www.w3.org/1998/Math/MathML", "m"],
  ["http://www.imsglobal.org/xsd/imsqti_metadata_v3p0", "qmd"],
  ["http://www.w3.org/2001/10/synthesis", "s"],
  ["http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0", "ud"],
  ["http://www.w3.org/2001/XInclude", "xi"],
  ["http://www.w3.org/1999/xlink", "xlink"],
  ["http://www.w3.org/2001/XMLSchema-instance", "xsi"],
]);

/**
 * One type the driver gives a probe element: the probe's local name in `urn:probe`, and the type's
 * namespace and local name.
 */
export interface ProbeType {
  readonly local: string;
  readonly namespace: string;
  readonly probe: string;
}

/**
 * What one version's driver schema imports and declares: the pinned XSD each vocabulary's
 * namespace is imported from, and the probe elements of the kinds no schema declares globally.
 */
export interface Driver {
  readonly imports: readonly (readonly [namespace: string, source: SourcePath])[];
  readonly probes: readonly ProbeType[];
  readonly version: SchemaVersion;
}

/**
 * Write a version's driver schema.
 *
 * @param driver - What it imports and declares.
 * @returns The schema's text.
 */
const driverText = (driver: Driver): string => {
  const bound = Arr.dedupe(driver.probes.map(({ namespace }) => namespace));

  return [
    `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:probe" elementFormDefault="qualified"${bound
      .map((namespace, at) => ` xmlns:t${at}="${namespace}"`)
      .join("")}>`,
    ...driver.imports.map(
      ([namespace, source]) =>
        `  <xs:import namespace="${namespace}" schemaLocation="${sources[source].url}"/>`,
    ),
    '  <xs:element name="batch"><xs:complexType><xs:sequence><xs:any namespace="##any" processContents="lax" minOccurs="0" maxOccurs="unbounded"/></xs:sequence></xs:complexType></xs:element>',
    ...driver.probes.map(
      ({ local, namespace, probe }) =>
        `  <xs:element name="${probe}" type="t${bound.indexOf(namespace)}:${local}"/>`,
    ),
    "</xs:schema>",
  ].join("\n");
};

/**
 * Write one batch: its root, binding every probe prefix, then each probe on a line of its own.
 *
 * @param probes - The probes, each one line of XML.
 * @returns The document's text; probe `i` is on line `i + 2`.
 */
const batchText = (probes: readonly string[]): string =>
  [
    `<p:batch${[...probePrefixes].map(([namespace, prefix]) => ` xmlns:${prefix}="${namespace}"`).join("")}>`,
    ...probes,
    "</p:batch>",
  ].join("\n");

/**
 * One validity error the validator reports: the element it is on, as `{namespace}local`, the
 * attribute it names, as the validator writes it, and its message.
 */
export interface ValidityError {
  readonly attribute: Option.Option<string>;
  readonly element: string;
  readonly message: string;
}

/**
 * What a validity error says, as the oracle reads it.
 *
 * - `attribute-not-allowed`: the element admits no attribute of that name.
 * - `attribute-strict`: a strict attribute wildcard found no global declaration for it.
 * - `attribute-required`: the element lacks an attribute its type requires.
 * - `element-unexpected`: the element may not stand where it does in its parent's content.
 * - `element-strict`: a strict element wildcard found no global declaration for it.
 * - `children-missing`: the element's content ends before its model does.
 * - `character-content`: the element holds text its content type does not admit.
 * - `value`: a value, an identity constraint, `xsi:type` or `xsi:nil`, which the vocabulary's
 *   structure does not decide.
 */
export type ErrorClass =
  | "attribute-not-allowed"
  | "attribute-required"
  | "attribute-strict"
  | "character-content"
  | "children-missing"
  | "element-strict"
  | "element-unexpected"
  | "value";

/**
 * The messages of each structural class, as libxml2 words them.
 */
const classes: readonly (readonly [RegExp, ErrorClass])[] = [
  [/^The attribute '.+' is not allowed\.$/u, "attribute-not-allowed"],
  [/^The attribute '.+' is required but missing\.$/u, "attribute-required"],
  [/demanded by the strict wildcard\.$/u, "attribute-strict"],
  [/^This element is not expected\./u, "element-unexpected"],
  [/^Missing child element\(s\)\./u, "children-missing"],
  [/^Character content (?:other than whitespace )?is not allowed/u, "character-content"],
  [/^Element content is not allowed/u, "character-content"],
];

/**
 * Class a validity error.
 *
 * @param error - The error.
 * @returns Its class; a strict wildcard's refusal of an element is `element-strict`.
 */
export const classOf = (error: ValidityError): ErrorClass => {
  const found = Option.getOrElse(
    Option.map(
      Arr.findFirst(classes, ([pattern]) => pattern.test(error.message)),
      ([, name]) => name,
    ),
    (): ErrorClass => "value",
  );

  return found === "attribute-strict" && Option.isNone(error.attribute) ? "element-strict" : found;
};

/**
 * The shape of libxml2's own validity error, such as a repeated `ID`, after `file:line: `: the
 * element's local name in an `element NAME: ` prefix, which libxml2 2.12 and 2.13 alike write for
 * that domain, then `validity error : ` and the message. A schema validity error the report's
 * reader reads itself (`#pantry/xml/oracle.ts`).
 */
const identityError = /^element (?<local>[^:]+): validity error : (?<message>[\s\S]*)$/u;

/**
 * Read one message of a batch's report as the validity error it states.
 *
 * @param message - The message, an error, as the report's reader read it.
 * @returns The error: a schema message's element and attribute, or the local name an identity
 *   error names; none for any other message, which no probe's validity explains.
 */
const validityErrorOf = (message: XsdMessage): Option.Option<ValidityError> => {
  if (message.source === "schema") {
    return Option.some({
      attribute: message.attribute,
      element: Option.getOrElse(message.element, () => ""),
      message: message.text,
    });
  }

  const groups = identityError.exec(message.text)?.groups;

  return groups === undefined
    ? Option.none()
    : Option.some({
        attribute: Option.none(),
        element: groups["local"] ?? "",
        message: groups["message"] ?? "",
      });
};

/**
 * The number of probes in one batch.
 */
const batchSize = 4000;

/**
 * Give each probe of a batch the validity errors its report's messages state: probe `i` stands on
 * line `i + 2`, so an error is the probe's on the line it names, and a warning judges nothing.
 *
 * @param batch - The batch's path, for a failure's message.
 * @param probes - How many probes the batch holds.
 * @param messages - The batch's messages, as the report's reader read them.
 * @returns Each probe's errors, in probe order; an {@link XmllintUnreadable} for an error on a line
 *   no probe stands on, or one no probe's validity explains.
 */
export const probeErrorsOf = (
  batch: string,
  probes: number,
  messages: readonly XsdMessage[],
): Effect.Effect<readonly (readonly ValidityError[])[], XmllintUnreadable> =>
  Effect.gen(function* attribute() {
    const errors: ValidityError[][] = Array.from({ length: probes }, () => []);
    for (const message of messages.filter(({ level }) => level === "error")) {
      const owner = errors[message.line - 2];
      const error = validityErrorOf(message);

      if (owner === undefined || Option.isNone(error)) {
        return yield* new XmllintUnreadable({
          batch,
          line: `line ${message.line}: ${message.text}`,
        });
      }

      owner.push(error.value);
    }

    return errors;
  });

/**
 * Validate probes against a version's XSDs.
 *
 * Each batch is judged by one `xmllint` run (`xmllintReportOf`, `#pantry/xml/oracle.ts`), whose
 * report reader reads libxml2 2.12's messages and the unprefixed ones 2.13 and later write alike.
 * Probe `i` of a batch stands on its line `i + 2`, so each error is the probe's on the line it
 * names; a warning judges nothing. A batch's report is read from the verdict cache
 * (`#pantry/test/gen/verdict-cache.ts`) when one is kept under the key of everything it depends
 * on, and its run's report is kept there otherwise.
 *
 * @param directory - A scratch directory under the package's `work/`, which this writes the
 *   driver, the catalog and the batches into.
 * @param driver - The version's driver.
 * @param probes - The probes, each one line of XML whose root element is one probe.
 * @returns Each probe's validity errors, in probe order; an {@link XmllintUnreadable} for an error
 *   no probe owns or no probe's validity explains, and the validator's own failure when it does
 *   not run or does not compile the driver.
 */
export const validate = Effect.fn("vocab.xmllint.validate")(function* validate(
  directory: string,
  driver: Driver,
  probes: readonly string[],
) {
  const fs = yield* FileSystem.FileSystem;
  const cache = yield* Effect.orDie(xsdDirectory);
  const chunks = Arr.chunksOf(probes, batchSize);

  const inputs = {
    catalog: catalogText(cache),
    driver: driverText(driver),
    pins: yield* pinDigestsOf(cache),
    xmllint: yield* xmllintVersion(),
  };

  yield* fs.makeDirectory(directory, { recursive: true });
  yield* fs.writeFileString(`${directory}/driver.xsd`, inputs.driver);
  yield* fs.writeFileString(`${directory}/catalog.xml`, inputs.catalog);

  const judged = yield* Effect.forEach(
    chunks,
    (chunk, at) =>
      Effect.gen(function* validateBatch() {
        const batch = `${directory}/batch-${at}.xml`;
        const text = batchText(chunk);

        yield* fs.writeFileString(batch, text);

        const report = yield* cachedReport(
          verdictCacheRoot,
          yield* verdictKey({ ...inputs, batch: text }),
          directory,
          xmllintReportOf({
            catalog: `${directory}/catalog.xml`,
            paths: [batch],
            schema: `${directory}/driver.xsd`,
          }),
        );
        const [verdict] = yield* verdictsOfReport([batch], report);

        return yield* probeErrorsOf(
          batch,
          chunk.length,
          verdict?._tag === "Invalid" ? verdict.messages : [],
        );
      }),
    { concurrency: 4 },
  );

  return judged.flat();
});

/**
 * Where a kind's probe stands: its element itself, which a schema declares globally, or a driver
 * element of the kind's named type.
 */
export type ProbeTarget =
  | { readonly _tag: "global"; readonly local: string; readonly namespace: string }
  | { readonly _tag: "typed"; readonly probe: string };

/**
 * Find where each kind's probe stands in a version, and the driver that declares the typed ones.
 *
 * A kind with a global declaration stands as its element; any other with a declaration of a named
 * type stands as a driver element of that type. A kind declared only locally with a type written
 * in place has no probe, and is left out.
 *
 * @param version - The version.
 * @returns Each kind's target, and the driver.
 */
export const probeTargetsOf = Effect.fn("vocab.xmllint.probeTargetsOf")(function* probeTargetsOf(
  version: SchemaVersion,
) {
  const { documents, entries } = yield* loadWorld(version);
  const globals = new Map<string, ProbeTarget>();
  const typed = new Map<string, { readonly local: string; readonly namespace: string }>();

  for (const [view, document] of documents) {
    for (const declared of yield* Effect.fromResult(declarationsIn(view, document.root))) {
      const kind = yield* Effect.fromResult(
        handleOf(declared.namespace, declared.local, typeNameOf(declared.type)),
      );
      const lexical = attributeOf(declared.declaration, "type");

      if (declared.global) {
        globals.set(kind, { _tag: "global", local: declared.local, namespace: declared.namespace });
      } else if (!typed.has(kind) && Option.isSome(lexical)) {
        const name = yield* Effect.fromResult(resolve(view.schema, lexical.value));

        if (name.namespace !== xsNamespace) {
          typed.set(kind, name);
        }
      }
    }
  }

  const probes = [...typed].filter(([kind]) => !globals.has(kind));
  const targets = new Map<string, ProbeTarget>([
    ...globals,
    ...probes.map(([kind], at): readonly [string, ProbeTarget] => [
      kind,
      { _tag: "typed", probe: `k${at}` },
    ]),
  ]);

  return {
    driver: {
      imports: entries,
      probes: probes.map(([, type], at) => ({ ...type, probe: `k${at}` })),
      version,
    } satisfies Driver,
    targets,
  };
});

/**
 * What a probe writer reads about the vocabulary: each kind's element, each kind's model and
 * required attributes in the probe's version, and the prefix each namespace is written with.
 */
export interface ProbeWorld {
  readonly cost: Cost;
  readonly elementOf: (kind: string) => Option.Option<RosterKind & { readonly namespace: string }>;
  readonly modelOf: (kind: string) => Option.Option<ContentType>;
  readonly prefixOf: (namespace: string) => string;
  readonly requiredOf: (kind: string) => readonly AttributeDeclaration[];
}

/**
 * The cost of a particle's cheapest match, by the kinds' costs: an element particle its least
 * count of its cheapest kind, a wildcard its least count of empty foreign elements, a sequence the
 * sum of its members' and a choice its cheapest alternative's.
 *
 * @param particle - The particle.
 * @param costs - Each kind's cost so far, `Infinity` for one not reached yet.
 * @returns The cost.
 */
const particleCost = (particle: Particle, costs: ReadonlyMap<string, number>): number => {
  const once = Match.valueTags(particle, {
    any: () => 1,
    element: ({ kinds }) =>
      Math.min(...kinds.map((kind) => costs.get(kind) ?? Number.POSITIVE_INFINITY)),
    group: ({ compositor, particles }) => {
      const inner = particles.map((member) => particleCost(member, costs));

      return compositor === "choice"
        ? Math.min(Number.POSITIVE_INFINITY, ...inner)
        : inner.reduce((sum, cost) => sum + cost, 0);
    },
  });

  return particle.occurs.min === 0 ? 0 : once * particle.occurs.min;
};

/**
 * Each kind's cost: how many elements its smallest instance holds, itself included, as the least
 * fixed point of {@link particleCost} over every model: the shortest derivation of a valid tree.
 *
 * @param models - Each kind's model.
 * @returns The costs; a kind no finite tree reaches is left out.
 */
const costsOf = (models: ReadonlyMap<string, ContentType>): ReadonlyMap<string, number> => {
  const costs = new Map<string, number>();

  for (let changed = true; changed;) {
    changed = false;

    for (const [kind, content] of models) {
      const inner =
        content._tag === "element-only" || content._tag === "mixed"
          ? particleCost(content.particle, costs)
          : 0;
      const cost = 1 + inner;

      if (cost < (costs.get(kind) ?? Number.POSITIVE_INFINITY)) {
        costs.set(kind, cost);
        changed = true;
      }
    }
  }

  return costs;
};

/**
 * The probe writer's view of one version of the derived vocabulary, read from the leaves: each
 * kind's element, model and required attributes, and the prefix each namespace is written with.
 *
 * @param version - The version.
 * @param leaves - The leaves' rows.
 * @param leaves.attributes - The attribute declarations.
 * @param leaves.models - The content models.
 * @param leaves.vocabularies - The rosters.
 * @returns The world.
 */
export const probeWorldOf = (
  version: SchemaVersion,
  leaves: {
    readonly attributes: readonly AttributeDeclaration[];
    readonly models: readonly ContentModel[];
    readonly vocabularies: readonly VocabularyRoster[];
  },
): ProbeWorld => {
  const elements = new Map(
    leaves.vocabularies.flatMap(({ kinds, namespace }) =>
      kinds.map((kind) => [kind.handle, { ...kind, namespace }] as const),
    ),
  );
  const models = new Map(
    leaves.models.flatMap((row) =>
      row.versions.includes(version) ? [[row.kind, row.content] as const] : [],
    ),
  );
  const required = Map.groupBy(
    leaves.attributes.filter((row) => row.use === "required" && row.versions.includes(version)),
    (row) => row.kind,
  );

  const costs = costsOf(models);

  return {
    cost: (letter) => (letter._tag === "kind" ? (costs.get(letter.kind) ?? 1) : 1),
    elementOf: (kind) => Option.fromNullishOr(elements.get(kind)),
    modelOf: (kind) => Option.fromNullishOr(models.get(kind)),
    prefixOf: (namespace) => probePrefixes.get(namespace) ?? "unbound",
    requiredOf: (kind) => required.get(kind) ?? [],
  };
};

/**
 * Write the qualified name of a kind's probe root: its element, or the driver element of its type.
 *
 * @param world - The probe world.
 * @param target - Where the probe stands.
 * @returns The name.
 */
export const rootNameOf = (world: ProbeWorld, target: ProbeTarget): string =>
  target._tag === "global"
    ? `${world.prefixOf(target.namespace)}:${target.local}`
    : `p:${target.probe}`;
