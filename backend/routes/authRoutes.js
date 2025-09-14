const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout,
  changePassword,
  deleteAccount
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Validaciones para registro
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una letra minúscula y un número')
];

// Validaciones para login
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email válido'),
  
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// Validaciones para cambio de contraseña
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('La contraseña actual es requerida'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*\d)/)
    .withMessage('La nueva contraseña debe contener al menos una letra minúscula y un número')
];

// Validación para eliminar cuenta
const validateDeleteAccount = [
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida para eliminar la cuenta')
];

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario
// @access  Public
router.post('/register', validateRegister, register);

// @route   POST /api/auth/login
// @desc    Iniciar sesión
// @access  Public
router.post('/login', validateLogin, login);

// @route   GET /api/auth/me
// @desc    Obtener usuario actual
// @access  Private
router.get('/me', authMiddleware, getMe);

// @route   POST /api/auth/logout
// @desc    Cerrar sesión
// @access  Private
router.post('/logout', authMiddleware, logout);

// @route   PUT /api/auth/change-password
// @desc    Cambiar contraseña
// @access  Private
router.put('/change-password', authMiddleware, validateChangePassword, changePassword);

// @route   DELETE /api/auth/delete-account
// @desc    Eliminar cuenta de usuario
// @access  Private
router.delete('/delete-account', authMiddleware, validateDeleteAccount, deleteAccount);

module.exports = router;