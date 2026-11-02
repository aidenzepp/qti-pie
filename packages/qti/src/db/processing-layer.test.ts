import { ChangeSet, Db, query, uuid, v } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe, inject } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { importPackage } from "#qti/import/package.ts";
import * as asi from "#qti/schema/kinds/asi.ts";
import * as xi from "#qti/schema/kinds/xi.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Admission, AttributeLexical, Node, TreeRoot } from "#qti/schema/node.ts";
import type { AttributeNameHandle } from "#qti/schema/node.ts";
import { OperatorArity, OperatorArityMax, OperatorArityUnbounded } from "#qti/schema/processing.ts";
import { Author } from "#qti/schema/roles.ts";
import {
  operatorArity,
  operatorArityMax,
  operatorArityUnbounded,
} from "#qti/schema/seed/operator-arity.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

const fixtures = inject("fixtures");

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
 * The 64 expression kinds and 25 rule kinds this phase appends to `asi.kinds`, after the 11 of M0
 * and M1 (`qti-response-processing` is the eleventh), in `asi.ts`'s append-only order.
 */
const expressions = asi.kinds.slice(11, 75);

const rules = asi.kinds.slice(75);

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

/**
 * The root node of one tree, with its kind.
 */
const rootOf = query(Author).rule((r) => {
  const { id, kind } = v(Node);

  return r
    .match(TreeRoot, { node: id, tree: r.param("tree", uuid) })
    .match(Node, { id, kind })
    .find({ id, kind });
});

const lexicalsOf = query(Author).rule((r) => {
  const { attribute, node } = v(AttributeLexical);

  return r
    .match(AttributeLexical, { attribute, node })
    .where(r.eq(node, r.param("node", uuid)))
    .find({ attribute });
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

      it.effect("stores each of the 30 M3 AttributeName labels through a written row", () =>
        Effect.gen(function* storesTheAttributeNames() {
          const packageId = yield* importPackage(fixtures.simple);
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const roots = yield* (yield* db.execute(rootOf, { tree: packageId })).collect;

          assert.strictEqual(roots.length, 1);

          const [root] = roots;

          assert.isDefined(root);
          if (root === undefined) {
            return;
          }

          // The attribute names are not carried by a seeded relation, and no stored `xi:include` exists
          // until the processing fixtures (`p3-22`), so the thirty labels are written as
          // `AttributeLexical` rows on the manifest's root and read back; the table only names the
          // node, its kind and the attribute.
          const written = yield* db.apply(
            ChangeSet.empty(Author).insert(
              AttributeLexical,
              attributeNames.map((attribute) => ({
                attribute,
                kind: root.kind,
                node: root.id,
                value: " padded",
              })),
            ),
            {},
          );

          assert.strictEqual(written.kind, "accepted");

          const found = yield* (yield* db.execute(lexicalsOf, { node: root.id })).collect;

          assert.deepStrictEqual(
            found.map((row) => row.attribute).toSorted(),
            attributeNames.toSorted(),
          );
        }),
      );
    });
  },
);
