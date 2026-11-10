/**
 * The stub kind the shared pins name: the interaction kind whose module the table of modules holds
 * as a stub the longest, the last planned to land. A test whose point is that an interaction a stub
 * module shows as a notice leaves the rest of the item standing names its kind here, so a module
 * that lands meets no such test by name; a test whose point is one kind's own behaviour derives its
 * expectation from that module's `implemented` flag instead. `src/session/skip.test.ts` names the
 * same kind and declaration for its own fixture.
 *
 * Test support only: nothing under `src/` outside `src/test/` and test files imports it.
 *
 * @module
 */
import { modules } from "#plate/model/interactions.ts";

/**
 * The stub kind: Select Point, the last module planned to land.
 */
export const stubKind = "select-point" as const;

/**
 * The QTI element of {@link stubKind}, read from its module in the table of modules, so a fixture
 * built from it changes with `stubKind` alone.
 */
export const stubElement = modules[stubKind].element;

/**
 * The base type an interaction of {@link stubKind} binds under QTI 3.0, which no module's contract
 * carries, so it changes beside `stubKind`.
 */
export const stubBaseType = "point";

/**
 * The cardinality a fixture declares for {@link stubKind}: `multiple`, because the binding rule
 * checks the element's choice count against the declaration before any module reads it. A `single`
 * declaration needs `max-choices="1"` on the element, where `multiple` binds the bare element, so a
 * fixture carries nothing of the kind but its name.
 */
export const stubCardinality = "multiple";
