import assert from "node:assert/strict";
import test from "node:test";

import * as minifiedBuild from "../color-contrast.min.js";
import * as readableBuild from "../color-contrast.js";

const {
  applyColourBrightness,
  analyzeColor,
  analyzeElement,
  analyzePalette,
  bestTextColor,
  backgroundTone,
  colourBrightness,
  compositeColors,
  contrastMatrix,
  contrastRatio,
  getBackgroundColour,
  meetsContrast,
  parseColor,
  parseColour,
} = readableBuild;

function element(backgroundColor, parentElement = null) {
  const classes = new Set();
  const ownerDocument = {
    defaultView: {
      getComputedStyle: (target) => ({
        backgroundColor: target.backgroundColor,
        color: target.color ?? "rgb(0, 0, 0)",
        fontSize: target.fontSize ?? "16px",
        fontWeight: target.fontWeight ?? "400",
      }),
    },
  };

  return {
    backgroundColor,
    parentElement,
    ownerDocument,
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
  };
}

test("parses common HEX and CSS RGB formats", () => {
  assert.deepEqual(parseColour("#369"), { r: 51, g: 102, b: 153, a: 1 });
  assert.deepEqual(parseColour("rgb(20% 40% 60% / 50%)"), {
    r: 51,
    g: 102,
    b: 153,
    a: 0.5,
  });
  assert.deepEqual(parseColour("rgba(51, 102, 153, 0)"), {
    r: 51,
    g: 102,
    b: 153,
    a: 0,
  });
  assert.equal(parseColour("rgb(10wat, 20, 30)"), null);
  assert.equal(parseColour("not-a-colour"), null);
});

test("chooses the text class with the stronger WCAG contrast", () => {
  assert.equal(backgroundTone("#000"), "dark");
  assert.equal(backgroundTone("#fff"), "light");
  assert.equal(colourBrightness("#000"), "dark");
  assert.equal(colourBrightness("#fff"), "light");
  assert.equal(colourBrightness("rgb(51, 102, 153)"), "dark");
  assert.equal(colourBrightness("rgba(0, 0, 0, 0)"), "light");
  assert.equal(
    colourBrightness("rgba(255, 255, 255, 0.2)", { fallback: "#000" }),
    "dark",
  );
  assert.equal(colourBrightness("tomato"), "light");
  assert.throws(
    () => colourBrightness("rgba(0, 0, 0, 0.5)", { fallback: "transparent" }),
    /Fallback color must be opaque/,
  );
  for (const value of [123, {}, { r: 0, g: 0, b: 0 }, { r: NaN, g: 0, b: 0, a: 1 }]) {
    assert.throws(() => backgroundTone(value), TypeError);
  }
});

test("parses HSL, named colors, Lab, OKLCH, and color() spaces", () => {
  for (const color of [
    "hsl(9 100% 64%)",
    "hsla(9, 100%, 64%, 0.5)",
    "tomato",
    "lab(50% 40 30)",
    "oklch(65% 0.2 30)",
    "color(display-p3 1 0.2 0.1)",
    "color(rec2020 0.8 0.2 0.1)",
  ]) {
    assert.ok(parseColor(color), `expected ${color} to parse`);
  }
});

test("provides color analysis and WCAG utilities", () => {
  const analysis = analyzeColor("#FF5733");
  assert.equal(analysis.recommendedTextColor, "#000000");
  assert.equal(analysis.backgroundTone, "light");
  assert.equal(analysis.blackText.aa, true);
  assert.equal(analysis.whiteText.aa, false);
  assert.ok(Math.abs(analysis.contrastWithBlack - 6.66) < 0.02);
  assert.equal(contrastRatio("#000", "#fff"), 21);
  assert.equal(bestTextColor("#FF5733"), "#000000");
  assert.equal(
    bestTextColor("#336699", ["#fff", "#000", "#ff0"]),
    "#fff",
  );
  assert.equal(meetsContrast("#000", "#FF5733"), true);
  assert.equal(
    meetsContrast("#fff", "#FF5733", { level: "AA", textSize: "normal" }),
    false,
  );
  assert.equal(
    meetsContrast("#000", "#fff", { level: "aa", textSize: "Normal" }),
    true,
  );
  assert.throws(
    () => meetsContrast("#000", "#fff", { level: 2 }),
    /Expected AA or AAA/,
  );
});

