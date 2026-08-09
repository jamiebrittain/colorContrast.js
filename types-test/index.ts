import {
  analyseGradient,
  analyzeColor,
  analyzeElement,
  analyzeGradient,
  analyzePalette,
  applyBackgroundTone,
  applyColorBrightness,
  backgroundTone,
  bestTextColor,
  colorBrightness,
  compositeColors,
  contrastMatrix,
  contrastRatio,
  gradientTone,
  meetsContrast,
  parseColor,
  parseGradient,
} from "color-contrast-js";
import type {
  BackgroundTone,
  GradientTone,
  ParsedGradient,
} from "color-contrast-js";

const brightness: "light" | "dark" = colorBrightness("tomato");
const tone: BackgroundTone = backgroundTone("tomato");
const ratio: number = contrastRatio("#000", "#fff");
const best: string = bestTextColor("#369", ["#000", "#fff"]);
const passes: boolean = meetsContrast("#000", "#fff", {
  level: "AAA",
  textSize: "normal",
});
const composite: string = compositeColors("rgb(0 0 0 / 50%)", "#fff");

const gradient: ParsedGradient | null = parseGradient(
  "linear-gradient(45deg, #336699, tomato)",
);
const gradientBackgroundTone: GradientTone = gradientTone(
  "linear-gradient(#000, #fff)",
);
const gradientRatio: number = contrastRatio(
  "#000",
  "linear-gradient(#fff, #eee)",
);
analyzeGradient("linear-gradient(#336699, #113355)").stops[0].blackText.aa;
analyseGradient("linear-gradient(#336699, #113355)").backgroundTone;
bestTextColor("linear-gradient(#336699, #113355)", ["#fff", "#000"]);
meetsContrast("#fff", "linear-gradient(#336699, #113355)", { level: "AA" });

analyzeColor("oklch(65% 0.2 30)").blackText.aa;
analyzeElement(document.body).backgroundColor;
analyzeElement(document.body).backgroundColors;
analyzeElement(document.body).unsupportedBackgrounds;
const readonlyPalette = ["tomato", "color(display-p3 1 0 0)"] as const;
analyzePalette(readonlyPalette);
contrastMatrix(readonlyPalette);
parseColor("lab(50% 40 30)");
applyColorBrightness(document.body);
applyBackgroundTone(document.body);

void [
  brightness,
  tone,
  ratio,
  best,
  passes,
  composite,
  gradient,
  gradientBackgroundTone,
  gradientRatio,
];
