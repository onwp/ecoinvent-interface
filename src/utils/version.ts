/**
 * Single source of truth for the library version.
 *
 * Kept separate from `index.ts` so that modules which would otherwise
 * introduce a circular dependency (interface-base, process, etc.) can
 * import it safely.
 */
export const VERSION = '1.1.0';
