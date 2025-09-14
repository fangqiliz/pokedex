const express = require('express');
const { body, param } = require('express-validator');
const {
  getProfile,
  addFavorite,
  removeFavorite,
  getFavorites,
  clearFavorites,
  addToHistory,
  getHistory,
  clearHistory,
  updateProfile,
  getUserStats
} = require('../controllers/userControllers');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Validaciones para agregar favorito
const validateAddFavorite = [
  body('pokemonId')
    .isInt({ min: 1, max: 1025 })
    .withMessage('ID de Pokémon debe ser un número entre 1 y 1025')
];

// Validaciones para ID de Pokémon en parámetros
const validatePokemonId = [
  param('id')
    .isInt({ min: 1, max: 1025 })
    .withMessage('ID de Pokémon debe ser un número entre 1 y 1025')
];

// Validaciones para agregar al historial
const validateAddToHistory = [
  body('id')
    .isInt({ min: 1, max: 1025 })
    .withMessage('ID de Pokémon debe ser un número entre 1 y 1025'),
  
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('El nombre del Pokémon es requerido y debe tener máximo 50 caracteres'),
  
  body('sprite')
    .isURL()
    .withMessage('El sprite debe ser una URL válida')
];

// Validaciones para actualizar perfil
const validateUpdateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos')
];

// ========== RUTAS DE PERFIL ==========

// @route   GET /api/user/profile
// @desc    Obtener perfil de usuario
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/user/profile
// @desc    Actualizar perfil de usuario
// @access  Private
router.put('/profile', validateUpdateProfile, updateProfile);

// @route   GET /api/user/stats
// @desc    Obtener estadísticas del usuario
// @access  Private
router.get('/stats', getUserStats);

// ========== RUTAS DE FAVORITOS ==========

// @route   POST /api/user/favoritos
// @desc    Agregar Pokémon a favoritos
// @access  Private
router.post('/favoritos', validateAddFavorite, addFavorite);

// @route   DELETE /api/user/favoritos/:id
// @desc    Eliminar Pokémon de favoritos
// @access  Private
router.delete('/favoritos/:id', validatePokemonId, removeFavorite);

// @route   GET /api/user/favoritos
// @desc    Obtener favoritos del usuario
// @access  Private
router.get('/favoritos', getFavorites);

// @route   DELETE /api/user/favoritos
// @desc    Limpiar todos los favoritos
// @access  Private
router.delete('/favoritos', clearFavorites);

// ========== RUTAS DE HISTORIAL ==========

// @route   POST /api/user/historial
// @desc    Agregar búsqueda al historial
// @access  Private
router.post('/historial', validateAddToHistory, addToHistory);

// @route   GET /api/user/historial
// @desc    Obtener historial del usuario
// @access  Private
router.get('/historial', getHistory);

// @route   DELETE /api/user/historial
// @desc    Limpiar historial de búsquedas
// @access  Private
router.delete('/historial', clearHistory);

module.exports = router;