/**
 * Every law of the catalog (`lawTable` of `#pantry/vocab/laws.ts`) is stated somewhere: by a module
 * that names its statements (`namedLaws`), by a package-media install's policy (`mediaLawsByName`
 * of `#pantry/qti/media.ts`, which states nothing for this package's own install, so a probe
 * policy's laws stand for every install's), by a law the importer writes out (`statedLaws`: primary
 * keys, patterns and generated fields, among them the stated limits' bounds), by a part of a
 * statement the oracle states in parts (`statedInParts`), or by a statement grizzle gives its own
 * structure, listed below with why. A law the catalog names that none of these states is a rule the
 * schema does not enforce: the importer accepts what the oracle refuses (decision 441, "AL5
 * attribute count").
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import type { MediaPolicy } from "#pantry/db/install.ts";
import { lawNames } from "#pantry/import/refusal.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import { mediaLawsByName } from "#pantry/qti/media.ts";
import { statedInParts } from "#pantry/test/oracle-laws.ts";
import { namedLaws, statedLaws } from "#pantry/test/law-namer.ts";

/**
 * A package-media install's policy, whose schema states the media laws: `Media data`, `Media
 * foreign`, `Media path`, `Media style` and `Media type`, the last over its extensions. This
 * package's own install has no policy and states none of them, so they are counted as stated where
 * a policy states them.
 */
const probePolicy: MediaPolicy = { media: { svg: "image/svg+xml" } };

/**
 * The laws no module names a statement of, each stated by grizzle's own structure: the statement
 * that holds it carries it without a statement of its own. Each is judged by the oracle and by the
 * database tier.
 *
 * Importer-held laws (a data-ssml attribute's, reading R7-a) and the stated limits are not here:
 * every one is a row of the table that a module names or the importer writes, so it is stated.
 */
const structurallyStated = {
  "AL2 last slot":
    "the attribute family's fold (AL2 fold) ends in `Node.attrs`, which grizzle computes as the fold's end value, the last slot's after-value, so no row can state another",
  "N1 one document node":
    'the tree statement\'s root pin (`nodeTree`, `root: "document"`) admits one document node per document and no other root',
  "N2 mirrors":
    "the tree statement's ordered family (`fin(Node, \"children\")`) holds slots 0 to children - 1, each held, as grizzle's family law",
  "N4 kinds":
    "`Node.kind`, `parentKind` and `version` are `closedId(NodeKind)` and `closedId(SchemaVersion)`, so a roster's closed relation holds every value that column takes and the containment into it is the field's own",
  "N5 first slot":
    "the predecessor copy is `accumulated(..., identity)`: grizzle writes each fold's identity at slot 0 (`was`, `elementsWas`, `attrsWas` and the other folds' was-fields)",
  "N7 empty family":
    "`lastState` is `accumulated(closedId(Position), \"0\")` and every fold's end is its identity over an empty family, as grizzle's fold gives it; N7 last slot holds the non-empty family's",
} as const satisfies Partial<Readonly<Record<LawName, string>>>;

/**
 * Name the laws of the catalog that nothing states.
 *
 * @param stated - The laws something states.
 * @returns The catalog's other laws, in the table's order.
 */
const unstated = (stated: ReadonlySet<string>): readonly LawName[] =>
  lawNames.filter((name) => !stated.has(name));

/**
 * The laws a module or a probe policy names a statement of, the importer writes, or the oracle
 * states a part of.
 *
 * @returns The laws.
 */
const statedByModules = (): ReadonlySet<string> =>
  new Set([
    ...[...namedLaws, mediaLawsByName(Option.some(probePolicy))].flatMap((byName) =>
      Object.entries(byName).flatMap(([name, statements]) => (statements.length > 0 ? [name] : [])),
    ),
    ...statedLaws().map(([, name]) => name),
    ...Object.values(statedInParts).flat(),
  ]);

describe("every law of the catalog is stated somewhere", () => {
  it("is named by a module, written by the importer, a part of a stated law, or listed with why grizzle's structure states it", () => {
    // Oracle: the catalog's own names (`lawTable`), the modules' named statements, and grizzle's
    // laws of `Qti`. Bound: every law of the catalog.
    const stated = statedByModules();

    assert.deepStrictEqual(
      unstated(stated).filter((name) => !Object.hasOwn(structurallyStated, name)),
      [],
      "a law of the catalog no schema module states",
    );

    for (const [name, reason] of Object.entries(structurallyStated)) {
      assert.isFalse(stated.has(name), `${name} is listed as structural and a module states it`);
      assert.isTrue(
        lawNames.some((law) => law === name),
        `${name} is listed and is no law of the catalog`,
      );
      assert.isAbove(reason.length, 0, `${name} is listed without a reason`);
    }
  });

  it("reports a law whose statement is taken away (the AL5 case of decision 441)", () => {
    // Control for the test above: with the statement of "AL5 attribute count" removed, it is the one law
    // left unstated.
    const without = new Set(statedByModules());
    without.delete("AL5 attribute count");

    assert.deepStrictEqual(
      unstated(without).filter((name) => !Object.hasOwn(structurallyStated, name)),
      ["AL5 attribute count"],
    );
  });
});
