import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import Mapa from '../src/models/Mapa.js';

dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const mapas = await Mapa.find({});
    const resultados = [];

    mapas.forEach((mapa) => {
      const mesas = (mapa.contenido || []).filter(
        (el) => el.type === 'mesa' && (el.shape === 'circle' || el.shape === 'rect')
      ).map((mesa) => ({
        id: mesa._id.toString(),
        nombre: mesa.nombre,
        shape: mesa.shape,
        posicion: mesa.posicion,
      }));

      console.log(`Mapa ${mapa.salaId} ->`);
      mesas.forEach((m) => {
        console.log(`  ${m.nombre} (${m.shape}) en x=${m.posicion.x}, y=${m.posicion.y}`);
      });

      resultados.push({
        mapaId: mapa._id.toString(),
        salaId: mapa.salaId.toString(),
        mesas,
      });
    });

    const outputPath = new URL('./table_locations.json', import.meta.url).pathname;
    fs.writeFileSync(outputPath, JSON.stringify(resultados, null, 2));
    console.log(`\nUbicaciones guardadas en ${outputPath}`);
  } catch (err) {
    console.error('Error al obtener ubicaciones:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
