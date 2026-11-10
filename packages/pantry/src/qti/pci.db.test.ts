/**
 * Phase 10's PCI laws and fixtures through the importer, on the lease: PostgreSQL the judge, held
 * to the law oracle's verdict on each package (`#pantry/test/oracle-verdict.ts`).
 *
 * The laws: a PCI with neither module form is refused under `pci-module-source`, a custom
 * interaction in a 3.0.0 package under `admission` ("Custom interaction version"), and a 3.0.0
 * PCI reading `QTI_CONTEXT` undeclared under `idref-target` (the rule p10n-4 pinned), each beside
 * an accepted twin. A PCI with two `qti-interaction-modules` children is refused under the
 * content model's rule, the oracle's, and never under `derived` (decision 407's risk).
 *
 * The fixtures: each of phase 10's positives (`pciNames`) is imported, exported and compared with
 * the package it came from, every entry equal; each negative (`pciNegativeNames`) is refused under
 * one of the oracle's rules. The importer names the rule of the first PostgreSQL object that
 * refuses, so only where the oracle's breaches keep one rule is it held to the rules its row of
 * `pciVerdicts` allows (the GEN-A rule, research c92da8fd).
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Formatter, Layer, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materialize, pciNames, pciNegativeNames, pciVerdicts } from "#pantry/test/fixtures.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { importAgreesWithOracle, oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { base, contextPci, edit, item, itemResource, manifestOf } from "#pantry/test/probe.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

/**
 * The folder the positives are exported under, `packages/pantry/work/pci-db`, one scoped folder
 * per export. No other test file writes there.
 */
const exportRoot = path.resolve(import.meta.dirname, "..", "..", "work", "pci-db");

/**
 * The base item's choice interaction, as written, which every law case here replaces.
 */
const choiceInteraction = `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>`;

/**
 * The element form of a PCI's module: one `qti-interaction-modules` child.
 */
const moduleElement = `<qti-interaction-modules><qti-interaction-module id="m" primary-path="m.js"/></qti-interaction-modules>`;

/**
 * A portable custom interaction bound to the base item's response, with its empty markup.
 *
 * @param attribute - Whether it writes the `module` attribute.
 * @param modules - The `qti-interaction-modules` children it writes before its markup.
 * @returns The interaction's text.
 */
const pciOf = (attribute: boolean, modules: number) =>
  `<qti-portable-custom-interaction response-identifier="RESPONSE"${attribute ? ` module="m"` : ""} custom-interaction-type-identifier="t">${moduleElement.repeat(modules)}<qti-interaction-markup/></qti-portable-custom-interaction>`;

/**
 * The files of a package of one item: the base item with its choice interaction replaced and
 * optional declarations before its response declaration, under one schema version.
 *
 * @param version - The `schemaversion` the manifest declares.
 * @param interaction - The text that replaces the choice interaction.
 * @param declarations - Text inserted before the item's response declaration.
 * @returns Each file's text by path.
 */
const itemPackage = (version: string, interaction: string, declarations = "") => ({
  ...base,
  "imsmanifest.xml": manifestOf(itemResource, version),
  "item.xml": edit(
    edit(item, choiceInteraction, interaction),
    "<qti-response-declaration",
    `${declarations}<qti-response-declaration`,
  ),
});

/**
 * Write a package's files, each encoded as UTF-8, into a directory removed when the scope closes.
 *
 * @param files - Each file's text by path.
 * @returns The package's directory.
 */
const written = (files: Readonly<Record<string, string>>) =>
  scopedPackage(
    new Map(Object.entries(files).map(([file, text]) => [file, new TextEncoder().encode(text)])),
  );

/**
 * Import a package the oracle refuses, and hold the importer's refusal to the oracle's: an
 * `ImportRefused` under one of the rules the oracle's breaches keep (its one rule where it finds
 * one breach).
 *
 * @param dir - The package.
 * @param label - Its name, for the assertions' messages.
 * @returns The importer's rule and the oracle's rules.
 */
const refusedAsOracle = (dir: string, label: string) =>
  Effect.gen(function* refusal() {
    const expected = yield* oracleVerdict(yield* readPackage(dir));
    const failure = yield* Effect.flip(importPackage(dir));

    const given =
      failure instanceof ImportRefused
        ? failure.rules[0]
        : assert.fail(`${label} failed with ${failure.message}`);
    const rules = expected.kind === "refused" ? [...expected.rules] : [];

    assert.strictEqual(expected.kind, "refused", `${label}: the oracle accepts it`);
    assert.include(
      rules,
      given,
      `${label}: the importer's ${given}, the oracle's ${rules.join(", ")}`,
    );

    return { given, rules };
  });

/**
 * Import a package the oracle accepts, failing the test when the importer refuses it.
 *
 * @param dir - The package.
 * @param label - Its name, for the assertion's message.
 * @returns The stored package's id.
 */
