import XLSX from 'xlsx';
import { Op } from 'sequelize';
import { sequelize as dbSequelize } from '../config/database.js';
import {
  Cliente,
  Disenador,
  Molderia,
  Muestra,
  Presentacion,
  Produccion,
  Usuario,
  Variacion,
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
  if (!raw) return false;
  if (value === true || value === 1) return true;
  if (['NO', 'N', 'FALSE', '0', 'NO LICENCIADO', 'SIN LICENCIA'].includes(raw)) {
    return false;
  }
  return true;
};

const igualCaseInsensitive = (campo, valor) =>
  dbSequelize.where(dbSequelize.fn('LOWER', dbSequelize.col(campo)), String(valor || '').trim().toLowerCase());

const determinarEstadoMuestraAprobaciones = (aprobadas, ok) => {
  const tieneAprobadas = Number(aprobadas) > 0;
  const tieneOk = String(ok || '').trim().toUpperCase() === 'OK';

  if (tieneOk && tieneAprobadas) {
    return 'aprobada';
  }

  if (tieneOk) {
    return 'presentada';
  }

  return 'pendiente';
};

const nombreDisenadorDefecto = 'S/N diseñador';

const obtenerOCrearDisenadorConDefecto = async (nombre) => {
  const disenador = await obtenerOCrearDisenador(nombre);
  if (disenador) {
    return disenador;
  }

  return obtenerOCrearDisenador(nombreDisenadorDefecto);
};

const construirReferenciaVariacion = (referenciaBase, numeroVariacion) => {
  const refBase = String(referenciaBase || '').trim();
  return `${refBase} V${numeroVariacion}`;
};

