/**
 * The React entry's `ItemScope` piece, the composable layer beneath `TestProvider` (operator ruling
 * OD-8): `@qti-pie/plate/react` exports `ItemScope`, and `ItemScopeProps` names the six props it
 * takes, so a host that wires one item by hand can import both.
 */
import { assert, describe, expectTypeOf, it } from "@effect/vitest";
import type { ReactNode } from "react";
import type { Configuration } from "#plate/configuration.ts";
import type { Redacted } from "#plate/payload.ts";
import * as published from "#plate/react.tsx";
import * as entry from "#plate/react/index.tsx";
import type { ItemScopeProps, PartOverrides } from "#plate/react/index.tsx";
import type { Options } from "#plate/render.ts";

describe("the React entry", () => {
  it("[W0-ITEMSCOPE] the React entry exports ItemScope as a function", () => {
    assert.isFunction(entry.ItemScope);
    assert.isFunction(published.ItemScope);
    assert.strictEqual(published.ItemScope, entry.ItemScope);
  });

  it("[W0-ITEMSCOPE] ItemScopeProps names the six props with the types ItemScope takes", () => {
    expectTypeOf<ItemScopeProps["children"]>().toEqualTypeOf<ReactNode | undefined>();
    expectTypeOf<ItemScopeProps["configuration"]>().toEqualTypeOf<Configuration>();
    expectTypeOf<ItemScopeProps["instance"]>().toEqualTypeOf<string>();
    expectTypeOf<ItemScopeProps["options"]>().toEqualTypeOf<Omit<Options, "parts"> | undefined>();
    expectTypeOf<ItemScopeProps["parts"]>().toEqualTypeOf<PartOverrides | undefined>();
    expectTypeOf<ItemScopeProps["redacted"]>().toEqualTypeOf<Redacted>();
    expectTypeOf<Parameters<typeof entry.ItemScope>[0]>().toEqualTypeOf<ItemScopeProps>();
  });

  it("[W0-ITEMSCOPE] Item is still exported beside ItemScope", () => {
    assert.isFunction(entry.Item);
    assert.isFunction(published.Item);
  });
});
