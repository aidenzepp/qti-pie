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
 * - **The law oracle** (`#pantry/test/oracle-verdict.ts` `oracleVerdict`) must accept every package
 *   but under `branch-target` and `branch-forward`. It states no breach of either today: its tables
 *   name both laws, and no judgment of it raises them, so it accepts every package reading 87
 *   refuses (R87's finding), and the model stands in for it.
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
import type { BranchTarget } from "#pantry/qti/tests.ts";
import {
  assemblyLiteral,
  assemblyPackage,
  classOf,
  modelVerdict,
  placementsOf,
  ruleFaultOf,
  sampledBounds,
  smallAssembly,
  swarmedAssembly,
} from "#pantry/test/gen/assembly.ts";
import type { Assembly, RuleFault, TargetClass } from "#pantry/test/gen/assembly.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 172 s at a load average of 75, under
 * V8 coverage, its slowest test.
 */
const testTimeoutMs = 1_200_000;

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
 * The kinds a rule of an item ref or a section branches to.
 */
const sectionTargets: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
]);

/**
 * State `Branch_target`'s judgment of a target's name on the host: its kind and part, and no
 * repeatable item ref, as `#pantry/qti/tests.ts` states it.
 *
 * @param b - The target.
 * @returns Whether the name is admitted.
 */
const admitted = (b: Addition<typeof BranchTarget>): boolean =>
  (b.ownerKind === "qti-test-part"
    ? b.targetKind === "qti-test-part"
    : sectionTargets.has(b.targetKind) && b.targetPart === b.ownerPart) &&
  !(b.targetKind === "qti-assessment-item-ref" && b.targetReplaced);

/**
 * State `Branch_target` on the host over one target, with its instance's start, which grizzle
 * copies onto its resolution: the name admitted, and its instance holding the rule's through
 * `via`.
 *
 * @param b - The target.
 * @returns Whether the law accepts it.
 */
const targetAccepts = (b: Addition<typeof BranchTarget>): boolean => {
  const above = b.targetInstanceStart <= b.instanceStart && b.instanceStart < b.targetInstanceEnd;
  const same = b.targetInstance === b.instance;
  const through = same
    ? b.via === b.instance
    : b.viaParent === b.targetInstance &&
      b.viaStart <= b.instanceStart &&
      b.instanceStart < b.viaEnd;

  return admitted(b) && above && through;
};

/**
 * State `Branch_forward` on the host over one target: a name `Branch_target` does not admit is
 * that law's alone, and any other lies after its source's end. No generated package shuffles, so
 * no target has a shuffle and the law has no other arm.
 *
 * @param b - The target.
 * @returns Whether the law accepts it.
 */
const forwardAccepts = (b: Addition<typeof BranchTarget>): boolean =>
  !admitted(b) ||
  (b.targetInstance === b.instance ? b.targetStart >= b.ownerEnd : b.targetStart > b.viaSiteStart);

/**
 * The rule PostgreSQL refuses a resolution under, by the schema's laws restated on the host: a
 * resolution with no target breaks its existence law, "Branch target"; a target breaks
 * `Branch_target` or `Branch_forward`, and never both, since `Branch_forward` judges only a name
 * `Branch_target` admits.
 *
 * @param target - The resolution's target, none where its import wrote none.
 * @param literal - The package's literal, for the assertions' messages.
 * @returns The rule, or none where every law accepts it.
 */
const rowRule = (
  target: Addition<typeof BranchTarget> | undefined,
  literal: string,
): "branch-forward" | "branch-target" | undefined => {
  if (target === undefined) {
    return "branch-target";
  }

  const targeted = targetAccepts(target);
  const forwarded = forwardAccepts(target);
  assert.isTrue(targeted || forwarded, `${literal}: a target breaks both branch laws`);

  if (!targeted) {
    return "branch-target";
  }

  return forwarded ? undefined : "branch-forward";
};

/**
 * The rule a fault of reading 87's model is refused under: a target that resolves nowhere, or to
 * a name of the wrong kind or part, "Branch target"; one that is not after its source,
 * "Branch forward".
 *
 * @param fault - The fault.
 * @returns The rule.
 */
const ruleOfFault = (fault: RuleFault): "branch-forward" | "branch-target" =>
  fault === "forward" ? "branch-forward" : "branch-target";

/**
 * Judge a package's import rows by the schema's laws on its branch rules, restated on the host,
 * placement by placement against reading 87's model: each instance of a test's assembly holds one
 * resolution per branch rule of its document that names no exit; a resolution has a target exactly
 * where the model resolves one, every target naming an `InstanceName` and an `Instance` of the
 * import, so no stand-in; and each resolution is refused under exactly the rule of its
 * placement's fault, or accepted where the model finds none.
 *
 * @param inputs - The package's import inputs.
 * @param assembly - The package.
 * @param literal - The package's literal, for the assertions' messages.
 * @returns The rules the database refuses the rows under, none where it accepts them.
 */
