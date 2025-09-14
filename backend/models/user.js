const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [50, 'El nombre de usuario no puede exceder 50 caracteres'],
    unique: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingresa un email válido'
    ]
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  favoritos: [{
    type: Number,
    min: [1, 'ID de Pokémon debe ser mayor a 0'],
    max: [1025, 'ID de Pokémon no puede exceder 1025']
  }],
  historial: [{
    id: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    sprite: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  ultimoAcceso: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices para mejorar performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ fechaRegistro: -1 });

// Middleware pre-save para hashear contraseña
UserSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña ha sido modificada
  if (!this.isModified('password')) return next();

  try {
    // Generar salt y hashear contraseña
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para actualizar último acceso
UserSchema.methods.updateLastAccess = function() {
  this.ultimoAcceso = new Date();
  return this.save();
};

// Método para comparar contraseñas
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Método para agregar favorito
UserSchema.methods.addFavorite = function(pokemonId) {
  if (!this.favoritos.includes(pokemonId)) {
    this.favoritos.push(pokemonId);
  }
  return this.save();
};

// Método para remover favorito
UserSchema.methods.removeFavorite = function(pokemonId) {
  this.favoritos = this.favoritos.filter(id => id !== parseInt(pokemonId));
  return this.save();
};

// Método para agregar al historial
UserSchema.methods.addToHistory = function(pokemon) {
  // Remover entrada existente si existe
  this.historial = this.historial.filter(item => item.id !== pokemon.id);
  
  // Agregar al inicio del historial
  this.historial.unshift({
    id: pokemon.id,
    name: pokemon.name,
    sprite: pokemon.sprite,
    timestamp: new Date()
  });

  // Mantener solo los últimos 10 elementos
  if (this.historial.length > 10) {
    this.historial = this.historial.slice(0, 10);
  }

  return this.save();
};

// Método para limpiar historial
UserSchema.methods.clearHistory = function() {
  this.historial = [];
  return this.save();
};

// Método estático para obtener estadísticas de usuarios
UserSchema.statics.getUserStats = async function() {
  const totalUsers = await this.countDocuments();
  const usersToday = await this.countDocuments({
    fechaRegistro: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  const activeUsers = await this.countDocuments({
    ultimoAcceso: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  return {
    totalUsers,
    usersToday,
    activeUsers
  };
};

// Middleware post-save para logging
UserSchema.post('save', function(doc, next) {
  console.log(`👤 Usuario ${doc.username} guardado/actualizado`);
  next();
});

module.exports = mongoose.model('User', UserSchema);