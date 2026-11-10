/**
 * The catalog names of the laws a host judgment lists (`#pantry/test/host-judge.ts` `judge`), so
 * a test that holds the schema's laws over the import's rows to the law oracle compares the two by
 * law name, as the oracle's breaches name them.
 */
import type { Law } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { schemaLawNameOf } from "#pantry/test/law-namer.ts";

/**
 * Name the laws a host judgment lists, each once, in the order the judgment lists them. A law the
 * catalog does not name is left out.
 *
 * @param laws - The judgment's broken or skipped laws.
 * @returns Their catalog names.
 */
export const lawNamesOf = (laws: readonly { readonly law: Law }[]): ReadonlySet<string> =>
  new Set(laws.flatMap(({ law }) => Option.toArray(schemaLawNameOf(law))));
