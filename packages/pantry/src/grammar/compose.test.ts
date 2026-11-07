import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element as choice, int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed, layerAttributeNames, vocabularies } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar, Kind, Name } from "#pantry/grammar/compose.ts";
import { foreignKinds, openClasses, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { compositionsOf } from "#pantry/test/compositions.ts";
import { toyFacets, toyGrammar, toySources, toyVocabulary } from "#pantry/test/gen/grammar.ts";
import {
  attributeDeclarations,
  globalAttributes,
  typeAttributeDeclarations,
} from "#pantry/vocab/inventory/attributes.ts";
import type { Domain } from "#pantry/vocab/inventory/types.ts";
import { coveredElements } from "#pantry/vocab/inventory/extensions.ts";
import { asiNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * Whether a handle type kept its literals: `true` for a union of string literals, `false` once it
 * widened to `string`.
 */
type Literal<Handle extends string> = string extends Handle ? false : true;

describe("the composition", () => {
  it("keeps the vocabularies' handles as literal unions, so the XDM's compile-time contracts hold", () => {
    const kindsAreLiteral: Literal<Kind> = true;
    const namesAreLiteral: Literal<Name> = true;

    assert.isTrue(kindsAreLiteral && namesAreLiteral);
  });

  it.effect(
    "composes production's list once per process: every composed() returns the first's result, beside a toy list composed at each of its calls, on every sequence of up to three calls",
    (ctx) =>
      // Oracle: the specification as a count. This file read production's grammar when it loaded,
      // so the process has announced production's list once, and `composed()` composes it no
      // more; a toy list is announced once per `compose` call (`src/test/compositions.ts`).
      searched(
        ctx,
        exhaust(
          {
            box: "every sequence of 1 to 3 calls over composed() and a toy composition",
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<"production after a toy" | "production twice">([
              "production after a toy",
              "production twice",
            ]),
            generator: array(choice(["production", "toy"] as const), { max: 3, min: 1 }),
            limit: 14,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "one composition of production's list per process",
            },
            suite: "grammar/compose/once",
          },
          (calls, c) =>
            Effect.sync(() => {
              const first = composed();
              const toy = [
                toyVocabulary({
                  admission: [],
                  attributes: [],
                  data: ["ws"],
                  facets: toyFacets({}),
                  kinds: ["e0"],
                }),
              ];
              for (const [at, call] of calls.entries()) {
                if (call === "production") {
                  assert.strictEqual(composed(), first, calls.join(", "));
                } else {
                  toyGrammar(toy);
                }

                const sofar = calls.slice(0, at + 1);
                assert.strictEqual(compositionsOf(vocabularies), 1, sofar.join(", "));
                assert.strictEqual(
                  compositionsOf(toy),
                  sofar.filter((step) => step === "toy").length,
                  sofar.join(", "),
                );
              }

              if (calls.join(" ").includes("toy production")) {
                c.note("production after a toy");
              }

              if (calls.filter((step) => step === "production").length > 1) {
                c.note("production twice");
              }
            }),
        ),
      ),
    120_000,
  );

  it.effect(
    "admits XML Schema's xsi: names on every element kind, xsi:nil only on the foreign kinds (audit A6)",
    () =>
      Effect.gen(function* xsi() {
        const { attributes, kinds } = yield* grammar;
        const holders = (name: string) =>
          attributes.admission.rows
            .filter((row) => row.name === name && row.version === "3.0.1")
            .map(({ kind }) => kind);
        const elements = kinds.isElement.rows.map(({ kind }) => kind);

        for (const name of ["xsi:schemaLocation", "xsi:type", "xsi:noNamespaceSchemaLocation"]) {
          assert.deepStrictEqual(new Set(holders(name)), new Set(elements), name);
        }

        assert.deepStrictEqual(new Set(holders("xsi:nil")), new Set(Object.values(foreignKinds)));
      }),
  );

  it.effect("codes the open classes first in AttributeName, 0 to 3", () =>
    Effect.gen(function* openCodes() {
      const { kinds } = yield* grammar;

      assert.deepStrictEqual(
        openClasses.map((name) => kinds.attributeName.codeOf(name)),
        [Option.some(0), Option.some(1), Option.some(2), Option.some(3)],
      );
    }),
  );

  it.effect(
    "types every global attribute the leaf declares as a static name, each coded right after the open classes",
    () =>
      // Oracle: the leaf's `globalAttributes`, read directly: the document layer's static list is
      // exactly its names, and each holds the code the run-time layer gave it, 4 onward.
      Effect.gen(function* layerNames() {
        const { kinds } = yield* grammar;
        const globals = globalAttributes.map(({ name }) => name);

        assert.deepStrictEqual(new Set(layerAttributeNames), new Set(globals));
        assert.deepStrictEqual(
          new Set(
            globals.map((name) => Option.getOrElse(kinds.attributeName.codeOf(name), () => -1)),
          ),
          new Set(globals.map((_, at) => openClasses.length + at)),
        );
      }),
  );

  it("resolves a child a vocabulary admits by a stated triple, beside the children its models admit", () => {
    // Oracle: the specification as a checker: a name resolves under a parent to the kind admitted
    // there, whoever states the admission.
    const result = toyGrammar([
      toyVocabulary({
        admission: [{ child: "e1", parent: "e0", version: "3.0.1" }],
        attributes: [],
        data: ["ws"],
        facets: toyFacets({}),
        kinds: ["e0", "e1"],
      }),
    ]);

    assert.deepStrictEqual(
      result.pipe(
        Result.map(({ kinds }) =>
          [kinds.resolve("urn:toy", "e1", "e0"), kinds.resolve("urn:toy", "e1", "e1")].map(
            (resolved): string => Option.getOrElse(resolved, () => "none"),
          ),
        ),
      ),
      Result.succeed(["e1", "none"]),
    );
  });

  it("admits at a wildcard only the global kinds of the composition at hand, none of a vocabulary it leaves out", () => {
    // Oracle: the specification as a checker: a wildcard admits a global element declaration of
    // the schema set, or an undeclared element as its namespace class's foreign kind (XML Schema
    // Part 1, §3.10.4). A toy composition leaves out every vocabulary that declares production's
    // global elements, so its `##any` wildcard admits the three foreign kinds alone.
    const toy = toyVocabulary({
      admission: [],
      attributes: [],
      data: ["ws", "comment", "pi"],
      facets: toyFacets({}),
      kinds: ["e0"],
    });
    const result = toyGrammar([
      {
        ...toy,
        models: [
          {
            content: {
              _tag: "element-only",
              particle: {
                _tag: "any",
                namespace: "##any",
                occurs: { max: Option.none(), min: 0 },
                processing: "lax",
                sources: toySources(schemaVersions),
              },
            },
            kind: "e0",
            sources: toySources(schemaVersions),
            type: Option.none(),
            versions: schemaVersions,
          },
        ],
      },
    ]);

    assert.deepStrictEqual(
      result.pipe(
        Result.map(
          ({ admission, kinds }) =>
            new Set(
              admission.rows
                .filter(
                  ({ child, parent }) =>
                    parent === "e0" && Option.isSome(kinds.isElement.lookup({ kind: child })),
                )
                .map(({ child }) => child),
            ),
        ),
      ),
      Result.succeed(new Set(Object.values(foreignKinds))),
    );
  });
});

/**
 * The attributes the reading-90 property writes on an element, each a named variant: a valid
 * `data-` name; an undeclared name in no namespace; a name in another namespace; a name in the
 * element's own namespace; `xml:id` and `xml:space`, which `xml.xsd` declares; an `xsi:` name;
 * and ARIA's `aria-keyshortcuts`.
 */
const extensionVariants = [
  "data",
  "undeclared",
  "foreign",
  "own-namespace",
  "xml:id",
  "xml:space",
  "xsi",
  "aria-keyshortcuts",
] as const;

/**
 * An attribute variant of {@link extensionVariants}.
 */
type ExtensionVariant = (typeof extensionVariants)[number];

/**
 * Each variant's attribute as written, its namespace declarations beside it, and the name a kind
 * declares it under when one does.
 */
const writtenAs: Readonly<
  Record<ExtensionVariant, { readonly declared: string; readonly text: string }>
> = {
  "aria-keyshortcuts": { declared: "aria-keyshortcuts", text: 'aria-keyshortcuts="Alt+A"' },
  data: { declared: "", text: 'data-extension="x"' },
  foreign: { declared: "", text: 'xmlns:f="urn:foreign" f:x="x"' },
  "own-namespace": { declared: "", text: `xmlns:o="${asiNamespace}" o:x="x"` },
  undeclared: { declared: "", text: 'foo="x"' },
  "xml:id": { declared: "xml:id", text: 'xml:id="x"' },
  "xml:space": { declared: "xml:space", text: 'xml:space="preserve"' },
  xsi: {
    declared: "",
    text: 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="a.xsd"',
  },
};

/**
 * Find a chain of element kinds from a document root to a kind, each admitted under the one before
 * it in a version, and each a kind with an element name, no foreign kind: the shortest path an
 * element of the kind is reached by.
 *
 * @param production - The composed grammar.
 * @param version - The version.
 * @param kind - The kind.
 * @returns The kinds from the root to it, none when no root reaches it.
 */
const pathTo = (
  production: ComposedGrammar,
  version: SchemaVersion,
  kind: string,
): Option.Option<readonly string[]> => {
  const elements = new Set<string>(production.kinds.elementName.rows.map((row) => row.kind));
  const children = new Map<string, string[]>();
  for (const row of production.admission.rows) {
    if (row.version === version && elements.has(row.child)) {
      children.set(row.parent, [...(children.get(row.parent) ?? []), row.child]);
    }
  }

  const before = new Map<string, string>();
  const pending = [...(children.get("document") ?? [])];
  for (const root of pending) {
    before.set(root, "document");
  }

  for (let at = pending.shift(); at !== undefined; at = pending.shift()) {
    if (at === kind) {
      const chain = [at];
      for (let up = before.get(at); up !== undefined && up !== "document"; up = before.get(up)) {
        chain.unshift(up);
      }

      return Option.some(chain);
    }

    for (const child of children.get(at) ?? []) {
      if (!before.has(child)) {
        before.set(child, at);
        pending.push(child);
      }
    }
  }

  return Option.none();
};

describe("spec reading 90, through the codec", () => {
  it.effect(
    "reads on every covered element exactly its declared names, data-*, xsi: names and aria-keyshortcuts beside aria-keyshorts",
    (ctx) =>
      Effect.gen(function* covered() {
        const production = yield* grammar;
        const shredGrammar = shredGrammarOf(production);
        const names = new Map<string, { readonly local: string; readonly namespace: string }>(
          production.kinds.elementName.rows.map(({ kind, local, namespace }) => [
            kind,
            { local, namespace },
          ]),
        );
        const declared = new Set(
          attributeDeclarations.flatMap(({ kind, name, versions }) =>
            versions.map((version) => `${version} ${kind} ${name}`),
          ),
        );
        // The box: every (version, kind) whose element the Schematron's extension rules of that
        // version cover, read from the leaf by expanded name, that a document root reaches, under
        // every variant.
        const coveredNames = new Set(
          coveredElements.flatMap(({ element, versions }) =>
            versions.map((version) => `${version} {${element.namespace}}${element.local}`),
          ),
        );
        const cases = schemaVersions.flatMap((version) =>
          production.kinds.isElement.rows.flatMap(({ kind }) => {
            const named = names.get(kind);
            const path = pathTo(production, version, kind);

            return named !== undefined &&
              coveredNames.has(`${version} {${named.namespace}}${named.local}`) &&
              Option.isSome(path)
              ? extensionVariants.map((variant) => ({ path: path.value, variant, version }))
              : [];
          }),
        );

        assert.isAbove(cases.length, 2000);

        return yield* searched(
          ctx,
          exhaust(
            {
              box: `every (version, kind) a document root reaches whose element that version's Schematron extension rules cover, under every variant, ${cases.length}`,
              caseHang: Duration.seconds(30),
              coverage: requiredInSpace<ExtensionVariant | "read" | "refused">([
                ...extensionVariants,
                "read",
                "refused",
              ]),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "spec reading 90 restated over the leaf's attribute declarations, with readings 47 and 10",
              },
              suite: "grammar/compose/reading-90",
            },
            (index, c) =>
              Effect.gen(function* readOne() {
                const { path, variant, version } = cases[index] ?? {
                  path: [],
                  variant: "data",
                  version: "3.0.1",
                };
                const kind = path.at(-1) ?? "";
                // Each element declares its own namespace as the default, so a path through another
                // vocabulary's elements (`xi:include`, MathML) names each in its namespace.
                const steps = path.map((step) => names.get(step) ?? { local: step, namespace: "" });
                const target = steps.at(-1)?.local ?? "";
                const opening = steps
                  .map(
                    ({ local, namespace }, at) =>
                      `<${local} xmlns="${namespace}"${at === steps.length - 1 ? ` ${writtenAs[variant].text}` : ""}>`,
                  )
                  .join("");
                const closing = steps
                  .toReversed()
                  .map(({ local }) => `</${local}>`)
                  .join("");
                const document = yield* Effect.orDie(
                  readXml(new TextEncoder().encode(`${opening}${closing}`)),
                );
                const outcome = yield* shred(document, version, shredGrammar).pipe(Effect.result);
                // Oracle: reading 90 restated: on a covered element an attribute its XSD does not
                // declare is read only when it is a `data-` name in no namespace or an `xsi:`
                // name (reading 47), and reading 10 adds `aria-keyshortcuts` wherever the XSD
                // declares `aria-keyshorts`; every covered element holds a `##any` `lax`
                // wildcard, so a `data-` name is in its namespace constraint.
                const { declared: name } = writtenAs[variant];
                const read =
                  variant === "data" ||
                  variant === "xsi" ||
                  (name !== "" && declared.has(`${version} ${kind} ${name}`)) ||
                  (variant === "aria-keyshortcuts" &&
                    declared.has(`${version} ${kind} aria-keyshorts`));
                c.note(variant);
                c.note(read ? "read" : "refused");

                assert.strictEqual(
                  Result.isSuccess(outcome),
                  read,
                  `${version} ${target} with ${writtenAs[variant].text}: ${Result.isFailure(outcome) ? outcome.failure.message : "read"}`,
                );
              }),
          ),
        );
      }),
    300_000,
  );

  it.effect(
    "holds data-* to exactly the kinds whose element the extension rules cover, in each schema version (a kind per context variant of an element)",
    () =>
      // Oracle: `coveredElements` (the Schematron's extension rules, reading 90) read against the
      // composed grammar's own admissions: Revision 2.1 admitted `data-*` on the extension hosts, 126
      // elements in 3.0.0 and 127 in 3.0.1. Both sides are sets of kinds, compared as sets; a
      // difference is the operator's open question O5, to be reported, never asserted away.
      Effect.gen(function* hosts() {
        const { attributes, kinds } = yield* grammar;
        const coveredNames = new Map(
          coveredElements.map(({ element, versions }) => [
            `{${element.namespace}}${element.local}`,
            new Set<string>(versions),
          ]),
        );

        for (const version of schemaVersions) {
          const admitting = new Set(
            attributes.admission.rows
              .filter((row) => row.name === "data-*" && row.version === version)
              .map(({ kind }) => kind),
          );
          const listed = new Set(
            kinds.elementName.rows
              .filter(
                ({ local, namespace }) =>
                  coveredNames.get(`{${namespace}}${local}`)?.has(version) === true,
              )
              .map(({ kind }) => kind),
          );
          yield* Effect.logInfo(`${version}: admitting ${admitting.size}, covered ${listed.size}`);

          assert.deepStrictEqual(
            [...admitting].toSorted(),
            [...listed].toSorted(),
            `data-* hosts in ${version}`,
          );
        }
      }),
  );
});