const separarReferenciaYDetalle = (refRaw) => {
  const refCompleta = String(refRaw || '').trim().replace(/\s+/g, ' ');
  if (!refCompleta) {
    return { codigo: '', detalle: '' };
  }

  // Ej: "D24-3556 CAFE" => codigo: "D24-3556", detalle: "CAFE"
  const match = refCompleta.match(/^([A-Za-z0-9]+(?:-[A-Za-z0-9]+)+)\s*(.*)$/);
  if (match) {
    return {
      codigo: String(match[1] || '').trim(),
      detalle: String(match[2] || '').trim(),
    };
  }

  return { codigo: refCompleta, detalle: '' };
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
      [Op.and]: [igualCaseInsensitive('nombre', nombreLimpio)],
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
      [Op.and]: [igualCaseInsensitive('nombre', nombreLimpio)],
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
      [Op.and]: [igualCaseInsensitive('nombre', nombreLimpio)],
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
      [Op.and]: [igualCaseInsensitive('nombre', nombreLimpio)],
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
  licencia,
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
      [Op.and]: [igualCaseInsensitive('referencia', refLimpia)],
    },
  });

  if (muestra) {
    console.log(`⏭️  Muestra existente: ${refLimpia}`);
  } else {
    // Crear nueva muestra
    muestra = await Muestra.create({
      referencia: refLimpia,
      segmento: segmento || 'SIN SEGMENTO',
      licencia: licencia || null,
      licenciado: licenciado === true || licenciado === 1,
      dima: dima || null,
      talla: talla || null,
      pareselaborados: parseInt(pareselaborados) || 0,
      fechaelaboracion: fechaelaboracion || new Date().toISOString().slice(0, 10),
      estado: estado || 'pendiente',
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

  // Separar en dos bloques: números (bloque 1) y letras (bloque 2)
  const bloque1 = registros.filter((r) => {
    const orden = String(valorPorAlias(r, mapaColumnas, ['ORDEN Nº', 'ORDEN N']) || '').trim();
    return orden && !/^[A-Za-z]/.test(orden);
  });

  const bloque2 = registros.filter((r) => {
    const orden = String(valorPorAlias(r, mapaColumnas, ['ORDEN Nº', 'ORDEN N']) || '').trim();
    return orden && /^[A-Za-z]/.test(orden);
  });

  console.log(`\n🔵 Bloque 1 (órdenes numéricas): ${bloque1.length} registros`);
  console.log(`🟠 Bloque 2 (órdenes con letras - variaciones): ${bloque2.length} registros`);

  let creados = 0;
  let procesados = 0;
  let variacionesCreadas = 0;
  const refsProcesadas = new Set();
  const muestrasOriginales = new Map(); // Para vincular variaciones y heredar datos
  const errores = []; // Acumular errores para retornar

  // Obtener ubicación por defecto para importaciones
  const ubicacion = await obtenerOCrearUbicacionImportacion();

  // ===============================================
  // BLOQUE 1: Órdenes numéricas (muestras bases)
  // ===============================================
  console.log('\n🔵 PROCESANDO BLOQUE 1 (MUESTRAS BASE)...');

  for (const fila of bloque1) {
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
      refsProcesadas.add(ref);
      if (procesados <= 3 || procesados % 100 === 0) {
        console.log(`\n🔍 Procesando orden ${procesados}: REF=${ref}, CLIENTE=${registro.cliente}, MOLDERÍA=${registro.molderia}`);
      }

      // Obtener o crear Cliente
      const cliente = await obtenerOCrearCliente(String(registro.cliente || ''));
      if (!cliente) {
        const error = `Orden ${registro.orden}: Cliente inválido (${registro.cliente})`;
        console.log(`   ❌ ${error}`);
        errores.push(error);
        continue;
      }

      // Obtener o crear Diseñador
      const disenador = await obtenerOCrearDisenadorConDefecto(String(registro.disenador || ''));
      if (!disenador) {
        const error = `Orden ${registro.orden}: Diseñador inválido (${registro.disenador})`;
        console.log(`   ❌ ${error}`);
        errores.push(error);
        continue;
      }

      // Obtener o crear Moldería
      const molderia = await obtenerOCrearMolderia(
        String(registro.molderia || ''),
        registro.molderiaNueva,
        registro.marca
      );
      if (!molderia) {
        const error = `Orden ${registro.orden}: Moldería inválida (${registro.molderia})`;
        console.log(`   ❌ ${error}`);
        errores.push(error);
        continue;
      }

      // Obtener o crear Muestra
      const muestra = await obtenerOCrearMuestra(
        ref,
        registro.segmento,
        String(registro.licencia || '').trim(),
        esValorLicenciaActivo(registro.licencia),
        registro.dima,
        registro.talla,
        registro.pares,
        excelDateToJSDate(registro.creacion),
        'pendiente',
        registro.proceso,
        registro.observaciones,
        cliente.id,
        disenador.id,
        molderia.id,
        ubicacion.id
      );
      if (!muestra) continue;

      // Guardar referencia de muestra original para el bloque 2
      muestrasOriginales.set(ref, muestra);

      // La producción se registra desde el archivo de Aprobaciones (con el dato real de pares)
      // BASE DIS solo registra la muestra y la orden de diseño

      if (procesados % 50 === 0) {
        console.log(`\n📊 Progreso: ${procesados} registros procesados, ${creados} creados\n`);
      }
    } catch (error) {
      const errorMsg = `Orden ${registro.orden}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errores.push(errorMsg);
    }
  }

  // ===============================================
  // BLOQUE 2: Órdenes con letras (variaciones)
  // ===============================================
  console.log('\n🟠 PROCESANDO BLOQUE 2 (VARIACIONES)...');

  for (const fila of bloque2) {
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
      const { codigo: ref, detalle } = separarReferenciaYDetalle(registro.ref);
      const orden = String(registro.orden || '').trim();
      const observacionVariacion = [String(registro.observaciones || '').trim(), detalle]
        .filter(Boolean)
        .join(' | ');

      if (!muestrasOriginales.has(ref)) {
        const error = `Variación ${orden}: No se encontró muestra original para REF=${ref}`;
        console.log(`⚠️  ${error}`);
        errores.push(error);
        continue;
      }

      const muestraOriginal = muestrasOriginales.get(ref);
      const muestraOriginalId = muestraOriginal.id;

      // Obtener o crear Cliente
      const cliente = await obtenerOCrearCliente(String(registro.cliente || ''));
      if (!cliente && !muestraOriginal?.clienteid) {
        const error = `Variación ${orden}: Cliente inválido (${registro.cliente})`;
        console.log(`   ❌ ${error}`);
        errores.push(error);
        continue;
      }

      // Obtener o crear Diseñador
      const disenador = await obtenerOCrearDisenadorConDefecto(String(registro.disenador || ''));
      if (!disenador && !muestraOriginal?.disenadorid) {
        const error = `Variación ${orden}: Diseñador inválido (${registro.disenador})`;
        console.log(`   ❌ ${error}`);
        errores.push(error);
        continue;
      }

      // Obtener o crear Moldería.
      // Si en la variación no viene moldería, heredamos la de la muestra original.
      let molderia = null;
      const nombreMolderia = String(registro.molderia || '').trim();

      if (nombreMolderia) {
        molderia = await obtenerOCrearMolderia(
          nombreMolderia,
          registro.molderiaNueva,
          registro.marca
        );
      } else if (muestraOriginal?.molderiaid) {
        molderia = { id: muestraOriginal.molderiaid };
        console.log(`ℹ️  Variación ${orden}: moldería heredada de muestra original (${muestraOriginal.molderiaid})`);
      }

      if (!molderia) {
        const error = `Variación ${orden}: Moldería inválida (${registro.molderia})`;
        console.log(`   ❌ ${error}`);
        errores.push(error);
        continue;
      }

      // Crear muestra como variación
      const variacionExiste = await Variacion.findOne({
        where: {
          muestraOriginalId: muestraOriginalId,
          orden,
        },
      });

      if (!variacionExiste) {
        const totalVariaciones = await Variacion.count({
          where: { muestraOriginalId },
        });
        const referenciaVariacion = construirReferenciaVariacion(
          muestraOriginal.referencia,
          totalVariaciones + 1
        );
        const licenciaVariacion = String(registro.licencia || muestraOriginal.licencia || '').trim() || null;

        await Variacion.create({
          referencia: referenciaVariacion,
          orden,
          segmento: registro.segmento || muestraOriginal.segmento || 'SIN SEGMENTO',
          licencia: licenciaVariacion,
          licenciado: esValorLicenciaActivo(registro.licencia ?? licenciaVariacion ?? muestraOriginal.licencia),
          dima: registro.dima || muestraOriginal.dima || null,
          talla: registro.talla || muestraOriginal.talla || null,
          color: muestraOriginal.color || null,
          tallas: muestraOriginal.tallas || null,
          precio: muestraOriginal.precio || null,
          pareselaborados: parseInt(registro.pares) || Number(muestraOriginal.pareselaborados) || 0,
          fechaelaboracion: excelDateToJSDate(registro.creacion) || muestraOriginal.fechaelaboracion || new Date(),
          estado: 'variacion',
          proceso: registro.proceso || muestraOriginal.proceso || null,
          observaciones: observacionVariacion || null,
          clienteid: cliente?.id || muestraOriginal.clienteid,
          disenadorid: disenador?.id || muestraOriginal.disenadorid,
          molderiaid: molderia.id,
          ubicacionid: ubicacion.id || muestraOriginal.ubicacionid,
          codigoqr: null,
          codigobarras: null,
          variacion: true,
          muestraOriginalId: muestraOriginalId,
        });

        variacionesCreadas++;
        console.log(`✅ Variación creada: Orden ${orden} (REF=${ref}) → Vinculada a ${muestraOriginalId}`);
      } else {
        console.log(`⏭️  Variación existente: Orden ${orden}`);
      }
    } catch (error) {
      const errorMsg = `Variación ${registro.orden}: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errores.push(errorMsg);
    }
  }

  console.log('\n✅ IMPORTACIÓN BASE DIS 2025 COMPLETADA');
  console.log(`   Bloque 1 (muestras base): ${creados} creadas`);
  console.log(`   Bloque 2 (variaciones): ${variacionesCreadas} creadas`);
  if (errores.length > 0) {
    console.log(`   ⚠️  Errores encontrados: ${errores.length}`);
  }

  return { procesados, creados, variacionesCreadas, refs: Array.from(refsProcesadas), errores };
};

/**
 * Importar datos de Formato Aprobaciones
 */
export const importarAprobaciones = async (filePath) => {
  console.log('\n' + '='.repeat(80));
  console.log('📥 IMPORTANDO: Formato Aprobaciones.xlsx');
  console.log('='.repeat(80));

  const workbook = XLSX.readFile(filePath);

  // Detectar hojas válidas (INDIC-DIS1, INDIC-DIS2, o cualquier hoja con estructura similar)
  const hojasPermitidas = ['INDIC-DIS1', 'INDIC-DIS2'];
  const hojasAProcesar = workbook.SheetNames.filter((name) =>
    hojasPermitidas.includes(name)
  );

  // Si no hay hojas específicas, intentar con la primera disponible
  if (hojasAProcesar.length === 0 && workbook.SheetNames.length > 0) {
    hojasAProcesar.push(workbook.SheetNames[0]);
    console.log(`⚠️  No se encontraron INDIC-DIS1 o INDIC-DIS2, usando hoja: ${workbook.SheetNames[0]}`);
  }

  if (hojasAProcesar.length === 0) {
    throw new Error('No se encontraron hojas válidas en el archivo de aprobaciones');
  }

  console.log(`🔍 Hojas a procesar: ${hojasAProcesar.join(', ')}`);

  let creados = 0;
  let procesados = 0;
  let procesadosPorHoja = {};
  let creadosPorHoja = {};
  const refsProcesadas = new Set();
  const errores = []; // Acumular errores para retornar

  // ===============================================
  // PROCESAR CADA HOJA VÁLIDA
  // ===============================================

  for (const nombreHoja of hojasAProcesar) {
    console.log(`\n🔵 PROCESANDO HOJA: ${nombreHoja}`);
    
    const ws = workbook.Sheets[nombreHoja];
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
      console.warn(`⚠️  No se pudo detectar encabezados en hoja ${nombreHoja}`);
      continue;
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

    console.log('🔍 COLUMNAS DETECTADAS EN', nombreHoja, ':', Object.keys(mapaColumnas));
    console.log('🔍 okIndex:', okIndex, '| observIndex:', observIndex);
    console.log('🔍 clienteColumnas (índices):', clienteColumnas);
    // Log primera fila de datos para ver valores reales
    if (registros.length > 0) {
      const primeraFila = registros[0];
      console.log('🔍 MAPA COLUMNA → ÍNDICE → VALOR EN FILA 1:');
      headerRow.forEach((col, idx) => {
        const colNorm = normalizarCabecera(col);
        if (colNorm) {
          console.log(`   [${idx}] "${col}" (${colNorm}) → "${primeraFila[idx]}"`);
        }
      });
    }

    let creadosHoja = 0;
    let procesadosHoja = 0;

    // Compatibilidad: hoja separada de presentaciones
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
            cliente: String(r[clienteIdx] || '').trim(),
          })).filter(r => r.ref && r.cliente);
        }
      }
    }

    for (const registro of registros) {
      try {
        procesadosHoja++;

        const ref = String(valorPorAlias(registro, mapaColumnas, ['REF']) || '').trim();
        const diseñador = String(valorPorAlias(registro, mapaColumnas, ['DISEÑADOR', 'DISENADOR']) || '').trim();
        const modelo = String(valorPorAlias(registro, mapaColumnas, ['MODELO']) || '').trim();
        const genero = String(valorPorAlias(registro, mapaColumnas, ['GENERO']) || '').trim();
        const cliente = String(valorPorAlias(registro, mapaColumnas, ['CLIENTE']) || '').trim();
        const licencia = valorPorAlias(registro, mapaColumnas, ['LICENCIA']);
        const fechaMuestra = valorPorAlias(registro, mapaColumnas, ['FECHA MUESTRA']);
        // Algunas versiones del Excel usan una columna separada para la fecha de producción
        const fechaProduccionCol = valorPorAlias(registro, mapaColumnas, ['FECHA PRODUCCION', 'FECHA PRODUCCIÓN', 'FECHA PRODUCION', 'FECHA PRODUC', 'FECHA']);
        const fechaProduccion = fechaProduccionCol || fechaMuestra;
        const aprobadasRaw = valorPorAlias(registro, mapaColumnas, [
          'APROBADAS', 'PARES APROBADOS', 'PARES', 'CANT APROBADAS', 'CANT', 'PRODUCCION', 'PARES PRODUCIDOS',
        ]);
        const aprobadas = parseInt(aprobadasRaw) || 0;
        const ok = String(okIndex !== undefined ? registro[okIndex] : '').trim().toUpperCase();

        // Log de diagnóstico primeras 3 filas
        if (procesadosHoja <= 3) {
          console.log(`🔍 Fila ${procesadosHoja}: REF=${ref} | OK_RAW="${registro[okIndex]}" | APROBADAS_RAW="${aprobadasRaw}" | aprobadas=${aprobadas} | ok="${ok}"`);
        }
        const observaciones = String(observIndex !== undefined ? registro[observIndex] : '').trim();
        const observacionesNormalizadas = observaciones.toLowerCase();
        const estadoMuestra = observacionesNormalizadas.includes('baja')
          ? 'dada de baja'
          : determinarEstadoMuestraAprobaciones(aprobadas, ok);
        const estadoSinCruce = observacionesNormalizadas.includes('baja')
          ? 'dada de baja'
          : 'no presentado';

        if (!ref) continue;

        refsProcesadas.add(ref);

        // Obtener o crear entidades relacionadas
        let clienteRecord = await obtenerOCrearCliente(cliente);
        const disenadorRecord = await obtenerOCrearDisenadorConDefecto(diseñador);
        const molderiaRecord = await obtenerOCrearMolderia(modelo, false, null);
        const ubicacion = await obtenerOCrearUbicacionImportacion();

        // Buscar la Muestra existente
        let muestra = await Muestra.findOne({
          where: { [Op.and]: [igualCaseInsensitive('referencia', ref)] },
        });

        if (!muestra) {
          if (!clienteRecord || !disenadorRecord || !molderiaRecord) {
              const error = `${nombreHoja} - REF ${ref}: Datos incompletos para crear (Cliente: ${!clienteRecord}, Diseñador: ${!disenadorRecord}, Moldería: ${!molderiaRecord})`;
              console.warn(`⚠️  ${error}`);
              errores.push(error);
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
            estado: estadoSinCruce,
            proceso: null,
            observaciones: observaciones || null,
            clienteid: clienteRecord.id,
            disenadorid: disenadorRecord.id,
            molderiaid: molderiaRecord.id,
            ubicacionid: ubicacion.id,
          });
          console.log(`✅ Muestra creada: ${ref}`);
        } else {
          if (String(muestra.estado || '').trim().toLowerCase() !== estadoMuestra) {
            await muestra.update({ estado: estadoMuestra, observaciones: observaciones || muestra.observaciones });
            console.log(`🔄 Muestra actualizada a ${estadoMuestra.toUpperCase()}: ${ref}`);
          }
        }

        // NOTA: La producción se crea por cliente dentro del loop de presentaciones (más abajo)

        // Procesar Presentaciones
        let clientesPresentacion = [];

        // 1) Clientes en el mismo bloque
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

        const resultadoEstado = estadoMuestra;
        const mesActual = new Date().toLocaleString('es-ES', { month: 'long' });

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
              derivoproduccion: ok === 'OK' && aprobadas > 0,
              observaciones: observaciones || null,
            });
            creadosHoja++;
            console.log(`✅ Presentación creada: ${ref} para ${cli.nombre} → ${resultadoEstado}`);
          }

          // Crear o actualizar producción por cada cliente con OK y pares aprobados
          if (ok === 'OK' && aprobadas > 0) {
            const produccionExiste = await Produccion.findOne({
              where: { muestraid: muestra.id, clienteid: cli.id },
            });

            if (!produccionExiste) {
              await Produccion.create({
                muestraid: muestra.id,
                clienteid: cli.id,
                ordennumero: ref,
                paresproducidos: aprobadas,
                // Preferir columna explícita de fecha de producción, si existe
                fechaproduccion: parsearFechaFlexible(fechaProduccion) || parsearFechaFlexible(fechaMuestra) || new Date(),
                mes: mesActual,
              });
              console.log(`✅ Producción creada: ${ref} para ${cli.nombre} con ${aprobadas} pares`);
            } else {
              // Actualizar con el dato real de Aprobaciones
              await produccionExiste.update({
                paresproducidos: aprobadas,
                fechaproduccion: parsearFechaFlexible(fechaProduccion) || parsearFechaFlexible(fechaMuestra) || produccionExiste.fechaproduccion,
                mes: mesActual,
              });
              console.log(`🔄 Producción actualizada: ${ref} para ${cli.nombre} → ${aprobadas} pares`);
            }
          }
        }

        if (procesadosHoja % 50 === 0) {
          console.log(`\n📊 Progreso ${nombreHoja}: ${procesadosHoja} registros procesados, ${creadosHoja} creados\n`);
        }
      } catch (error) {
        const errorMsg = `${nombreHoja}: ${error.message}`;
        console.error(`❌ Error procesando presentación: ${errorMsg}`);
        errores.push(errorMsg);
      }
    }

    procesadosPorHoja[nombreHoja] = procesadosHoja;
    creadosPorHoja[nombreHoja] = creadosHoja;
    procesados += procesadosHoja;
    creados += creadosHoja;
  }

  console.log('\n✅ IMPORTACIÓN APROBACIONES COMPLETADA');
  console.log(`   Total registros procesados: ${procesados}`);
  console.log(`   Total presentaciones creadas: ${creados}`);
  if (errores.length > 0) {
    console.log(`   ⚠️  Errores encontrados: ${errores.length}`);
  }
  
  // Detallar por hoja
  for (const [hoja, count] of Object.entries(procesadosPorHoja)) {
    console.log(`   Hoja ${hoja}: ${count} registros, ${creadosPorHoja[hoja]} creados`);
  }

  return { procesados, creados, refsProcesadas: Array.from(refsProcesadas), errores };
};

