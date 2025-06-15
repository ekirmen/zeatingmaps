import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function renameSalaField() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const Mapas = mongoose.connection.collection('mapas');
    const cursor = Mapas.find({ sala: { $exists: true } });

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      await Mapas.updateOne(
        { _id: doc._id },
        {
          $set: { salaId: doc.sala },
          $unset: { sala: '' },
        }
      );
      console.log(`Migrated document ${doc._id}`);
    }

    // Remove index if it exists
    try {
      await Mapas.dropIndex('sala_1');
      console.log('Dropped index sala_1');
    } catch (err) {
      if (err.codeName !== 'IndexNotFound') {
        throw err;
      }
      console.log('Index sala_1 not found, skipping');
    }

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

renameSalaField();
