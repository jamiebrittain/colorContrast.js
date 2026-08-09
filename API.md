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

## `analyzeGradient(gradient, options?)`

Analyzes every color stop of a CSS gradient and reports the worst case. The contrast ratios are the minimums across all stops, so a passing result holds anywhere on the gradient. `backgroundTone` is `"mixed"` when the stops disagree.

```js
const result = analyzeGradient("linear-gradient(45deg, #336699, #113355)");

result.backgroundTone; // "dark"
result.recommendedTextColor; // "#FFFFFF"
result.contrastWithWhite; // ≈ 6, the weakest stop
result.stops; // per-stop ColorAnalysis results
```

The returned object has this shape:

```ts
type GradientAnalysis = {
  gradient: string;
  type: "linear" | "radial" | "conic";
  repeating: boolean;
  stops: ColorAnalysis[];
  backgroundTone: "light" | "dark" | "mixed";
  recommendedTextColor: "#000000" | "#FFFFFF";
  contrastWithBlack: number; // minimum across stops
  contrastWithWhite: number; // minimum across stops
  blackText: ContrastCompliance;
  whiteText: ContrastCompliance;
};
```

Stop-based analysis is the standard conservative heuristic for gradients: colors between stops are interpolations of the stops, so checking every stop bounds the practical worst case. Gradients that interpolate through another color space (for example `linear-gradient(in oklab, ...)`) can pass through intermediate colors not strictly bounded by their stops; the stops remain a close approximation.

## `gradientTone(gradient, options?)`

Classifies a gradient as `"light"`, `"dark"`, or `"mixed"` when its stops disagree.

```js
gradientTone("linear-gradient(#111, #333)"); // "dark"
gradientTone("linear-gradient(#000, #fff)"); // "mixed"
```

## `contrastRatio(foreground, background, options?)`

Returns a WCAG contrast ratio from 1 to 21. Translucent foregrounds are composited over the background before calculation.

```js
contrastRatio("#000", "#fff"); // 21
```

The background may also be a CSS gradient; the result is then the lowest ratio across the gradient's color stops.

```js
contrastRatio("#fff", "linear-gradient(#336699, #113355)"); // ≈ 6
```

## `bestTextColor(background, candidates?, options?)`

Returns the candidate with the strongest contrast against the background. Candidates default to black and white. A gradient background selects the candidate with the strongest worst-case contrast across its stops.

```js
bestTextColor("#336699"); // "#FFFFFF"
bestTextColor("#336699", ["#fff", "#000", "#ff0"]); // "#fff"
```

## `meetsContrast(foreground, background, options?)`

Checks a foreground/background pair against WCAG AA or AAA thresholds. A gradient background must pass at every color stop.

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

## `parseGradient(gradient)`

Parses a CSS `linear-gradient()`, `radial-gradient()`, or `conic-gradient()` (including `repeating-` variants) and returns its color stops. Configuration arguments and interpolation hints are skipped. Returns `null` for anything that is not a single gradient.

```js
parseGradient("linear-gradient(45deg, rgb(51, 102, 153) 0%, tomato)");
// { type: "linear", repeating: false, colors: ["rgb(51, 102, 153)", "tomato"] }
```

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

This helper resolves background *colors* only; use `analyzeElement` for gradient-aware analysis. It does not analyze `url()` images, blend modes, canvas content, or video.

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

Gradient `background-image` layers on the element and its ancestors are included: every gradient stop is composited over the underlying background, and `contrastRatio`, `aa`, and `aaa` report the worst case, so a pass holds anywhere on the gradient. The candidate backgrounds are returned as `backgroundColors` (with `backgroundColor` remaining the color-only composite). Layers that cannot be analyzed — such as `url()` images — are ignored and listed in `unsupportedBackgrounds`.

Gradients are assumed to cover the element (the CSS default); a gradient confined by `background-size` or `background-position` is still treated as covering. Stop geometry is not evaluated, and stacked gradients are combined per stop.

## `applyBackgroundTone(target, options?)`

Applies a class describing the background tone to one element, a selector, or an iterable of elements. Every element is evaluated independently, including gradient background layers: the class reflects the text color with the strongest worst-case contrast across the visible background.

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
- `analyseGradient` → `analyzeGradient`
- `parseColour` → `parseColor`
- `bestTextColour` → `bestTextColor`
- `compositeColours` → `compositeColors`
- `getBackgroundColour` → `getBackgroundColor`
- `analyseElement` → `analyzeElement`
- `analysePalette` → `analyzePalette`
