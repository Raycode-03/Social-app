// MongoClient setup + retry logic
import { MongoClient, ServerApiVersion } from "mongodb";

if (!process.env.MONGODB_URL) throw new Error('Missing MONGODB_URL');

const uri = process.env.MONGODB_URL;
const options = { serverApi: { version: ServerApiVersion.v1 } };

let client: MongoClient;

async function connectWithRetry(retries = 5, delay = 2000): Promise<MongoClient> {
  try {
    const c = new MongoClient(uri, options);
    await c.connect();
    console.log("MongoDB connected successfully!");
    return c;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Retrying MongoDB connection... (${retries} left)`);
      await new Promise(res => setTimeout(res, delay));
      return connectWithRetry(retries - 1, delay);
    } else {
      throw err;
    }
  }
}

async function initializeMongoClient() {
  if (process.env.NODE_ENV === "development") {
    const g = global as typeof globalThis & { _mongoClient?: MongoClient };
    if (!g._mongoClient) {
      g._mongoClient = await connectWithRetry();
    }
    client = g._mongoClient;
  } else {
    client = await connectWithRetry();
  }
  return client;
}

// Initialize and export a promise that resolves to the client
const clientPromise = initializeMongoClient();

export default clientPromise;