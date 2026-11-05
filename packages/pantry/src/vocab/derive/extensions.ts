/**
 * The extension-rules deriver: it reads the Schematron that both ASI XSDs embed and prints the
 * leaf `src/vocab/inventory/extensions.ts`, the elements whose extension attributes the
 * Schematron's data-extension rule sets constrain, per schema version (spec reading 81).
 *
 * Run it from `packages/pantry` as `node src/vocab/derive/extensions.ts`; it reads only the two ASI
 * XSDs `sources.ts` pins, touches no database, and imports nothing that reads the leaves:
 *
 * ```sh
 * node src/vocab/derive/extensions.ts > src/vocab/inventory/extensions.ts
 * pnpm exec vp fmt src/vocab/inventory/extensions.ts
 * ```
 *
 * `extensions.test.ts` beside it checks that a re-run reproduces the leaf byte for byte.
 *
 * Reading rules:
 *
 * - The rule sets are the `sch:pattern` elements whose `id` is one of {@link extensionPatterns},
 *   wherever they stand in the schema's annotations; every other pattern constrains something else
 *   and is not read.
 * - A rule's element is its `context`, which each of those rules writes `//<prefix>:<local>`: the
 *   prefix is resolved through the schema's `sch:ns` declarations, so the element is an expanded
 *   name. A context of any other shape, or a prefix no `sch:ns` declares, is refused.
 * - Only the element is read. Which attributes a rule's assertions list, and how many positions they
 *   test, is the text spec reading 81 sets aside: the XSD's own declarations say which attributes
 *   an element declares.
 * - An element two rules of one version name (both ASI XSDs state `qti-rubric-block` and
 *   `qti-template-inline` twice) is one row, sourced to its first rule.
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Console, Effect, Layer, Option, Result } from "effect";
import { Command } from "effect/cli";
import { Digest } from "effect/crypto";
import type { Element } from "@qti-pie/crust/tree.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { refuse } from "#pantry/vocab/derive/derive.ts";
import type { XsdReadingError } from "#pantry/vocab/derive/derive.ts";
import { readPlaced } from "#pantry/vocab/derive/sources.ts";
import type { Placed, SourcePath } from "#pantry/vocab/derive/sources.ts";
import { vocabularyNamespaces } from "#pantry/vocab/namespaces.ts";

/**
 * The Schematron namespace (ISO/IEC 19757-3), which the ASI XSDs bind to `sch`.
 */
export const schematronNamespace = "http://purl.oclc.org/dsdl/schematron";

/**
 * The ids of the Schematron rule sets that constrain extension attributes: the ASI binding's §5.2,
 * "The Constrained Namespace Extension Rule Definitions", for root, global and local elements.
 */
export const extensionPatterns = [
  "RULESET_ROOTELEMENT_DATAEXTENSIONRULES",
  "RULESET_GLOBALELEMENT_DATAEXTENSIONRULES",
  "RULESET_LOCALELEMENT_DATAEXTENSIONRULES",
] as const;

/**
 * The ASI XSD each schema version embeds its Schematron in.
 */
export const extensionSources: Readonly<Record<SchemaVersion, SourcePath>> = {
  "3.0.0": "imsqti_asiv3p0_v1p0.xsd",
  "3.0.1": "imsqti_asiv3p0p1_v1p0.xsd",
};

/**
 * One element a version's extension rules cover: its namespace and local name, and the line of the
 * first rule that names it in that version's ASI XSD.
 */
export interface CoveredRule {
  readonly line: number;
  readonly local: string;
  readonly namespace: string;
  readonly version: SchemaVersion;
}

/**
 * The context every extension rule writes: the descendant step `//`, a prefix and a local name.
 */
const contextForm = /^\/\/(?<prefix>[A-Za-z_][\w.-]*):(?<local>[A-Za-z_][\w.-]*)$/u;

/**
 * Name the vocabulary whose namespace a namespace name is.
 *
 * @param namespace - The namespace name.
 * @returns The vocabulary's name, or none for the namespace of no vocabulary.
 */
const vocabularyOf = (namespace: string): Option.Option<string> =>
  Option.map(
    Option.fromNullishOr(
      Object.entries(vocabularyNamespaces).find(([, held]) => held.namespace === namespace),
    ),
    ([name]) => name,
  );

/**
 * List an element and every element below it, in document order, the order {@link Placed}'s lines
 * are in.
 *
 * @param node - The element.
 * @returns It, then its descendants depth first.
 */
const inDocumentOrder = (node: Element): readonly Element[] => [
  node,
  ...node.children.flatMap((child) => (child.kind === "element" ? inDocumentOrder(child) : [])),
];

