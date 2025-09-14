const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');

// Generar JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

// @desc    Registrar usuario
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: { $regex: new RegExp('^' + username + '$', 'i') } }
      ]
    });

    if (existingUser) {
      let errorMessage = 'Usuario ya existe';
      if (existingUser.email === email.toLowerCase()) {
        errorMessage = 'Este email ya está registrado';
      } else if (existingUser.username.toLowerCase() === username.toLowerCase()) {
        errorMessage = 'Este nombre de usuario ya está en uso';
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }

    // Crear nuevo usuario
    const user = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    console.log(`✨ Nuevo usuario registrado: ${user.username} (${user.email})`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fechaRegistro: user.fechaRegistro
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await user.updateLastAccess();

    // Generar token
    const token = generateToken(user._id);

    console.log(`🔐 Usuario logueado: ${user.username} (${user.email})`);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        favoritos: user.favoritos,
        historial: user.historial,
        fechaRegistro: user.fechaRegistro,
        ultimoAcceso: user.ultimoAcceso
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        favoritos: user.favoritos,
        historial: user.historial,
        fechaRegistro: user.fechaRegistro,
        ultimoAcceso: user.ultimoAcceso
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Cerrar sesión (logout)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    console.log(`👋 Usuario deslogueado: ${req.user.username}`);
    
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Cambiar contraseña
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    console.log(`🔑 Contraseña cambiada para usuario: ${user.username}`);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Eliminar cuenta
// @route   DELETE /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);

    // Verificar contraseña
    const isPasswordValid = await user.matchPassword(password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Contraseña incorrecta'
      });
    }

    // Eliminar usuario
    await User.findByIdAndDelete(req.user.id);

    console.log(`🗑️ Cuenta eliminada: ${user.username} (${user.email})`);

    res.json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  changePassword,
  deleteAccount
};