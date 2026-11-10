/**
 * The stub kind the shared pins name, derived from the table of modules: the first kind of
 * {@link stubOrder} that is a bare stub, so the pins name the kind planned to land last for as long
 * as it is one, and the next bare stub kind of the order the day it lands. A test whose point is
 * that an interaction a stub module shows as a notice leaves the rest of the item standing names
 * its kind here, so a module that lands meets no such test by name; a test whose point is one
 * kind's own behaviour derives its expectation from that module's `implemented` flag instead.
 *
 * A kind is a bare stub when its module is a stub (`implemented: false`) and declares no container
 * (`containerKinds` in `#plate/model/interactions.ts`). A kind whose interactions live only inside
 * a container element cannot stand bare in an item body, so its stub cannot be the item a pin
 * builds: Position Object's `qti-position-object-interaction` is a child of
 * `qti-position-object-stage` alone, `open` refuses it in a body as an unknown element under every
 * declaration, and inside the stage the notice names the stage, not the interaction. Position
 * Object is therefore never the stub kind. Its stub declares no container yet (its module gets the
 * stage when it lands), so `containerKinds` does not name it and the rule alone would not skip it:
 * it is kept out of {@link stubOrder}, and the rule skips any kind of the order that declares a
 * container.
 *
 * Three files are taught the branch, and no other file names a kind by hand: this one, which
 * derives {@link stubKind} and {@link hasStub}; `src/session/skip.test.ts`, which skips its
 * stub-notice test, with the reason in the title, while {@link hasStub} is false; and
 * `src/styles.markup.test.ts`, which includes its stub witness row only while {@link hasStub}. When
 * no kind of the order is a bare stub, this module refuses to load, at compile time and at run
 * time, with a message naming the rows to delete, so {@link hasStub} is true whenever it loads and
 * the two gates stand for the premise rather than for a state the module admits. The five importers
 * of this file (`src/engine/attempt.test.ts`, `src/model/item.test.ts`, `src/payload.test.ts`,
 * `src/validate/verdict.test.ts` and `src/vertical.test.ts`) read {@link stubKind},
 * {@link stubElement}, {@link stubBaseType} and {@link stubCardinality} and not {@link hasStub}: their
 * tests whose premise is that a stub shows as a notice have no premise then, and the merge that
 * lands the last bare stub deletes them, the two `stubNode` rows the message names first.
 * `src/vertical.test.ts` reads {@link stubKind} alone and pairs it with its Select Point fixture, so
 * it follows the kind only while Select Point is the stub kind.
 *
 * Test support only: nothing under `src/` outside `src/test/` and test files imports it.
 *
 * @module
 */
import { Data } from "effect";

import type { ModuleInteraction, ModuleKind } from "#plate/interactions/contract.ts";
import type { ModelOf } from "#plate/model/interactions.ts";
import { containerKinds, modules } from "#plate/model/interactions.ts";

/**
 * The kinds the shared pins may name, Select Point first because it is planned to land last, then
 * the others by the issue that lands each, the later issue first (the issue ids in
 * `docs/cloud-agents.md`). Each has a row in {@link stubDeclarations}. A kind belongs here only
 * while two things hold. `src/session/skip.test.ts`, which opens the bare element of every kind of
 * the order under its declaration, finds that element accepted as one notice. And the importers
 * that follow the kind stay green when it is the pinned one: Order, Associate, Match and Hot Text
 * open as one notice, but `src/validate/verdict.test.ts` puts an `img` inside the stub element to
 * pin the URL pass's mark, and their content models refuse that child, so none is admitted. Nor is
 * a kind `open` refuses or opens with more than the one notice: Slider, Media and Portable Custom
 * need attributes or children beyond `response-identifier`, End Attempt is refused directly in an
 * item body, Drawing and Upload declare the `file` base type, which the reader marks as
 * unsupported beside the notice, and Position Object only stands inside its container.
 */
export const stubOrder = [
  "select-point",
  "graphic-order",
  "graphic-associate",
  "hotspot",
  "graphic-gap-match",
] as const satisfies readonly ModuleKind[];

/**
 * What a fixture declares so that the bare element of each kind of {@link stubOrder} binds: the
 * `RESPONSE` declaration's base type and cardinality, the base type QTI 3.0 gives the kind and the
 * cardinality its bare element binds under. The binding rule checks the element's choice count
 * (`max-choices` or `max-associations`, unwritten) against the declaration before any module reads
 * the element. Select Point's count reads `0` unwritten, so it declares `multiple`: a `single`
 * declaration needs `max-choices="1"` on the element, where `multiple` binds the bare element, so
 * a fixture carries nothing of the kind but its name. The other kinds read `1` unwritten and
 * declare `single`, except Graphic Order, which is ordered. No module's contract carries a base
 * type, so a row changes beside its kind.
 */
