/**
 * Product branding — keep in sync with backend APP_NAME / marketing copy.
 * NEXT_PUBLIC_* vars are inlined at build time.
 */
export const APP_SHORT_NAME =
  process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Arclis";

export const APP_FULL_NAME =
  process.env.NEXT_PUBLIC_APP_FULL_NAME?.trim() ||
  "Arclis Financial Intelligence Platform";

/** Shown after "|" in default document title (unchanged phrase per product spec). */
export const APP_TITLE_TAGLINE = "Financial Intelligence Platform";

export const APP_DEFAULT_PAGE_TITLE = `${APP_SHORT_NAME} | ${APP_TITLE_TAGLINE}`;