const acceptedAsOracle = (dir: string, label: string) =>
  Effect.flatMap(importAgreesWithOracle(dir, label), (id) =>
    Option.match(id, {
      onNone: () => assert.fail(`${label} was refused, as the oracle refuses it`),
      onSome: Effect.succeed,
    }),
  );

/**
 * The law cases: a package breaking one PCI law, the rule it is refused under, and its accepted
 * twins, each one edit away.
 */
const lawCases = [
  {
    name: "a PCI with neither module form (PCI module source)",
    refused: itemPackage("3.0.1", pciOf(false, 0)),
    rule: "pci-module-source",
    twins: [itemPackage("3.0.1", pciOf(true, 0))],
  },
  {
    name: "a custom interaction in a 3.0.0 package (Custom interaction version)",
    refused: itemPackage("3.0.0", `<qti-custom-interaction response-identifier="RESPONSE"/>`),
    rule: "admission",
    twins: [itemPackage("3.0.1", `<qti-custom-interaction response-identifier="RESPONSE"/>`)],
  },
  {
    name: "a 3.0.0 PCI reading QTI_CONTEXT undeclared (Idref target)",
    refused: itemPackage("3.0.0", contextPci("QTI_CONTEXT")),
    rule: "idref-target",
    twins: [
      itemPackage("3.0.1", contextPci("QTI_CONTEXT")),
      itemPackage(
        "3.0.0",
        contextPci("QTI_CONTEXT"),
        '<qti-context-declaration identifier="QTI_CONTEXT" cardinality="record"/>',
      ),
    ],
  },
] as const;

describe.skipIf(!hasLease)("pci.db.test.ts, on the lease", { timeout: leaseTestTimeoutMs }, () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
  })("the PCI laws and fixtures through the importer", (it) => {
    for (const { name, refused, rule, twins } of lawCases) {
      it.effect(`refuses ${name} under ${rule}, and accepts its twins`, () =>
        // Oracle: PostgreSQL, the law as the information model states it (§5.106.2 for R10-a,
        // §5.106's 3.0.0 text for R10-b, §7.37 and the 3.0.0 XSD's IDREF for QTI_CONTEXT), with
        // the law oracle's verdict on each package: the refused one under the law's rule, each
        // twin, one edit away, accepted.
        Effect.gen(function* lawCase() {
          const { given } = yield* refusedAsOracle(yield* written(refused), name);

          assert.strictEqual(given, rule, name);

          for (const [at, twin] of twins.entries()) {
            yield* acceptedAsOracle(yield* written(twin), `${name}: twin ${at}`);
          }
        }).pipe(Effect.scoped),
      );
    }

    it.effect(
      "refuses a PCI with two qti-interaction-modules children under the oracle's content rule, never derived",
      () =>
        // Oracle: the law oracle's verdict, the content model's automaton refusing the repeated
        // child (decision 407): a `derived` refusal would be E1's, the database's own account of
        // the rows, and is reported, not accepted.
        Effect.gen(function* twoModules() {
          const label = "a PCI with two qti-interaction-modules children";
          const { given, rules } = yield* refusedAsOracle(
            yield* written(itemPackage("3.0.1", pciOf(false, 2))),
            label,
          );

          assert.notStrictEqual(given, "derived", label);
          assert.notInclude(rules, "derived", label);
          assert.include(["child-set", "ordering"], given, label);

          yield* acceptedAsOracle(yield* written(itemPackage("3.0.1", pciOf(false, 1))), label);
        }).pipe(Effect.scoped),
    );

    for (const name of pciNames) {
      it.effect(`imports ${name}, exports it and compares it equal`, () =>
        // Oracle: PostgreSQL accepts the package whole, as the law oracle does, and `comparePackage`
        // of the package with the files its export wrote finds every entry equal, which reads no
        // database.
        Effect.gen(function* roundTrips() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materialize(name);
          const id = yield* acceptedAsOracle(dir, name);

          yield* fs.makeDirectory(exportRoot, { recursive: true });

          const target = yield* fs.makeTempDirectoryScoped({ directory: exportRoot, prefix: name });

          yield* exportPackage(id, target);

          const report = yield* comparePackage(dir, target);

          assert.isFalse(
            report.some(({ outcome }) => outcome.kind === "differs"),
            `${name}: ${Formatter.format(report)}`,
          );
        }).pipe(Effect.scoped),
      );
    }

    for (const name of pciNegativeNames) {
      const allowed = pciVerdicts.find(([row]) => row === name)?.[1] ?? [];

      it.effect(`refuses ${name} under one of ${allowed.join(", ")}`, () =>
        // Oracle: the law oracle's verdict on the package, and the predicted column of the
        // spec's 4.5 table (`pciVerdicts`) by the GEN-A rule: where the oracle's breaches keep
        // several rules the importer's is one of them, and where they keep one it is one the
        // package's row allows.
        Effect.gen(function* negative() {
          const { given, rules } = yield* refusedAsOracle(yield* materialize(name), name);

          if (rules.length === 1) {
            assert.include(allowed, given, `${name}: the importer's and the oracle's ${given}`);
          }
        }),
      );
    }
  });
});
