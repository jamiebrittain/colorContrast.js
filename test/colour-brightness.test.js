import assert from "node:assert/strict";
import test from "node:test";

import * as minifiedBuild from "../color-contrast.min.js";
import * as readableBuild from "../color-contrast.js";

const {
  applyColourBrightness,
  analyzeColor,
  analyzeElement,
  analyzeGradient,
  analyzePalette,
  bestTextColor,
  backgroundTone,
  colourBrightness,
  compositeColors,
  contrastMatrix,
  contrastRatio,
  getBackgroundColour,
  gradientTone,
  meetsContrast,
  parseColor,
  parseColour,
  parseGradient,
} = readableBuild;

function element(backgroundColor, parentElement = null) {
  const classes = new Set();
  const ownerDocument = {
    defaultView: {
      getComputedStyle: (target) => ({
        backgroundColor: target.backgroundColor,
        backgroundImage: target.backgroundImage ?? "none",
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

test("parses gradient color stops", () => {
  assert.deepEqual(
    parseGradient("linear-gradient(45deg, rgb(51, 102, 153) 0%, tomato)"),
    { type: "linear", repeating: false, colors: ["rgb(51, 102, 153)", "tomato"] },
  );
  assert.deepEqual(
    parseGradient(
      "repeating-conic-gradient(from 45deg at 50% 50%, #000 0deg, #fff 180deg)",
    ),
    { type: "conic", repeating: true, colors: ["#000", "#fff"] },
  );
  assert.deepEqual(
    parseGradient("radial-gradient(circle at center, red, 30%, blue 100%)")
      .colors,
    ["red", "blue"],
  );
  assert.deepEqual(
    parseGradient("linear-gradient(in oklab, red 0% 50%, blue)").colors,
    ["red", "blue"],
  );
  assert.equal(parseGradient("#fff"), null);
  assert.equal(parseGradient('url("pattern.png")'), null);
  assert.equal(parseGradient("linear-gradient(red, blue), url(x.png)"), null);
  assert.equal(parseGradient("linear-gradient(45deg)"), null);
  assert.equal(parseGradient(42), null);
});

test("analyzes gradients using the worst-case stop", () => {
  const mixed = analyzeGradient("linear-gradient(90deg, #000, #fff)");
  assert.equal(mixed.type, "linear");
  assert.equal(mixed.backgroundTone, "mixed");
  assert.equal(mixed.stops.length, 2);
  assert.equal(mixed.contrastWithBlack, 1);
  assert.equal(mixed.contrastWithWhite, 1);
  assert.equal(mixed.blackText.aa, false);
  assert.equal(mixed.whiteText.aa, false);

  const light = analyzeGradient("linear-gradient(#fff, #ff0)");
  assert.equal(light.backgroundTone, "light");
  assert.equal(light.recommendedTextColor, "#000000");
  assert.equal(light.blackText.aa, true);

  assert.equal(gradientTone("linear-gradient(#fff, #000)"), "mixed");
  assert.equal(gradientTone("linear-gradient(#111, #333)"), "dark");
  assert.equal(
    analyzeGradient("linear-gradient(rgb(0 0 0 / 50%), #000)").stops[0]
      .resolvedColor,
    "rgb(128, 128, 128)",
  );
  assert.throws(() => analyzeGradient("#fff"), /Unsupported gradient/);
});

test("contrast utilities accept gradient backgrounds", () => {
  assert.equal(contrastRatio("#000", "linear-gradient(#fff, #fff)"), 21);
  assert.equal(contrastRatio("#000", "linear-gradient(45deg, #fff, #000)"), 1);
  assert.equal(
    contrastRatio("#000", "linear-gradient(rgb(255 255 255 / 50%), #fff)", {
      fallback: "#fff",
    }),
    21,
  );
  assert.equal(
    bestTextColor("linear-gradient(#336699, #113355)"),
    "#FFFFFF",
  );
  assert.equal(
    meetsContrast("#fff", "linear-gradient(#336699, #113355)"),
    true,
  );
  assert.equal(
    meetsContrast("#000", "linear-gradient(#336699, #113355)"),
    false,
  );
  assert.throws(
    () => contrastRatio("linear-gradient(#000, #fff)", "#fff"),
    TypeError,
  );
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

test("analyzes gradient background layers on elements", () => {
  const parent = element("rgb(0, 0, 0)");
  const child = element("rgba(0, 0, 0, 0)", parent);
  child.backgroundImage =
    "linear-gradient(rgb(255 255 255 / 50%), rgb(255, 255, 255))";
  child.color = "rgb(0, 0, 0)";

  const result = analyzeElement(child);
  assert.equal(result.backgroundColor, "rgb(0, 0, 0)");
  assert.deepEqual(result.backgroundColors, [
    "rgb(128, 128, 128)",
    "rgb(255, 255, 255)",
  ]);
  assert.deepEqual(result.unsupportedBackgrounds, []);
  assert.equal(
    result.contrastRatio,
    contrastRatio("#000", "rgb(128, 128, 128)"),
  );
  assert.equal(getBackgroundColour(child), "rgb(0, 0, 0)");
});

test("reports unsupported background image layers", () => {
  const sample = element("rgb(255, 255, 255)");
  sample.backgroundImage =
    'url("texture.png"), linear-gradient(rgb(0, 0, 0), rgb(34, 34, 34))';
  sample.color = "rgb(255, 255, 255)";

  const result = analyzeElement(sample);
  assert.deepEqual(result.unsupportedBackgrounds, ['url("texture.png")']);
  assert.deepEqual(result.backgroundColors, [
    "rgb(0, 0, 0)",
    "rgb(34, 34, 34)",
  ]);
  assert.equal(result.aa, true);
});

test("applies tone classes using gradient layers", () => {
  const onGradient = element("rgb(255, 255, 255)");
  onGradient.backgroundImage =
    "linear-gradient(rgb(20, 20, 20), rgb(0, 0, 60))";

  applyColourBrightness([onGradient]);

  assert.equal(onGradient.classList.contains("dark"), true);
  assert.equal(onGradient.classList.contains("light"), false);
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
