/**
 * The React layer's surface, which `@qti-pie/plate/react` publishes (decision D6): the contract's
 * types, the core pieces, one component per interaction, the status region, the navigation and the
 * test layer. React and React DOM are optional peer dependencies of plate, needed only here.
 *
 * @module
 */
export type {
  CreateTestServer,
  InteractionComponent,
  InteractionParts,
  InteractionProps,
  InteractionStateProps,
  ItemProps,
  ItemViewPayload,
  NavigationProps,
  PartComponent,
  PartOverrides,
  PartProps,
  Posted,
  StatusProps,
  Submit,
  TestProviderProps,
  TestServerOptions,
  TestSessionState,
  TestSessionStore,
  TestTransport,
  TimerState,
  UseParts,
  UseUpgrade,
} from "#plate/react/contract.tsx";

export type { NoticeProps } from "#plate/react/parts.tsx";

export { Notice, useParts, useUpgrade } from "#plate/react/parts.tsx";

export { Item } from "#plate/react/item.tsx";

export { Associate } from "#plate/react/associate.tsx";

export { Choice } from "#plate/react/choice.tsx";

export { Drawing } from "#plate/react/drawing.tsx";

export { EndAttempt } from "#plate/react/end-attempt.tsx";

export { ExtendedText } from "#plate/react/extended-text.tsx";

export { GapMatch } from "#plate/react/gap-match.tsx";

export { GraphicAssociate } from "#plate/react/graphic-associate.tsx";

export { GraphicGapMatch } from "#plate/react/graphic-gap-match.tsx";

export { GraphicOrder } from "#plate/react/graphic-order.tsx";

export { Hotspot } from "#plate/react/hotspot.tsx";

export { Hottext } from "#plate/react/hottext.tsx";

export { InlineChoice } from "#plate/react/inline-choice.tsx";

export { Match } from "#plate/react/match.tsx";

export { Media } from "#plate/react/media.tsx";

export { Navigation } from "#plate/react/navigation.tsx";

export { Order } from "#plate/react/order.tsx";

export { PortableCustom } from "#plate/react/portable-custom.tsx";

export { PositionObject } from "#plate/react/position-object.tsx";

export { SelectPoint } from "#plate/react/select-point.tsx";

export { Slider } from "#plate/react/slider.tsx";

export { Status } from "#plate/react/status.tsx";

export {
  fetchTransport,
  NoTestProvider,
  NotImplemented,
  TestProvider,
  useCurrentItem,
  useNavigation,
  useSubmit,
  useTestSession,
  useTimer,
} from "#plate/react/test-provider.tsx";

export { TextEntry } from "#plate/react/text-entry.tsx";

export { Upload } from "#plate/react/upload.tsx";
