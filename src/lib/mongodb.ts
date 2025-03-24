import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your Mongo URI to environment variables");
}

const uri = process.env.MONGODB_URI;

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Extend globalThis without using var
declare global {
  interface Global {
    _mongoClientPromise?: Promise<MongoClient>;
  }
}

// Use globalThis but ensure we don't use `var`
const globalWithMongo = global as typeof global & { _mongoClientPromise?: Promise<MongoClient> };

if (process.env.NODE_ENV === "development") {
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
