import { Db, query, v } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { AttributeAdmission } from "#pantry/schema/attributes.ts";
import { Admission } from "#pantry/schema/node.ts";
import type { AttributeNameHandle } from "#pantry/schema/node.ts";
import {
  OperatorArity,
  OperatorArityMax,
  OperatorArityUnbounded,
} from "#pantry/schema/processing.ts";
import { Author } from "#pantry/schema/roles.ts";
import {
  operatorArity,
  operatorArityMax,
  operatorArityUnbounded,
} from "#pantry/schema/seed/operator-arity.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The 20 expression kinds outside `NumericLogic1toManyDType`'s choice, so the 44 others are the
 * children of `qti-sum` (the spec's 3.3 table A).
 */
const nonNumeric = new Set([
  "qti-and",
  "qti-any-n",
  "qti-contains",
  "qti-duration-gte",
  "qti-duration-lt",
  "qti-equal",
  "qti-equal-rounded",
  "qti-gt",
  "qti-gte",
  "qti-inside",
  "qti-is-null",
  "qti-lt",
  "qti-lte",
  "qti-match",
  "qti-member",
  "qti-not",
  "qti-or",
  "qti-pattern-match",
  "qti-string-match",
  "qti-substring",
]);

const generic = ["ws", "comment", "pi"];

const mixed = ["text", "ws", "entityRef", "comment", "pi"];

/**
 * The 64 expression kinds and 25 rule kinds of the M3 roster, by `asi.ts`'s named rosters
 * `expressionKinds` and `ruleKinds`, never by position in `asi.kinds`, whose order other
 * modules' kinds interleave.
 */
const expressions = asi.expressionKinds;

const rules = asi.ruleKinds;

/**
 * The 25 attribute names of the spec's 3.9 that the M0 roster does not hold, then the 5 of
 * `xi:include` that `kinds/xi.ts` introduces: the 30 labels this phase appends to `AttributeName`.
 */
const attributeNames: readonly AttributeNameHandle[] = [
  "min",
  "max",
  "class",
  "definition",
  "tolerance-mode",
  "tolerance",
  "include-lower-bound",
  "include-upper-bound",
  "rounding-mode",
  "figures",
  "n",
  "shape",
  "coords",
  "name",
  "section-identifier",
  "include-category",
  "exclude-category",
  "outcome-identifier",
  "weight-identifier",
  "pattern",
  "step",
  "number-repeats",
  "case-sensitive",
  "substring",
  "variable-identifier",
  "parse",
  "xpointer",
  "encoding",
  "accept",
  "accept-language",
];

const admissionRows = query(Author).rule((r) => {
  const { child, parent, version } = v(Admission);

  return r.match(Admission, { child, parent, version }).find({ child, parent, version });
});

const arityRows = query(Author).rule((r) => {
  const { kind, min } = v(OperatorArity);

  return r.match(OperatorArity, { kind, min }).find({ kind, min });
});

const arityMaxRows = query(Author).rule((r) => {
  const { kind, max } = v(OperatorArityMax);

  return r.match(OperatorArityMax, { kind, max }).find({ kind, max });
});

const arityUnboundedRows = query(Author).rule((r) => {
  const { kind } = v(OperatorArityUnbounded);

  return r.match(OperatorArityUnbounded, { kind }).find({ kind });
});

const attributeAdmissionRows = query(Author).rule((r) => {
  const { attribute } = v(AttributeAdmission);

  return r.match(AttributeAdmission, { attribute }).find({ attribute });
});

const keyOf = (row: {
  readonly child: string;
  readonly parent: string;
  readonly version: string;
}) => `${row.version} ${row.parent} ${row.child}`;

/**
 * The children `parent` has under `version`, sorted.
 */
const childrenOf = (
  rows: readonly { readonly child: string; readonly parent: string; readonly version: string }[],
  parent: string,
) =>
  rows
    .filter((row) => row.parent === parent && row.version === "3.0.0")
    .map((row) => row.child)
    .toSorted();

describe.skipIf(!hasLease)(
  "db/processing-layer.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "60 seconds",
    })("the processing arms installed on the lease", (it) => {
      it.effect(
        "admits under qti-sum, qti-correct and qti-base-value the sets asi.test.ts names",
        () =>
          Effect.gen(function* admitsTheNamedSets() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const rows = yield* (yield* db.execute(admissionRows, {})).collect;
            const numeric = expressions.filter((kind) => !nonNumeric.has(kind));

            assert.strictEqual(expressions.length, 64);
            assert.strictEqual(numeric.length, 44);
            assert.deepStrictEqual(
              childrenOf(rows, "qti-sum"),
              [...numeric, ...generic].toSorted(),
            );
            assert.deepStrictEqual(childrenOf(rows, "qti-correct"), ["comment", "pi"]);
            assert.deepStrictEqual(childrenOf(rows, "qti-base-value"), mixed.toSorted());
          }),
      );

      it.effect(
        "holds 4,048 rows per version under the M3 hosts, the very rows the kinds files name",
        () =>
          Effect.gen(function* holdsTheHostRows() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const rows = yield* (yield* db.execute(admissionRows, {})).collect;
            const processingHosts = new Set<string>([
              ...expressions,
              ...rules,
              "qti-response-processing",
            ]);
            const expected = [
              ...asi.admission.filter(
                (row) =>
                  (processingHosts.has(row.parent) &&
                    !(row.parent === "qti-response-processing" && generic.includes(row.child))) ||
                  (row.parent === "qti-assessment-item" && row.child === "qti-template-processing"),
              ),
              ...xi.admission,
            ];
            const hosts = new Set<string>([
              ...processingHosts,
              ...xi.kinds,
              "p",
              "qti-assessment-item",
              "qti-item-body",
              "qti-prompt",
              "qti-simple-choice",
            ]);
            const expectedKeys = new Set(expected.map(keyOf));

            assert.strictEqual(processingHosts.size, 90);
            for (const version of ["3.0.0", "3.0.1"]) {
              const wanted = [...expectedKeys].filter((key) => key.startsWith(`${version} `));

              assert.strictEqual(wanted.length, 4048, version);
              assert.deepStrictEqual(
                rows
                  .filter((row) => row.version === version && expectedKeys.has(keyOf(row)))
                  .map(keyOf)
                  .toSorted(),
                wanted.toSorted(),
                version,
              );
            }

            // Nothing the processing hosts own is missing, and nothing under them is extra.
            assert.deepStrictEqual(
              rows
                .filter((row) => processingHosts.has(row.parent) && !expectedKeys.has(keyOf(row)))
                .map(keyOf),
              rows
                .filter(
                  (row) =>
                    row.parent === "qti-response-processing" &&
                    generic.includes(row.child) &&
                    !expectedKeys.has(keyOf(row)),
                )
                .map(keyOf),
            );
            assert.isTrue([...hosts].every((host) => rows.some((row) => row.parent === host)));
          }),
      );

      it.effect(
        "holds OperatorArity, OperatorArityMax and OperatorArityUnbounded as the seed tables do",
        () =>
          Effect.gen(function* holdsTheArity() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const minimum = yield* (yield* db.execute(arityRows, {})).collect;
            const maximum = yield* (yield* db.execute(arityMaxRows, {})).collect;
            const unbounded = yield* (yield* db.execute(arityUnboundedRows, {})).collect;

            assert.strictEqual(minimum.length, 64);
            assert.strictEqual(maximum.length, 50);
            assert.strictEqual(unbounded.length, 14);
            assert.deepStrictEqual(
              minimum.map((row) => `${row.kind} ${row.min}`).toSorted(),
              operatorArity.map((row) => `${row.kind} ${row.min}`).toSorted(),
            );
            assert.deepStrictEqual(
              maximum.map((row) => `${row.kind} ${row.max}`).toSorted(),
              operatorArityMax.map((row) => `${row.kind} ${row.max}`).toSorted(),
            );
            assert.deepStrictEqual(
              unbounded.map((row) => row.kind).toSorted(),
              operatorArityUnbounded.map((row) => row.kind).toSorted(),
            );
          }),
      );

      it.effect(
        "carries the 91 M3 NodeKind labels, read through the closed columns of Admission",
        () =>
          Effect.gen(function* carriesTheKinds() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const rows = yield* (yield* db.execute(admissionRows, {})).collect;
            const named = new Set(rows.flatMap((row) => [row.parent, row.child]));
            const labels = [...expressions, ...rules, ...xi.kinds];

            // `closed` rosters are not relations, so no query reads `pg_enum`; `Admission`'s two
            // `closedId(NodeKind)` columns hold every label this phase appends, so a label the
            // installed enum lacked could not be stored in them.
            assert.strictEqual(labels.length, 91);
            assert.deepStrictEqual(
              labels.filter((label) => !named.has(label)),
              [],
            );
          }),
      );

      it.effect(
        "carries the 30 M3 AttributeName labels, read through the closed column of AttributeAdmission",
        () =>
          Effect.gen(function* carriesTheAttributeNames() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const rows = yield* (yield* db.execute(attributeAdmissionRows, {})).collect;
            const named = new Set(rows.map((row) => row.attribute));

            // `closed` rosters are not relations, so no query reads `pg_enum`; `AttributeAdmission`'s
            // `attribute` column is the closed `AttributeName` roster, so a label the installed enum
            // lacked could not be stored in it.
            assert.strictEqual(attributeNames.length, 30);
            assert.deepStrictEqual(
              attributeNames.filter((label) => !named.has(label)),
              [],
            );
          }),
      );
    });
  },
);