const reconciliarEstadosPendientes = async (referenciasBaseDis = [], referenciasAprobadas = []) => {
  const refsBaseDis = [...new Set(referenciasBaseDis.map((ref) => String(ref || '').trim()).filter(Boolean))];
  const refsAprobadas = new Set(
    referenciasAprobadas.map((ref) => String(ref || '').trim()).filter(Boolean),
  );

  if (!refsBaseDis.length) {
    return { actualizadas: 0 };
  }

  const muestras = await Muestra.findAll({
    where: {
      referencia: {
        [Op.in]: refsBaseDis,
      },
    },
  });

  let actualizadas = 0;
  for (const muestra of muestras) {
    if (!refsAprobadas.has(String(muestra.referencia || '').trim())) {
      if (String(muestra.estado || '').trim().toLowerCase() !== 'no presentado') {
        await muestra.update({ estado: 'no presentado' });
        actualizadas++;
      }
    }
  }

  return { actualizadas };
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

  let refsBaseDis = [];
  let refsAprobaciones = [];

  try {
    if (baseDisPath) {
      const baseDisImport = await importarBaseDis(baseDisPath);
      const { refs, ...baseDisResultado } = baseDisImport;
      resultados.baseDis = baseDisResultado;
      refsBaseDis = refs;
    }
    
    if (aprobacionesPath) {
      const aprobacionesImport = await importarAprobaciones(aprobacionesPath);
      const { refsProcesadas, ...aprobacionesResultado } = aprobacionesImport;
      resultados.aprobaciones = aprobacionesResultado;
      refsAprobaciones = refsProcesadas;
    }

    if (refsBaseDis.length && aprobacionesPath) {
      resultados.reconciliacion = await reconciliarEstadosPendientes(
        refsBaseDis,
        refsAprobaciones,
      );
    }

    console.log('\n✅ IMPORTACIÓN MASIVA COMPLETADA EXITOSAMENTE');
    return resultados;
  } catch (error) {
    console.error(`❌ Error en importación masiva: ${error.message}`);
    throw error;
  }
};