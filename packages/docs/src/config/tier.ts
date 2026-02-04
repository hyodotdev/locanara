/**
 * Documentation tier configuration
 *
 * This is the Community (open-source) edition.
 * For Pro features, see https://docs-pro.locanara.com
 */

export const DOCS_TIER = "community";

export const IS_PRO_DOCS = false;
export const IS_COMMUNITY_DOCS = true;

/**
 * Helper to conditionally render Pro-only content
 * Always returns null in Community edition
 */
export function proOnly<T>(_content: T): null {
  return null;
}

/**
 * Helper to render different content based on tier
 * Always returns community content in Community edition
 */
export function tierContent<T>(options: { community: T; pro: T }): T {
  return options.community;
}
