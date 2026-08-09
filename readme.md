# colorContrast.js

Analyze CSS color contrast, check WCAG compliance, and choose accessible foreground colors. It is a browser-ready, ESM-only module with TypeScript declarations and no runtime dependencies for consumers.

## Install

Available on npm as [`color-contrast-js`](https://www.npmjs.com/package/color-contrast-js):

```sh
npm install color-contrast-js
```

```js
import {
  backgroundTone,
  analyzeColor,
  contrastRatio,
} from "color-contrast-js";
```

## Quick start

```js
backgroundTone("#336699"); // "dark" — use light text
backgroundTone("tomato"); // "light" — use dark text

contrastRatio("#000", "#fff"); // 21

analyzeColor("oklch(65% 0.2 30)");
// Color, luminance, black/white contrast, recommended text,
// background tone, and WCAG AA/AAA results.
```

The tone describes the background, so it can be used as a class name:

```css
.light { color: #000; }
.dark { color: #fff; }
```

## Common tasks

```js
bestTextColor("#336699", ["#fff", "#000", "#ff0"]); // "#fff"

meetsContrast("#000", "#FF5733", {
  level: "AA",
  textSize: "normal",
}); // true

compositeColors("rgb(0 0 0 / 50%)", "#fff");
// "rgb(128, 128, 128)"
```

Gradients are analyzed at every color stop, so a passing result holds anywhere on the gradient:

```js
gradientTone("linear-gradient(#111, #333)"); // "dark"
gradientTone("linear-gradient(#000, #fff)"); // "mixed"

contrastRatio("#fff", "linear-gradient(#336699, #113355)");
// ≈ 6 — the weakest stop

meetsContrast("#fff", "linear-gradient(#336699, #113355)"); // true
bestTextColor("linear-gradient(45deg, #336699, #113355)"); // "#FFFFFF"
```

Analyze an element using its computed foreground, composited background, font size, and font weight:

```js
const result = analyzeElement(document.querySelector(".sample"));

result.contrastRatio;
result.textSize; // "normal" or "large"
result.aa;
result.aaa;
```

Or apply a background-tone class to elements:

```js
applyBackgroundTone(".sample", {
  lightClass: "on-light",
  darkClass: "on-dark",
});
```

## API

| API | Purpose |
| --- | --- |
| `backgroundTone(color, options)` | Classify a background as `"light"` or `"dark"` |
| `analyzeColor(color, options)` | Return luminance, recommendations, contrast, and compliance |
| `contrastRatio(first, second, options)` | Compare two colors from 1 to 21 |
| `bestTextColor(background, candidates, options)` | Choose the strongest supplied foreground |
| `meetsContrast(foreground, background, options)` | Check WCAG AA or AAA |
| `compositeColors(foreground, background)` | Resolve the visible result of transparency |
| `parseColor(color)` | Parse a CSS color into RGBA channels |
| `parseGradient(gradient)` | Extract the color stops from a CSS gradient |
| `analyzeGradient(gradient, options)` | Analyze every stop and report the worst case |
| `gradientTone(gradient, options)` | Classify a gradient as `"light"`, `"dark"`, or `"mixed"` |
| `analyzePalette(colors, options)` | Analyze every color in a palette |
| `contrastMatrix(colors, options)` | Calculate all palette contrast pairs |
| `getBackgroundColor(element, options)` | Resolve a composited DOM background |
| `analyzeElement(element, options)` | Check computed element contrast and WCAG results |
| `applyBackgroundTone(target, options)` | Apply tone classes to DOM elements |

See the complete [API reference](API.md) for parameters, return values, options, examples, and TypeScript types.

The historical `colorBrightness`, `colourBrightness`, `applyColorBrightness`, and `applyColourBrightness` names remain as compatibility aliases. New code should use `backgroundTone` and `applyBackgroundTone` because their names make the result unambiguous.

## Supported colors

- HEX, RGB, RGBA, HSL, and HSLA
- CSS named colors such as `tomato`
- `lab()`, `lch()`, `oklab()`, and `oklch()`
- `color()` spaces including sRGB, linear sRGB, Display P3, A98 RGB, ProPhoto RGB, Rec. 2020, and XYZ
- `linear-gradient()`, `radial-gradient()`, and `conic-gradient()`, including `repeating-` variants

Wide-gamut colors are converted to sRGB and clipped to the sRGB gamut before the WCAG 2 contrast calculation. Alpha values and CSS percentage syntax are supported.

Gradients are evaluated at their color stops — the standard conservative heuristic, since a gradient has no single contrast ratio — and results report the worst case. `contrastRatio`, `meetsContrast`, and `bestTextColor` accept gradients as backgrounds, `analyzeElement` and `applyBackgroundTone` account for gradient `background-image` layers, and `analyzeGradient` provides the full per-stop breakdown. `url()` background images cannot be analyzed; `analyzeElement` lists them in `unsupportedBackgrounds`, and a scrim or solid panel behind the text remains the reliable pattern for text over images.

## Which build should I use?

Both builds expose the same API:

- `color-contrast.js` is the readable ES module and the default npm entry. Use `import ... from "color-contrast-js"` in applications and libraries. Your bundler can minify it as part of the final build.
- `color-contrast.min.js` is the pre-minified ES module for direct browser or CDN use. npm consumers can explicitly import `color-contrast-js/min`, although this is rarely necessary.

Keeping the readable build makes debugging, code review, source attribution, and unbundled development easier. The minified build provides the smaller delivery option; it should not be the only published file.

The package is ESM-only. Use `import` rather than CommonJS `require()`.

## Live example

[hex.madebynifty.com](https://hex.madebynifty.com/) uses colorContrast.js to keep its text readable as the background changes.

## Development

Requires Node.js 22 or newer for development:

```sh
npm install
npm run build
npm run check
```

See [CHANGELOG.md](CHANGELOG.md) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

[MIT](LICENSE) © 2013–2026 Jamie Brittain.
