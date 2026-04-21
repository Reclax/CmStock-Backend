import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { Usuario } from "../models/index.js";
import { tokenBlacklistService } from "./token-blacklist.service.js";

export class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export class AuthService {
  async register(nombre, email, password, rol = "usuario") {
    // Validar que el usuario no exista
    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) {
      throw new HttpError("El usuario ya existe", 409);
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password: hashedPassword,
      rol,
    });

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    };
  }

  async login(email, password) {
    // Encontrar usuario
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      throw new HttpError("Credenciales inválidas", 401);
    }

    // Validar que el usuario esté activo
    if (!usuario.activo) {
      throw new HttpError("Usuario inactivo", 403);
    }

    // Validar contraseña
    const isPasswordValid = await bcrypt.compare(password, usuario.password);
    if (!isPasswordValid) {
      throw new HttpError("Credenciales inválidas", 401);
    }

    // Generar JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
        jti: randomUUID(),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "24h" }
    );

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }

  async logout(token) {
    if (!token) {
      throw new HttpError("Token no proporcionado", 400);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    tokenBlacklistService.revoke(token, decoded.exp);
    return { message: "Sesion cerrada exitosamente" };
  }

  async validateToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return decoded;
    } catch (error) {
      throw new HttpError("Token inválido o expirado", 401);
    }
  }

  async getCurrentUser(userId) {
    const usuario = await Usuario.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!usuario) {
      throw new HttpError("Usuario no encontrado", 404);
    }

    return usuario;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const usuario = await Usuario.findByPk(userId);

    if (!usuario) {
      throw new HttpError("Usuario no encontrado", 404);
    }

    // Validar contraseña anterior
    const isPasswordValid = await bcrypt.compare(oldPassword, usuario.password);
    if (!isPasswordValid) {
      throw new HttpError("Contraseña anterior incorrecta", 401);
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await usuario.update({ password: hashedPassword });

    return { message: "Contraseña actualizada exitosamente" };
  }
}
