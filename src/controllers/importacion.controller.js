import {
  importarBaseDis,
  importarAprobaciones,
  importarTodos,
} from '../services/importacion.service.js';

/**
 * Controlador de Importación
 */

/**
 * Importar archivo BASE DIS 2025
 * POST /api/importacion/base-dis
 */
export const importarBaseDisController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha cargado ningún archivo',
      });
    }

    console.log(`📁 Archivo recibido: ${req.file.originalname}`);

    const resultado = await importarBaseDis(req.file.path);

    return res.status(200).json({
      success: true,
      message: 'Importación de BASE DIS completada',
      data: resultado,
    });
  } catch (error) {
    console.error('Error en importación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la importación',
      error: error.message,
    });
  }
};

/**
 * Importar archivo Aprobaciones
 * POST /api/importacion/aprobaciones
 */
export const importarAprobacionesController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha cargado ningún archivo',
      });
    }

    console.log(`📁 Archivo recibido: ${req.file.originalname}`);

    const resultado = await importarAprobaciones(req.file.path);

    return res.status(200).json({
      success: true,
      message: 'Importación de Aprobaciones completada',
      data: resultado,
    });
  } catch (error) {
    console.error('Error en importación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la importación',
      error: error.message,
    });
  }
};

/**
 * Importar múltiples archivos
 * POST /api/importacion/todos
 */
export const importarTodosController = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se han cargado archivos',
      });
    }

    const baseDis = req.files.baseDis ? req.files.baseDis[0] : null;
    const aprobaciones = req.files.aprobaciones ? req.files.aprobaciones[0] : null;

    if (!baseDis || !aprobaciones) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren ambos archivos: baseDis y aprobaciones',
      });
    }

    console.log(`📁 Archivos recibidos: ${baseDis.originalname}, ${aprobaciones.originalname}`);

    const resultado = await importarTodos(baseDis.path, aprobaciones.path);

    return res.status(200).json({
      success: true,
      message: 'Importación completada',
      data: resultado,
    });
  } catch (error) {
    console.error('Error en importación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en la importación',
      error: error.message,
    });
  }
};
