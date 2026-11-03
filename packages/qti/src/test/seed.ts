import { execFileSync } from "node:child_process";

/**
 * The largest seed output `printSeed` accepts: 256 MiB. The full seed is about 7 MB, and
 * `execFileSync`'s default 1 MiB buffer is smaller than it (`src/schema/qti.test.ts` measures the
 * same limit), so a spawn without this buffer fails with `ENOBUFS`.
 */
const SEED_BUFFER = 256 * 1024 * 1024;

/**
 * Print the seed with `scripts/seed-sql.ts` and return its output. Run from `packages/qti`.
 *
 * @param args - The script's arguments, such as `--only` and `--minus`; empty prints the full seed.
 * @returns The SQL the script printed, in a buffer large enough to hold the full seed.
 */
export const printSeed = (args: readonly string[]): string =>
  execFileSync(process.execPath, ["scripts/seed-sql.ts", ...args], {
    encoding: "utf-8",
    maxBuffer: SEED_BUFFER,
  });
