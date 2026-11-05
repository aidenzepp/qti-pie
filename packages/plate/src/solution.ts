/**
 * An item's correct responses: {@link solution}, a plain function a host calls to show the answers
 * an item declares, such as on a solution page.
 *
 * This is a browser module: it value-imports from `effect` only `Option`, so a host that imports
 * `solution` alone bundles no Schema and no Effect runtime.
 *
 * @module
 */
import { Option } from "effect";
import type { ResponseDeclaration } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { Responses } from "#plate/session/session.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * Give a response declaration's correct response.
 *
 * @param declaration The response declaration.
 * @returns Its `qti-correct-response`, or NULL of its base type and cardinality when it declares
 *   none.
 */
const correctOf = (declaration: ResponseDeclaration): Value =>
  Option.getOrElse(declaration.correct, () =>
    nullOf(declaration.baseType, declaration.cardinality),
  );

/**
 * Give an item's correct responses, by response identifier: each declared response's
 * `qti-correct-response`, and NULL of the declared base type and cardinality where a declaration
 * has none.
 *
 * It takes `check`'s {@link Accepted}, never `redact`'s output, which holds no correct response. A
 * correct response is the one the declaration writes: template processing, which plate does not
 * run and the item's `unsupported` then marks, can set another.
 *
 * @param document The accepted item.
 * @returns A value for every response the item declares, each value of base type integer an exact
 *   `bigint`.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_CorrectResponse
 */
export const solution = (document: Accepted): Responses =>
  Object.fromEntries(
    [...document.item.responses].map(([identifier, declaration]) => [
      identifier,
      correctOf(declaration),
    ]),
  );
