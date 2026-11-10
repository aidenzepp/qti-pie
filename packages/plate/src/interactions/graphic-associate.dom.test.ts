/**
 * Graphic Associate's (Q-7) runtime controller in each engine's page, over the core's fixture
 * rendered into an item root with its live part and upgraded through the page's registry: the pair
 * made by keys alone and by two clicks, the refusals, the removal of a pair, the posted form, the
 * size of every hotspot, and the upgrade and teardown contracts.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`, and the page carries `src/styles.css`, so what a hotspot takes of
 * the pointer and how large it is are the stylesheet's.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import { controller } from "#plate/interactions/graphic-associate.dom.ts";
import { redact, render } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { readHidden } from "#plate/runtime/wire.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The core's fixture, relative to the package, which `commands.readFile` resolves against.
 */
const fixturePath = "fixtures/ei/items/graphic-associate.xml";

/**
 * The item instance every render in this file uses, so a hotspot's entry name is `w0d.RESPONSE`.
 */
const instance = "w0d";

/**
 * The name the hidden inputs post under.
 */
const entry = entryName(instance, "RESPONSE");

/**
 * The `data-slot` marker of each part the cases read, as the core writes them.
 */
const slots = {
  hidden: "graphic-associate-interaction-hidden",
  hotspot: "graphic-associate-interaction-hotspot",
  pair: "graphic-associate-interaction-pair",
  pairs: "graphic-associate-interaction-pairs",
  root: "graphic-associate-interaction",
} as const;

/**
 * A 320 by 200 picture, as a data URL, so the fixture's image needs no file and the image part is
 * the size its `width` and `height` give it in either engine.
 */