/**
 * Read an attribute in no namespace.
 *
 * @param node - The element.
 * @param local - The attribute's local name.
 * @returns Its value, or none when the element does not carry it.
 */
const attributeOf = (node: Element, local: string): Option.Option<string> =>
  Option.map(
    Option.fromNullishOr(
      node.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local),
    ),
    ({ value }) => value,
  );

/**
 * Read the elements one version's extension rules cover, each once, in the order the rules first
 * name them.
 *
 * @param version - The version.
 * @param placed - Its ASI XSD, read with its start-tag lines.
 * @returns The covered elements, or an {@link XsdReadingError} for a rule whose context is not
 *   `//<prefix>:<local>`, a prefix no `sch:ns` declares or one bound to the namespace of no
 *   vocabulary, or a tree and file that hold different numbers of elements.
 */
export const coveredIn = (
  version: SchemaVersion,
  placed: Placed,
): Result.Result<readonly CoveredRule[], XsdReadingError> =>
  Result.gen(function* coveredInBody() {
    const elements = inDocumentOrder(placed.document.root);
    if (elements.length !== placed.lines.length) {
      return yield* refuse(
        `${placed.file} holds ${elements.length} elements in its tree but ${placed.lines.length} start tags`,
      );
    }

    const schematron = elements.flatMap((node, at) =>
      node.namespace === schematronNamespace ? [{ at, node }] : [],
    );
    const prefixes = new Map(
      schematron.flatMap(({ node }) =>
        node.local === "ns"
          ? Option.toArray(Option.all([attributeOf(node, "prefix"), attributeOf(node, "uri")]))
          : [],
      ),
    );
    const patterns = new Set<string>(extensionPatterns);
    const rules = schematron.flatMap(({ node }) =>
      node.local === "pattern" && Option.exists(attributeOf(node, "id"), (id) => patterns.has(id))
        ? node.children.flatMap((child) =>
            child.kind === "element" &&
            child.namespace === schematronNamespace &&
            child.local === "rule"
              ? [child]
              : [],
          )
        : [],
    );
    const lineOf = new Map(elements.map((node, at) => [node, placed.lines[at] ?? 0] as const));
    const covered = new Map<string, CoveredRule>();
    for (const rule of rules) {
      const context = Option.getOrElse(attributeOf(rule, "context"), () => "");
      const groups = contextForm.exec(context)?.groups;
      const prefix = groups?.["prefix"];
      const local = groups?.["local"];
      if (prefix === undefined || local === undefined) {
        return yield* refuse(
          `a data-extension rule of ${placed.file} has the context "${context}", which is not //<prefix>:<local>`,
        );
      }

      const namespace = prefixes.get(prefix);
      if (namespace === undefined) {
        return yield* refuse(
          `a data-extension rule of ${placed.file} names the prefix ${prefix}, which no sch:ns declares`,
        );
      }

      if (Option.isNone(vocabularyOf(namespace))) {
        return yield* refuse(
          `a data-extension rule of ${placed.file} names an element in ${namespace}, the namespace of no vocabulary`,
        );
      }

      const key = `{${namespace}}${local}`;
      if (!covered.has(key)) {
        covered.set(key, { line: lineOf.get(rule) ?? 0, local, namespace, version });
      }
    }

    return [...covered.values()];
  });

/**
 * Read both versions' covered elements from the pinned ASI XSDs.
 *
 * @returns The covered elements of 3.0.0, then of 3.0.1.
 */
export const loadCovered = Effect.fn("vocab.loadCovered")(function* loadCovered() {
  const read: CoveredRule[] = [];
  for (const version of schemaVersions) {
    const placed = yield* readPlaced(extensionSources[version]);
    read.push(...(yield* Effect.fromResult(coveredIn(version, placed))));
  }

  return read;
});

/**
 * Write a JSDoc comment; `vp fmt` wraps its lines.
 *
 * @param paragraphs - Each paragraph as its lines.
 * @returns The comment's lines.
 */
const commentOf = (paragraphs: readonly (readonly string[])[]): readonly string[] => [
  "/**",
  ...paragraphs.flatMap((lines, index) => [
    ...(index === 0 ? [] : [" *"]),
    ...lines.map((line) => ` * ${line}`),
  ]),
  " */",
];

/**
 * Write a line number as the leaf writes it: as it is below 10,000, and with `_` between each
 * group of three digits from there, as the lint's `numeric-separators-style` asks.
 *
 * @param line - The line.
 * @returns The numeral.
 */
const numeralOf = (line: number): string =>
  line < 10_000 ? String(line) : String(line).replaceAll(/\B(?=(?:\d{3})+$)/gu, "_");

/**
 * Name the leaf's constant for a namespace: its vocabulary's name and `Namespace`.
 *
 * @param namespace - The namespace name, which {@link coveredIn} has checked is a vocabulary's.
 * @returns The constant's name.
 */
