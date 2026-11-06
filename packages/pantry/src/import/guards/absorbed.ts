/**
 * The guard for what an absorbing flag hides: a node beneath a formula is stored at the set
 * `{math}` alone, so the ancestry law no longer sees the flags of the QTI content the formula
 * sits in. This guard re-walks each such subtree from the formula's own ancestry and refuses what
 * the flags would refuse with no absorption.
 */
import type { Fact, Uuid } from "@bjornpagen/grizzle";
import { edgesByParent } from "#pantry/import/guards/mathml-edges.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import { absorbing, banned, FLAGS, KindEnters } from "#pantry/schema/seed/ancestry.ts";
import type { Flag } from "#pantry/schema/seed/ancestry.ts";

type NodeRow = Fact<typeof Node>;

/**
 * The flags an ancestry handle holds, none for `root`.
 */
const flagsOf = (handle: string): readonly Flag[] =>
  FLAGS.filter((flag) => handle.split(".").includes(flag));

/**
 * The flags a node of `kind` at `flagSet` hands its children with no absorption: the set's flags
 * and the flags the kind enters.
 */
const unabsorbedStep = (flagSet: readonly Flag[], kind: string): readonly Flag[] => {
  const entered = KindEnters[kind] ?? [];

  return FLAGS.filter((flag) => flagSet.includes(flag) || entered.includes(flag));
};

/**
 * Whether the ancestry law refuses a node of `kind` at `flagSet`: its ban rule, and `qti-gap`
 * judged by its own rule whatever absorbing flag the set holds.
 */
const refuses = (flagSet: readonly Flag[], kind: string): boolean =>
  banned(flagSet, kind) || (kind === "qti-gap" && !flagSet.includes("gap"));

/**
 * The refusal for `node`, banned at `flagSet` inside the content of `host`.
 */
const refusalOf = (node: NodeRow, host: NodeRow, flagSet: readonly Flag[]): ImportRefused =>
  new ImportRefused({
    detail:
      node.kind === "qti-gap"
        ? `A qti-gap sits inside the content of a ${host.kind} and no qti-gap-match-interaction encloses the ${host.kind}. Move the qti-gap into the block content of a qti-gap-match-interaction, outside the ${host.kind}.`
        : `A ${node.kind} sits inside the content of a ${host.kind}, where the ancestry (${flagSet.join(".") || "root"}) the ${host.kind} sits in bans it. Move the ${node.kind} out of the ${host.kind}, or the ${host.kind} out of the element that bans it.`,
    rule: "ancestry-ban",
  });

/**
 * Refuse the first node, in document order, that sits in the content of a host of `flag` and that
 * the flags would ban were the host's content not absorbed.
 *
 * A host is a node of a kind that enters `flag` and whose own ancestry holds no absorbing flag.
 * Each host's subtree is walked from the host's own flags, adding what each kind enters and
 * absorbing nothing, so a formula nested in a formula is refused at the inner one (`m:math` is
 * banned at `math`). Every ban refuses as `ancestry-ban`, the rule a flag refusal of the same node
 * names, so an author reads the same message either way. No row is written.
 *
 * @param rows - The rows an import built for one package.
 * @param flag - The absorbing flag whose hosts to check.
 * @returns The refusal for the first banned node, or nothing.
 */
export const absorbedFinding = (rows: Rows, flag: Flag): ImportRefused | undefined => {
  const nodes = Rows.of(rows, Node);
  const byId = new Map<Uuid, NodeRow>(nodes.map((node) => [node.id, node]));
  const edges = edgesByParent(rows);
  const children = new Set(Rows.of(rows, Edge).map((edge) => edge.child));

  const pending = nodes.filter((node) => !children.has(node.id)).toReversed();
  const hosts: NodeRow[] = [];
  while (pending.length > 0) {
    const node = pending.pop();
    if (node === undefined) {
      break;
    }

    if (
      (KindEnters[node.kind] ?? []).includes(flag) &&
      !absorbing.some((held) => flagsOf(node.ancestry).includes(held))
    ) {
      hosts.push(node);
    }

    for (const edge of (edges.get(node.id) ?? []).toReversed()) {
      const child = byId.get(edge.child);
      if (child !== undefined) {
        pending.push(child);
      }
    }
  }

  for (const host of hosts) {
    const walk: [NodeRow, readonly Flag[]][] = [];
    const descend = (parent: NodeRow, at: readonly Flag[]): void => {
      const inner = unabsorbedStep(at, parent.kind);
      for (const edge of (edges.get(parent.id) ?? []).toReversed()) {
        const child = byId.get(edge.child);
        if (child !== undefined) {
          walk.push([child, inner]);
        }
      }
    };

    descend(host, flagsOf(host.ancestry));
    for (let next = walk.pop(); next !== undefined; next = walk.pop()) {
      const [node, at] = next;
      if (refuses(at, node.kind)) {
        return refusalOf(node, host, at);
      }

      descend(node, at);
    }
  }

  return undefined;
};