test("composites colors and analyzes palettes", () => {
  assert.equal(compositeColors("rgb(0 0 0 / 50%)", "#fff"), "rgb(128, 128, 128)");
  const palette = ["#000", "#fff", "tomato"];
  assert.equal(analyzePalette(palette).length, 3);
  const matrix = contrastMatrix(palette);
  assert.equal(matrix.length, 3);
  assert.deepEqual(matrix.map((row) => row.length), [3, 3, 3]);
  assert.equal(matrix[0][1], 21);
  assert.equal(matrix[1][0], 21);
  assert.equal(matrix[2][2], 1);
});

test("resolves transparent backgrounds through element ancestors", () => {
  const root = element("rgb(255, 255, 255)");
  const parent = element("rgba(0, 0, 0, 0.5)", root);
  const child = element("rgba(255, 0, 0, 0)", parent);

  assert.equal(getBackgroundColour(child), "rgb(128, 128, 128)");
});

test("uses the fallback behind a fully translucent element tree", () => {
  const child = element("transparent");

  assert.equal(
    getBackgroundColour(child, { fallback: "#336699" }),
    "rgb(51, 102, 153)",
  );
});

test("applies a result independently to every selected element", () => {
  const dark = element("#000");
  const light = element("#fff");
  const root = {
    querySelectorAll: (selector) => {
      assert.equal(selector, ".sample");
      return [dark, light];
    },
  };

  const results = applyColourBrightness(".sample", { root });

  assert.deepEqual(results, [dark, light]);
  assert.equal(dark.classList.contains("dark"), true);
  assert.equal(dark.classList.contains("light"), false);
  assert.equal(light.classList.contains("light"), true);
  assert.equal(light.classList.contains("dark"), false);
});

test("analyzes an element using the applicable WCAG text size", () => {
  const normalText = element("rgb(255, 255, 255)");
  normalText.color = "rgb(120, 120, 120)";
  normalText.fontSize = "16px";
  normalText.fontWeight = "400";

  const normalAnalysis = analyzeElement(normalText);
  assert.equal(normalAnalysis.textSize, "normal");
  assert.equal(normalAnalysis.isLargeText, false);
  assert.equal(normalAnalysis.aa, false);

  const largeText = element("rgb(255, 255, 255)");
  largeText.color = "rgb(120, 120, 120)";
  largeText.fontSize = "19px";
  largeText.fontWeight = "700";

  const largeAnalysis = analyzeElement(largeText);
  assert.equal(largeAnalysis.textSize, "large");
  assert.equal(largeAnalysis.isLargeText, true);
  assert.equal(largeAnalysis.aa, true);
  assert.ok(largeAnalysis.contrastRatio > 3);
  assert.ok(largeAnalysis.contrastRatio < 4.5);

  const belowBoldBoundary = element("rgb(255, 255, 255)");
  belowBoldBoundary.fontSize = "18.6px";
  belowBoldBoundary.fontWeight = "700";
  assert.equal(analyzeElement(belowBoldBoundary).textSize, "normal");

  const atBoldBoundary = element("rgb(255, 255, 255)");
  atBoldBoundary.fontSize = `${14 * (96 / 72)}px`;
  atBoldBoundary.fontWeight = "700";
  assert.equal(analyzeElement(atBoldBoundary).textSize, "large");
});

test("readable and minified builds expose matching APIs and behavior", () => {
  assert.deepEqual(Object.keys(minifiedBuild), Object.keys(readableBuild));

  for (const build of [readableBuild, minifiedBuild]) {
    assert.equal(build.backgroundTone("#000"), "dark");
    assert.equal(build.contrastRatio("#000", "#fff"), 21);
    assert.equal(build.bestTextColor("#fff"), "#000000");
    assert.equal(build.meetsContrast("#000", "#fff"), true);
    assert.deepEqual(build.parseColor("#369"), {
      r: 51,
      g: 102,
      b: 153,
      a: 1,
    });
    assert.throws(() => build.backgroundTone({}), TypeError);
  }
});
