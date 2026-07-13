import { readFile, writeFile } from "node:fs/promises";

import { build } from "esbuild";
import { minify } from "terser";

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const banner = `/*! colorContrast.js v${packageJson.version} | ${packageJson.license} | includes Culori (MIT) */`;

const sharedBuildOptions = {
  entryPoints: ["src/color-contrast.js"],
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2020",
  banner: { js: banner },
};

await build({
  ...sharedBuildOptions,
  outfile: "color-contrast.js",
});

await build({
  ...sharedBuildOptions,
  minify: true,
  outfile: "color-contrast.min.js",
});

const legacySource = await readFile("jquery.colourbrightness.js", "utf8");
const legacyResult = await minify(legacySource, {
  compress: true,
  mangle: true,
  format: { comments: /^!/ },
});

if (!legacyResult.code) {
  throw new Error("Terser did not produce a legacy build");
}

await writeFile(
  "jquery.colourbrightness.min.js",
  `${legacyResult.code.trimEnd()}\n`,
);
