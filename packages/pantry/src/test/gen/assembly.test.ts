/**
 * Generated packages against reading 87 and grizzle's write compiler (R87): every package the
 * assembly generator (`#pantry/test/gen/assembly.ts`) draws, exhausted in a small box and sampled
 * by a swarm beyond it, is judged two ways.
 *
 * - **Reading 87's verdict.** The generator's model of reading 87 (`modelVerdict`, its bullets over
 *   the assembled test) predicts accepted or refused, and the import's rows must give the same
 *   verdict under the schema's own laws, restated on the host: every instance of a test's assembly
 *   resolves each branch rule of its document once (the count law of `Instance.rules`), and each
 *   resolution meets `Branch_target` and `Branch_forward` at its instance's start, which grizzle
 *   copies onto it from the tree's pre-order.
 * - **The law oracle** (`#pantry/test/locate.ts` `oracleVerdict`) must accept every package but under
 *   `branch-target` and `branch-forward`. It states no breach of either today: its tables name both
 *   laws, and no judgment of it raises them, so it accepts every package reading 87 refuses (R87's
 *   finding), and the model stands in for it.
 *
 * The same packages' write programs are compiled in `assembly.compile.oracle.test.ts`.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import type { Case } from "@grizzle/testing/explore";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { BranchResolution } from "#pantry/qti/tests.ts";
import {
  assemblyLiteral,
  assemblyPackage,
  classOf,
  modelVerdict,
  placementsOf,
  sampledBounds,
  smallAssembly,
  swarmedAssembly,
} from "#pantry/test/gen/assembly.ts";
import type { Assembly, TargetClass } from "#pantry/test/gen/assembly.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { oracleVerdict } from "#pantry/test/locate.ts";

/**
 * A situation a search must reach: where a rule's target lies, and the shapes of the instance tree
 * reading 87 is judged over.
 */
type Situation =
  | TargetClass
  | "a chain of three instances"
  | "a document placed twice"
  | "an instance with no rule"
  | "accepted"
  | "refused";

/**
 * The rules the law oracle may refuse a generated package under: reading 87's two laws.
 */
const branchRules: ReadonlySet<string> = new Set(["branch-forward", "branch-target"]);

/**
 * Name the situations one package reaches.
 *
 * @param assembly - The package.
 * @param accepted - Whether the oracle accepts it.
 * @returns Its situations.
 */
const situationsOf = (assembly: Assembly, accepted: boolean): readonly Situation[] => {
  const placed = placementsOf(assembly);
  const depth = (instance: number): number =>
    instance === 0 ? 1 : 1 + depth(placed.instances[instance]?.parent ?? 0);
  const documents = placed.instances.map(({ document }) => document);
  const ruled = new Set(
    assembly.rules.flatMap((rule) =>
      placed.placements.filter(({ id }) => id === rule.owner).map(({ instance }) => instance),
    ),
  );
  const classes = assembly.rules.flatMap((rule) => {
    const owner = placed.placements.find(({ id }) => id === rule.owner);

    return owner === undefined ? [] : [classOf(placed, owner, rule.target)];
  });

  return [
    ...classes,
    ...(placed.instances.some((_, at) => depth(at) >= 3)
      ? ["a chain of three instances" as const]
      : []),
    ...(new Set(documents).size < documents.length ? ["a document placed twice" as const] : []),
    ...(placed.instances.some((_, at) => !ruled.has(at))
      ? ["an instance with no rule" as const]
      : []),
    accepted ? "accepted" : "refused",
  ];
};

/**
 * One instance as the tree draws it: its document, its start, and whether its assembly is a test's.
 */
interface InstanceStart {
  readonly document: string;
  readonly start: bigint;
  readonly test: boolean;
}

/**
 * Each instance of a package's assemblies, by id, with its start in its tree's pre-order: a root
 * starts at 0, and each child at its previous sibling's end, the first at its parent's start plus
 * one, in the order its tree nests them.
 *
 * @param inputs - The package's inputs.
 * @returns Each instance's document, its start, and whether its assembly is a test's, by id.
 */
const instanceStarts = (inputs: PackageInputs): ReadonlyMap<string, InstanceStart> => {
  const starts = new Map<string, InstanceStart>();
  const walk = (instance: InstanceMember | InstanceRoot, start: bigint, test: boolean): bigint => {
    starts.set(instance.id, { document: instance.document, start, test });
    let next = start + 1n;
    for (const child of instance.children) {
      next = walk(child, next, test);
    }

    return next;
  };
  for (const root of inputs.Instance.values()) {
    walk(root, 0n, root.assemblyKind === "qti-assessment-test");
  }

  return starts;
};

/**
 * State `Branch_target` and `Branch_forward` on the host over one resolution, as
 * `#pantry/qti/tests.ts` states them, with its instance's start, which grizzle copies onto it. No
 * generated package shuffles, so `Branch_forward` is its first arm.
 *
 * @param b - The resolution.
 * @param instanceStart - Its instance's start.
 * @returns Whether both laws accept it.
 */
const lawAccepts = (b: Addition<typeof BranchResolution>, instanceStart: bigint): boolean => {
  const sectionTargets = new Set([
    "qti-assessment-item-ref",
    "qti-assessment-section",
    "qti-assessment-section-ref",
  ]);
  const kind =
    b.ownerKind === "qti-test-part"
      ? b.targetKind === "qti-test-part"
      : sectionTargets.has(b.targetKind) && b.targetPart === b.ownerPart;
  const above = b.targetInstanceStart <= instanceStart && instanceStart < b.targetInstanceEnd;
  const same = b.targetInstance === b.instance;
  const through = same
    ? b.via === b.instance
    : b.viaParent === b.targetInstance && b.viaStart <= instanceStart && instanceStart < b.viaEnd;
  const forward = same ? b.targetStart >= b.ownerEnd : b.targetStart > b.viaSiteStart;

  return kind && !b.targetReplaced && above && through && forward;
};

