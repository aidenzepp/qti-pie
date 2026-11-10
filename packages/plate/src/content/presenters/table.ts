/**
 * The table of catalog presenters, one per predefined catalog support: the one place that holds
 * them, which the catalog module reads to present an active card. A record over `CatalogSupport`,
 * so a support added to the vocabulary or taken from it changes this table or fails to compile;
 * a presenter that lands changes only its own file. An `ext:` support has no presenter: the
 * catalog module leaves its cards dormant.
 *
 * @module
 */
import type { CatalogPresenter } from "#plate/content/contract.ts";
import { additionalDirectionsPresenter } from "#plate/content/presenters/additional-directions.ts";
import { audioDescriptionPresenter } from "#plate/content/presenters/audio-description.ts";
import { braillePresenter } from "#plate/content/presenters/braille.ts";
import { glossaryOnScreenPresenter } from "#plate/content/presenters/glossary-on-screen.ts";
import { highContrastPresenter } from "#plate/content/presenters/high-contrast.ts";
import { keyboardDirectionsPresenter } from "#plate/content/presenters/keyboard-directions.ts";
import { keywordTranslationPresenter } from "#plate/content/presenters/keyword-translation.ts";
import { linguisticGuidancePresenter } from "#plate/content/presenters/linguistic-guidance.ts";
import { longDescriptionPresenter } from "#plate/content/presenters/long-description.ts";
import { signLanguagePresenter } from "#plate/content/presenters/sign-language.ts";
import { simplifiedGraphicsPresenter } from "#plate/content/presenters/simplified-graphics.ts";
import { simplifiedLanguagePortionsPresenter } from "#plate/content/presenters/simplified-language-portions.ts";
import { spokenPresenter } from "#plate/content/presenters/spoken.ts";
import { tactilePresenter } from "#plate/content/presenters/tactile.ts";
import { transcriptPresenter } from "#plate/content/presenters/transcript.ts";
import type { CatalogSupport } from "#plate/supports.ts";

/**
 * The presenter of each predefined catalog support, by support.
 */
export const presenters = {
  "additional-directions": additionalDirectionsPresenter,
  "audio-description": audioDescriptionPresenter,
  braille: braillePresenter,
  "glossary-on-screen": glossaryOnScreenPresenter,
  "high-contrast": highContrastPresenter,
  "keyboard-directions": keyboardDirectionsPresenter,
  "keyword-translation": keywordTranslationPresenter,
  "linguistic-guidance": linguisticGuidancePresenter,
  "long-description": longDescriptionPresenter,
  "sign-language": signLanguagePresenter,
  "simplified-graphics": simplifiedGraphicsPresenter,
  "simplified-language-portions": simplifiedLanguagePortionsPresenter,
  spoken: spokenPresenter,
  tactile: tactilePresenter,
  transcript: transcriptPresenter,
} as const satisfies { readonly [S in CatalogSupport]: CatalogPresenter<S> };

/**
 * The presenters as each declares itself.
 */
export type Presenters = typeof presenters;
