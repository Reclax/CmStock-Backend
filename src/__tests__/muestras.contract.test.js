import request from "supertest";
import { expect } from "chai";
import jwt from "jsonwebtoken";

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

const createMinimalMuestra = async (suffix) => {
  const cliente = await Cliente.create({ nombre: `Cliente ${suffix}`, region: null });
  const disenador = await Disenador.create({ nombre: `Disenador ${suffix}` });
  const molderia = await Molderia.create({
    nombre: `Molderia ${suffix}`,
    tipohorma: "pendiente",
    talon: "pendiente",
    punta: "pendiente",
    esnueva: false,
    marca: null,
  });
  const ubicacion = await Ubicacion.create({
    nombre: `Bodega ${suffix}`,
    tipo: "bodega",
    descripcion: null,
  });

  return Muestra.create({
    referencia: `REF-${suffix}`,
    modelo: `MOD-${suffix}`,
    segmento: "SEG-1",
    licenciado: false,
    dima: null,
    talla: 40,
    pareselaborados: 1,
    fechaelaboracion: "2026-01-01",
    estado: "nueva",
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

describe("Contrato API - /api/muestras (paginación)", () => {
  before(async () => {
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
  });

  it("GET /api/muestras retorna {data,total,page,limit,totalPages} y total consistente", async () => {
    const user = await Usuario.create({
      nombre: "User Test",
      email: "user@test.com",
      password: "hash",
      rol: "usuario",
      activo: true,
    });

    await Promise.all([
      createMinimalMuestra("1"),
      createMinimalMuestra("2"),
      createMinimalMuestra("3"),
      createMinimalMuestra("4"),
      createMinimalMuestra("5"),
      createMinimalMuestra("6"),
    ]);

    const res = await request(app)
      .get("/api/muestras?page=1&limit=5")
      .set(authHeaderFor(user));

    expect(res.status).to.equal(200);

    expect(res.body).to.be.an("object");
    expect(res.body).to.have.property("data");
    expect(res.body).to.have.property("total");
    expect(res.body).to.have.property("page");
    expect(res.body).to.have.property("limit");
    expect(res.body).to.have.property("totalPages");

    expect(res.body.data).to.be.an("array");
    expect(res.body.data.length).to.equal(5);

    expect(res.body.total).to.equal(6);
    expect(res.body.page).to.equal(1);
    expect(res.body.limit).to.equal(5);
    expect(res.body.totalPages).to.equal(2);

    const first = res.body.data[0];
    expect(first).to.have.property("id");
    expect(first).to.have.property("referencia");
    expect(first).to.have.property("fechaelaboracion");
  });

  it("GET /api/muestras con 0 registros devuelve data vacía y total 0", async () => {
    const user = await Usuario.create({
      nombre: "User Empty",
      email: "empty@test.com",
      password: "hash",
      rol: "usuario",
      activo: true,
    });

    const res = await request(app)
      .get("/api/muestras?page=1&limit=5")
      .set(authHeaderFor(user));

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("data");
    expect(res.body.data).to.be.an("array");
    expect(res.body.data.length).to.equal(0);
    expect(res.body.total).to.equal(0);
  });
});
