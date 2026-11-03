/**
 * The value-arm contracts of the schema: for each context of the value table of `value.ts`, one
 * grizzle `contract` per base type, over the field type `lexicalOf` returns for it.
 *
 * They live apart from the written-out contracts of `contracts.ts` because they read `value.ts`,
 * which reads the schema in turn; `contracts.ts` imports only `patterns`.
 */
import { contract } from "@bjornpagen/grizzle";
import type { ValueContext } from "#qti/schema/value.ts";
import { lexicalOf } from "#qti/schema/value.ts";

/**
 * The base types a value arm holds a contract for, as the keys of one context's contracts.
 */
type ArmBaseType =
  | "directedPair"
  | "duration"
  | "float"
  | "identifier"
  | "integer"
  | "pair"
  | "point"
  | "uri";

/**
 * A value-arm contract as the exhaustiveness check reads it: a named constructor.
 */
interface Arm {
  readonly name: string;
}

/**
 * Mint the 64 value-arm contracts: for each of the eight contexts of `valueContexts`, one contract
 * named `<Context><BaseType>Value` for each of the base types `Integer`, `Float`, `Duration`,
 * `Pair`, `DirectedPair`, `Point`, `Uri` and `Identifier`, over the field type
 * `lexicalOf(context)` returns for it, so the table in `value.ts` stays the one source of the
 * lexical forms. The result is keyed by context and then by base type.
 *
 * A contract's name is a literal type, so each name is written out; the `satisfies` clause refuses
 * a context of the table that is missing here, and the module's test compares the keys and the
 * names to the table. Each call mints new contracts, so a caller keeps the result and calls once.
 */
