# Changelog

## 2.0.0 — 2026-07-13

- Rebuilt the project as colorContrast.js, a browser-ready ES module with compatibility aliases for the original plugin names.
- Added readable and minified module builds plus a complete API reference.
- Relicensed the project under the MIT License.
- Added `backgroundTone` and `applyBackgroundTone` as clearer canonical names for the original brightness helpers.
- Added `analyzeColor`, `contrastRatio`, `bestTextColor`, `meetsContrast`, `compositeColors`, palette analysis, and contrast matrices.
- Added `analyzeElement` for computed foreground/background contrast and font-aware WCAG checks.
- Added HEX, RGB, HSL, named-color, Lab, LCH, Oklab, OKLCH, and CSS `color()` parsing.
- Switched the recommended contrast calculation to WCAG relative luminance.
- Added DOM helpers for individual elements, selectors and element collections.
- Added alpha compositing through translucent ancestor backgrounds, building on the proposal in [#9](https://github.com/jamiebrittain/colorContrast.js/pull/9) by [@ioliva](https://github.com/ioliva).
- Added TypeScript declarations, automated tests, npm package metadata, and third-party notices.
- Added strict runtime validation for parsed channel objects and consistent option errors.
- Centralized WCAG thresholds and corrected the 14pt bold large-text boundary.
- Added guarded npm packaging, readable/minified build parity checks, and continuous integration.
- Added [hex.madebynifty.com](https://hex.madebynifty.com/) as the live v2 example.

## 1.3.0 — 2026-07-13

This release is intended to be tagged from a dedicated legacy-only commit before the v2 release. It is a GitHub compatibility release for existing jQuery users, not part of the `color-contrast-js` npm package.

- Fixed every element in a jQuery collection receiving the first element's result ([#7](https://github.com/jamiebrittain/colorContrast.js/issues/7)).
- Improved zero-alpha and transparent background detection.
- Included the HTML element when looking for an inherited background.
- Added a white fallback for a completely transparent document.
- Preserved the v1 brightness algorithm and class behavior.
- Left elements unchanged when their computed background color cannot be parsed.
- Documented that partially transparent backgrounds remain a v1 limitation; use v2 for compositing-aware analysis.
- Added regression tests and reproducible minification.

## 1.2.0 — 2015-12-29

- Added a terminating semicolon for compatibility with concatenated scripts.
- Updated the project metadata and version header.
