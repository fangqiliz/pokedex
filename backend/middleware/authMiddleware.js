const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware para verificar JWT y autenticar usuario
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado. Token no proporcionado.'
      });
    }

    // Verificar formato: "Bearer <token>"
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    // Extraer token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token vacío'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en la base de datos
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado. Token inválido.'
      });
    }

    // Actualizar último acceso del usuario
    await user.updateLastAccess();

    // Agregar usuario al request
    req.user = user;
    next();

  } catch (error) {
    console.error('Error en middleware de autenticación:', error);

    // Manejar errores específicos de JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado. Por favor, inicia sesión nuevamente.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        error: 'Token aún no es válido'
      });
    }

    // Error genérico
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor en autenticación'
    });
  }
};

// Middleware opcional - no falla si no hay token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user) {
      req.user = user;
      await user.updateLastAccess();
    }
    
    next();
  } catch (error) {
    // En caso de error, simplemente continúa sin usuario
    next();
  }
};

// Middleware para verificar roles (futuro uso)
const roleMiddleware = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes'
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  optionalAuth,
  roleMiddleware
};