const picture = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#9bc"/></svg>',
)}`;

/**
 * How a case differs from the core's fixture rendered as is.
 */
interface Variant {
  /**
   * The render's `mode`, `answering` when absent.
   */
  readonly mode?: Options["mode"];
  /**
   * The values the render shows, such as a restored response.
   */
  readonly values?: Options["values"];
  /**
   * A rewrite of the fixture's XML, for a limit the fixture does not write.
   */
  readonly xml?: (text: string) => string;
}

/**
 * The render's options as a case builds them, one input at a time.
 */
type RenderInputs = { -readonly [K in keyof Options]: Options[K] };

/**
 * A rendered, mounted item.
 */
interface Page {
  /**
   * The container the item and its form sit in, which the case removes.
   */
  readonly container: HTMLElement;
  /**
   * The form the item sits in, which a case posts.
   */
  readonly form: HTMLFormElement;
  /**
   * Find a hotspot by its identifier.
   *
   * @param identifier The hotspot's `identifier`.
   * @returns Its list item.
   */
  readonly hotspot: (identifier: string) => HTMLElement;
  /**
   * The item's live part.
   */
  readonly live: HTMLElement;
  /**
   * The interaction's root.
   */
  readonly root: HTMLElement;
}

/**
 * Make sure the page carries plate's stylesheet, which the pointer and the sizes depend on.
 *
 * @returns A promise that settles once the stylesheet is in the page.
 */
const ensureStyles = async (): Promise<void> => {
  if (document.querySelector("style[data-test='plate']") !== null) {
    return;
  }

  const style = document.createElement("style");

  style.dataset["test"] = "plate";
  style.textContent = await commands.readFile("src/styles.css");
  document.head.append(style);
};

/**
 * Render the fixture as plate's SSR writes it.
 *
 * @param variant What differs from the fixture as is.
 * @returns The item's HTML.
 */
const renderedHtml = (variant: Variant) =>
  Effect.gen(function* renderFixture() {
    const text = yield* Effect.promise(() => commands.readFile(fixturePath));
    const bytes = new TextEncoder().encode(variant.xml === undefined ? text : variant.xml(text));
    const accepted = Option.getOrThrow(acceptedItem(yield* open(fixturePath, bytes)));
    const configuration = yield* configure({});

    const options: RenderInputs = { instance };

    if (variant.mode !== undefined) {
      options.mode = variant.mode;
    }

    if (variant.values !== undefined) {
      options.values = variant.values;
    }

    return Result.getOrThrow(render(redact(accepted), configuration, options)).html;
  });

/**
 * Render the fixture and mount it in a form at the end of the page's body.
 *
 * @param variant What differs from the fixture as is.
 * @returns The mounted item.
 */
const mountPage = async (variant: Variant = {}): Promise<Page> => {
  await ensureStyles();

  const html = await Effect.runPromise(renderedHtml(variant));
  const container = document.createElement("div");

  container.innerHTML = `<form>${html.replace('src="images/graphic-associate-map.svg"', `src="${picture}"`)}</form>`;
  document.body.append(container);

  const form = container.querySelector("form");
  const root = container.querySelector<HTMLElement>(`[data-slot="${slots.root}"]`);
  const live = container.querySelector<HTMLElement>('[data-slot="item-live"]');

  assert.isNotNull(form);
  assert.isNotNull(root);
  assert.isNotNull(live);

  return {
    container,
    form,
    hotspot: (identifier) =>
      [...root.querySelectorAll<HTMLElement>(`[data-slot="${slots.hotspot}"]`)].find(
        (element) => element.dataset["identifier"] === identifier,
      ) ?? assert.fail(`no hotspot ${identifier}`),
    live,
    root,
  };
};

/**
 * Mount an item, upgrade it, run a case, and tear everything down whatever the case does.
 *
 * @param variant What differs from the fixture as is.
 * @param body The case.
 * @returns A promise of the case's end.
 */
const withPage = async (
  variant: Variant,
  body: (page: Page) => Promise<void> | void,
): Promise<void> => {
  const page = await mountPage(variant);
  const upgraded = upgrade(page.container);

  try {
    await body(page);
  } finally {
    upgraded.teardown();
    page.container.remove();
  }
};

/**
 * Wait for two animation frames, so a text the live region writes on the next frame is written.
 *
 * @returns A promise of the second frame's timestamp.
 */
const frames = (): Promise<number> =>
  Effect.runPromise(
    Effect.callback<number>((resume) => {
      requestAnimationFrame(() => {
        requestAnimationFrame((time) => {
          resume(Effect.succeed(time));
        });
      });
    }),
  );

/**
 * Read what the item's live region says now.
 *
 * @param page The mounted item.
 * @returns The region's text, once the frame that writes it has passed.
 */
const heard = async (page: Page): Promise<string> => {
  await frames();

  return page.live.textContent;
};

/**
 * Dispatch a `keydown` at an element, bubbling and cancelable, as a key press reaches the page.
 *
 * @param element The element the key is pressed on.
 * @param key The event's `key`.
 * @returns The event, to read `defaultPrevented` from.
 */
const press = (element: Element, key: string): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });

  element.dispatchEvent(event);

  return event;
};

/**
 * Dispatch a `click` at an element, bubbling and cancelable, as a single pointer press reaches the
 * page.
 *
 * @param element The element clicked.
 */
const click = (element: Element): void => {
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
};

/**
 * Find the shape a hotspot draws, the element a pointer lands on.
 *
 * @param hotspot The hotspot's list item.
 * @returns The first element of its outline.
 */
const drawingOf = (hotspot: HTMLElement): Element =>
  hotspot.querySelector("svg > *") ?? assert.fail("a hotspot without a drawn area");

/**
 * Pick one hotspot up, move the cursor to another and place it there, by keys.
 *
 * @param page The mounted item.
 * @param from The identifier of the hotspot picked up.
 * @param to The identifier of the hotspot placed on.
 */
const pair = (page: Page, from: string, to: string): void => {
  const source = page.hotspot(from);
  const identifiers = [
    ...page.root.querySelectorAll<HTMLElement>(`[data-slot="${slots.hotspot}"]`),
  ].map((element) => element.dataset["identifier"]);

  press(source, "Enter");
  press(source, "Home");

  for (let step = 0; step < identifiers.indexOf(to); step += 1) {
    press(source, "ArrowRight");
  }

  press(source, "Enter");
};

/**
 * Read the pairs the response holds, one `"<a> <b>"` per hidden input.
 *
 * @param page The mounted item.
 * @returns The pairs, in the order made.
 */
const posted = (page: Page): readonly string[] => readHidden(page.root, entry);

/**
 * Read the pairs the list shows, by the `data-pair` of each.
 *
 * @param page The mounted item.
 * @returns The pairs, in the order shown.
 */
const listed = (page: Page): readonly string[] =>
  [...page.root.querySelectorAll<HTMLElement>(`[data-slot="${slots.pair}"]`)].map(
    (element) => element.dataset["pair"] ?? "",
  );

/**
 * Read one hotspot's centre, as the line a pair draws is expected to start or end at.
 *
 * @param x The abscissa in the image's 320 by 200 coordinates.
 * @param y The ordinate.
 * @returns The point.
 */
const point = (x: number, y: number) => ({ x, y });

/**
 * Read the lines the page draws for pairs.
 *
 * @param page The mounted item.
 * @returns Each line's `data-pair` and its two ends.
 */
const lines = (page: Page) =>
  [...page.root.querySelectorAll<SVGLineElement>("svg line")].map((line) => ({
    aria: line.getAttribute("aria-hidden"),
    from: point(line.x1.baseVal.value, line.y1.baseVal.value),
    pair: line.dataset["pair"],
    to: point(line.x2.baseVal.value, line.y2.baseVal.value),
  }));

/**
 * Rewrite the fixture so H1 pairs only with H2 and H3 (`match-group`) and H2 is in at most one pair
 * (`match-max`), the two limits the fixture does not write.
 *
 * @param text The fixture's XML.
 * @returns The XML with the two limits written.
 */
const withLimits = (text: string): string =>
  text
    .replace('identifier="H1" shape="rect"', 'identifier="H1" match-group="H2 H3" shape="rect"')
    .replace(
      'hotspot-label="Anywhere else" match-max="3"',
      'hotspot-label="Anywhere else" match-max="1"',
    );

/**
 * Ignore a mutation record.
 */
const ignored = (): void => undefined;

describe(server.browser, () => {
  describe("the Graphic Associate runtime", () => {
    it("[Q-7] the Graphic Associate controller is implemented and leaves no stub mark", async () => {
      await withPage({}, (page) => {
        assert.isTrue(controller.implemented);
        assert.strictEqual(controller.kind, "graphic-associate");
        assert.isUndefined(page.root.dataset["runtime"]);
      });
    });

    it("[Q-7] keyboard only: pick H1, move to H3, Enter makes the pair and writes its hidden input", async () => {
      await withPage({}, async (page) => {
        const h1 = page.hotspot("H1");

        await userEvent.tab();
        assert.strictEqual(document.activeElement, h1);

        await userEvent.keyboard("{Enter}");
        assert.strictEqual(h1.getAttribute("aria-pressed"), "true");

        await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
        assert.isTrue(Object.hasOwn(page.hotspot("H3").dataset, "cursor"));
        assert.deepStrictEqual(posted(page), []);

        await userEvent.keyboard("{Enter}");

        assert.deepStrictEqual(posted(page), ["H1 H3"]);
        assert.deepStrictEqual(listed(page), ["H1 H3"]);
        assert.strictEqual(
          page.root.querySelector(`[data-slot="${slots.pair}"]`)?.textContent,
          "Well and Barn",
        );
        assert.strictEqual(document.activeElement, h1);
        assert.strictEqual(h1.getAttribute("aria-pressed"), "false");

        const said = await heard(page);

        assert.include(said, "Well");
        assert.include(said, "Barn");
      });
    });

    it("[Q-7] single pointer: click H1, click H3 (WCAG 2.5.7)", async () => {
      await withPage({}, async (page) => {
        const moves: Event[] = [];
        const record = (event: Event) => {
          moves.push(event);
        };

        document.addEventListener("pointermove", record);
        document.addEventListener("mousemove", record);

        try {
          click(drawingOf(page.hotspot("H1")));
          assert.strictEqual(page.hotspot("H1").getAttribute("aria-pressed"), "true");
          assert.deepStrictEqual(posted(page), []);

          click(drawingOf(page.hotspot("H3")));
        } finally {
          document.removeEventListener("pointermove", record);
          document.removeEventListener("mousemove", record);
        }

        assert.deepStrictEqual(posted(page), ["H1 H3"]);
        assert.deepStrictEqual(listed(page), ["H1 H3"]);
        assert.deepStrictEqual(moves, []);

        const said = await heard(page);

        assert.include(said, "Well");
        assert.include(said, "Barn");
      });
    });

    it("[Q-7] a hotspot on itself, or a pair already made in either order, is refused and announced", async () => {
      await withPage({}, async (page) => {
        const h1 = page.hotspot("H1");

        press(h1, "Enter");
        press(h1, "ArrowRight");
        assert.isTrue(Object.hasOwn(h1.dataset, "cursor"));
        press(h1, "Enter");

        assert.deepStrictEqual(posted(page), []);
        assert.deepStrictEqual(listed(page), []);
        assert.match(await heard(page), /Well cannot be paired with itself/u);
        assert.strictEqual(h1.getAttribute("aria-pressed"), "true");
        press(h1, "Escape");

        pair(page, "H1", "H3");
        assert.deepStrictEqual(posted(page), ["H1 H3"]);

        pair(page, "H1", "H3");
        assert.deepStrictEqual(posted(page), ["H1 H3"]);
        assert.match(await heard(page), /Well and Barn are already paired/u);
        press(page.hotspot("H1"), "Escape");

        pair(page, "H3", "H1");
        assert.deepStrictEqual(posted(page), ["H1 H3"]);
        assert.deepStrictEqual(listed(page), ["H1 H3"]);
        assert.match(await heard(page), /Barn and Well are already paired/u);
      });
    });

    it("[Q-7] a hotspot at its match-max is unavailable; a pair outside a match-group is refused", async () => {
      await withPage({ xml: withLimits }, async (page) => {
        pair(page, "H1", "H4");
        assert.deepStrictEqual(posted(page), []);
        assert.match(
          await heard(page),
          /Well cannot be paired with Oak; pair it with one of Anywhere else, Barn/u,
        );
        press(page.hotspot("H1"), "Escape");

        pair(page, "H4", "H1");
        assert.deepStrictEqual(posted(page), []);
        assert.match(await heard(page), /Well cannot be paired with Oak/u);
        press(page.hotspot("H4"), "Escape");

        pair(page, "H1", "H3");
        assert.deepStrictEqual(posted(page), ["H1 H3"]);

        const h2 = page.hotspot("H2");

        assert.isFalse(h2.hasAttribute("aria-disabled"));
        pair(page, "H4", "H2");
        assert.deepStrictEqual(posted(page), ["H1 H3", "H4 H2"]);
        assert.strictEqual(h2.getAttribute("aria-disabled"), "true");
        assert.isFalse(page.hotspot("H4").hasAttribute("aria-disabled"));

        press(h2, "Enter");
        assert.strictEqual(h2.getAttribute("aria-pressed"), "false");
        assert.match(await heard(page), /Anywhere else is at its limit of 1 pair/u);

        pair(page, "H3", "H2");
        assert.deepStrictEqual(posted(page), ["H1 H3", "H4 H2"]);
        assert.match(await heard(page), /Anywhere else is at its limit of 1 pair/u);
      });
    });

    it("[Q-7] removing a pair removes its hidden input", async () => {
      await withPage({}, async (page) => {
        pair(page, "H1", "H3");
        pair(page, "H3", "H4");
        assert.deepStrictEqual(posted(page), ["H1 H3", "H3 H4"]);

        const [first, second] = page.root.querySelectorAll<HTMLElement>(
          `[data-slot="${slots.pair}"]`,
        );

        assert.isDefined(first);
        assert.isDefined(second);
        assert.strictEqual(first.getAttribute("tabindex"), "0");

        const event = press(first, "Delete");

        assert.isTrue(event.defaultPrevented);
        assert.deepStrictEqual(posted(page), ["H3 H4"]);
        assert.deepStrictEqual(listed(page), ["H3 H4"]);
        assert.isFalse(Object.hasOwn(page.hotspot("H1").dataset, "paired"));
        assert.isTrue(Object.hasOwn(page.hotspot("H3").dataset, "paired"));
        assert.match(await heard(page), /Well and Barn/u);

        click(second);
        assert.deepStrictEqual(posted(page), []);
        assert.deepStrictEqual(listed(page), []);
        assert.isFalse(Object.hasOwn(page.hotspot("H3").dataset, "paired"));
        assert.isFalse(Object.hasOwn(page.hotspot("H4").dataset, "paired"));
      });
    });

    it("[Q-7] the posted form decodes to the pairs made", async () => {
      await withPage({}, (page) => {
        pair(page, "H1", "H3");
        pair(page, "H3", "H4");

        const decoded = Result.getOrThrow(
          decode([...new FormData(page.form)], {
            baseType: "pair",
            cardinality: "multiple",
            name: entry,
          }),
        );

        assert.deepStrictEqual(
          decoded.values.map((single) =>
            single.baseType === "pair" ? single.value.join(" ") : "",
          ),
          ["H1 H3", "H3 H4"],
        );
      });
    });

    it("[Q-7] each hotspot target is at least 24 by 24 CSS pixels", async () => {
      await withPage({}, (page) => {
        const hotspots = [
          ...page.root.querySelectorAll<HTMLElement>(`[data-slot="${slots.hotspot}"]`),
        ];

        assert.lengthOf(hotspots, 4);

        for (const hotspot of hotspots) {
          const operable = hotspot.getAttribute("tabindex") === "0";
          const box = hotspot.getBoundingClientRect();
          const drawn = drawingOf(hotspot).getBoundingClientRect();

          assert.isTrue(operable, `${hotspot.dataset["identifier"]} takes the keyboard`);
          assert.isAtLeast(box.width, 24, `${hotspot.dataset["identifier"]} width`);
          assert.isAtLeast(box.height, 24, `${hotspot.dataset["identifier"]} height`);
          assert.isAtLeast(drawn.width, 24, `${hotspot.dataset["identifier"]} drawn width`);
          assert.isAtLeast(drawn.height, 24, `${hotspot.dataset["identifier"]} drawn height`);
        }
      });
    });

    it("[Q-7] upgrade moves no focus and announces nothing; teardown removes every listener and keeps the hidden inputs", async () => {
      const page = await mountPage();
      const focused: EventTarget[] = [];
      const record = (event: FocusEvent) => {
        focused.push(event.target ?? document);
      };
      const before = document.activeElement;

      document.addEventListener("focusin", record);

      const upgraded = upgrade(page.container);

      await frames();
      document.removeEventListener("focusin", record);

      try {
        assert.strictEqual(document.activeElement, before);
        assert.deepStrictEqual(focused, []);
        assert.strictEqual(page.live.textContent, "");

        pair(page, "H1", "H3");
        assert.deepStrictEqual(posted(page), ["H1 H3"]);

        upgraded.teardown();

        assert.deepStrictEqual(posted(page), ["H1 H3"]);
        assert.deepStrictEqual(listed(page), []);
        assert.isFalse(Object.hasOwn(page.hotspot("H1").dataset, "paired"));
        assert.deepStrictEqual(lines(page), []);

        for (const hotspot of page.root.querySelectorAll<HTMLElement>(
          `[data-slot="${slots.hotspot}"]`,
        )) {
          for (const name of ["tabindex", "role", "aria-pressed", "aria-disabled", "data-cursor"]) {
            assert.isFalse(hotspot.hasAttribute(name), `${hotspot.dataset["identifier"]} ${name}`);
          }

          assert.isFalse(drawingOf(hotspot).hasAttribute("pointer-events"));
        }

        await frames();

        const written = new MutationObserver(ignored);

        written.observe(page.live, { characterData: true, childList: true, subtree: true });

        pair(page, "H3", "H4");
        click(drawingOf(page.hotspot("H1")));
        click(drawingOf(page.hotspot("H4")));
        await frames();

        assert.deepStrictEqual(written.takeRecords(), []);
        written.disconnect();
        assert.deepStrictEqual(posted(page), ["H1 H3"]);
      } finally {
        upgraded.teardown();
        page.container.remove();
      }
    });

    it("[Q-7] a pair is drawn on the image as an aria-hidden line between its two hotspots, and removed with it", async () => {
      await withPage({}, (page) => {
        pair(page, "H1", "H3");
        assert.deepStrictEqual(lines(page), [
          { aria: "true", from: point(55, 60), pair: "H1 H3", to: point(170, 70) },
        ]);
        assert.isTrue(Object.hasOwn(page.hotspot("H1").dataset, "paired"));
        assert.isTrue(Object.hasOwn(page.hotspot("H3").dataset, "paired"));

        pair(page, "H4", "H2");
        assert.deepStrictEqual(
          lines(page).map(({ from, pair: made, to }) => ({ from, made, to })),
          [
            { from: point(55, 60), made: "H1 H3", to: point(170, 70) },
            { from: point(260, 140), made: "H4 H2", to: point(160, 100) },
          ],
        );

        press(
          page.root.querySelector<HTMLElement>(`[data-slot="${slots.pair}"]`) ?? page.root,
          "Delete",
        );
        assert.deepStrictEqual(
          lines(page).map(({ pair: made }) => made),
          ["H4 H2"],
        );
      });
    });

    it("[Q-7] the drawn area of a hotspot takes the pointer, and the default area takes the rest of the image", async () => {
      await withPage({}, (page) => {
        const image = page.root.querySelector<HTMLElement>("img");

        assert.isNotNull(image);
        image.scrollIntoView();

        const box = image.getBoundingClientRect();
        const hit = (x: number, y: number): string | undefined =>
          document
            .elementFromPoint(box.left + x, box.top + y)
            ?.closest<HTMLElement>(`[data-slot="${slots.hotspot}"]`)?.dataset["identifier"];

        assert.strictEqual(hit(55, 60), "H1");
        assert.strictEqual(hit(170, 70), "H3");
        assert.strictEqual(hit(260, 150), "H4");
        assert.strictEqual(hit(300, 20), "H2");
      });
    });

    it("[Q-7] max-associations makes every hotspot unavailable until a pair is removed", async () => {
      await withPage({}, async (page) => {
        pair(page, "H1", "H3");
        pair(page, "H3", "H4");
        pair(page, "H4", "H2");
        assert.lengthOf(posted(page), 3);

        for (const identifier of ["H1", "H2", "H3", "H4"]) {
          assert.strictEqual(
            page.hotspot(identifier).getAttribute("aria-disabled"),
            "true",
            identifier,
          );
        }

        press(page.hotspot("H1"), "Enter");
        assert.strictEqual(page.hotspot("H1").getAttribute("aria-pressed"), "false");
        assert.match(await heard(page), /at most 3 pairs/u);

        press(
          page.root.querySelector<HTMLElement>(`[data-slot="${slots.pair}"]`) ?? page.root,
          "Backspace",
        );
        assert.lengthOf(posted(page), 2);
        assert.isFalse(page.hotspot("H1").hasAttribute("aria-disabled"));
      });
    });

    it("[Q-7] a restored response shows its pairs, draws them, and counts them against each limit", async () => {
      const values: Options["values"] = {
        RESPONSE: {
          baseType: "pair",
          cardinality: "multiple",
          values: [
            { baseType: "pair", value: ["H1", "H3"] },
            { baseType: "pair", value: ["H3", "H4"] },
          ],
        },
      };

      await withPage({ values }, async (page) => {
        assert.deepStrictEqual(posted(page), ["H1 H3", "H3 H4"]);
        assert.deepStrictEqual(listed(page), ["H1 H3", "H3 H4"]);
        assert.lengthOf(lines(page), 2);
        assert.strictEqual(page.hotspot("H3").getAttribute("aria-disabled"), "true");
        assert.isFalse(page.hotspot("H1").hasAttribute("aria-disabled"));

        pair(page, "H2", "H3");
        assert.deepStrictEqual(posted(page), ["H1 H3", "H3 H4"]);
        assert.match(await heard(page), /Barn is at its limit of 2 pairs/u);
        press(page.hotspot("H2"), "Escape");

        pair(page, "H1", "H4");
        assert.deepStrictEqual(posted(page), ["H1 H3", "H3 H4", "H1 H4"]);

        press(
          page.root.querySelector<HTMLElement>(`[data-slot="${slots.pair}"]`) ?? page.root,
          "Delete",
        );
        assert.deepStrictEqual(posted(page), ["H3 H4", "H1 H4"]);
        assert.isFalse(page.hotspot("H3").hasAttribute("aria-disabled"));
      });
    });

    it("[Q-7] a finished or reviewed item gets no input behaviour, and still draws its pairs", async () => {
      const values: Options["values"] = {
        RESPONSE: {
          baseType: "pair",
          cardinality: "multiple",
          values: [{ baseType: "pair", value: ["H1", "H3"] }],
        },
      };

      await withPage({ mode: "review", values }, (page) => {
        const h1 = page.hotspot("H1");

        assert.deepStrictEqual(posted(page), []);
        assert.deepStrictEqual(listed(page), ["H1 H3"]);
        assert.lengthOf(lines(page), 1);

        for (const hotspot of page.root.querySelectorAll<HTMLElement>(
          `[data-slot="${slots.hotspot}"]`,
        )) {
          assert.isFalse(hotspot.hasAttribute("tabindex"));
          assert.isFalse(hotspot.hasAttribute("aria-pressed"));
        }

        assert.isFalse(press(h1, "Enter").defaultPrevented);
        click(drawingOf(h1));
        assert.isFalse(h1.hasAttribute("aria-pressed"));
        assert.deepStrictEqual(posted(page), []);
        assert.isFalse(drawingOf(h1).hasAttribute("pointer-events"));
      });
    });

    it("[Q-7] a root without its entry name, or without its hotspots, attaches nothing and tears down cleanly", async () => {
      const page = await mountPage();

      delete page.root.dataset["entryName"];

      const nameless = upgrade(page.container);

      try {
        assert.deepStrictEqual(
          nameless.controllers.map(({ kind }) => kind),
          ["graphic-associate"],
        );

        for (const hotspot of page.root.querySelectorAll<HTMLElement>(
          `[data-slot="${slots.hotspot}"]`,
        )) {
          assert.isFalse(hotspot.hasAttribute("tabindex"));
        }

        press(page.hotspot("H1"), "Enter");
        assert.isFalse(page.hotspot("H1").hasAttribute("aria-pressed"));
        assert.deepStrictEqual(posted(page), []);
      } finally {
        nameless.teardown();
        page.container.remove();
      }

      const bare = document.createElement("div");

      bare.innerHTML = `<div data-slot="item"><div data-slot="item-live" aria-live="polite"></div><div data-slot="${slots.root}" data-entry-name="${entry}"></div></div>`;
      document.body.append(bare);

      const upgraded = upgrade(bare);

      try {
        await frames();
        assert.strictEqual(bare.querySelector('[data-slot="item-live"]')?.textContent, "");
        assert.strictEqual(bare.querySelectorAll("input").length, 0);
      } finally {
        upgraded.teardown();
        bare.remove();
      }
    });
  });
});
