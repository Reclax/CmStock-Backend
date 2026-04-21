import request from "supertest";
import { expect } from "chai";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

process.env.NODE_ENV = "test";
if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test-secret";

let app;
let sequelize;
let Usuario;
let Cliente;
let Disenador;
let Molderia;
let Ubicacion;
let Muestra;

const signTokenFor = (user) =>
  jwt.sign({ id: user.id, rol: user.rol, email: user.email }, process.env.JWT_SECRET);

const authHeaderFor = (user) => ({ Authorization: `Bearer ${signTokenFor(user)}` });

const cleanupUploads = () => {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) return;
  for (const filename of fs.readdirSync(uploadsDir)) {
    if (filename.startsWith("foto-")) {
      try {
        fs.unlinkSync(path.join(uploadsDir, filename));
      } catch {
        // ignore
      }
    }
  }
};

const createMinimalMuestra = async () => {
  const cliente = await Cliente.create({ nombre: "Cliente Test", region: null });
  const disenador = await Disenador.create({ nombre: "Disenador Test" });
  const molderia = await Molderia.create({
    nombre: "Molderia Test",
    tipohorma: "pendiente",
    talon: "pendiente",
    punta: "pendiente",
    esnueva: false,
    marca: null,
  });
  const ubicacion = await Ubicacion.create({
    nombre: "Bodega Test",
    tipo: "bodega",
    descripcion: null,
  });

  return Muestra.create({
    referencia: "REF-1",
    modelo: "MOD-1",
    segmento: "SEG-1",
    licenciado: false,
    dima: null,
    talla: 40,
    pareselaborados: 1,
    fechaelaboracion: "2026-01-01",
    estado: "nuevo",
    proceso: null,
    observaciones: null,
    codigoqr: null,
    codigobarras: null,
    clienteid: cliente.id,
    disenadorid: disenador.id,
    molderiaid: molderia.id,
    ubicacionid: ubicacion.id,
  });
};

describe("Fotos (CmStock) - orden y control de tamaño", () => {
  before(async () => {
    // Import after env is set, so config/database.js picks sqlite in-memory.
    ({ app } = await import("../app.js"));
    ({ sequelize } = await import("../config/database.js"));
    const models = await import("../models/index.js");
    Usuario = models.Usuario;
    Cliente = models.Cliente;
    Disenador = models.Disenador;
    Molderia = models.Molderia;
    Ubicacion = models.Ubicacion;
    Muestra = models.Muestra;
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    cleanupUploads();
  });

  after(async () => {
    cleanupUploads();
    await sequelize.close();
  });

  it("POST /api/fotos/upload: asigna orden incremental por usuario+muestra", async () => {
    const user = await Usuario.create({
      nombre: "User Test",
      email: "user@test.com",
      password: "hash",
      rol: "usuario",
      activo: true,
    });

    const muestra = await createMinimalMuestra();

    const res1 = await request(app)
      .post("/api/fotos/upload")
      .set(authHeaderFor(user))
      .field("muestraid", muestra.id)
      .attach("file", Buffer.from("img1"), {
        filename: "a.png",
        contentType: "image/png",
      });

    expect(res1.status).to.equal(201);
    expect(res1.body).to.have.property("orden", 1);

    const res2 = await request(app)
      .post("/api/fotos/upload")
      .set(authHeaderFor(user))
      .field("muestraid", muestra.id)
      .attach("file", Buffer.from("img2"), {
        filename: "b.png",
        contentType: "image/png",
      });

    expect(res2.status).to.equal(201);
    expect(res2.body).to.have.property("orden", 2);

    const res3 = await request(app)
      .post("/api/fotos/upload")
      .set(authHeaderFor(user))
      .field("muestraid", muestra.id)
      .attach("file", Buffer.from("img3"), {
        filename: "c.png",
        contentType: "image/png",
      });

    expect(res3.status).to.equal(201);
    expect(res3.body).to.have.property("orden", 3);

    const list = await request(app)
      .get(`/api/fotos?muestraid=${encodeURIComponent(muestra.id)}`)
      .set(authHeaderFor(user));

    expect(list.status).to.equal(200);
    expect(list.body).to.be.an("array");
    expect(list.body.length).to.equal(3);

    const ordenes = list.body.map((f) => f.orden);
    expect(ordenes).to.deep.equal([1, 2, 3]);
  });

  it("PATCH /api/fotos/reordenar: persiste el orden enviado por el usuario", async () => {
    const user = await Usuario.create({
      nombre: "User 2",
      email: "user2@test.com",
      password: "hash",
      rol: "usuario",
      activo: true,
    });

    const muestra = await createMinimalMuestra();

    const a = await request(app)
      .post("/api/fotos/upload")
      .set(authHeaderFor(user))
      .field("muestraid", muestra.id)
      .attach("file", Buffer.from("a"), { filename: "a.png", contentType: "image/png" });

    const b = await request(app)
      .post("/api/fotos/upload")
      .set(authHeaderFor(user))
      .field("muestraid", muestra.id)
      .attach("file", Buffer.from("b"), { filename: "b.png", contentType: "image/png" });

    const c = await request(app)
      .post("/api/fotos/upload")
      .set(authHeaderFor(user))
      .field("muestraid", muestra.id)
      .attach("file", Buffer.from("c"), { filename: "c.png", contentType: "image/png" });

    const orderedIds = [c.body.id, a.body.id, b.body.id];

    const resReorder = await request(app)
      .patch("/api/fotos/reordenar")
      .set(authHeaderFor(user))
      .send({ muestraid: muestra.id, orderedIds });

    expect(resReorder.status).to.equal(200);
    expect(resReorder.body).to.be.an("array");
    expect(resReorder.body.map((f) => f.id)).to.deep.equal(orderedIds);
    expect(resReorder.body.map((f) => f.orden)).to.deep.equal([1, 2, 3]);

    const list = await request(app)
      .get(`/api/fotos?muestraid=${encodeURIComponent(muestra.id)}`)
      .set(authHeaderFor(user));

    expect(list.status).to.equal(200);
    expect(list.body.map((f) => f.id)).to.deep.equal(orderedIds);
    expect(list.body.map((f) => f.orden)).to.deep.equal([1, 2, 3]);
  });

  it("POST /api/fotos/upload: rechaza tipo no permitido", async () => {
    const user = await Usuario.create({
      nombre: "User 3",
      email: "user3@test.com",
      password: "hash",
      rol: "usuario",
      activo: true,
    });

    const muestra = await createMinimalMuestra();

    const res = await request(app)
      .post("/api/fotos/upload")
      .set(authHeaderFor(user))
      .field("muestraid", muestra.id)
      .attach("file", Buffer.from("not-image"), {
        filename: "a.txt",
        contentType: "text/plain",
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("message");
  });

  it("POST /api/fotos/upload: rechaza archivos mayores a 10MB", async () => {
    const user = await Usuario.create({
      nombre: "User 4",
      email: "user4@test.com",
      password: "hash",
      rol: "usuario",
      activo: true,
    });

    const muestra = await createMinimalMuestra();

    const big = Buffer.alloc(10 * 1024 * 1024 + 1, 1);

    const res = await request(app)
      .post("/api/fotos/upload")
      .set(authHeaderFor(user))
      .field("muestraid", muestra.id)
      .attach("file", big, {
        filename: "big.png",
        contentType: "image/png",
      });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property("message");
  });
});
