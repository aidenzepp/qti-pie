/**
 * The test navigation, rendered as React: a stub until issue m3g-02 fills it.
 *
 * @module
 */
import type { ReactNode } from "react";
import type { NavigationProps } from "#plate/react/contract.tsx";
import { markStub, Notice } from "#plate/react/parts.tsx";

/**
 * The navigation `renderNavigation` writes, as React: a stub that renders the item's notice in the
 * configuration's locale, marked a stub (`markStub`). Issue m3g-02 fills it, projecting the
 * navigation's tree through `useParts` and calling `onIntent` with a pressed button's intent.
 *
 * @param props The navigation state and the configuration `renderNavigation` takes.
 * @returns The item's notice.
 */
export const Navigation = markStub(({ configuration }: NavigationProps): ReactNode => (
  <Notice feature="test-navigation" locale={configuration.locale} />
));