/**
 * Judge a package's import rows by the schema's laws on its branch rules, restated on the host:
 * each instance of a test's assembly holds one resolution per branch rule of its document that
 * names no exit, and each resolution meets `Branch_target` and `Branch_forward` at its instance's
 * start. A target that resolves nowhere has no resolution, so its instance holds one too few.
 *
 * @param inputs - The package's import inputs.
 * @param literal - The package's literal, for the assertions' messages.
 * @returns The verdict the database would give on these laws.
 */
const rowsVerdict = (inputs: PackageInputs, literal: string): "accepted" | "refused" => {
  const starts = instanceStarts(inputs);
  const rules = [...inputs.BranchRule.values()];
  const resolutions = [...inputs.BranchResolution.values()];
  for (const resolution of resolutions) {
    assert.strictEqual(
      resolution.targetInstanceStart,
      starts.get(resolution.targetInstance)?.start,
      `${literal}: the host's start of instance ${resolution.targetInstance} is not its pre-order start`,
    );
  }

  const counted = [...starts].every(
    ([id, { document, test }]) =>
      !test ||
      resolutions.filter(({ instance }) => instance === id).length ===
        rules.filter((rule) => rule.document === document).length,
  );
  const lawful = resolutions.every((resolution) =>
    lawAccepts(resolution, starts.get(resolution.instance)?.start ?? -1n),
  );

  return counted && lawful ? "accepted" : "refused";
};

/**
 * Judge one generated package: reading 87's model against its import rows under the laws, the law
 * oracle within reading 87's rules, and its write program kept for the compile.
 *
 * @param assembly - The package.
 * @param c - The search's case.
 * @returns Nothing; fails the case on a disagreement.
 */
const judge = (assembly: Assembly, c: Case<Situation>) =>
  Effect.gen(function* judged() {
    const literal = assemblyLiteral(assembly);
    const dir = yield* scopedPackage(assemblyPackage(assembly));
    const verdict = yield* oracleVerdict(yield* readPackage(dir));
    const predicted = modelVerdict(assembly);
    const program = yield* readProgram(dir);
    const byLaws = rowsVerdict(program.inputs, literal);

    c.noteAll(situationsOf(assembly, predicted.kind === "accepted"));
    assert.strictEqual(
      byLaws,
      predicted.kind,
      `${literal}: its rows are ${byLaws} by the laws, and reading 87's model ${predicted.kind === "refused" ? `refuses it (${[...predicted.faults].join(", ")})` : "accepts it"}; its import writes ${String(program.inputs.BranchRule.size)} branch rules and ${String(program.inputs.BranchResolution.size)} resolutions`,
    );
    assert.isTrue(
      verdict.kind === "accepted" || [...verdict.rules].every((rule) => branchRules.has(rule)),
      `${literal}: the law oracle refuses it under ${verdict.kind === "refused" ? [...verdict.rules].join(", ") : ""}`,
    );
  }).pipe(Effect.scoped);

layer(NodeServices.layer, { excludeTestServices: true })("test/gen/assembly.ts", (it) => {
  it.effect(
    "every package of the small box gets reading 87's verdict from its import rows under the laws",
    (ctx) =>
      // Oracle: a specification, reading 87's bullets restated over the assembled test
      // (`modelVerdict`), against the import's rows under the count law, `Branch_target` and
      // `Branch_forward` restated, at the instance starts a pre-order walk of the tree draws.
      // Bound: 11 shapes of a test of at most two parts and two documents, each with one rule of
      // each owner naming each identifier or EXIT_TEST.
      searched(
        ctx,
        exhaust(
          {
            box: "11 shapes of at most two parts, three item refs, one nesting and a chain of two documents, with one branch rule of every owner and target",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<Situation>([
              "a chain of three instances",
              "a document placed twice",
              "accepted",
              "after",
              "ancestor",
              "an instance with no rule",
              "at the end",
              "before",
              "exit",
              "inside",
              "into a placed document",
              "its own instance",
              "other part",
              "outer instance, after",
              "outer instance, before",
              "refused",
              "self",
              "unplaced",
            ]),
            generator: smallAssembly,
            limit: 400,
            literal: assemblyLiteral,
            oracle: { kind: "specification", name: "reading 87's bullets over the assembled test" },
            suite: "pantry/test/gen-assembly-box",
          },
          judge,
        ),
      ),
    { timeout: 1_200_000 },
  );

  it.effect(
    "every sampled package, drawn by its own swarm past the box, gets reading 87's verdict from its import rows under the laws",
    (ctx) =>
      // Oracle: as the box's. Bound: up to 4 documents in chains of placements, sections nested 3
      // deep, 3 children each, 2 parts and 3 rules, each case under its own swarm of 7 features;
      // 300 runs.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(30),
            concurrency: 1,
            coverage: required<Situation>(
              ["a chain of three instances", "accepted", "refused", "an instance with no rule"],
              { cases: 80, sense: notesOnly },
            ),
            draw: drawn(swarmedAssembly(sampledBounds)),
            kept: [],
            literal: ({ assembly }) => assemblyLiteral(assembly),
            oracle: { kind: "specification", name: "reading 87's bullets over the assembled test" },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/test/gen-assembly-swarm",
          },
          ({ assembly }, c) => judge(assembly, c),
        ),
      ),
    { timeout: 1_200_000 },
  );
});
