/**
 * The stub kind the shared pins name, derived from the table of modules: the first kind of
 * {@link stubOrder} whose module is a stub, so the pins name the kind planned to land last for as
 * long as it is a stub, and the next kind of the order the day it lands first. A test whose point
 * is that an interaction a stub module shows as a notice leaves the rest of the item standing names
 * its kind here, so a module that lands meets no such test by name; a test whose point is one
 * kind's own behaviour derives its expectation from that module's `implemented` flag instead.
 *
 * Three files are taught the branch, and no other file names a kind by hand: this one, which
 * derives {@link stubKind} and {@link hasStub}; `src/session/skip.test.ts`, which registers its
 * stub-notice test only while {@link hasStub}; and `src/styles.markup.test.ts`, which includes its
 * stub witness row only while {@link hasStub}. When every kind of the order is implemented,
 * {@link stubKind} is the last kind of the order and {@link hasStub} is false. The five importers
 * of this file (`src/engine/attempt.test.ts`, `src/model/item.test.ts`, `src/payload.test.ts`,
 * `src/validate/verdict.test.ts` and `src/vertical.test.ts`) read {@link stubKind},
 * {@link stubElement}, {@link stubBaseType} and {@link stubCardinality} and not {@link hasStub}:
 * their tests whose premise is that a stub shows as a notice have no premise then, and the merge
 * that lands the last stub deletes them.
 *
 * Test support only: nothing under `src/` outside `src/test/` and test files imports it.
 *
 * @module
 */
import type { ModuleKind } from "#plate/interactions/contract.ts";
import { Array as Arr } from "effect";
import { modules } from "#plate/model/interactions.ts";

/**
 * The kinds the shared pins may name, the kind planned to land last first. Each has a row in
 * {@link stubDeclarations}, and a kind belongs here only while `src/session/skip.test.ts`, which
 * opens the bare element of every kind of the order under its declaration, finds that element
 * accepted: a kind whose bare element `open` refuses fails that test, so it is not admitted.
 *
 * Position Object is not admitted. QTI 3.0 allows `qti-position-object-interaction` only inside a
 * `qti-position-object-stage`, so `open` refuses the bare element in an item body as an unknown
 * element under every declaration; inside a stage the item opens, but its notice names the stage
 * and not the interaction, which is not the element {@link stubElement} names.
 */
export const stubOrder = ["select-point"] as const satisfies readonly ModuleKind[];

/**
 * What a fixture declares so that the bare element of each kind of {@link stubOrder} binds: the
 * `RESPONSE` declaration's base type and cardinality. Select Point's is `multiple` of `point`,
 * because the binding rule checks the element's choice count (`max-choices`, unwritten, which
 * Select Point reads as `0`) against the declaration before any module reads the element. A
 * `single` declaration needs `max-choices="1"` on the element, where `multiple` binds the bare
 * element, so a fixture carries nothing of the kind but its name. QTI 3.0 fixes the base type of
 * each kind and no module's contract carries it, so a row changes beside its kind.
 */
export const stubDeclarations = {
  "select-point": { baseType: "point", cardinality: "multiple" },
} as const satisfies {
  readonly [K in (typeof stubOrder)[number]]: {
    readonly baseType: string;
    readonly cardinality: "multiple" | "ordered" | "single";
  };
};

/**
 * The stub kind: the first kind of {@link stubOrder} whose module in the table of modules has
 * `implemented: false`, or the last kind of the order when every module of it is implemented, which
 * {@link hasStub} reports.
 */
export const stubKind =
  stubOrder.find((kind) => !modules[kind].implemented) ?? Arr.lastNonEmpty(stubOrder);

/**
 * Whether the table of modules holds a stub of a kind of {@link stubOrder}: false once every one
 * of them is implemented, when {@link stubKind} names an implemented module and a test whose
 * premise is a stub shown as a notice has nothing to stand on.
 */
export const hasStub = !modules[stubKind].implemented;

/**
 * The QTI element of {@link stubKind}, read from its module in the table of modules, so a fixture
 * built from it changes with {@link stubKind} alone.
 */
export const stubElement = modules[stubKind].element;

/**
 * The base type an interaction of {@link stubKind} binds under QTI 3.0, read from its row of
 * {@link stubDeclarations}.
 */
export const stubBaseType = stubDeclarations[stubKind].baseType;

/**
 * The cardinality a fixture declares for {@link stubKind}, read from its row of
 * {@link stubDeclarations}.
 */
export const stubCardinality = stubDeclarations[stubKind].cardinality;
