import mongoose from 'mongoose';

const connections = {}; // Almacenar conexiones activas

const connectToCompanyDB = async (dbName) => {
  if (connections[dbName]) {
    return connections[dbName];
  }

  try {
    const connection = await mongoose.createConnection(
      process.env.MONGO_URI,
      {
        dbName,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    connections[dbName] = connection;
    console.log(`Conectado a la base de datos: ${dbName}`);
    return connection;
  } catch (error) {
    console.error(`Error al conectar con la base de datos: ${dbName}`, error);
    throw error;
  }
};

export default connectToCompanyDB;