const constantOf = (namespace: string): string =>
  `${Option.getOrElse(vocabularyOf(namespace), () => "unknown")}Namespace`;

/**
 * Name the leaf's constant for a version's ASI XSD.
 *
 * @param version - The version.
 * @returns The constant's name.
 */
const fileConstant = (version: SchemaVersion): string =>
  version === "3.0.0" ? "asi3p0" : "asi3p0p1";

/**
 * Print the leaf: every covered element once, by its expanded name, with the versions whose rules
 * cover it and the line of each version's first rule, in the order 3.0.0's rules name them, 3.0.1's
 * new ones after.
 *
 * @param covered - The covered elements of both versions.
 * @returns The leaf's text, unformatted.
 */
export const renderExtensions = (covered: readonly CoveredRule[]): string => {
  const rows = Map.groupBy(covered, ({ local, namespace }) => `{${namespace}}${local}`);
  const counts = schemaVersions.map(
    (version) => `${String(covered.filter((row) => row.version === version).length)} in ${version}`,
  );
  const namespaces = [...new Set(covered.map(({ namespace }) => namespace))];

  return [
    ...commentOf([
      [
        `The elements whose extension attributes the Schematron both ASI XSDs embed constrains, ${counts.join(" and ")}: each one the context of a rule of the ${extensionPatterns.join(", ")} patterns names, by its expanded name, with the versions whose rules name it and the line of each version's first such rule.`,
      ],
      [
        "On these elements spec reading 81 admits no undeclared attribute but a `data-` one, `xsi:` names and reading 10's `aria-keyshortcuts` apart. The rules' assertions are not read: the XSDs' own declarations say which attributes each element declares.",
      ],
      [
        "Generated by `node src/vocab/derive/extensions.ts` and formatted with `vp fmt`; `src/vocab/derive/extensions.test.ts` checks that a re-run reproduces this file byte for byte.",
      ],
    ]),
    'import type { SchemaVersion } from "#pantry/grammar/kinds.ts";',
    'import type { SourcePath } from "#pantry/vocab/derive/sources.ts";',
    'import type { ExpandedName, Source, Sources } from "#pantry/vocab/inventory/types.ts";',
    "",
    ...commentOf([
      [
        "One element the extension rules cover: its expanded name, the schema versions whose rules name it, and the rule that first names it in each, aligned with its versions.",
      ],
    ]),
    "export interface CoveredElement {",
    "  readonly element: ExpandedName;",
    "  readonly sources: Sources;",
    "  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];",
    "}",
    "",
    ...commentOf([
      ["Where a pinned XSD states a rule."],
      [
        "@param file - The pinned file.",
        "@param line - The line its start tag begins on.",
        "@returns The source.",
      ],
    ]),
    'const xsd = (file: SourcePath, line: number): Source => ({ _tag: "xsd", file, line });',
    "",
    ...schemaVersions.flatMap((version) => [
      ...commentOf([[`The pinned \`${extensionSources[version]}\`.`]]),
      `const ${fileConstant(version)}: SourcePath = ${JSON.stringify(extensionSources[version])};`,
      "",
    ]),
    ...namespaces.flatMap((namespace) => [
      ...commentOf([
        [
          `The namespace of the \`${Option.getOrElse(vocabularyOf(namespace), () => "")}\` vocabulary.`,
        ],
      ]),
      `const ${constantOf(namespace)} = ${JSON.stringify(namespace)};`,
      "",
    ]),
    ...commentOf([["Every covered element, in the order the rules first name it."]]),
    "export const coveredElements: readonly CoveredElement[] = [",
    ...[...rows.values()].map((held) => {
      const [first] = held;
      const versions = held.map(({ version }) => JSON.stringify(version)).join(", ");
      const sources = held
        .map(({ line, version }) => `xsd(${fileConstant(version)}, ${numeralOf(line)})`)
        .join(", ");

      return `  { element: { local: ${JSON.stringify(first?.local ?? "")}, namespace: ${constantOf(first?.namespace ?? "")} }, sources: [${sources}], versions: [${versions}] },`;
    }),
    "];",
    "",
  ].join("\n");
};

/**
 * The command line: `extensions` prints the leaf to standard output.
 */
const command = Command.make(
  "extensions",
  {},
  Effect.fn("vocab.deriveExtensionsCommand")(function* deriveExtensionsCommand() {
    yield* Console.log(renderExtensions(yield* loadCovered()));
  }),
).pipe(
  Command.withDescription(
    "Print the extension-rules leaf, read from the pinned ASI XSDs in ~/.cache/gr8des/qti3/xsd.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)),
    ),
  );
}
