/**
 * The item's status region, rendered as React: a stub until issue m3g-02 fills it.
 *
 * @module
 */
import type { ReactNode } from "react";
import type { StatusProps } from "#plate/react/contract.tsx";
import { markStub, Notice } from "#plate/react/parts.tsx";

/**
 * The status region `renderStatus` writes, as React: a stub that renders the item's notice in the
 * configuration's locale, marked a stub (`markStub`). Issue m3g-02 fills it, projecting the
 * region's tree through `useParts`.
 *
 * @param props The status input and the configuration `renderStatus` takes.
 * @returns The item's notice.
 */
export const Status = markStub(({ configuration }: StatusProps): ReactNode => (
  <Notice feature="status" locale={configuration.locale} />
));
