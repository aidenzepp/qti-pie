/**
 * The ancestry encoding as data: the flags, the kinds that enter them, the bans, and the
 * `AncestryStep` rows derived from them. No import of `node.ts`: `node.ts` declares
 * `closed("Ancestry", ancestryHandles)` from this module, and a kind a later phase appends gains
 * its rows from the handle tuple the seed composition passes, with no edit here.
 *
 * An ancestry is the set of flags a node sits inside, named by its flags joined with `.` in
 * `FLAGS` order, `root` for the empty set. `reachable` computes the sets by closure over the
 * `Admission` rows: a tree starts at each kind no row admits as a child, at the empty set; a node
 * of kind `k` at set `S` that is not banned yields each child kind at `S` plus `KindEnters[k]`.
 * The bans are the missing `AncestryStep` rows:
 *
 * - An interaction kind at any set holding `int`, `choice`, `htx`, `rubric`, `tmpl` or `modal`;
 * - `qti-gap` at a set without `gap`;
 * - `qti-rubric-block` at a set holding `rubric`;
 * - `qti-hottext` at a set holding `htx` (a hottext under a prompt or a choice is admitted).
 *
 * `ancestryHandles` is the closure over the `Admission` rows of the kinds files, printed and
 * pasted: this module cannot compute it at load, because the composed rows (`seed/admission.ts`)
 * import `node.ts`, which imports this module, and a computed tuple is not a literal type. The
 * test re-runs `reachable` and asserts equality, so a set the literal missed fails there.
 */

/**
 * The flags, in the canonical order that names an ancestry. A later phase appends after `htx`.
 */
export const FLAGS = ["fb", "modal", "rubric", "tmpl", "int", "gap", "choice", "htx"] as const;

/**
 * One flag an ancestry holds.
 */
export type Flag = (typeof FLAGS)[number];

/**
 * The flags each kind enters; a kind absent from the record enters none.
 */
export type KindEnterTable = Readonly<Record<string, readonly Flag[]>>;

/**
 * The 20 interaction kinds: each enters `int`.
 */
export const interactionKinds = [
  "qti-choice-interaction",
  "qti-order-interaction",
  "qti-associate-interaction",
  "qti-match-interaction",
  "qti-gap-match-interaction",
  "qti-inline-choice-interaction",
  "qti-text-entry-interaction",
  "qti-extended-text-interaction",
  "qti-hottext-interaction",
  "qti-hotspot-interaction",
  "qti-select-point-interaction",
  "qti-graphic-order-interaction",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-position-object-interaction",
  "qti-slider-interaction",
  "qti-drawing-interaction",
  "qti-media-interaction",
  "qti-upload-interaction",
  "qti-end-attempt-interaction",
] as const;

const entering = (flag: Flag, kinds: readonly string[]): readonly (readonly [string, Flag])[] =>
  kinds.map((kind) => [kind, flag] as const);

/**
 * The flags each entering kind adds to its children's ancestry.
 */
export const KindEnters: KindEnterTable = Object.fromEntries(
  Object.entries(
    Object.groupBy(
      [
        ...entering("int", interactionKinds),
        ...entering("gap", ["qti-gap-match-interaction"]),
        ...entering("choice", [
          "qti-prompt",
          "qti-simple-choice",
          "qti-simple-associable-choice",
          "qti-inline-choice",
          "qti-label",
          "qti-gap-text",
          "qti-gap-img",
        ]),
        ...entering("htx", ["qti-hottext"]),
        ...entering("rubric", ["qti-rubric-block"]),
        ...entering("tmpl", [
          "qti-template-block",
          "qti-template-block.rubric",
          "qti-template-inline",
          "qti-template-inline.rubric",
        ]),
        ...entering("modal", ["qti-modal-feedback"]),
        ...entering("fb", [
          "qti-feedback-block",
          "qti-feedback-block.template",
          "qti-feedback-inline",
        ]),
      ],
      ([kind]) => kind,
    ),
  ).map(([kind, pairs]) => [
    kind,
    FLAGS.filter((flag) => (pairs ?? []).some(([, entered]) => entered === flag)),
  ]),
);

/**
 * The ancestry handle of a flag set: the flags in `FLAGS` order joined with `.`, `root` for none.
 */
export const handleOf = (flags: readonly Flag[]): string =>
  FLAGS.filter((flag) => flags.includes(flag)).join(".") || "root";

const interactions: ReadonlySet<string> = new Set(interactionKinds);

const isInteraction = (kind: string): boolean => interactions.has(kind);

/**
 * Whether a node of `kind` may not sit at the flag set: no row of `AncestryStep` names the pair.
 */
export const banned = (flagSet: readonly Flag[], kind: string): boolean => {
  const has = (flag: Flag): boolean => flagSet.includes(flag);
  if (isInteraction(kind)) {
    return (["int", "choice", "htx", "rubric", "tmpl", "modal"] as const).some(has);
  }

  if (kind === "qti-gap") {
    return !has("gap");
  }

  if (kind === "qti-rubric-block") {
    return has("rubric");
  }

  if (kind === "qti-hottext") {
    return has("htx");
  }

  return false;
};

