/**
 * The bindings the fit laws judge, on the lease: the database's verdict over the small scope of
 * `#pantry/test/binding-cases.ts`, held to the law oracle's (`importAgreesWithOracle`).
 *
 * Lane N2's tier at dadbbbd4 found the `undeclared-response` fixture refused under BindingFit, over
 * the nil declaration's `single` and no base type, where the oracle refuses it under "Binding
 * declared" alone. A declared binding now has its `BindingDeclaration` (or
 * `PlacedBindingDeclaration`) row and an undeclared one none, whose existence law is "Binding
 * declared", and the fit laws read the binding's cardinality row (`#pantry/qti/interactions.ts`;
 * lane NIL's audit, B1 and B2). This suite holds the database to that over every site and state the
 * host guard (`src/test/binding-fit.oracle.test.ts`) exhausts. Under the old sentinel, a binding
 * renamed to an undeclared name, an outcome or a built-in, at a site whose nil or borrowed type its
 * interaction does not fit, refused under BindingFit: the containment into the closed `BindingFit`
 * is a CHECK on the binding's table, which PostgreSQL judges as the row is inserted, before the
 * deferred `declarationRef` that "Binding declared" was.
 *
 * A declaration that writes no cardinality, an empty one, one no cardinality spells or a padded one
 * has no `DeclarationCardinality` row, so its bindings have their declaration rows and no
 * cardinality rows (`#pantry/import/overlays/declarations.ts` `typedDeclarationOf`; spec readings
 * 158 and 159), and AL3 or the value domain refuses it alone, as the oracle names it (the ruling
 * of 2026-11-06). Before,
 * it was held as `single`, which `Declaration`'s own `E1_derived` refused too, and this suite
 * tolerated that rule for those four states; it now holds every state to the oracle alike.
 */
import { NodeServices } from "@effect/platform-node";
import { layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { bindingCase, bindingSites, bindingStates } from "#pantry/test/binding-cases.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { importAgreesWithOracle } from "#pantry/test/oracle-verdict.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * The every-relation package the cases edit.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * Every (site, state) of the scope, by its number.
 */
const cases = bindingSites.flatMap((site) => bindingStates.map((state) => ({ site, state })));

describe.skipIf(!hasLease)("import/binding-fit.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("the fit laws' bindings, judged by PostgreSQL", (it) => {
    it.effect(
      "the database refuses every binding case under a rule the law oracle predicts, or accepts it where the oracle does",
      (ctx) =>
        // Oracle: a second implementation, the law oracle's verdict over the same entries. Bound: every site of binding-cases.ts under every
        // state, exhausted, one import each.
        searched(
          ctx,
          exhaust(
            {
              box: "every binding site of binding-cases.ts under every state, imported",
              caseHang: Duration.seconds(120),
              coverage: noCoverage,
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => {
                const drawn = cases[at];

                return drawn === undefined ? String(at) : `${drawn.site.identifier} ${drawn.state}`;
              },
              oracle: { kind: "second-implementation", name: "the law oracle's verdict" },
              suite: "pantry/binding-fit-db",
            },
            (at) =>
              Effect.gen(function* bindingCaseAgrees() {
                const drawn = cases[at];
                if (drawn === undefined) {
                  return;
                }

                const label = `${drawn.site.kind} ${drawn.site.attribute} ${drawn.state}`;
                const dir = yield* scopedPackage(bindingCase(base, drawn.site, drawn.state));
                yield* importAgreesWithOracle(dir, label);
              }).pipe(Effect.scoped),
          ),
        ),
      3_600_000,
    );
  });
});
