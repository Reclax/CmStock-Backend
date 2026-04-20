import jwt from "jsonwebtoken";

// Middleware para autenticación - Valida JWT
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token no proporcionado" });
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expirado" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Token inválido" });
    }
    return res.status(500).json({ message: "Error al validar token" });
  }
};

// Middleware para autorización basada en roles - RBAC
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        message: `Acceso denegado. Roles permitidos: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

// Middleware para verificar que solo el propietario o admin puedan acceder
export const authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  const userId = req.params.id || req.user.id;

  if (req.user.id !== userId && req.user.rol !== "admin") {
    return res.status(403).json({
      message: "No tienes permiso para acceder a este recurso",
    });
  }

  next();
};
