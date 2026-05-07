import { expect } from "chai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { ensureCommonDemoImage } from "../../scripts/seed-demo.js";

describe("Seeder demo - imagen real", () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const uploadsCommonDir = path.resolve(__dirname, "..", "..", "uploads", "common");
  const expectedPath = path.join(uploadsCommonDir, "default_product.jpg");

  after(() => {
    // Limpieza suave: si el archivo fue creado por el test, lo borramos.
    // Si el usuario ya lo tenía, no podemos distinguirlo, así que solo borramos
    // si el tamaño coincide con la fuente actual en src/assets.
    try {
      const { absolutePath } = ensureCommonDemoImage();
      const srcPath = path.resolve(__dirname, "..", "..", "src", "assets", "default_product.jpg");
      if (fs.existsSync(absolutePath) && fs.existsSync(srcPath)) {
        const dstSize = fs.statSync(absolutePath).size;
        const srcSize = fs.statSync(srcPath).size;
        if (dstSize === srcSize) {
          fs.unlinkSync(absolutePath);
        }
      }
    } catch {
      // ignore
    }
  });

  it("crea/copía una imagen física en uploads/common y retorna la URL", () => {
    const result = ensureCommonDemoImage();

    expect(result).to.have.property("urlarchivo", "/uploads/common/default_product.jpg");
    expect(result).to.have.property("absolutePath");
    expect(result.absolutePath).to.equal(expectedPath);

    expect(fs.existsSync(expectedPath)).to.equal(true);
    const stat = fs.statSync(expectedPath);
    expect(stat.size).to.be.greaterThan(0);
  });

  it("es idempotente (segunda llamada no falla)", () => {
    const r1 = ensureCommonDemoImage();
    const r2 = ensureCommonDemoImage();

    expect(r2.urlarchivo).to.equal(r1.urlarchivo);
    expect(fs.existsSync(expectedPath)).to.equal(true);
  });
});
