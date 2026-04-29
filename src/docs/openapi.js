const errorSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
  },
  required: ["message"],
  additionalProperties: false,
};

const commonParameters = {
  IdParam: {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "string", format: "uuid" },
    description: "Identificador del recurso",
  },
  PageParam: {
    name: "page",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  LimitParam: {
    name: "limit",
    in: "query",
    required: false,
    schema: { type: "integer", minimum: 1, default: 10 },
  },
};

const normalizeProperty = (property) => {
  if (Array.isArray(property?.type)) {
    const nonNullType = property.type.find((type) => type !== "null");
    return {
      ...property,
      type: nonNullType,
      nullable: property.type.includes("null"),
    };
  }

  return property;
};

const createSchema = ({ properties, required = [], includeTimestamps = false }) => {
  const normalizedProperties = Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, normalizeProperty(value)])
  );
  const responseProperties = {
    id: { type: "string", format: "uuid" },
    ...normalizedProperties,
  };

  if (includeTimestamps) {
    responseProperties.createdat = { type: "string", format: "date-time" };
    responseProperties.updatedat = { type: "string", format: "date-time" };
  }

  return {
    response: {
      type: "object",
      properties: responseProperties,
      required: ["id", ...required],
      additionalProperties: false,
    },
    create: {
      type: "object",
      properties: normalizedProperties,
      required,
      additionalProperties: false,
    },
    update: {
      type: "object",
      properties: normalizedProperties,
      additionalProperties: false,
    },
  };
};

const paginatedSchema = (schemaRef) => ({
  type: "object",
  properties: {
    data: {
      type: "array",
      items: { $ref: schemaRef },
    },
    total: { type: "integer" },
    page: { type: "integer" },
    limit: { type: "integer" },
    totalPages: { type: "integer" },
  },
  required: ["data", "total", "page", "limit", "totalPages"],
  additionalProperties: false,
});

const authSchemas = {
  Register: {
    type: "object",
    properties: {
      nombre: { type: "string", minLength: 3 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 6 },
      rol: {
        type: "string",
        enum: ["admin", "diseñador", "modelador", "usuario", "gerente"],
        default: "usuario",
      },
    },
    required: ["nombre", "email", "password"],
    additionalProperties: false,
  },
  Login: {
    type: "object",
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
    required: ["email", "password"],
    additionalProperties: false,
  },
  ChangePassword: {
    type: "object",
    properties: {
      oldPassword: { type: "string" },
      newPassword: { type: "string", minLength: 6 },
    },
    required: ["oldPassword", "newPassword"],
    additionalProperties: false,
  },
  Usuario: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      nombre: { type: "string" },
      email: { type: "string", format: "email" },
      rol: { type: "string" },
    },
    required: ["id", "nombre", "email", "rol"],
    additionalProperties: false,
  },
  LoginResponse: {
    type: "object",
    properties: {
      message: { type: "string" },
      token: { type: "string" },
      usuario: { $ref: "#/components/schemas/Usuario" },
    },
    required: ["message", "token", "usuario"],
    additionalProperties: false,
  },
};

