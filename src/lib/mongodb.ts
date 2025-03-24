import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to environment variables");
}

const uri = process.env.MONGODB_URI;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Extend global type to include _mongoClientPromise
declare global {
  namespace NodeJS {
    interface Global {
      _mongoClientPromise?: Promise<MongoClient>;
    }
  }
}

// Use `globalThis` instead of `global`
const globalWithMongo = global as typeof global & { _mongoClientPromise?: Promise<MongoClient> };

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve connection during hot reloads
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production, create a new connection
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
