import {
  converter,
  modeA98,
  modeHsl,
  modeLab,
  modeLch,
  modeLrgb,
  modeOklab,
  modeOklch,
  modeP3,
  modeProphoto,
  modeRec2020,
  modeRgb,
  modeXyz50,
  modeXyz65,
  parse,
  useMode,
} from "culori/fn";

[
  modeRgb,
  modeHsl,
  modeLab,
  modeLch,
  modeOklab,
  modeOklch,
  modeP3,
  modeA98,
  modeProphoto,
  modeRec2020,
  modeLrgb,
  modeXyz50,
  modeXyz65,
].forEach(useMode);

const toRgb = converter("rgb");
const BLACK = { r: 0, g: 0, b: 0, a: 1 };
const WHITE = { r: 255, g: 255, b: 255, a: 1 };
const LARGE_TEXT_MIN_PX = 18 * (96 / 72);
const LARGE_BOLD_TEXT_MIN_PX = 14 * (96 / 72);
const WCAG_THRESHOLDS = {
  AA: { normal: 4.5, large: 3 },
  AAA: { normal: 7, large: 4.5 },
};

const clamp = (value, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value));

export function parseColor(value) {
  if (typeof value !== "string") return null;
  const parsed = parse(value.trim());
  if (!parsed) return null;
  const rgb = toRgb(parsed);
  if (!rgb || ![rgb.r, rgb.g, rgb.b].every(Number.isFinite)) return null;
  return {
    r: clamp(rgb.r) * 255,
    g: clamp(rgb.g) * 255,
    b: clamp(rgb.b) * 255,
    a: clamp(rgb.alpha ?? 1),
  };
}

function requireColor(value, label = "color") {
  const parsed = typeof value === "string" ? parseColor(value) : value;
  const validChannels =
    parsed !== null &&
    typeof parsed === "object" &&
    [parsed.r, parsed.g, parsed.b, parsed.a].every(Number.isFinite) &&
    parsed.r >= 0 &&
    parsed.r <= 255 &&
    parsed.g >= 0 &&
    parsed.g <= 255 &&
    parsed.b >= 0 &&
    parsed.b <= 255 &&
    parsed.a >= 0 &&
    parsed.a <= 1;
  if (!validChannels) throw new TypeError(`Unsupported ${label}: ${value}`);
  return parsed;
}

