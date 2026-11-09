/**
 * A selection whose `select` names no integer, refused on the lease by the laws that state
 * `select`'s lexical form: PostgreSQL the judge, grizzle's outcome the name.
 *
 * The builder (`#pantry/import/overlays/tests.ts` `selectionsOf`) writes a selection's row whatever
 * its `select` holds, split around its collapsed value as written. Two laws state that the form
 * names an integer: `SelectForm`'s pattern law, `lexical(bigint)` of `#pantry/qti/tests.ts`, which
 * the column's domain holds as the statement casts the form into it, before any row CHECK and
 * before PostgreSQL computes `select` from it; and the `select` attribute's value domain, xs:int's
 * lexical space (`Attribute`'s `value_domain` CHECK). The first case writes each form alone into a
 * lawful package's rows, split as the builder splits it, so the domain is the only law it breaks
 * and the outcome names it alone. The second imports the fixture that writes `select="2.5"`
 * (`select-not-integer`), which breaks both, and PostgreSQL reports whichever its statements reach
 * first.
 */
import { Db, lawsOf, sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Formatter, Layer, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { piecesOf } from "#pantry/import/overlays/tests.ts";
import { readProgram } from "#pantry/import/program.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { Qti } from "#pantry/qti/own.ts";
import { Author, AuthorApp } from "#pantry/qti/own-login.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * `SectionSelection.selectForm`'s pattern law, as grizzle's `lawsOf` lists it and its installation
 * lists it beside the domain's CHECK.
 */
const selectFormLaw = Arr.findFirst(
  lawsOf(Qti),
  (stated) =>
    stated.kind === "pattern" &&
    stated.relation === "SectionSelection" &&
    stated.field === "selectForm",
).pipe(Option.getOrThrowWith(() => new Error("SectionSelection.selectForm states no pattern law")));

/**
 * Whether a law is the `select` attribute's value domain: `Attribute`'s `value_domain` CHECK,
 * which judges every attribute's lexical form by its type.
 *
 * @param law - The law.
 * @returns Whether it is.
 */
const isValueDomain = (law: Law): boolean =>
  law.kind === "check" && law.relation === "Attribute" && law.name === "value_domain";

/**
 * Selects that name no integer, each a form the builder once wrote no row for: a decimal, a word,
 * two integers collapse keeps apart, and whitespace alone, whose form is empty.
 */
const forms = ["2.5", "two", "1 2", " "] as const;

/**
 * A package's inputs with every selection's `select` written as a form, split as the builder
 * splits it (`piecesOf`), so `lead ‖ form ‖ trail = lexical` holds and no other row changes.
 *
 * @param inputs - The package's inputs.
 * @param lexical - The `select` as written.
 * @returns The inputs, each selection's row holding the form.
 */
const withSelect = (inputs: PackageInputs, lexical: string): PackageInputs => {
  const pieces = piecesOf(lexical);

  return {
    ...inputs,
    SectionSelection: new Map(
      [...inputs.SectionSelection].map(([node, row]) => [
        node,
        {
          ...row,
          selectForm: pieces.value,
          selectLead: pieces.lead,
          selectLexical: lexical,
          selectTrail: pieces.trail,
        },
      ]),
    ),
  };
};

describe.skipIf(!hasLease)("import/overlays/select-forms.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("a select that names no integer, judged by PostgreSQL", (it) => {
    for (const form of forms) {
      it.effect(
        `refuses a selection's row whose select is ${JSON.stringify(form)} by SelectForm's pattern law alone`,
        () =>
          // Oracle: PostgreSQL, `SectionSelection.select_form`'s domain CHECK as the statement
          // casts the form, and grizzle's `patternLawsOf`, the field's law its installation lists
          // with that CHECK. Bound: the every-relation package, which PostgreSQL accepts whole
          // (`#pantry/import/pattern-laws.db.test.ts`), its one selection's row holding the form.
          Effect.gen(function* ownLaw() {
            const dir = yield* scopedPackage(
              everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 }),
            );
            const program = yield* readProgram(dir);
            assert.isAbove(
              program.inputs.SectionSelection.size,
              0,
              "the package holds a selection",
            );

            const db = yield* Db.open(AuthorApp.roles.author, {});
            const outcome = yield* db.apply(
              changeSetOf(Author, withSelect(program.inputs, form)),
              {},
            );

            assert.isTrue(
              outcome.kind === "invariant-rejected" &&
                outcome.refused.laws.length === 1 &&
                outcome.refused.laws.every((refused) => sameLaw(refused, selectFormLaw)),
              Formatter.format(outcome),
            );
          }).pipe(Effect.scoped),
        leaseTestTimeoutMs,
      );
    }

    it.effect(
      "writes select-not-integer's selection as written, and refuses the package by a law of select's lexical form",
      () =>
        // Oracle: PostgreSQL, the two laws that state `select`'s lexical form, SelectForm's
        // pattern law and the attribute's value domain, whichever the statements reach first; the
        // fixture's one edit, `select="+2"` to `select="2.5"` (`#pantry/test/fixtures.ts`), breaks
        // no other. Bound: the fixture, its two selections, `2` and `2.5`.
        Effect.gen(function* sameInput() {
          const program = yield* readProgram(yield* materialize("select-not-integer"));
          assert.isTrue(
            [...program.inputs.SectionSelection.values()].some(
              ({ selectForm, selectLexical }) => selectForm === "2.5" && selectLexical === "2.5",
            ),
            "the builder writes the selection whose select is 2.5",
          );

          const db = yield* Db.open(AuthorApp.roles.author, {});
          const outcome = yield* db.apply(changeSetOf(Author, program.inputs), {});

          assert.isTrue(
            outcome.kind === "invariant-rejected" &&
              outcome.refused.laws.length > 0 &&
              outcome.refused.laws.every(
                (refused) => sameLaw(refused, selectFormLaw) || isValueDomain(refused),
              ),
            Formatter.format(outcome),
          );
        }),
      leaseTestTimeoutMs,
    );
  });
});
