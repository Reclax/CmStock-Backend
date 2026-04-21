import { AuthService, HttpError } from "../services/auth.service.js";
import Joi from "joi";

const authService = new AuthService();

// Esquemas de validación
const registerSchema = Joi.object({
  nombre: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid("admin", "diseñador", "modelador", "usuario", "gerente").optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const handleError = (res, error) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.details) {
    // Error de validación Joi
    return res.status(400).json({
      message: "Validación fallida",
      details: error.details.map((d) => d.message),
    });
  }
  return res.status(500).json({ message: "Error interno del servidor" });
};

export const register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw error;
    }

    const usuario = await authService.register(
      value.nombre,
      value.email,
      value.password,
      value.rol
    );

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuario,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw error;
    }

    const result = await authService.login(value.email, value.password);

    return res.status(200).json({
      message: "Login exitoso",
      ...result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const usuario = await authService.getCurrentUser(req.user.id);
    return res.status(200).json(usuario);
  } catch (error) {
    return handleError(res, error);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      throw error;
    }

    const result = await authService.changePassword(
      req.user.id,
      value.oldPassword,
      value.newPassword
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError("Token no proporcionado", 400);
    }

    const token = authHeader.slice(7);
    const result = await authService.logout(token);
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};
