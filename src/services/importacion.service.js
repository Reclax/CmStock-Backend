import XLSX from 'xlsx';
import { Op } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Cliente,
  Disenador,
  Molderia,
  Muestra,
  Presentacion,
  Produccion,
  Usuario,
  Foto,
  Ubicacion,
} from '../models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * SERVICIO DE IMPORTACIÓN DE EXCEL
 * Importa datos desde Excel sin sobrescribir registros existentes
 */

// Convertir fecha de Excel a Date
const excelDateToJSDate = (excelDate) => {
  if (!excelDate) return null;
  
  if (typeof excelDate === 'string') {
    // Try to parse common string date formats
    const parts = excelDate.split(/[-/]/);
    let parsedDate;
    if (parts.length === 3) {
      // Assuming DD/MM/YYYY or DD-MM-YYYY
      if (parts[2].length === 4) {
        parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      } else {
        parsedDate = new Date(excelDate);
      }
    } else {
      parsedDate = new Date(excelDate);
    }
    
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  const num = Number(excelDate);
  if (!isNaN(num)) {
    const date = new Date((num - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
};

/**
 * Obtener o crear Cliente
 */
export const obtenerOCrearCliente = async (nombre) => {
  if (!nombre || nombre.trim() === '') return null;

  const nombreLimpio = nombre.trim();

  // Buscar cliente existente (case-insensitive)
  let cliente = await Cliente.findOne({
    where: {
      nombre: { [Op.iLike]: nombreLimpio },
    },
  });

  // Si no existe, crear nuevo
  if (!cliente) {
    cliente = await Cliente.create({
      nombre: nombreLimpio,
      region: null,
    });
    console.log(`✅ Cliente creado: ${nombreLimpio}`);
  } else {
    console.log(`⏭️  Cliente existente: ${nombreLimpio}`);
  }

  return cliente;
};

/**
 * Obtener o crear Usuario (Diseñador)
 */
export const obtenerOCrearUsuario = async (nombre, rol = 'diseñador') => {
  if (!nombre || nombre.trim() === '') return null;

  const nombreLimpio = nombre.trim();

  // Buscar usuario existente
  let usuario = await Usuario.findOne({
    where: {
      nombre: { [Op.iLike]: nombreLimpio },
    },
  });

  // Si no existe, crear nuevo
  if (!usuario) {
    usuario = await Usuario.create({
      nombre: nombreLimpio,
      email: `${nombreLimpio.toLowerCase().replace(/\s+/g, '.')}@cmstock.local`,
      password: 'temporal123', // Contraseña temporal
      rol,
      activo: true,
    });
    console.log(`✅ Usuario creado: ${nombreLimpio}`);
  } else {
    console.log(`⏭️  Usuario existente: ${nombreLimpio}`);
  }

  return usuario;
};

/**
 * Obtener o crear Diseñador (tabla disenadores, no usuarios)
 */
export const obtenerOCrearDisenador = async (nombre) => {
  if (!nombre || nombre.trim() === '') return null;

  const nombreLimpio = nombre.trim();

  // Buscar diseñador existente
  let disenador = await Disenador.findOne({
    where: {
      nombre: { [Op.iLike]: nombreLimpio },
    },
  });

  // Si no existe, crear nuevo
  if (!disenador) {
    disenador = await Disenador.create({
      nombre: nombreLimpio,
    });
    console.log(`✅ Diseñador creado: ${nombreLimpio}`);
  } else {
    console.log(`⏭️  Diseñador existente: ${nombreLimpio}`);
  }

  return disenador;
};

/**
 * Obtener o crear Ubicación por defecto para importaciones
 */
export const obtenerOCrearUbicacionImportacion = async () => {
  let ubicacion = await Ubicacion.findOne({
    where: {
      nombre: 'IMPORTACIÓN',
    },
  });

  if (!ubicacion) {
    ubicacion = await Ubicacion.create({
      nombre: 'IMPORTACIÓN',
      tipo: 'Almacén',
      descripcion: 'Ubicación por defecto para muestras importadas',
    });
    console.log('✅ Ubicación de importación creada');
  }

  return ubicacion;
};

/**
 * Obtener usuario del sistema (para importaciones)
 */
export const obtenerUsuarioSistema = async () => {
  // Buscar usuario admin, si no existe retornar null
  const admin = await Usuario.findOne({
    where: { rol: 'admin' },
  });
  return admin;
};

/**
 * Obtener o crear Moldería
 */
export const obtenerOCrearMolderia = async (nombre, molderiaNueva, marca) => {
  if (!nombre || nombre.trim() === '') return null;

  const nombreLimpio = nombre.trim();

  // Buscar moldería existente
  let molderia = await Molderia.findOne({
    where: {
      nombre: { [Op.iLike]: nombreLimpio },
    },
  });

  // Si no existe, crear nueva
  if (!molderia) {
    molderia = await Molderia.create({
      nombre: nombreLimpio,
      tipohorma: nombreLimpio, // tipohorma es el mismo que el nombre (ej: "SUECA 0")
      talon: 'Estándar', // Valor por defecto
      punta: 'Estándar', // Valor por defecto
      esnueva: molderiaNueva === 1 || molderiaNueva === true,
      marca: marca || null,
    });
    console.log(`✅ Moldería creada: ${nombreLimpio}`);
  } else {
    console.log(`⏭️  Moldería existente: ${nombreLimpio}`);
  }

  return molderia;
};

/**
 * Obtener o crear Muestra
 */
export const obtenerOCrearMuestra = async (
  referencia,
  segmento,
  licenciado,
  dima,
  talla,
  pareselaborados,
  fechaelaboracion,
  estado,
  proceso,
  observaciones,
  clienteid,
  disenadorid,
  molderiaid,
  ubicacionid
) => {
  if (!referencia || referencia.trim() === '') return null;

  const refLimpia = referencia.trim();

  // Buscar muestra existente por referencia
  let muestra = await Muestra.findOne({
    where: {
      referencia: { [Op.iLike]: refLimpia },
    },
  });

  if (muestra) {
    console.log(`⏭️  Muestra existente: ${refLimpia}`);
  } else {
    // Crear nueva muestra
    muestra = await Muestra.create({
      referencia: refLimpia,
      segmento: segmento || 'SIN SEGMENTO',
      licenciado: licenciado === true || licenciado === 1,
      dima: dima || null,
      talla: talla || null,
      pareselaborados: parseInt(pareselaborados) || 0,
      fechaelaboracion: fechaelaboracion || new Date().toISOString().slice(0, 10),
      estado: estado || 'PENDIENTE',
      proceso: proceso || null,
      observaciones: observaciones || null,
      codigoqr: null,
      codigobarras: null,
      clienteid,
      disenadorid,
      molderiaid,
      ubicacionid,
    });
    console.log(`✅ Muestra creada: ${refLimpia}`);
  }

  return muestra;
};

/**
 * Importar datos de BASE DIS 2025
 */
export const importarBaseDis = async (filePath) => {
  console.log('\n' + '='.repeat(80));
  console.log('📥 IMPORTANDO: BASE DIS 2025 (2).xlsx');
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(filePath);
  const ws = workbook.Sheets['BASES'];
  const datos = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Headers en fila 4
  const headers = datos[3].slice(2);
  console.log('📋 Headers encontrados:', headers.slice(0, 10)); // Ver primeros 10 headers
  
  const registros = datos.slice(4).filter((r) => r[2]); // Filtrar vacíos
  console.log(`📊 Total de registros a procesar: ${registros.length}`);

  let creados = 0;
  let procesados = 0;

  // Obtener ubicación por defecto para importaciones
  const ubicacion = await obtenerOCrearUbicacionImportacion();

  for (const fila of registros) {
    const registro = {};
    headers.forEach((header, i) => {
      registro[header] = fila[i + 2];
    });

    try {
      procesados++;
      
      const ref = String(registro['REF'] || '').trim();
      if (procesados <= 3 || procesados % 100 === 0) {
        console.log(`\n🔍 Procesando orden ${procesados}: REF=${ref}, CLIENTE=${registro['CLIENTE']}, MOLDERÍA=${registro['MOLDERÍA']}`);
      }

      // Obtener o crear Cliente
      const cliente = await obtenerOCrearCliente(registro['CLIENTE']);
      if (!cliente) {
        console.log(`   ❌ Cliente inválido`);
        continue;
      }

      // Obtener o crear Diseñador (tabla disenadores)
      const disenador = await obtenerOCrearDisenador(registro['DISEÑADOR']);
      if (!disenador) {
        console.log(`   ❌ Diseñador inválido`);
        continue;
      }

      // Obtener o crear Moldería (pasando solo nombre, molderiaNueva, marca)
      const molderia = await obtenerOCrearMolderia(
        registro['MOLDERÍA'],
        registro['MOLDERIA NUEVA'],
        registro['MARCA']
      );
      if (!molderia) {
        console.log(`   ❌ Moldería inválida`);
        continue;
      }

      // Obtener o crear Muestra con TODOS los parámetros correctos
      const muestra = await obtenerOCrearMuestra(
        ref,                       // referencia
        registro['SEGMENTO'],      // segmento
        registro['LICENCIA'],      // licenciado (boolean)
        registro['DIMA'],          // dima
        registro['TALLA'],         // talla
        registro['PARES'],         // pareselaborados
        excelDateToJSDate(registro['CREACIÓN']), // fechaelaboracion
        'PENDIENTE',               // estado (por defecto PENDIENTE)
        registro['PROCESO'],       // proceso
        registro['OBSERVACIONES'], // observaciones
        cliente.id,                // clienteid
        disenador.id,              // disenadorid (tabla disenadores, no usuarios)
        molderia.id,               // molderiaid
        ubicacion.id               // ubicacionid
      );
      if (!muestra) continue;

      // Crear Producción
      const produccionExiste = await Produccion.findOne({
        where: {
          ordennumero: String(registro['ORDEN Nº']),
        },
      });

      if (!produccionExiste) {
        await Produccion.create({
          muestraid: muestra.id,
          clienteid: cliente.id,
          ordennumero: String(registro['ORDEN Nº']),
          paresproducidos: parseInt(registro['PARES']) || 0,
          fechaproduccion: excelDateToJSDate(registro['FECHA ENTREGA']) || new Date(),
          mes: registro['MES'] || 'SIN MES',
        });
        creados++;
        console.log(`✅ Producción creada: Orden ${registro['ORDEN Nº']}`);
      } else {
        console.log(`⏭️  Producción existente: Orden ${registro['ORDEN Nº']}`);
      }

      if (procesados % 50 === 0) {
        console.log(`\n📊 Progreso: ${procesados} registros procesados, ${creados} creados\n`);
      }
    } catch (error) {
      console.error(
        `❌ Error procesando orden ${registro['ORDEN Nº']}: ${error.message}`
      );
    }
  }

  console.log('\n✅ IMPORTACIÓN BASE DIS 2025 COMPLETADA');
  console.log(`   Total procesados: ${procesados}`);
  console.log(`   Nuevos creados: ${creados}`);

  return { procesados, creados };
};

/**
 * Importar datos de Formato Aprobaciones
 */
export const importarAprobaciones = async (filePath) => {
  console.log('\n' + '='.repeat(80));
  console.log('📥 IMPORTANDO: Formato Aprobaciones.xlsx');
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(filePath);
  const ws = workbook.Sheets['INDIC-DIS2'];
  const datos = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Headers en fila 13 (índice 12)
  const registros = datos.slice(13).filter((r) => r[1]); // Filtrar por [1] (REF)

  let creados = 0;
  let procesados = 0;

  const wsPresentacion = workbook.Sheets['presentacion muestras'];
  let datosPresentacion = [];
  if (wsPresentacion) {
    const rawPresentacion = XLSX.utils.sheet_to_json(wsPresentacion, { header: 1 });
    if (rawPresentacion.length > 0) {
      const headers = rawPresentacion[0].map(h => String(h || '').toUpperCase());
      const refIdx = headers.indexOf('REF');
      const clienteIdx = headers.indexOf('CLIENTE');
      if (refIdx !== -1 && clienteIdx !== -1) {
        datosPresentacion = rawPresentacion.slice(1).map(r => ({
          ref: String(r[refIdx] || '').trim(),
          cliente: String(r[clienteIdx] || '').trim()
        })).filter(r => r.ref && r.cliente);
      }
    }
  }

  for (const registro of registros) {
    try {
      procesados++;

      // Mapeo de índices de columna
      const ref = String(registro[1] || '').trim(); // [1] = REF
      const diseñador = String(registro[2] || '').trim(); // [2] = DISEÑADOR
      const modelo = String(registro[3] || '').trim(); // [3] = MODELO
      const genero = String(registro[4] || '').trim(); // [4] = GENERO (segmento)
      const cliente = String(registro[5] || '').trim(); // [5] = CLIENTE
      const licencia = registro[6]; // [6] = LICENCIA
      const fechaMuestra = registro[7]; // [7] = FECHA MUESTRA
      const aprobadas = parseInt(registro[8]) || 0; // [8] = APROBADAS
      const ok = String(registro[9] || '').trim().toUpperCase(); // [9] = "OK" o vacío
      const observaciones = String(registro[14] || '').trim(); // [14] = OBSERV

      if (!ref) continue;

      // Obtener o crear entidades relacionadas
      let clienteRecord = await obtenerOCrearCliente(cliente);
      const disenadorRecord = await obtenerOCrearDisenador(diseñador);
      const molderiaRecord = await obtenerOCrearMolderia(modelo, false, null);
      const ubicacion = await obtenerOCrearUbicacionImportacion();

      // Buscar la Muestra existente
      let muestra = await Muestra.findOne({
        where: { referencia: { [Op.iLike]: ref } },
      });

      if (!muestra) {
        if (!clienteRecord || !disenadorRecord || !molderiaRecord) {
            console.warn(`⚠️  Muestra no encontrada y faltan datos para crearla: ${ref}`);
            continue;
        }
        // Crear si no existe
        muestra = await Muestra.create({
          referencia: ref,
          segmento: genero || 'SIN SEGMENTO',
          licenciado: licencia === true || licencia === 1 || String(licencia).toUpperCase() === 'SI',
          dima: null,
          talla: null,
          pareselaborados: 0,
          fechaelaboracion: new Date().toISOString().slice(0, 10),
          estado: ok === 'OK' ? 'PRESENTADA' : 'PENDIENTE',
          proceso: null,
          observaciones: null,
          clienteid: clienteRecord.id,
          disenadorid: disenadorRecord.id,
          molderiaid: molderiaRecord.id,
          ubicacionid: ubicacion.id,
        });
        console.log(`✅ Muestra creada: ${ref}`);
      } else {
        if (ok === 'OK' && muestra.estado !== 'PRESENTADA') {
          await muestra.update({ estado: 'PRESENTADA' });
          console.log(`🔄 Muestra actualizada a PRESENTADA: ${ref}`);
        }
      }

      // Procesar Presentaciones
      let clientesPresentacion = [];
      if (datosPresentacion.length > 0) {
        const matches = datosPresentacion.filter(p => p.ref.toUpperCase() === ref.toUpperCase());
        for (const match of matches) {
          const cli = await obtenerOCrearCliente(match.cliente);
          if (cli) clientesPresentacion.push(cli);
        }
      }
      
      // Fallback a cliente de la hoja principal
      if (clientesPresentacion.length === 0 && clienteRecord) {
        clientesPresentacion.push(clienteRecord);
      }

      const resultadoEstado = ok === 'OK' ? 'APROBADA' : 'PENDIENTE';

      for (const cli of clientesPresentacion) {
        const presentacionExiste = await Presentacion.findOne({
          where: { muestraid: muestra.id, clienteid: cli.id },
        });

        if (!presentacionExiste) {
          await Presentacion.create({
            muestraid: muestra.id,
            clienteid: cli.id,
            resultado: resultadoEstado,
            fecha: excelDateToJSDate(fechaMuestra) || new Date(),
            paresaprobados: aprobadas,
            paresrechazados: 0,
            derivoproduccion: false,
            observaciones: observaciones || null,
          });
          creados++;
          console.log(`✅ Presentación creada: ${ref} para ${cli.nombre} → ${resultadoEstado}`);
        }
      }

      if (procesados % 50 === 0) {
        console.log(`\n📊 Progreso: ${procesados} registros procesados, ${creados} creados\n`);
      }
    } catch (error) {
      console.error(`❌ Error procesando presentación: ${error.message}`);
    }
  }

  console.log('\n✅ IMPORTACIÓN APROBACIONES COMPLETADA');
  console.log(`   Total procesados: ${procesados}`);
  console.log(`   Nuevos creados: ${creados}`);

  return { procesados, creados };
};

/**
 * Importar datos de FORMATO PRECIOS POR REFERENCIA
 */
export const importarPrecios = async (filePath, sheetName = 'NIÑOS', usuarioId = null) => {
  console.log('\n' + '='.repeat(80));
  console.log('📥 IMPORTANDO: Formato Precios por Referencia (+ Fotos)');
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(filePath);
  const ws = workbook.Sheets[sheetName];
  const datos = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Headers en fila 11 (índice 10)
  if (datos.length < 11) {
    console.warn('⚠️  Archivo no tiene estructura esperada');
    return { procesados: 0, creados: 0, fotosAgregadas: 0 };
  }

  const headers = datos[10]; // Fila 11 (índice 10)
  // Buscar índices de columnas importantes
  const fotoIdx = headers.indexOf('FOTO*');
  const obsIdx = headers.indexOf('OBSERVACIONES');
  const refIdx = headers.indexOf('REFERENCIA*');
  const descIdx = headers.indexOf('DESCRIPCION*');
  const colorIdx = headers.indexOf('COLOR');
  const tallasIdx = headers.indexOf('TALLAS');
  const precioIdx = headers.indexOf('PRECIO');

  if (refIdx === -1) {
    console.warn('⚠️  No se encontró columna REFERENCIA');
    return { procesados: 0, creados: 0, fotosAgregadas: 0 };
  }

  const registros = datos.slice(11).filter((r) => r[refIdx]); // Desde fila 12

  let creados = 0;
  let procesados = 0;
  let actualizados = 0;
  let fotosAgregadas = 0;

  for (const fila of registros) {
    try {
      procesados++;

      const referencia = String(fila[refIdx] || '').trim();
      if (!referencia) continue;

      const precio = parseFloat(fila[precioIdx]) || 0;

      // Buscar muestra por referencia
      const muestra = await Muestra.findOne({
        where: {
          referencia: { [Op.iLike]: referencia },
        },
      });

      if (muestra) {
        // Actualizar muestra
        await muestra.update({
          color: String(fila[colorIdx] || '').trim() || muestra.color,
          tallas: String(fila[tallasIdx] || '').trim() || muestra.tallas,
          precio: precio !== 0 ? precio : muestra.precio,
          observaciones: String(fila[obsIdx] || '').trim() || muestra.observaciones,
        });
        actualizados++;
        console.log(`🔄 Muestra actualizada (color/tallas/precio): ${referencia}`);

        // ========== PROCESAR FOTO ==========
        if (fotoIdx !== -1 && usuarioId) {
          const fotoRef = String(fila[fotoIdx] || '').trim();
          
          if (fotoRef) {
            try {
              const fotoExiste = await Foto.findOne({
                where: {
                  muestraid: muestra.id,
                  urlarchivo: { [Op.iLike]: fotoRef },
                },
              });

              if (!fotoExiste) {
                let urlFinal = fotoRef;
                if (!fotoRef.startsWith('/') && !fotoRef.startsWith('http')) {
                  urlFinal = `/uploads/${fotoRef}`;
                }

                await Foto.create({
                  muestraid: muestra.id,
                  urlarchivo: urlFinal,
                  origen: 'importacion',
                  fechacarga: new Date().toISOString().slice(0, 10),
                  usuarioid: usuarioId,
                });
                fotosAgregadas++;
                console.log(`📸 Foto agregada a muestra ${referencia}: ${urlFinal}`);
              }
            } catch (fotoError) {
              console.error(`❌ Error procesando foto de ${referencia}: ${fotoError.message}`);
            }
          }
        }
      } else {
        console.warn(`⚠️  Muestra no encontrada para actualizar precio: ${referencia}`);
      }

      if (procesados % 20 === 0) {
        console.log(
          `\n📊 Progreso: ${procesados} registros procesados, ${actualizados} actualizados, ${fotosAgregadas} fotos\n`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error procesando precio en fila ${fila[refIdx]}: ${error.message}`
      );
    }
  }

  console.log('\n✅ IMPORTACIÓN PRECIOS COMPLETADA');
  console.log(`   Total procesados: ${procesados}`);
  console.log(`   Nuevos creados: ${creados}`);
  console.log(`   Actualizados: ${actualizados}`);
  console.log(`   Fotos agregadas: ${fotosAgregadas}`);

  return { procesados, creados, actualizados, fotosAgregadas };
};

/**
 * Importar todos los archivos
 */
export const importarTodos = async (baseDis2025Path, aprobacionesPath, preciosPath = null) => {
  const resultados = {
    baseDis: null,
    aprobaciones: null,
    precios: null,
  };

  try {
    resultados.baseDis = await importarBaseDis(baseDis2025Path);
  } catch (error) {
    console.error('❌ Error importando BASE DIS 2025:', error.message);
  }

  try {
    resultados.aprobaciones = await importarAprobaciones(aprobacionesPath);
  } catch (error) {
    console.error('❌ Error importando Aprobaciones:', error.message);
  }

  if (preciosPath) {
    try {
      resultados.precios = await importarPrecios(preciosPath);
    } catch (error) {
      console.error('❌ Error importando Precios:', error.message);
    }
  }

  return resultados;
};
