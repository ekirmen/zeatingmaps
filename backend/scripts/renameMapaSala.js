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

    // Remove old indexes if they exist
    const oldIndexes = ['sala_1', 'salaId_1'];
    for (const idx of oldIndexes) {
      try {
        await Mapas.dropIndex(idx);
        console.log(`Dropped index ${idx}`);
      } catch (err) {
        if (err.codeName !== 'IndexNotFound') {
          throw err;
        }
        console.log(`Index ${idx} not found, skipping`);
      }
    }

    // Create the new unique compound index
    await Mapas.createIndex({ salaId: 1, funcionId: 1 }, { unique: true });
    console.log('Created index salaId_1_funcionId_1');

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

renameSalaField();
