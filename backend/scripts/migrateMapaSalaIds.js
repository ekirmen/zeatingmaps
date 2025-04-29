import mongoose from 'mongoose';
const { ObjectId } = mongoose.Types;

async function migrateSalaIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/tickera', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Get the Mapas collection
    const Mapas = mongoose.connection.collection('mapas');

    // Find all documents
    const cursor = Mapas.find({});
    
    // Process each document
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      
      // Check if sala is a string that can be converted to ObjectId
      if (typeof doc.sala === 'string' && ObjectId.isValid(doc.sala)) {
        const newSalaId = new ObjectId(doc.sala);
        
        // Update the document
        await Mapas.updateOne(
          { _id: doc._id },
          { $set: { sala: newSalaId } }
        );
        
        console.log(`Updated sala ID for document ${doc._id}`);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateSalaIds();
