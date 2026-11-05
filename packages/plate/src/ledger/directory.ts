/**
 * Where the conformance ledger lives: the folder the one command writes its outputs to and the
 * playground's ledger page reads `ledger.json` from, one setting for both.
 *
 * @module
 */
import path from "node:path";
import { Config } from "effect";

/**
 * The package directory, `packages/plate`, which a relative `PLATE_LEDGER_DIR` is read from,
 * wherever the process was started.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * The ledger's folder: `PLATE_LEDGER_DIR`, read from the package directory when relative, and
 * `work/ledger` in the package when it is not set.
 */
export const ledgerDirectory = Config.NonEmptyString("PLATE_LEDGER_DIR").pipe(
  Config.withDefault(path.join("work", "ledger")),
  Config.map((directory) => path.resolve(packageDirectory, directory)),
);