const resourceSpecs = [
  {
    name: "Cliente",
    tag: "Clientes",
    label: "cliente",
    path: "/api/clientes",
    properties: {
      nombre: { type: "string" },
      region: { type: ["string", "null"] },
    },
    required: ["nombre"],
  },
  {
    name: "Usuario",
    tag: "Usuarios",
    label: "usuario",
    path: "/api/usuarios",
    properties: {
      nombre: { type: "string" },
      email: { type: "string", format: "email" },
      rol: { type: "string" },
      activo: { type: "boolean" },
    },
    required: ["nombre", "email", "rol", "activo"],
  },
  {
    name: "Molderia",
    tag: "Molderias",
    label: "molderia",
    path: "/api/molderias",
    paginated: true,
    patch: true,
    properties: {
      nombre: { type: "string" },
      tipohorma: { type: "string" },
      talon: { type: "string" },
      punta: { type: "string" },
      esnueva: { type: "boolean" },
      marca: { type: ["string", "null"] },
    },
    required: ["nombre", "tipohorma", "talon", "punta", "esnueva"],
  },
  {
    name: "Ubicacion",
    tag: "Ubicaciones",
    label: "ubicacion",
    path: "/api/ubicaciones",
    paginated: true,
    patch: true,
    properties: {
      nombre: { type: "string" },
      tipo: { type: "string" },
      descripcion: { type: ["string", "null"] },
    },
    required: ["nombre", "tipo"],
  },
  {
    name: "Foto",
    tag: "Fotos",
    label: "foto",
    path: "/api/fotos",
    patch: true,
    includeTimestamps: true,
    properties: {
      muestraid: { type: "string", format: "uuid" },
      urlarchivo: { type: "string" },
      origen: { type: "string", enum: ["camara", "archivo"] },
      fechacarga: { type: "string", format: "date" },
      usuarioid: { type: "string", format: "uuid" },
      orden: { type: ["integer", "null"], minimum: 1 },
    },
    required: ["muestraid", "urlarchivo", "origen", "fechacarga", "usuarioid"],
  },
  {
    name: "Muestra",
    tag: "Muestras",
    label: "muestra",
    path: "/api/muestras",
    properties: {
      referencia: { type: "string" },
      modelo: { type: "string" },
      segmento: { type: "string" },
      licenciado: { type: "boolean" },
      dima: { type: ["string", "null"] },
      talla: { type: ["integer", "null"] },
      pareselaborados: { type: "integer" },
      fechaelaboracion: { type: "string", format: "date" },
      estado: {
        type: "string",
        enum: ["nueva", "presentada", "aprobada", "rechazada", "reutilizable"],
      },
      proceso: { type: ["string", "null"] },
      observaciones: { type: ["string", "null"] },
      clienteid: { type: "string", format: "uuid" },
      disenadorid: { type: "string", format: "uuid" },
      molderiaid: { type: "string", format: "uuid" },
      ubicacionid: { type: "string", format: "uuid" },
    },
    required: [
      "referencia",
      "modelo",
      "segmento",
      "licenciado",
      "pareselaborados",
      "fechaelaboracion",
      "estado",
      "clienteid",
      "disenadorid",
      "molderiaid",
      "ubicacionid",
    ],
  },
  {
    name: "Trazabilidad",
    tag: "Trazabilidades",
    label: "trazabilidad",
    path: "/api/trazabilidades",
    patch: true,
    includeTimestamps: true,
    properties: {
      muestraid: { type: "string", format: "uuid" },
      disenadorid: { type: "string", format: "uuid" },
      modeladorid: { type: "string", format: "uuid" },
      fecharequerimiento: { type: "string", format: "date" },
      fechadiseno: { type: "string", format: "date" },
      fechamolderia: { type: "string", format: "date" },
      fecharegistro: { type: "string", format: "date" },
      tiempos: { type: ["string", "null"] },
    },
    required: [
      "muestraid",
      "disenadorid",
      "modeladorid",
      "fecharequerimiento",
      "fechadiseno",
      "fechamolderia",
      "fecharegistro",
    ],
  },
  {
    name: "Produccion",
    tag: "Producciones",
    label: "produccion",
    path: "/api/producciones",
    properties: {
      muestraid: { type: "string", format: "uuid" },
      clienteid: { type: "string", format: "uuid" },
      ordennumero: { type: "string" },
      paresproducidos: { type: "integer" },
      fechaproduccion: { type: "string", format: "date" },
      mes: { type: "string" },
    },
    required: [
      "muestraid",
      "clienteid",
      "ordennumero",
      "paresproducidos",
      "fechaproduccion",
      "mes",
    ],
  },
  {
    name: "MovimientoInventario",
    tag: "MovimientosInventario",
    label: "movimiento de inventario",
    collectionLabel: "movimientos de inventario",
    path: "/api/movimientos-inventario",
    properties: {
      muestraid: { type: "string", format: "uuid" },
      tipo: { type: "string", enum: ["entrada", "salida"] },
      cantidad: { type: "integer" },
      fecha: { type: "string", format: "date" },
      motivo: { type: "string" },
      usuarioid: { type: "string", format: "uuid" },
    },
    required: ["muestraid", "tipo", "cantidad", "fecha", "motivo", "usuarioid"],
  },
  {
    name: "Presentacion",
    tag: "Presentaciones",
    label: "presentacion",
    path: "/api/presentaciones",
    properties: {
      muestraid: { type: "string", format: "uuid" },
      clienteid: { type: "string", format: "uuid" },
      fecha: { type: "string", format: "date" },
      resultado: { type: "string", enum: ["aprobada", "rechazada"] },
      paresaprobados: { type: ["integer", "null"] },
      paresrechazados: { type: ["integer", "null"] },
      derivoproduccion: { type: "boolean" },
      observaciones: { type: ["string", "null"] },
    },
    required: ["muestraid", "clienteid", "fecha", "resultado", "derivoproduccion"],
  },
];