/**
 * The flag set a node of `kind` at `flagSet` hands its children.
 */
const stepOf = (
  flagSet: readonly Flag[],
  kind: string,
  kindEnters: KindEnterTable,
): readonly Flag[] =>
  FLAGS.filter((flag) => flagSet.includes(flag) || (kindEnters[kind] ?? []).includes(flag));

/**
 * The reachable flag sets, by size and then `FLAGS` order, as the closure from `root` over the
 * `Admission` rows: a tree starts at every kind no row admits as a child.
 */
export const reachable = (
  admission: readonly { readonly child: string; readonly parent: string }[],
  kindEnters: KindEnterTable,
): readonly (readonly Flag[])[] => {
  const childrenOf = Map.groupBy(admission, (row) => row.parent);
  const admitted = new Set(admission.map((row) => row.child));
  const sets = new Map<string, readonly Flag[]>();
  const seen = new Set<string>();
  const pending: [readonly Flag[], string][] = [...childrenOf.keys()]
    .filter((kind) => !admitted.has(kind))
    .map((kind) => [[], kind]);

  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [flagSet, kind] = next;
    const key = `${handleOf(flagSet)}\u0000${kind}`;
    if (seen.has(key) || banned(flagSet, kind)) {
      continue;
    }

    seen.add(key);
    sets.set(handleOf(flagSet), flagSet);

    const inner = stepOf(flagSet, kind, kindEnters);
    for (const row of childrenOf.get(kind) ?? []) {
      pending.push([inner, row.child]);
    }
  }

  return [...sets.values()].toSorted(
    (left, right) =>
      left.length - right.length ||
      FLAGS.findIndex((flag) => left.includes(flag) && !right.includes(flag)) -
        FLAGS.findIndex((flag) => right.includes(flag) && !left.includes(flag)),
  );
};

/**
 * The 56 reachable ancestries over the kinds files' `Admission` rows (M0 and M1), by size and then
 * `FLAGS` order, as `reachable(admission, KindEnters)` printed them. The count stays under 64.
 */
export const ancestryHandles = [
  "root",
  "fb",
  "modal",
  "rubric",
  "tmpl",
  "int",
  "htx",
  "fb.modal",
  "fb.rubric",
  "fb.tmpl",
  "fb.int",
  "fb.htx",
  "modal.tmpl",
  "modal.htx",
  "rubric.tmpl",
  "rubric.htx",
  "tmpl.int",
  "tmpl.htx",
  "int.gap",
  "int.choice",
  "int.htx",
  "fb.modal.tmpl",
  "fb.modal.htx",
  "fb.rubric.tmpl",
  "fb.rubric.htx",
  "fb.tmpl.int",
  "fb.tmpl.htx",
  "fb.int.gap",
  "fb.int.choice",
  "fb.int.htx",
  "modal.tmpl.htx",
  "rubric.tmpl.htx",
  "tmpl.int.gap",
  "tmpl.int.choice",
  "tmpl.int.htx",
  "int.gap.choice",
  "int.gap.htx",
  "int.choice.htx",
  "fb.modal.tmpl.htx",
  "fb.rubric.tmpl.htx",
  "fb.tmpl.int.gap",
  "fb.tmpl.int.choice",
  "fb.tmpl.int.htx",
  "fb.int.gap.choice",
  "fb.int.gap.htx",
  "fb.int.choice.htx",
  "tmpl.int.gap.choice",
  "tmpl.int.gap.htx",
  "tmpl.int.choice.htx",
  "int.gap.choice.htx",
  "fb.tmpl.int.gap.choice",
  "fb.tmpl.int.gap.htx",
  "fb.tmpl.int.choice.htx",
  "fb.int.gap.choice.htx",
  "tmpl.int.gap.choice.htx",
  "fb.tmpl.int.gap.choice.htx",
] as const;

/**
 * The ancestry handles whose flag set holds `fb`.
 */
export const fbFlagged: readonly string[] = ancestryHandles.filter((handle) =>
  handle.split(".").includes("fb"),
);

const flagsOf = (handle: string): readonly Flag[] =>
  FLAGS.filter((flag) => handle.split(".").includes(flag));

const known: ReadonlySet<string> = new Set(ancestryHandles);

/**
 * One `AncestryStep` row for every ancestry and every kind of `kinds` that may sit there: `next`
 * is the ancestry of that node's children, the identity for a kind that enters nothing. A pair
 * that is not banned but whose `next` is no handle (a `qti-prompt` at `root`, which no `Admission`
 * row lets a tree reach) has no row, because `next` is a closed ancestry and the pair cannot occur.
 */
export const ancestryStepRows = (
  kinds: readonly string[],
  kindEnters: KindEnterTable,
): readonly { readonly ancestry: string; readonly kind: string; readonly next: string }[] =>
  ancestryHandles.flatMap((ancestry) => {
    const flagSet = flagsOf(ancestry);

    return kinds
      .filter((kind) => !banned(flagSet, kind))
      .map((kind) => ({ ancestry, kind, next: handleOf(stepOf(flagSet, kind, kindEnters)) }))
      .filter((row) => known.has(row.next));
  });
