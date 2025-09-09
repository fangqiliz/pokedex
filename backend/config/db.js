const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Mantener hasta 10 conexiones de socket
      serverSelectionTimeoutMS: 5000, // Mantener intentando enviar operaciones por 5 segundos
      socketTimeoutMS: 45000, // Cerrar conexiones después de 45 segundos de inactividad
      family: 4 // Usar IPv4, omitir IPv6
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    
    // Event listeners para la conexión
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose conectado a MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de conexión MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose desconectado de MongoDB');
    });

    // Manejo de cierre de aplicación
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔄 Conexión MongoDB cerrada debido al cierre de la aplicación');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;