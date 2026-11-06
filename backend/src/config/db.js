const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async (uri = env.MONGO_URI) => {
  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Disconnected successfully');
  } catch (error) {
    console.error(`[MongoDB] Error disconnecting: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
