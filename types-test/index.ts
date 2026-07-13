import {
  analyzeColor,
  analyzeElement,
  analyzePalette,
  applyBackgroundTone,
  applyColorBrightness,
  backgroundTone,
  bestTextColor,
  colorBrightness,
  compositeColors,
  contrastMatrix,
  contrastRatio,
  meetsContrast,
  parseColor,
} from "color-contrast-js";
import type { BackgroundTone } from "color-contrast-js";

const brightness: "light" | "dark" = colorBrightness("tomato");
const tone: BackgroundTone = backgroundTone("tomato");
const ratio: number = contrastRatio("#000", "#fff");
const best: string = bestTextColor("#369", ["#000", "#fff"]);
const passes: boolean = meetsContrast("#000", "#fff", {
  level: "AAA",
  textSize: "normal",
});
const composite: string = compositeColors("rgb(0 0 0 / 50%)", "#fff");

analyzeColor("oklch(65% 0.2 30)").blackText.aa;
analyzeElement(document.body).backgroundColor;
const readonlyPalette = ["tomato", "color(display-p3 1 0 0)"] as const;
analyzePalette(readonlyPalette);
contrastMatrix(readonlyPalette);
parseColor("lab(50% 40 30)");
applyColorBrightness(document.body);
applyBackgroundTone(document.body);

void [brightness, tone, ratio, best, passes, composite];