export const stubDeclarations = {
  "graphic-associate": { baseType: "pair", cardinality: "single" },
  "graphic-gap-match": { baseType: "directedPair", cardinality: "single" },
  "graphic-order": { baseType: "identifier", cardinality: "ordered" },
  hotspot: { baseType: "identifier", cardinality: "single" },
  "select-point": { baseType: "point", cardinality: "multiple" },
} as const satisfies {
  readonly [K in (typeof stubOrder)[number]]: {
    readonly baseType: string;
    readonly cardinality: "multiple" | "ordered" | "single";
  };
};

/**
 * A kind of {@link stubOrder}.
 */
type OrderKind = (typeof stubOrder)[number];

/**
 * The kinds of {@link stubOrder} whose model node is the contract's bare node,
 * `ModuleInteraction<K>`: the type of a stub, which declares `InteractionModule<K,
 * ModuleInteraction<K>, never>`. A module that lands declares its own model node with the fields
 * its render reads, so `ModelOf<K>` grows past the bare node and the kind leaves this union, and
 * the literal `{ kind: stubKind, … }` a test builds as the bare node of the stub kind keeps
 * fitting `ModelOf<typeof stubKind>` on a branch where any kinds of the order have landed, in any
 * order: {@link stubKind} is typed as this union alone, so no kind is named as its fallback. When
 * every kind has landed this union is `never`, which {@link noBareStub} reports.
 */
type BareKind = {
  readonly [K in OrderKind]: ModuleInteraction<K> extends ModelOf<K> ? K : never;
}[OrderKind];

/**
 * The message this module refuses to load with when every kind of {@link stubOrder} has landed.
 * The `satisfies` is the same refusal at compile time: while a kind of the order is bare the
 * expected type is `string`, and when none is it is `never`, so `tsc` reports this line with the
 * message as the literal's type, beside the two rows it names, which then fail against
 * `ModelOf<never>`.
 */
const noBareStub =
  "Every kind of stubOrder has landed, so no stub kind remains: delete the stubNode rows of src/engine/attempt.test.ts and src/payload.test.ts, whose premise was a stub shown as a notice." satisfies [
    BareKind,
  ] extends [never]
    ? never
    : string;

/**
 * Tell whether a kind of the order is a bare stub: its module in the table of modules has
 * `implemented: false` and declares no container. A stub module's model node is the bare node, so
 * the kind is a {@link BareKind}: the table's values and its types say the same of a stub.
 *
 * @param kind A kind of the order.
 * @returns Whether its module is a bare stub.
 */
const isBareStub = (kind: OrderKind): kind is BareKind =>
  !modules[kind].implemented && !containerKinds.has(kind);

/**
 * The first kind of {@link stubOrder} that is a bare stub ({@link isBareStub}), none when every
 * kind of the order is implemented or declares a container.
 */
const bareStub = stubOrder.find(isBareStub);

/**
 * Whether the order holds a bare stub. True whenever this module loads, as it refuses to load
 * ({@link noBareStub}) once every kind of {@link stubOrder} is implemented or declares a container;
 * the importers that gate on it (`src/session/skip.test.ts`, `src/styles.markup.test.ts`) state
 * their premise, a stub shown as a notice, through it.
 */
export const hasStub = bareStub !== undefined;

/**
 * Every kind of {@link stubOrder} has landed, so the module has no stub kind to export: a defect
 * of the branch, not of a caller, thrown at load and never returned. It is a tagged class, as every
 * failure in this package is (`src/browser.test.ts` refuses a bare `Error` in any non-test module,
 * this helper included), and has no field: {@link noBareStub} already names the rows to delete.
 */
class NoBareStub extends Data.TaggedError("NoBareStub") {
  /**
   * The rows to delete, as {@link noBareStub} names them.
   */
  // oxlint-disable-next-line eslint/class-methods-use-this -- A field would be an own property of the error, and this one has none: its message is the module-level constant.
  override get message(): string {
    return noBareStub;
  }
}

if (bareStub === undefined) {
  throw new NoBareStub();
}

/**
 * The stub kind: the first bare stub of {@link stubOrder}. Its type is {@link BareKind}, the kinds
 * still bare, whichever kinds have landed; the module does not load without one.
 */
export const stubKind: BareKind = bareStub;

/**
 * The QTI element of {@link stubKind}, read from its module in the table of modules, so a fixture
 * built from it changes with {@link stubKind} alone.
 */
export const stubElement = modules[stubKind].element;

/**
 * The row of {@link stubDeclarations} of any kind of the order. The two values read from the stub
 * kind's row below are typed over every row, as `stubKind` was the whole order before its type
 * followed the table: a reader that keys a record by them (`correctOf` in
 * `src/styles.markup.test.ts`) covers every row of the order, whichever kind is the stub kind.
 */
type Declaration = (typeof stubDeclarations)[OrderKind];

/**
 * The base type an interaction of {@link stubKind} binds under QTI 3.0, read from its row of
 * {@link stubDeclarations}.
 */
export const stubBaseType: Declaration["baseType"] = stubDeclarations[stubKind].baseType;

/**
 * The cardinality a fixture declares for {@link stubKind}, read from its row of
 * {@link stubDeclarations}.
 */
export const stubCardinality: Declaration["cardinality"] = stubDeclarations[stubKind].cardinality;
