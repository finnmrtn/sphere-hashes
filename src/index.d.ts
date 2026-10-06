export type SphereStyle = 'sphere' | 'mesh' | 'flat' | 'dither';
export type SpherePalette = 'studio' | 'warm' | 'cool' | 'mono';
export type SphereShape = 'circle' | 'rounded' | 'square';

export interface SphereHashOptions {
  /** The look. `sphere` is the glass ball, the others are flat fills. Default `sphere`. */
  style?: SphereStyle;
  /** The colour family. Default `studio`. */
  palette?: SpherePalette;
  /** The clip. Default `circle`. */
  shape?: SphereShape;
  /** The width and height attributes on the svg. The viewBox stays 0 0 100 100. Default 100. */
  size?: number;
  /** Draw the seed's initials on top. Default false. */
  initials?: boolean;
}

/** The avatar for a seed as an SVG string. */
export function sphereHash(seed: string, options?: SphereHashOptions): string;

/** The avatar as a data URL for an img src or a CSS background. */
export function sphereHashUrl(seed: string, options?: SphereHashOptions): string;

/** The four swatches behind an avatar, as hex strings. */
export function sphereHashColors(seed: string, options?: SphereHashOptions): string[];

/** The 32 bit hash of a string that everything else is drawn from. */
export function hash(seed: string): number;

/** The initials used by the `initials` option, up to two letters. */
export function initials(seed: string): string;

export const STYLES: readonly SphereStyle[];
export const PALETTES: readonly SpherePalette[];
export const SHAPES: readonly SphereShape[];
