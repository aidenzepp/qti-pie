import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar, Kind, Name } from "#pantry/grammar/compose.ts";
import { fixedKinds, foreignKinds, openClasses, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { toyFacets, toyGrammar, toySources, toyVocabulary } from "#pantry/test/gen/grammar.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
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
    "gives every admitted child the content position 0 or a position its family's automaton reaches",
    () =>
      Effect.gen(function* positions() {
        const { admission, content } = yield* grammar;
        const reached = new Set(
          content.follow.rows.map(({ parent, to, version }) => `${version} ${parent} ${to}`),
        );
        const outside = admission.rows.filter(
          ({ parent, position, version }) =>
            position !== "0" && !reached.has(`${version} ${parent} ${position}`),
        );

        assert.deepStrictEqual(outside.slice(0, 10), []);
      }),
    60_000,
  );

  it("builds a toy grammar through the production path", () => {
    const result = toyGrammar([
      toyVocabulary({
        admission: [{ child: "e1", parent: "e0", version: "3.0.1" }],
        attributes: ["id"],
        data: ["ws"],
        facets: toyFacets({}),
        kinds: ["e0", "e1"],
      }),
    ]);

    assert.deepStrictEqual(
      Result.isSuccess(result) ? [...result.success.kinds.nodeKind.handles] : result.failure._tag,
      [...fixedKinds, "ws", "e0", "e1"],
    );
  });

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
 * The attributes the reading-81 property writes on an element, each a named variant: a valid
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

describe("spec reading 81, through the codec", () => {
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
              caseHang: Duration.seconds(30),
              coverage: requiredInSpace<ExtensionVariant | "read" | "refused">([
                ...extensionVariants,
                "read",
                "refused",
              ]),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: Formatter.format,
              suite: "grammar/compose/reading-81",
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
                // Oracle: reading 81 restated: on a covered element an attribute its XSD does not
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
});
