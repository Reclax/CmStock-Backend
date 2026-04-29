import XLSX from 'xlsx';
import { Op } from 'sequelize';
import {
  Cliente,
  Disenador,
  Molderia,
  Muestra,
  Presentacion,
  Produccion,
  Ubicacion,
} from '../models/index.js';

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

const normalizarCabecera = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
};

const construirMapaColumnas = (headerRow = []) => {
  const map = {};
  headerRow.forEach((cell, index) => {
    const key = normalizarCabecera(cell);
    if (key && map[key] === undefined) {
      map[key] = index;
    }
  });
  return map;
};

const valorPorAlias = (row, mapa, aliases = []) => {
  for (const alias of aliases) {
    const key = normalizarCabecera(alias);
    if (mapa[key] !== undefined) {
      return row[mapa[key]];
    }
  }
  return undefined;
};

const parsearFechaMesTexto = (value) => {
  if (typeof value !== 'string') return null;

  const texto = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!texto) return null;

  const meses = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };

  const mes = meses[texto];
  if (mes === undefined) return null;

  const year = new Date().getFullYear();
  return new Date(year, mes, 1);
};

const parsearFechaFlexible = (value) => {
  return excelDateToJSDate(value) || parsearFechaMesTexto(value);
};

const esValorLicenciaActivo = (value) => {
  const raw = String(value || '').trim().toUpperCase();
  return value === true || value === 1 || raw === 'SI' || raw === 'SÍ';
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
  if (!ws) {
    throw new Error('No se encontró la hoja BASES en el archivo BASE DIS');
  }

  const datos = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Detectar fila de encabezados de forma robusta
  const headerRowIndex = datos.findIndex((row) => {
    const rowNorm = row.map((c) => normalizarCabecera(c));
    return rowNorm.includes('REF') && rowNorm.includes('CLIENTE') && rowNorm.includes('ORDEN N');
  });

  if (headerRowIndex === -1) {
    throw new Error('No se pudo detectar la fila de encabezados en BASE DIS');
  }

  const headerRow = datos[headerRowIndex];
  const mapaColumnas = construirMapaColumnas(headerRow);
  console.log('📋 Encabezados BASE DIS detectados:', headerRow.filter(Boolean).slice(0, 10));

  // Filtrar por REF real, no por ORDEN
  const registros = datos
    .slice(headerRowIndex + 1)
    .filter((r) => String(valorPorAlias(r, mapaColumnas, ['REF']) || '').trim());

  console.log(`📊 Total de registros a procesar: ${registros.length}`);

  let creados = 0;
  let procesados = 0;

  // Obtener ubicación por defecto para importaciones
  const ubicacion = await obtenerOCrearUbicacionImportacion();

  for (const fila of registros) {
    const registro = {
      orden: valorPorAlias(fila, mapaColumnas, ['ORDEN Nº', 'ORDEN N']),
      mes: valorPorAlias(fila, mapaColumnas, ['MES']),
      ref: valorPorAlias(fila, mapaColumnas, ['REF']),
      pares: valorPorAlias(fila, mapaColumnas, ['PARES']),
      marca: valorPorAlias(fila, mapaColumnas, ['MARCA']),
      molderia: valorPorAlias(fila, mapaColumnas, ['MOLDERÍA', 'MOLDERIA']),
      molderiaNueva: valorPorAlias(fila, mapaColumnas, ['MOLDERIA NUEVA']),
      segmento: valorPorAlias(fila, mapaColumnas, ['SEGMENTO']),
      licencia: valorPorAlias(fila, mapaColumnas, ['LICENCIA']),
      dima: valorPorAlias(fila, mapaColumnas, ['DIMA']),
      talla: valorPorAlias(fila, mapaColumnas, ['TALLA']),
      cliente: valorPorAlias(fila, mapaColumnas, ['CLIENTE']),
      disenador: valorPorAlias(fila, mapaColumnas, ['DISEÑADOR', 'DISENADOR']),
      creacion: valorPorAlias(fila, mapaColumnas, ['CREACIÓN', 'CREACION']),
      fechaEntrega: valorPorAlias(fila, mapaColumnas, ['FECHA ENTREGA']),
      proceso: valorPorAlias(fila, mapaColumnas, ['PROCESO']),
      observaciones: valorPorAlias(fila, mapaColumnas, ['OBSERVACIONES']),
    };

    try {
      procesados++;
      
      const ref = String(registro.ref || '').trim();
      if (procesados <= 3 || procesados % 100 === 0) {
        console.log(`\n🔍 Procesando orden ${procesados}: REF=${ref}, CLIENTE=${registro.cliente}, MOLDERÍA=${registro.molderia}`);
      }

      // Obtener o crear Cliente
      const cliente = await obtenerOCrearCliente(String(registro.cliente || ''));
      if (!cliente) {
        console.log(`   ❌ Cliente inválido`);
        continue;
      }

      // Obtener o crear Diseñador (tabla disenadores)
      const disenador = await obtenerOCrearDisenador(String(registro.disenador || ''));
      if (!disenador) {
        console.log(`   ❌ Diseñador inválido`);
        continue;
      }

      // Obtener o crear Moldería (pasando solo nombre, molderiaNueva, marca)
      const molderia = await obtenerOCrearMolderia(
        String(registro.molderia || ''),
        registro.molderiaNueva,
        registro.marca
      );
      if (!molderia) {
        console.log(`   ❌ Moldería inválida`);
        continue;
      }

      // Obtener o crear Muestra con TODOS los parámetros correctos
      const muestra = await obtenerOCrearMuestra(
        ref,                       // referencia
        registro.segmento,         // segmento
        esValorLicenciaActivo(registro.licencia), // licenciado (boolean)
        registro.dima,             // dima
        registro.talla,            // talla
        registro.pares,            // pareselaborados
        excelDateToJSDate(registro.creacion), // fechaelaboracion
        'PENDIENTE',               // estado (por defecto PENDIENTE)
        registro.proceso,          // proceso
        registro.observaciones,    // observaciones
        cliente.id,                // clienteid
        disenador.id,              // disenadorid (tabla disenadores, no usuarios)
        molderia.id,               // molderiaid
        ubicacion.id               // ubicacionid
      );
      if (!muestra) continue;

      // Crear Producción
      const produccionExiste = await Produccion.findOne({
        where: {
          ordennumero: String(registro.orden),
        },
      });

      if (!produccionExiste) {
        await Produccion.create({
          muestraid: muestra.id,
          clienteid: cliente.id,
          ordennumero: String(registro.orden),
          paresproducidos: parseInt(registro.pares) || 0,
          fechaproduccion: excelDateToJSDate(registro.fechaEntrega) || new Date(),
          mes: registro.mes || 'SIN MES',
        });
        creados++;
        console.log(`✅ Producción creada: Orden ${registro.orden}`);
      } else {
        console.log(`⏭️  Producción existente: Orden ${registro.orden}`);
      }

      if (procesados % 50 === 0) {
        console.log(`\n📊 Progreso: ${procesados} registros procesados, ${creados} creados\n`);
      }
    } catch (error) {
      console.error(
        `❌ Error procesando orden ${registro.orden}: ${error.message}`
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
  const ws = workbook.Sheets['INDIC-DIS2'] || workbook.Sheets[workbook.SheetNames[0]];
  if (!ws) {
    throw new Error('No se encontró una hoja válida en el archivo de aprobaciones');
  }

  const datos = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Detectar fila de encabezados en base a columnas clave
  const headerRowIndex = datos.findIndex((row) => {
    const rowNorm = row.map((c) => normalizarCabecera(c));
    return (
      rowNorm.includes('REF') &&
      rowNorm.includes('DISENADOR') &&
      rowNorm.includes('MODELO') &&
      rowNorm.includes('CLIENTE')
    );
  });

  if (headerRowIndex === -1) {
    throw new Error('No se pudo detectar la fila de encabezados en Aprobaciones');
  }

  const headerRow = datos[headerRowIndex] || [];
  const mapaColumnas = construirMapaColumnas(headerRow);
  const refIndices = headerRow
    .map((h, i) => (normalizarCabecera(h) === 'REF' ? i : -1))
    .filter((i) => i >= 0);
  const okIndex = refIndices.length > 1 ? refIndices[1] : mapaColumnas[normalizarCabecera('OK')];
  const observIndex = mapaColumnas[normalizarCabecera('OBSERV')];

  // CLIENTE principal + CLIENTE 1/2/3 en el mismo bloque
  const clienteColumnas = headerRow
    .map((h, i) => ({ key: normalizarCabecera(h), i }))
    .filter((entry) => entry.key === 'CLIENTE' || entry.key.startsWith('CLIENTE '))
    .map((entry) => entry.i);

  const registros = datos
    .slice(headerRowIndex + 1)
    .filter((r) => String(valorPorAlias(r, mapaColumnas, ['REF']) || '').trim());

  let creados = 0;
  let procesados = 0;

  // Compatibilidad: si existe hoja separada, también se toma en cuenta
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

      const ref = String(valorPorAlias(registro, mapaColumnas, ['REF']) || '').trim();
      const diseñador = String(valorPorAlias(registro, mapaColumnas, ['DISEÑADOR', 'DISENADOR']) || '').trim();
      const modelo = String(valorPorAlias(registro, mapaColumnas, ['MODELO']) || '').trim();
      const genero = String(valorPorAlias(registro, mapaColumnas, ['GENERO']) || '').trim();
      const cliente = String(valorPorAlias(registro, mapaColumnas, ['CLIENTE']) || '').trim();
      const licencia = valorPorAlias(registro, mapaColumnas, ['LICENCIA']);
      const fechaMuestra = valorPorAlias(registro, mapaColumnas, ['FECHA MUESTRA']);
      const aprobadas = parseInt(valorPorAlias(registro, mapaColumnas, ['APROBADAS'])) || 0;
      const ok = String(okIndex !== undefined ? registro[okIndex] : '').trim().toUpperCase();
      const observaciones = String(observIndex !== undefined ? registro[observIndex] : '').trim();

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
          licenciado: esValorLicenciaActivo(licencia),
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

      // 1) Clientes en el mismo bloque de INDIC-DIS2
      if (clienteColumnas.length > 0) {
        const clientesEncontrados = clienteColumnas
          .map((idx) => String(registro[idx] || '').trim())
          .filter(Boolean);

        const unicos = [...new Set(clientesEncontrados.map((v) => v.toUpperCase()))];
        for (const nombreUpper of unicos) {
          const original = clientesEncontrados.find((c) => c.toUpperCase() === nombreUpper);
          const cli = await obtenerOCrearCliente(original);
          if (cli) clientesPresentacion.push(cli);
        }
      }

      // 2) Hoja separada (si existe)
      if (datosPresentacion.length > 0) {
        const matches = datosPresentacion.filter(p => p.ref.toUpperCase() === ref.toUpperCase());
        for (const match of matches) {
          const cli = await obtenerOCrearCliente(match.cliente);
          if (cli) clientesPresentacion.push(cli);
        }
      }

      // Evitar duplicados de cliente
      const vistos = new Set();
      clientesPresentacion = clientesPresentacion.filter((cli) => {
        if (vistos.has(cli.id)) return false;
        vistos.add(cli.id);
        return true;
      });
      
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
            fecha: parsearFechaFlexible(fechaMuestra) || new Date(),
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
 * Importar todos los archivos (Importación Masiva)
 */
export const importarTodos = async (baseDisPath, aprobacionesPath) => {
  console.log('\n' + '='.repeat(80));
  console.log('📥 INICIANDO IMPORTACIÓN MASIVA');
  console.log('='.repeat(80));

  const resultados = {
    baseDis: null,
    aprobaciones: null,
  };

  try {
    if (baseDisPath) {
      resultados.baseDis = await importarBaseDis(baseDisPath);
    }
    
    if (aprobacionesPath) {
      resultados.aprobaciones = await importarAprobaciones(aprobacionesPath);
    }

    console.log('\n✅ IMPORTACIÓN MASIVA COMPLETADA EXITOSAMENTE');
    return resultados;
  } catch (error) {
    console.error(`❌ Error en importación masiva: ${error.message}`);
    throw error;
  }
};