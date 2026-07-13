export type BackgroundTone = "light" | "dark";
/** @deprecated Use BackgroundTone. */
export type BrightnessClass = BackgroundTone;
export type ColorChannels = { r: number; g: number; b: number; a: number };
export type ContrastCompliance = {
  aa: boolean;
  aaLarge: boolean;
  aaa: boolean;
  aaaLarge: boolean;
};
export type ColorOptions = { fallback?: string };
export type ColorAnalysis = {
  color: string;
  resolvedColor: string;
  luminance: number;
  recommendedTextColor: "#000000" | "#FFFFFF";
  backgroundTone: BrightnessClass;
  contrastWithBlack: number;
  contrastWithWhite: number;
  blackText: ContrastCompliance;
  whiteText: ContrastCompliance;
};

export function parseColor(value: string): ColorChannels | null;
export function backgroundTone(color: string, options?: ColorOptions): BackgroundTone;
export function colorBrightness(color: string, options?: ColorOptions): BackgroundTone;
export function analyzeColor(color: string, options?: ColorOptions): ColorAnalysis;
export function contrastRatio(foreground: string, background: string, options?: ColorOptions): number;
export function bestTextColor(background: string, candidates?: readonly string[], options?: ColorOptions): string;
export function meetsContrast(foreground: string, background: string, options?: ColorOptions & { level?: "AA" | "AAA"; textSize?: "normal" | "large" }): boolean;
export function compositeColors(foreground: string, background: string): string;
export function analyzePalette(colors: readonly string[], options?: ColorOptions): ColorAnalysis[];
export function contrastMatrix(colors: readonly string[], options?: ColorOptions): number[][];
export function getBackgroundColor(element: Element, options?: ColorOptions): string;
export function analyzeElement(element: Element, options?: ColorOptions): {
  foregroundColor: string;
  backgroundColor: string;
  fontSize: number;
  fontWeight: number;
  textSize: "normal" | "large";
  isLargeText: boolean;
  contrastRatio: number;
  aa: boolean;
  aaa: boolean;
};
export function applyBackgroundTone(target: Element | Iterable<Element> | string, options?: ColorOptions & { root?: ParentNode; lightClass?: string; darkClass?: string }): Element[];
export function applyColorBrightness(target: Element | Iterable<Element> | string, options?: ColorOptions & { root?: ParentNode; lightClass?: string; darkClass?: string }): Element[];

export { backgroundTone as colourBrightness, analyzeColor as analyseColour, parseColor as parseColour, bestTextColor as bestTextColour, compositeColors as compositeColours, applyBackgroundTone as applyColourBrightness, getBackgroundColor as getBackgroundColour, analyzeElement as analyseElement, analyzePalette as analysePalette };
