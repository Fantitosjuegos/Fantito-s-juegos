/**
 * css-utils.ts
 * ------------
 * Helpers for working with CSS custom properties in React inline styles.
 *
 * React's CSSProperties type doesn't allow arbitrary `--variable` keys, so
 * we'd normally need `as any` everywhere. This helper encapsulates that cast
 * in one place and keeps the rest of the code clean.
 *
 * Usage:
 *   style={cssVars({ '--vs-intensity': intensity, '--dx': `${dx}px` })}
 */

/** Pass an object of CSS custom property names → values, get a style object back. */
export function cssVars(
    vars: Record<string, string | number>,
  ): React.CSSProperties {
    return vars as React.CSSProperties;
  }
  
  /**
   * Merge CSS custom properties with regular React style properties.
   *
   * Usage:
   *   style={withCssVars({ opacity: 0.5 }, { '--glow': '1' })}
   */
  export function withCssVars(
    style: React.CSSProperties,
    vars: Record<string, string | number>,
  ): React.CSSProperties {
    return { ...style, ...(vars as React.CSSProperties) };
  }