import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DEFAULT_FILENAME = "default_product.jpg";

export const ensureCommonDemoImage = () => {
  const projectRoot = process.cwd();

  const srcPath = path.resolve(projectRoot, "src", "assets", DEFAULT_FILENAME);
  const dstDir = path.resolve(projectRoot, "uploads", "common");
  const dstPath = path.join(dstDir, DEFAULT_FILENAME);

  if (!fs.existsSync(srcPath)) {
    throw new Error(`No se encontró la imagen demo en: ${srcPath}`);
  }

  fs.mkdirSync(dstDir, { recursive: true });

  if (!fs.existsSync(dstPath)) {
    fs.copyFileSync(srcPath, dstPath);
  }

  return {
    urlarchivo: `/uploads/common/${DEFAULT_FILENAME}`,
    absolutePath: dstPath,
  };
};

// Permite ejecutarlo por comando: `node scripts/seed-demo.js`
const isDirectRun = (() => {
  if (!process.argv[1]) return false;
  try {
    return path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isDirectRun) {
  const result = ensureCommonDemoImage();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result));
}
