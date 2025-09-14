const { validationResult } = require('express-validator');
const User = require('../models/user');

// @desc    Obtener perfil de usuario
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res) => {
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
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Agregar Pokémon a favoritos
// @route   POST /api/user/favoritos
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { pokemonId } = req.body;
    const user = await User.findById(req.user.id);

    // Verificar si ya está en favoritos
    if (user.favoritos.includes(pokemonId)) {
      return res.status(400).json({
        success: false,
        error: 'Este Pokémon ya está en favoritos'
      });
    }

    // Agregar a favoritos
    await user.addFavorite(pokemonId);

    console.log(`⭐ Pokémon ${pokemonId} agregado a favoritos de ${user.username}`);

    res.json({
      success: true,
      message: 'Pokémon agregado a favoritos',
      favoritos: user.favoritos
    });

  } catch (error) {
    console.error('Error agregando favorito:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Eliminar Pokémon de favoritos
// @route   DELETE /api/user/favoritos/:id
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const { id } = req.params;
    const pokemonId = parseInt(id);

    if (!pokemonId || pokemonId < 1 || pokemonId > 1025) {
      return res.status(400).json({
        success: false,
        error: 'ID de Pokémon inválido'
      });
    }

    const user = await User.findById(req.user.id);

    // Verificar si está en favoritos
    if (!user.favoritos.includes(pokemonId)) {
      return res.status(400).json({
        success: false,
        error: 'Este Pokémon no está en favoritos'
      });
    }

    // Remover de favoritos
    await user.removeFavorite(pokemonId);

    console.log(`💔 Pokémon ${pokemonId} removido de favoritos de ${user.username}`);

    res.json({
      success: true,
      message: 'Pokémon eliminado de favoritos',
      favoritos: user.favoritos
    });

  } catch (error) {
    console.error('Error removiendo favorito:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener favoritos del usuario
// @route   GET /api/user/favoritos
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      favoritos: user.favoritos,
      total: user.favoritos.length
    });

  } catch (error) {
    console.error('Error obteniendo favoritos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Limpiar todos los favoritos
// @route   DELETE /api/user/favoritos
// @access  Private
const clearFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.favoritos = [];
    await user.save();

    console.log(`🧹 Favoritos limpiados para usuario: ${user.username}`);

    res.json({
      success: true,
      message: 'Todos los favoritos han sido eliminados',
      favoritos: []
    });

  } catch (error) {
    console.error('Error limpiando favoritos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Agregar búsqueda al historial
// @route   POST /api/user/historial
// @access  Private
const addToHistory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { id, name, sprite } = req.body;
    const user = await User.findById(req.user.id);

    // Agregar al historial
    await user.addToHistory({ id, name, sprite });

    res.json({
      success: true,
      message: 'Búsqueda agregada al historial',
      historial: user.historial
    });

  } catch (error) {
    console.error('Error agregando al historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener historial del usuario
// @route   GET /api/user/historial
// @access  Private
const getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      historial: user.historial,
      total: user.historial.length
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Limpiar historial
// @route   DELETE /api/user/historial
// @access  Private
const clearHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    await user.clearHistory();

    console.log(`🧹 Historial limpiado para usuario: ${user.username}`);

    res.json({
      success: true,
      message: 'Historial de búsquedas eliminado',
      historial: []
    });

  } catch (error) {
    console.error('Error limpiando historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Actualizar perfil de usuario
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: errors.array()
      });
    }

    const { username } = req.body;
    const user = await User.findById(req.user.id);

    // Verificar si el username ya está en uso por otro usuario
    if (username && username !== user.username) {
        const existingUser  = await User.findOne({ 
  username: { $regex: '^' + username, $options: 'i' },
  _id: { $ne: user._id }
});



      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Este nombre de usuario ya está en uso'
        });
      }

      user.username = username.trim();
      await user.save();
    }

    console.log(`📝 Perfil actualizado para usuario: ${user.username}`);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
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
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

// @desc    Obtener estadísticas del usuario
// @route   GET /api/user/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const stats = {
      totalFavoritos: user.favoritos.length,
      totalBusquedas: user.historial.length,
      fechaRegistro: user.fechaRegistro,
      ultimoAcceso: user.ultimoAcceso,
      diasRegistrado: Math.floor((new Date() - user.fechaRegistro) / (1000 * 60 * 60 * 24))
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

module.exports = {
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
};