/**
 * Whether a leaf definition is or is derived from `xs:ID`: atomic, with the built-in `ID`.
 *
 * @param domain - The leaf definition.
 * @returns Whether it is an ID type.
 */
const isId = (domain: Domain): boolean => domain._tag === "atomic" && domain.builtin === "ID";

/**
 * Each (version, host)'s declared attributes as the leaf states them: a kind's by its handle, a
 * governing type's by its `TypeName` handle, each name with whether its type is an ID.
 */
const declaredUses: ReadonlyMap<string, ReadonlyMap<string, boolean>> = (() => {
  const uses = new Map<string, Map<string, boolean>>();
  const note = (host: string, versions: readonly string[], name: string, domain: Domain) => {
    for (const version of versions) {
      const at = `${version} ${host}`;
      uses.set(at, (uses.get(at) ?? new Map<string, boolean>()).set(name, isId(domain)));
    }
  };
  for (const { domain, kind, name, versions } of attributeDeclarations) {
    note(kind, versions, name, domain);
  }

  for (const { domain, name, owner, versions } of typeAttributeDeclarations) {
    note(owner, versions, name, domain);
  }

  return uses;
})();

describe("spec reading 109, wild IDs", () => {
  it.effect(
    "admit no wild xml:id on a kind or governor whose declared uses include an ID-derived one, and keep it on every other: every admitted (version, kind) and (version, governor)",
    (ctx) =>
      // Oracle: XML Schema 1.0 Part 1, §3.4.4, Element Locally Valid (Complex Type), clause 5.2,
      // over the leaf's own declarations (`attributeDeclarations`, `typeAttributeDeclarations`):
      // an `xml:id` the host does not declare is a wild ID where its type is `xml.xsd`'s `xs:ID`,
      // and it stands on no host that declares an ID-derived use. The same declarations say where
      // the reading bars it, so a host that declares none keeps every `xml:id` its wildcard gave it
      // before the reading, which the measured before/after diff of the slice's report counts.
      // Bound: every (version, kind) the attribute grammar admits a name on, and every (version,
      // governor), in both versions.
      Effect.gen(function* wildIds() {
        const { attributes } = yield* Effect.fromResult(composed());
        const hosts = [
          ...Map.groupBy(
            attributes.admission.rows,
            ({ kind, version }): string => `${version} ${kind}`,
          ),
          ...Map.groupBy(
            attributes.governed.rows,
            ({ governor, version }): string => `${version} ${governor}`,
          ),
        ];
        const typeOf = new Map<string, string>(
          attributes.governor.rows.map(
            ({ governor, governs, version }) =>
              [`${version} ${governor}`, `${version} ${governs}`] as const,
          ),
        );

        return yield* searched(
          ctx,
          exhaust(
            {
              box: `every admitted (version, kind) and (version, governor), ${hosts.length}`,
              caseHang: Duration.minutes(1),
              coverage: requiredInSpace<"declares an ID" | "declares no ID">([
                "declares an ID",
                "declares no ID",
              ]),
              generator: int(0, hosts.length - 1),
              limit: hosts.length,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "XML Schema 1.0 Part 1, §3.4.4 clause 5.2, over the leaf's declarations",
              },
              suite: "grammar/compose/wild-ids",
            },
            (index, c) =>
              Effect.sync(() => {
                const [at, rows] = hosts[index] ?? ["", []];
                const uses = declaredUses.get(typeOf.get(at) ?? at) ?? new Map<string, boolean>();
                const declaresId = [...uses.values()].some(Boolean);
                c.note(declaresId ? "declares an ID" : "declares no ID");

                const wild = rows.filter(
                  ({ domain, name }) =>
                    name === "xml:id" &&
                    !uses.has(name) &&
                    attributes.identity
                      .lookup({ domain })
                      .pipe(Option.exists(({ identity }) => identity === "ID")),
                );

                assert.deepStrictEqual(declaresId ? wild.map(({ name }) => name) : [], [], at);
              }),
          ),
        );
      }),
    120_000,
  );
});
