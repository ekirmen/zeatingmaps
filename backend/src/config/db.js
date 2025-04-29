import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,          // Manejo de cadenas de conexión
      useUnifiedTopology: true,       // Manejo del motor de topología
      serverSelectionTimeoutMS: 5000, // Tiempo de espera para conexión inicial
      socketTimeoutMS: 45000,         // Tiempo de espera para operaciones inactivas
    });

    console.log(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    process.exit(1); // Salir del proceso en caso de fallo crítico
  }

  // Eventos para monitorizar la conexión
  mongoose.connection.on('connected', () => {
    console.log('Conexión establecida con MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`Error de conexión a MongoDB: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Desconectado de MongoDB');
  });

  // Manejo de desconexión al cerrar la app
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Conexión cerrada por el servidor');
    process.exit(0);
  });
};

export default connectDB;
