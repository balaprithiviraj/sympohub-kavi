const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sympohub';

  // Explicit opt-in for zero-install local dev: MONGO_URI=memory
  if (uri === 'memory') {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log('MongoDB connected (in-memory dev server)');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 20,
      minPoolSize: 2
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Tip: install MongoDB locally, use a free MongoDB Atlas URI, or set MONGO_URI=memory for a zero-install dev database.');
    process.exit(1);
  }
};

module.exports = connectDB;
