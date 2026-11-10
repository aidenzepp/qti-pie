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
 * no kind of the order is a bare stub, {@link stubKind} is the last kind of the order and
 * {@link hasStub} is false. The five importers of this file (`src/engine/attempt.test.ts`,
 * `src/model/item.test.ts`, `src/payload.test.ts`, `src/validate/verdict.test.ts` and
 * `src/vertical.test.ts`) read {@link stubKind}, {@link stubElement}, {@link stubBaseType} and
 * {@link stubCardinality} and not {@link hasStub}: their tests whose premise is that a stub shows as
 * a notice have no premise then, and the merge that lands the last bare stub deletes them.
 * `src/vertical.test.ts` reads {@link stubKind} alone and pairs it with its Select Point fixture, so
 * it follows the kind only while Select Point is the stub kind.
 *
 * Test support only: nothing under `src/` outside `src/test/` and test files imports it.
 *
 * @module
 */
import type { ModuleKind } from "#plate/interactions/contract.ts";
import { Array as Arr } from "effect";
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
 * The first kind of {@link stubOrder} that is a bare stub: its module in the table of modules has
 * `implemented: false` and declares no container, none when every kind of the order is implemented
 * or declares one.
 */
const bareStub = stubOrder.find((kind) => !modules[kind].implemented && !containerKinds.has(kind));

/**
 * The stub kind: the first bare stub of {@link stubOrder}, or the last kind of the order when it
 * holds none, which {@link hasStub} reports.
 */
export const stubKind = bareStub ?? Arr.lastNonEmpty(stubOrder);

/**
 * Whether the order holds a bare stub: false once every kind of {@link stubOrder} is implemented or
 * declares a container, when {@link stubKind} names a module a notice no longer stands for and a
 * test whose premise is a stub shown as a notice has nothing to stand on.
 */
export const hasStub = bareStub !== undefined;

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