function composite(foreground, background) {
  const alpha = foreground.a + background.a * (1 - foreground.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const channel = (name) =>
    (foreground[name] * foreground.a +
      background[name] * background.a * (1 - foreground.a)) /
    alpha;
  return { r: channel("r"), g: channel("g"), b: channel("b"), a: alpha };
}

function opaqueFallback(value) {
  const fallback = requireColor(value, "fallback color");
  if (fallback.a !== 1) {
    throw new TypeError(`Fallback color must be opaque: ${value}`);
  }
  return fallback;
}

function resolveColor(value, fallback = "#fff") {
  const color = requireColor(value);
  return color.a < 1 ? composite(color, opaqueFallback(fallback)) : color;
}

function linearize(channel) {
  const value = channel / 255;
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function ratioFromColors(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function compliance(ratio) {
  return {
    aa: ratio >= WCAG_THRESHOLDS.AA.normal,
    aaLarge: ratio >= WCAG_THRESHOLDS.AA.large,
    aaa: ratio >= WCAG_THRESHOLDS.AAA.normal,
    aaaLarge: ratio >= WCAG_THRESHOLDS.AAA.large,
  };
}

function contrastThreshold(level, textSize) {
  if (typeof level !== "string" || typeof textSize !== "string") {
    throw new TypeError("Expected AA or AAA and normal or large text");
  }
  const normalizedLevel = level.toUpperCase();
  const normalizedTextSize = textSize.toLowerCase();
  const threshold = WCAG_THRESHOLDS[normalizedLevel]?.[normalizedTextSize];
  if (threshold === undefined) {
    throw new TypeError("Expected AA or AAA and normal or large text");
  }
  return threshold;
}

function cssColor({ r, g, b, a }) {
  const channels = `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
  return a < 1
    ? `rgba(${channels}, ${Number(a.toFixed(4))})`
    : `rgb(${channels})`;
}

export function compositeColors(foreground, background) {
  return cssColor(
    composite(requireColor(foreground), requireColor(background)),
  );
}

export function contrastRatio(
  foreground,
  background,
  { fallback = "#fff" } = {},
) {
  const resolvedBackground = resolveColor(background, fallback);
  const parsedForeground = requireColor(foreground, "foreground color");
  const resolvedForeground =
    parsedForeground.a < 1
      ? composite(parsedForeground, resolvedBackground)
      : parsedForeground;
  return ratioFromColors(resolvedForeground, resolvedBackground);
}

export function analyzeColor(color, { fallback = "#fff" } = {}) {
  const resolved = resolveColor(color, fallback);
  const contrastWithBlack = ratioFromColors(resolved, BLACK);
  const contrastWithWhite = ratioFromColors(resolved, WHITE);
  const useBlack = contrastWithBlack >= contrastWithWhite;
  return {
    color,
    resolvedColor: cssColor(resolved),
    luminance: luminance(resolved),
    recommendedTextColor: useBlack ? "#000000" : "#FFFFFF",
    backgroundTone: useBlack ? "light" : "dark",
    contrastWithBlack,
    contrastWithWhite,
    blackText: compliance(contrastWithBlack),
    whiteText: compliance(contrastWithWhite),
  };
}

export function backgroundTone(color, options) {
  return analyzeColor(color, options).backgroundTone;
}

export function bestTextColor(
  background,
  candidates = ["#000000", "#FFFFFF"],
  options,
) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new TypeError("Candidates must be a non-empty array of colors");
  }
  return candidates.reduce((best, candidate) => {
    const ratio = contrastRatio(candidate, background, options);
    return !best || ratio > best.ratio ? { color: candidate, ratio } : best;
  }, null).color;
}

export function meetsContrast(
  foreground,
  background,
  { level = "AA", textSize = "normal", fallback = "#fff" } = {},
) {
  const threshold = contrastThreshold(level, textSize);
  return contrastRatio(foreground, background, { fallback }) >= threshold;
}

export function analyzePalette(colors, options) {
  if (!Array.isArray(colors)) throw new TypeError("Palette must be an array");
  return colors.map((color) => analyzeColor(color, options));
}

export function contrastMatrix(colors, options) {
  if (!Array.isArray(colors)) throw new TypeError("Palette must be an array");
  return colors.map((foreground) =>
    colors.map((background) => contrastRatio(foreground, background, options)),
  );
}

function styleReaderFor(element) {
  const view = element.ownerDocument?.defaultView;
  const getStyle = view?.getComputedStyle ?? globalThis.getComputedStyle;
  if (typeof getStyle !== "function") {
    throw new TypeError("getComputedStyle is not available for this element");
  }
  return getStyle.bind(view ?? globalThis);
}

export function getBackgroundColor(element, { fallback = "#fff" } = {}) {
  const getStyle = styleReaderFor(element);
  const layers = [];
  let current = element;
  while (current) {
    const color = parseColor(getStyle(current).backgroundColor);
    if (color && color.a > 0) {
      layers.push(color);
      if (color.a === 1) break;
    }
    current = current.parentElement;
  }
  if (!layers.some(({ a }) => a === 1)) layers.push(opaqueFallback(fallback));
  return cssColor(layers.reverse().reduce((background, layer) =>
    composite(layer, background),
  ));
}

export function analyzeElement(element, { fallback = "#fff" } = {}) {
  const style = styleReaderFor(element)(element);
  const foregroundColor = style.color;
  const backgroundColor = getBackgroundColor(element, { fallback });
  const fontSize = Number.parseFloat(style.fontSize);
  const numericWeight = Number.parseInt(style.fontWeight, 10);
  const fontWeight = Number.isFinite(numericWeight)
    ? numericWeight
    : style.fontWeight === "bold" || style.fontWeight === "bolder"
      ? 700
      : 400;
  const isLargeText =
    fontSize >= LARGE_TEXT_MIN_PX ||
    (fontSize >= LARGE_BOLD_TEXT_MIN_PX && fontWeight >= 700);
  const textSize = isLargeText ? "large" : "normal";
  const ratio = contrastRatio(foregroundColor, backgroundColor, { fallback });

  return {
    foregroundColor,
    backgroundColor,
    fontSize,
    fontWeight,
    textSize,
    isLargeText,
    contrastRatio: ratio,
    aa: ratio >= contrastThreshold("AA", textSize),
    aaa: ratio >= contrastThreshold("AAA", textSize),
  };
}

function elementsFrom(target, root) {
  if (typeof target === "string") return [...root.querySelectorAll(target)];
  if (target?.classList) return [target];
  if (target?.[Symbol.iterator]) return [...target];
  throw new TypeError("Expected an element, selector, or iterable of elements");
}

export function applyBackgroundTone(
  target,
  {
    fallback = "#fff",
    root = globalThis.document,
    lightClass = "light",
    darkClass = "dark",
  } = {},
) {
  if (!root && typeof target === "string") {
    throw new TypeError("A document or root is required when using a selector");
  }
  const elements = elementsFrom(target, root);
  for (const element of elements) {
    const result = backgroundTone(getBackgroundColor(element, { fallback }));
    element.classList.remove(lightClass, darkClass);
    element.classList.add(result === "light" ? lightClass : darkClass);
  }
  return elements;
}

// Historical aliases retained for the original project community.
export const colorBrightness = backgroundTone;
export const colourBrightness = backgroundTone;
export const analyseColour = analyzeColor;
export const parseColour = parseColor;
export const bestTextColour = bestTextColor;
export const compositeColours = compositeColors;
export const applyColorBrightness = applyBackgroundTone;
export const applyColourBrightness = applyBackgroundTone;
export const getBackgroundColour = getBackgroundColor;
export const analyseElement = analyzeElement;
export const analysePalette = analyzePalette;
