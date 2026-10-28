import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

export async function connectDB(): Promise<string> {
  if (mongoose.connection.readyState === 1) {
    console.log('[DB] Already connected to MongoDB.');
    return 'connected';
  }

  const uri = process.env.MONGO_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('[DB] Connecting to provided MONGO_URI...');
      await mongoose.connect(uri);
      console.log('[DB] Connected to external MongoDB successfully.');
      return uri;
    } catch (err) {
      console.error('[DB] Failed to connect to provided MONGO_URI, falling back to embedded MongoMemoryServer:', err);
    }
  }

  console.log('[DB] Initializing embedded MongoDB server (MongoMemoryServer)...');
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }
  const memoryUri = mongoServer.getUri();
  await mongoose.connect(memoryUri);
  console.log(`[DB] Connected to embedded MongoDB successfully at ${memoryUri}`);
  return memoryUri;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