const buildPathObject = (spec) => {
  const schemaRef = `#/components/schemas/${spec.name}`;
  const createRef = `#/components/schemas/${spec.name}Create`;
  const updateRef = `#/components/schemas/${spec.name}Update`;

  const listResponse = spec.paginated
    ? {
        200: {
          description: "Listado paginado",
          content: {
            "application/json": {
              schema: paginatedSchema(schemaRef),
            },
          },
        },
      }
    : {
        200: {
          description: "Listado",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: schemaRef },
              },
            },
          },
        },
      };

  const base = {
    get: {
      tags: [spec.tag],
      summary: `Listar ${spec.collectionLabel || spec.tag.toLowerCase()}`,
      ...(spec.paginated
        ? {
            parameters: [{ $ref: "#/components/parameters/PageParam" }, { $ref: "#/components/parameters/LimitParam" }],
          }
        : {}),
      responses: listResponse,
    },
    post: {
      tags: [spec.tag],
      summary: `Crear ${spec.label}`,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: createRef },
          },
        },
      },
      responses: {
        201: {
          description: "Recurso creado",
          content: {
            "application/json": {
              schema: { $ref: schemaRef },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
      },
    },
  };

  const item = {
    get: {
      tags: [spec.tag],
      summary: `Obtener ${spec.label} por id`,
      parameters: [{ $ref: "#/components/parameters/IdParam" }],
      responses: {
        200: {
          description: "Recurso encontrado",
          content: {
            "application/json": {
              schema: { $ref: schemaRef },
            },
          },
        },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
    put: {
      tags: [spec.tag],
      summary: `Actualizar ${spec.label}`,
      parameters: [{ $ref: "#/components/parameters/IdParam" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: updateRef },
          },
        },
      },
      responses: {
        200: {
          description: "Recurso actualizado",
          content: {
            "application/json": {
              schema: { $ref: schemaRef },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
      },
    },
    delete: {
      tags: [spec.tag],
      summary: `Eliminar ${spec.label}`,
      parameters: [{ $ref: "#/components/parameters/IdParam" }],
      responses: {
        204: { description: "Recurso eliminado" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
  };

  if (spec.patch) {
    item.patch = {
      tags: [spec.tag],
      summary: `Actualizar parcialmente ${spec.label}`,
      parameters: [{ $ref: "#/components/parameters/IdParam" }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: updateRef },
          },
        },
      },
      responses: {
        200: {
          description: "Recurso actualizado",
          content: {
            "application/json": {
              schema: { $ref: schemaRef },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        404: { $ref: "#/components/responses/NotFound" },
        409: { $ref: "#/components/responses/Conflict" },
      },
    };
  }

  return {
    [spec.path]: base,
    [`${spec.path}/{id}`]: item,
  };
};

export const buildOpenApiDocument = ({ serverUrl }) => {
  const componentSchemas = {
    ...authSchemas,
  };
  const paths = {};

  for (const spec of resourceSpecs) {
    const schemas = createSchema({
      properties: spec.properties,
      required: spec.required,
      includeTimestamps: spec.includeTimestamps,
    });

    componentSchemas[spec.name] = schemas.response;
    componentSchemas[`${spec.name}Create`] = schemas.create;
    componentSchemas[`${spec.name}Update`] = schemas.update;

    Object.assign(paths, buildPathObject(spec));
  }

  // Ajustes y endpoints custom para Fotos (subida multipart + reordenamiento)
  if (paths["/api/fotos"]?.get) {
    paths["/api/fotos"].get.parameters = [
      {
        name: "muestraid",
        in: "query",
        required: false,
        schema: { type: "string", format: "uuid" },
        description: "Filtra fotos por muestra (se retorna el orden del usuario autenticado)",
      },
    ];
  }

  if (paths["/api/fotos"]?.post) {
    // Se elimina el POST genérico del CRUD; solo queda /api/fotos/upload
    delete paths["/api/fotos"].post;
  }

  // Eliminar endpoints por id del CRUD genérico
  if (paths["/api/fotos/{id}"]) {
    delete paths["/api/fotos/{id}"];
  }

  // POST /api/fotos/upload (multipart/form-data)
  paths["/api/fotos/upload"] = {
    post: {
      tags: ["Fotos"],
      summary: "Subir una foto (archivo) para una muestra",
      description:
        "Sube una imagen (JPG/PNG/WebP, máx 10MB). El usuario se obtiene del token y el campo 'orden' se asigna automáticamente por (muestra, usuario).",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file", "muestraid"],
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "Archivo de imagen",
                },
                muestraid: { type: "string", format: "uuid" },
                origen: {
                  type: "string",
                  enum: ["camara", "archivo"],
                  default: "archivo",
                },
                fechacarga: {
                  type: "string",
                  format: "date",
                  description: "Opcional. Si no se envía, se usa la fecha actual.",
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        201: {
          description: "Foto creada y archivo guardado",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Foto" },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
  };

  // PATCH /api/fotos/reordenar
  paths["/api/fotos/reordenar"] = {
    patch: {
      tags: ["Fotos"],
      summary: "Reordenar fotos de una muestra",
      description:
        "Persiste el orden de fotos del usuario autenticado dentro de la muestra. 'orderedIds' debe incluir todas las fotos del usuario para esa muestra.",
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["muestraid", "orderedIds"],
              properties: {
                muestraid: { type: "string", format: "uuid" },
                orderedIds: {
                  type: "array",
                  minItems: 1,
                  items: { type: "string", format: "uuid" },
                },
              },
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        200: {
          description: "Listado reordenado",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: { $ref: "#/components/schemas/Foto" },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
  };

  // Agregar endpoints de autenticación
  const authPaths = {
    "/api/auth/register": {
      post: {
        tags: ["Autenticación"],
        summary: "Registrar un nuevo usuario",
        description: "Crear una nueva cuenta de usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Register" },
            },
          },
        },
        responses: {
          201: {
            description: "Usuario registrado exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    usuario: { $ref: "#/components/schemas/Usuario" },
                  },
                  required: ["message", "usuario"],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: {
            description: "El usuario ya existe",
            content: {
              "application/json": {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Autenticación"],
        summary: "Iniciar sesión",
        description: "Autenticar usuario y obtener token JWT",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Login" },
            },
          },
        },
        responses: {
          200: {
            description: "Login exitoso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: {
            description: "Credenciales inválidas",
            content: {
              "application/json": {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Autenticación"],
        summary: "Obtener usuario actual",
        description: "Retorna los datos del usuario autenticado",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Datos del usuario",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Usuario" },
              },
            },
          },
          401: {
            description: "No autenticado o token inválido",
            content: {
              "application/json": {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    "/api/auth/change-password": {
      post: {
        tags: ["Autenticación"],
        summary: "Cambiar contraseña",
        description: "Cambiar la contraseña del usuario autenticado",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ChangePassword" },
            },
          },
        },
        responses: {
          200: {
            description: "Contraseña actualizada exitosamente",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                  required: ["message"],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  };

  const finalPaths = {
    "/": {
      get: {
        tags: ["API"],
        summary: "Estado de la API",
        responses: {
          200: {
            description: "API disponible",
            content: {
              "text/plain": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
    },
    ...authPaths,
    ...paths,
  };

  return {
    openapi: "3.0.3",
    info: {
      title: "CM Stock API",
      version: "1.0.0",
      description: "Documentación OpenAPI de las rutas disponibles del backend CM Stock.",
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: "API" },
      { name: "Autenticación", description: "Endpoints para autenticación y gestión de sesiones" },
      ...resourceSpecs.map((spec) => ({ name: spec.tag })),
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT obtenido en el login",
        },
      },
      parameters: commonParameters,
      responses: {
        BadRequest: {
          description: "Solicitud inválida",
          content: {
            "application/json": {
              schema: errorSchema,
            },
          },
        },
        NotFound: {
          description: "Recurso no encontrado",
          content: {
            "application/json": {
              schema: errorSchema,
            },
          },
        },
        Unauthorized: {
          description: "No autenticado",
          content: {
            "application/json": {
              schema: errorSchema,
            },
          },
        },
        Conflict: {
          description: "Conflicto con el estado actual del recurso",
          content: {
            "application/json": {
              schema: errorSchema,
            },
          },
        },
      },
      schemas: componentSchemas,
    },
    paths: finalPaths,
    security: [{ BearerAuth: [] }],
  };
};
