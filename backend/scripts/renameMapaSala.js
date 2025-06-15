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

    for await (const doc of cursor) {
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

    // Remove existing duplicates before creating the new index
    const duplicates = await Mapas.aggregate([
      {
        $group: {
          _id: { salaId: '$salaId', funcionId: '$funcionId' },
          ids: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]).toArray();

    for (const dup of duplicates) {
      const [keep, ...remove] = dup.ids;
      if (remove.length) {
        await Mapas.deleteMany({ _id: { $in: remove } });
        console.log(
          `Removed ${remove.length} duplicate maps for sala ${dup._id.salaId} ` +
            `and funcion ${dup._id.funcionId}`,
        );
      }
    }

    // Create the new unique compound index
    await Mapas.createIndex(
      { salaId: 1, funcionId: 1 },
      { unique: true, name: 'salaId_1_funcionId_1' },
    );
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
