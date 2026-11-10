import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  acceptedItem,
  configure,
  noSupports,
  open,
  readPnp,
  redact,
  render,
} from "#plate/index.ts";
import type { Accepted, PnpSupports, Supports } from "#plate/index.ts";

/**
 * Where the fixture item sits under the package, which `open` takes as the document's location.
 */
const itemLocation = "fixtures/m5/items/spoken.xml";

/**
 * The text of the fixture's `ueb` braille card entry, which nothing else in the item says.
 */
const uebNote = "The unified braille note.";

/**
 * The text of the fixture's `ebae` braille card entry, the card's default.
 */
const ebaeNote = "The American edition braille note.";

/**
 * The instance token every render here passes.
 */
const instance = "q1";

/**
 * Read one of the fixtures of `fixtures/m5` as bytes.
 *
 * @param name The file's path under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m5/${name}`, import.meta.url)));

/**
 * Open the fixture item and accept it.
 */
const acceptFixture: Effect.Effect<Accepted> = Effect.gen(function* acceptFixtureItem() {
  const verdict = yield* open(itemLocation, fixture("items/spoken.xml"));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the fixture item is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Redact the item under the supports and render it, as a host does for one candidate.
 *
 * @param accepted The accepted item.
 * @param supports The supports the redaction and the render both take.
 * @returns The item's HTML.
 */
const renderedHtml = (accepted: Accepted, supports: Supports): Effect.Effect<string> =>
  Effect.gen(function* renderUnder() {
    const configuration = yield* configure({});
    const rendered = yield* Effect.fromResult(
      render(redact(accepted, undefined, configuration, { supports }), configuration, {
        instance,
        supports,
      }),
    );

    return rendered.html;
  }).pipe(Effect.orDie);

/**
 * Read a profile of braille preferences.
 *
 * @param braille The `braille` element's inner XML.
 * @returns The supports read.
 */
const readBraille = (braille: string): Effect.Effect<PnpSupports> =>
  readPnp(
    new TextEncoder().encode(
      `<access-for-all-pnp xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0pnp_v1p0"><braille>${braille}</braille></access-for-all-pnp>`,
    ),
  ).pipe(Effect.orDie);

describe("a braille card's entry, chosen by the candidate's braille type", () => {
  it.effect("[A-10b] the braille card entry matching the braille type is chosen", () =>
    Effect.gen(function* matchingEntry() {
      const accepted = yield* acceptFixture;
      const supports = yield* readPnp(fixture("pnp-spoken.xml")).pipe(Effect.orDie);
      const html = yield* renderedHtml(accepted, supports);

      assert.include(html, uebNote);
      assert.notInclude(html, ebaeNote);
    }),
  );

  it.effect("[A-10b] another braille type chooses the entry that matches it", () =>
    Effect.gen(function* otherType() {
      const accepted = yield* acceptFixture;
      const html = yield* renderedHtml(
        accepted,
        yield* readBraille("<braille-type>ebae</braille-type>"),
      );

      assert.include(html, ebaeNote);
      assert.notInclude(html, uebNote);
    }),
  );

  it.effect("[A-10b] a braille type no entry names gets the card's default entry", () =>
    Effect.gen(function* defaultEntry() {
      const accepted = yield* acceptFixture;

      for (const braille of ["<braille-type>ext:nemeth-only</braille-type>", "<grade>2</grade>"]) {
        const html = yield* renderedHtml(accepted, yield* readBraille(braille));

        assert.include(html, ebaeNote, braille);
        assert.notInclude(html, uebNote, braille);
      }
    }),
  );

  it.effect("[A-10b] without the braille support neither entry shows", () =>
    Effect.gen(function* dormant() {
      const accepted = yield* acceptFixture;
      const html = yield* renderedHtml(accepted, noSupports);

      assert.notInclude(html, uebNote);
      assert.notInclude(html, ebaeNote);
    }),
  );
});