const rowsRules = (
  inputs: PackageInputs,
  assembly: Assembly,
  literal: string,
): ReadonlySet<string> => {
  const starts = instanceStarts(inputs);
  const placed = placementsOf(assembly);
  const rules = [...inputs.BranchRule.values()];
  const resolutions = [...inputs.BranchResolution.values()];
  const named = new Map([...inputs.Named.values()].map((row) => [row.node, row.identifier]));
  const names = new Set(
    [...inputs.InstanceName.values()].map(({ identifier, instance, node }) =>
      JSON.stringify([instance, node, identifier]),
    ),
  );
  const targetOf = new Map(
    [...inputs.BranchTarget.values()].map((row) => [JSON.stringify([row.instance, row.rule]), row]),
  );
  assert.strictEqual(inputs.BranchShuffle.size, 0, `${literal}: no generated package shuffles`);
  assert.strictEqual(
    targetOf.size,
    inputs.BranchTarget.size,
    `${literal}: one target per resolution`,
  );

  for (const target of targetOf.values()) {
    assert.isTrue(
      names.has(JSON.stringify([target.targetInstance, target.targetNode, target.target])),
      `${literal}: a target names no InstanceName of its identifier`,
    );
    assert.strictEqual(
      target.targetInstanceStart,
      starts.get(target.targetInstance)?.start,
      `${literal}: the host's start of instance ${target.targetInstance} is not its pre-order start`,
    );
    assert.strictEqual(target.instanceStart, starts.get(target.instance)?.start);
    assert.isTrue(starts.has(target.via), `${literal}: a target's via is no instance`);
  }

  const counted = [...starts].every(
    ([id, { document, test }]) =>
      !test ||
      resolutions.filter(({ instance }) => instance === id).length ===
        rules.filter((rule) => rule.document === document).length,
  );
  assert.isTrue(counted, `${literal}: an instance holds a resolution per branch rule`);

  const refused = new Set<string>();
  for (const resolution of resolutions) {
    const at = JSON.stringify([resolution.instance, resolution.rule]);
    const target = targetOf.get(at);
    const start = starts.get(resolution.instance)?.start;
    const owner = placed.placements.find(
      ({ id, instance }) => id === named.get(resolution.owner) && BigInt(instance) === start,
    );
    assert.isDefined(owner, `${literal}: a resolution's owner is no placement of the model`);
    if (owner === undefined) {
      continue;
    }

    const fault = ruleFaultOf(placed, owner, resolution.target);
    const rule = rowRule(target, literal);
    assert.strictEqual(
      target === undefined,
      fault === "unresolved",
      `${literal}: ${owner.id}'s rule to ${resolution.target} at instance ${String(start)} ${target === undefined ? "has no target" : "has a target"}, and the model finds ${fault ?? "no fault"}`,
    );
    assert.strictEqual(
      rule,
      fault === undefined ? undefined : ruleOfFault(fault),
      `${literal}: ${owner.id}'s rule to ${resolution.target} at instance ${String(start)}`,
    );
    if (rule !== undefined) {
      refused.add(rule);
    }
  }

  return refused;
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
    const byLaws = rowsRules(program.inputs, assembly, literal);
    const modelled = new Set(
      predicted.kind === "refused" ? [...predicted.faults].map(ruleOfFault) : [],
    );
    const oracled = new Set(verdict.kind === "refused" ? verdict.rules : []);

    c.noteAll(situationsOf(assembly, predicted.kind === "accepted"));
    assert.deepStrictEqual(
      byLaws,
      modelled,
      `${literal}: its rows are refused under {${[...byLaws].join(", ")}} by the laws, and reading 87's model ${predicted.kind === "refused" ? `refuses it (${[...predicted.faults].join(", ")})` : "accepts it"}; its import writes ${String(program.inputs.BranchRule.size)} branch rules, ${String(program.inputs.BranchResolution.size)} resolutions and ${String(program.inputs.BranchTarget.size)} targets`,
    );
    assert.deepStrictEqual(
      oracled,
      byLaws,
      `${literal}: the law oracle refuses it under {${[...oracled].join(", ")}}, and its rows under {${[...byLaws].join(", ")}}`,
    );
    assert.isTrue(
      [...oracled].every((rule) => branchRules.has(rule)),
      `${literal}: the law oracle refuses it under ${[...oracled].join(", ")}`,
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
    { timeout: testTimeoutMs },
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
    { timeout: testTimeoutMs },
  );
});
