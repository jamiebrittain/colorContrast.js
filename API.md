# colorContrast.js API

All functions are named exports from `color-contrast-js`. TypeScript declarations are included in the package.

```js
import { contrastRatio, meetsContrast } from "color-contrast-js";
```

## Common options

Functions that resolve transparency accept an optional opaque fallback color:

```ts
type ColorOptions = {
  fallback?: string; // default: "#fff"
};
```

## `backgroundTone(color, options?)`

Classifies the supplied background as `"light"` or `"dark"`. The result describes the background, not the recommended text color.

```js
backgroundTone("#111"); // "dark"
backgroundTone("tomato"); // "light"
```

## `analyzeColor(color, options?)`

Returns the resolved color, WCAG relative luminance, black and white contrast ratios, the background tone, recommended text color, and AA/AAA compliance.

```js
const result = analyzeColor("#FF5733");

result.backgroundTone; // "light"
result.recommendedTextColor; // "#000000"
result.contrastWithBlack; // approximately 6.66
result.blackText.aa; // true
```

The returned object has this shape:

```ts
type ColorAnalysis = {
  color: string;
  resolvedColor: string;
  luminance: number;
  recommendedTextColor: "#000000" | "#FFFFFF";
  backgroundTone: "light" | "dark";
  contrastWithBlack: number;
  contrastWithWhite: number;
  blackText: ContrastCompliance;
  whiteText: ContrastCompliance;
};

type ContrastCompliance = {
  aa: boolean;
  aaLarge: boolean;
  aaa: boolean;
  aaaLarge: boolean;
};
```

## `contrastRatio(foreground, background, options?)`

Returns a WCAG contrast ratio from 1 to 21. Translucent foregrounds are composited over the background before calculation.

```js
contrastRatio("#000", "#fff"); // 21
```

## `bestTextColor(background, candidates?, options?)`

Returns the candidate with the strongest contrast against the background. Candidates default to black and white.

```js
bestTextColor("#336699"); // "#FFFFFF"
bestTextColor("#336699", ["#fff", "#000", "#ff0"]); // "#fff"
```

## `meetsContrast(foreground, background, options?)`

Checks a foreground/background pair against WCAG AA or AAA thresholds.

```js
meetsContrast("#000", "#FF5733", {
  level: "AA", // "AA" or "AAA"
  textSize: "normal", // "normal" or "large"
}); // true
```

## `compositeColors(foreground, background)`

Composites a translucent foreground over a background and returns CSS RGB or RGBA.

```js
compositeColors("rgb(0 0 0 / 50%)", "#fff");
// "rgb(128, 128, 128)"
```

## `parseColor(color)`

Parses a supported CSS color and returns numeric sRGB channels from 0–255 plus alpha from 0–1. Returns `null` for unsupported input.

```js
parseColor("tomato");
// { r: 255, g: 99, b: 71, a: 1 }
```

Supported inputs include HEX, RGB, HSL, named colors, Lab, LCH, Oklab, OKLCH, and CSS `color()` spaces. Wide-gamut inputs are converted to sRGB and clipped to the sRGB gamut.

## `analyzePalette(colors, options?)`

Returns `analyzeColor()` results for every palette entry.

```js
analyzePalette(["#000", "#fff", "tomato"]);
```

## `contrastMatrix(colors, options?)`

Returns a pairwise matrix where rows are foreground colors and columns are background colors.

```js
contrastMatrix(["#000", "#fff"]);
// [[1, 21], [21, 1]]
```

## `getBackgroundColor(element, options?)`

Resolves an element's visible `background-color`, compositing translucent ancestor background colors until it reaches an opaque color or the fallback.

```js
getBackgroundColor(document.querySelector(".card"));
```

This helper handles solid and translucent CSS background colors. It does not analyze background images, gradients, blend modes, canvas content, or video.

## `analyzeElement(element, options?)`

Analyzes an element's computed foreground, resolved background, font size and weight. It selects the applicable WCAG normal/large text thresholds automatically.

```js
const result = analyzeElement(document.querySelector(".card"));

result.foregroundColor;
result.backgroundColor;
result.contrastRatio;
result.textSize; // "normal" or "large"
result.aa;
result.aaa;
```

## `applyBackgroundTone(target, options?)`

Applies a class describing the background tone to one element, a selector, or an iterable of elements. Every element is evaluated independently.

```js
applyBackgroundTone(".card");

applyBackgroundTone(".card", {
  lightClass: "on-light",
  darkClass: "on-dark",
  fallback: "#fff",
  root: document,
});
```

The function returns the affected elements.

## Historical aliases

The original project names remain available as aliases:

- `colorBrightness` and `colourBrightness` → `backgroundTone`
- `applyColorBrightness` and `applyColourBrightness` → `applyBackgroundTone`
- `analyseColour` → `analyzeColor`
- `parseColour` → `parseColor`
- `bestTextColour` → `bestTextColor`
- `compositeColours` → `compositeColors`
- `getBackgroundColour` → `getBackgroundColor`
- `analyseElement` → `analyzeElement`
- `analysePalette` → `analyzePalette`
