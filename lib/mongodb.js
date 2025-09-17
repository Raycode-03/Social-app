// lib/mongodb.js
export const runtime = "nodejs";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongodb_url = process.env.MONGODB_URL || "mongodb://localhost:27017";
if (!mongodb_url) {
  throw new Error("MONGODB_URL environment variable is not set!");
}

// Retry settings
const MAX_RETRIES = 5;
const RETRY_DELAY = 2000; // milliseconds

// Global cache across hot reloads (important for Next.js)
let cached = global._mongoCache;

if (!cached) {
  cached = global._mongoCache = { client: null, db: null, promise: null };
}

async function connectWithRetry(url, retries = MAX_RETRIES) {
  try {
    const mongoClient = await MongoClient.connect(url, {
      serverSelectionTimeoutMS: 5000,
    });
    const db = mongoClient.db(); // default DB from URL
    console.log("✅ MongoDB connected successfully!");
    return { mongoClient, db };
  } catch (err) {
    if (retries > 0) {
      console.warn(
        `⚠️ MongoDB connection failed. Retrying in ${RETRY_DELAY}ms... (${retries} retries left)`
      );
      await new Promise((res) => setTimeout(res, RETRY_DELAY));
      return connectWithRetry(url, retries - 1);
    } else {
      console.error("❌ MongoDB connection failed after multiple attempts:", err);
      throw err;
    }
  }
}

export async function connect_db() {
  if (cached.db) return cached.db; // reuse

  if (!cached.promise) {
    cached.promise = connectWithRetry(mongodb_url).then((result) => {
      cached.client = result.mongoClient;
      cached.db = result.db;
      return cached.db;
    });
  }

  return cached.promise;
}

export function get_db() {
  if (!cached.db) {
    throw new Error("Database not connected! Call connect_db() first.");
  }
  return cached.db;
}
