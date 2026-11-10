/**
 * The law oracle's tables (`#pantry/test/oracle.ts` `lawsOf`) over the installed grammar
 * (`#pantry/grammar/install.ts`), built once at load: what every test that judges a package by the
 * grammar the importer reads judges it by.
 */
import { grammar } from "#pantry/grammar/install.ts";
import { lawsOf } from "#pantry/test/oracle.ts";

/**
 * The oracle's tables over the installed grammar.
 */
export const laws = lawsOf(grammar);