export const valueArmContracts = () =>
  ({
    Declared: {
      directedPair: contract("DeclaredDirectedPairValue", lexicalOf("Declared").directedPair),
      duration: contract("DeclaredDurationValue", lexicalOf("Declared").duration),
      float: contract("DeclaredFloatValue", lexicalOf("Declared").float),
      identifier: contract("DeclaredIdentifierValue", lexicalOf("Declared").identifier),
      integer: contract("DeclaredIntegerValue", lexicalOf("Declared").integer),
      pair: contract("DeclaredPairValue", lexicalOf("Declared").pair),
      point: contract("DeclaredPointValue", lexicalOf("Declared").point),
      uri: contract("DeclaredUriValue", lexicalOf("Declared").uri),
    },
    InterpolationDefault: {
      directedPair: contract(
        "InterpolationDefaultDirectedPairValue",
        lexicalOf("InterpolationDefault").directedPair,
      ),
      duration: contract(
        "InterpolationDefaultDurationValue",
        lexicalOf("InterpolationDefault").duration,
      ),
      float: contract("InterpolationDefaultFloatValue", lexicalOf("InterpolationDefault").float),
      identifier: contract(
        "InterpolationDefaultIdentifierValue",
        lexicalOf("InterpolationDefault").identifier,
      ),
      integer: contract(
        "InterpolationDefaultIntegerValue",
        lexicalOf("InterpolationDefault").integer,
      ),
      pair: contract("InterpolationDefaultPairValue", lexicalOf("InterpolationDefault").pair),
      point: contract("InterpolationDefaultPointValue", lexicalOf("InterpolationDefault").point),
      uri: contract("InterpolationDefaultUriValue", lexicalOf("InterpolationDefault").uri),
    },
    InterpolationTarget: {
      directedPair: contract(
        "InterpolationTargetDirectedPairValue",
        lexicalOf("InterpolationTarget").directedPair,
      ),
      duration: contract(
        "InterpolationTargetDurationValue",
        lexicalOf("InterpolationTarget").duration,
      ),
      float: contract("InterpolationTargetFloatValue", lexicalOf("InterpolationTarget").float),
      identifier: contract(
        "InterpolationTargetIdentifierValue",
        lexicalOf("InterpolationTarget").identifier,
      ),
      integer: contract(
        "InterpolationTargetIntegerValue",
        lexicalOf("InterpolationTarget").integer,
      ),
      pair: contract("InterpolationTargetPairValue", lexicalOf("InterpolationTarget").pair),
      point: contract("InterpolationTargetPointValue", lexicalOf("InterpolationTarget").point),
      uri: contract("InterpolationTargetUriValue", lexicalOf("InterpolationTarget").uri),
    },
    Literal: {
      directedPair: contract("LiteralDirectedPairValue", lexicalOf("Literal").directedPair),
      duration: contract("LiteralDurationValue", lexicalOf("Literal").duration),
      float: contract("LiteralFloatValue", lexicalOf("Literal").float),
      identifier: contract("LiteralIdentifierValue", lexicalOf("Literal").identifier),
      integer: contract("LiteralIntegerValue", lexicalOf("Literal").integer),
      pair: contract("LiteralPairValue", lexicalOf("Literal").pair),
      point: contract("LiteralPointValue", lexicalOf("Literal").point),
      uri: contract("LiteralUriValue", lexicalOf("Literal").uri),
    },
    MapKey: {
      directedPair: contract("MapKeyDirectedPairValue", lexicalOf("MapKey").directedPair),
      duration: contract("MapKeyDurationValue", lexicalOf("MapKey").duration),
      float: contract("MapKeyFloatValue", lexicalOf("MapKey").float),
      identifier: contract("MapKeyIdentifierValue", lexicalOf("MapKey").identifier),
      integer: contract("MapKeyIntegerValue", lexicalOf("MapKey").integer),
      pair: contract("MapKeyPairValue", lexicalOf("MapKey").pair),
      point: contract("MapKeyPointValue", lexicalOf("MapKey").point),
      uri: contract("MapKeyUriValue", lexicalOf("MapKey").uri),
    },
    MatchDefault: {
      directedPair: contract(
        "MatchDefaultDirectedPairValue",
        lexicalOf("MatchDefault").directedPair,
      ),
      duration: contract("MatchDefaultDurationValue", lexicalOf("MatchDefault").duration),
      float: contract("MatchDefaultFloatValue", lexicalOf("MatchDefault").float),
      identifier: contract("MatchDefaultIdentifierValue", lexicalOf("MatchDefault").identifier),
      integer: contract("MatchDefaultIntegerValue", lexicalOf("MatchDefault").integer),
      pair: contract("MatchDefaultPairValue", lexicalOf("MatchDefault").pair),
      point: contract("MatchDefaultPointValue", lexicalOf("MatchDefault").point),
      uri: contract("MatchDefaultUriValue", lexicalOf("MatchDefault").uri),
    },
    MatchTarget: {
      directedPair: contract("MatchTargetDirectedPairValue", lexicalOf("MatchTarget").directedPair),
      duration: contract("MatchTargetDurationValue", lexicalOf("MatchTarget").duration),
      float: contract("MatchTargetFloatValue", lexicalOf("MatchTarget").float),
      identifier: contract("MatchTargetIdentifierValue", lexicalOf("MatchTarget").identifier),
      integer: contract("MatchTargetIntegerValue", lexicalOf("MatchTarget").integer),
      pair: contract("MatchTargetPairValue", lexicalOf("MatchTarget").pair),
      point: contract("MatchTargetPointValue", lexicalOf("MatchTarget").point),
      uri: contract("MatchTargetUriValue", lexicalOf("MatchTarget").uri),
    },
    Usage: {
      directedPair: contract("UsageDirectedPairValue", lexicalOf("Usage").directedPair),
      duration: contract("UsageDurationValue", lexicalOf("Usage").duration),
      float: contract("UsageFloatValue", lexicalOf("Usage").float),
      identifier: contract("UsageIdentifierValue", lexicalOf("Usage").identifier),
      integer: contract("UsageIntegerValue", lexicalOf("Usage").integer),
      pair: contract("UsagePairValue", lexicalOf("Usage").pair),
      point: contract("UsagePointValue", lexicalOf("Usage").point),
      uri: contract("UsageUriValue", lexicalOf("Usage").uri),
    },
  }) satisfies { [Context in ValueContext]: Record<ArmBaseType, Arm> };
