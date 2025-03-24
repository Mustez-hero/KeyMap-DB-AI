import { MongoClient } from "mongodb";
import { config } from "dotenv";

// Load environment variables
config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("❌ MONGODB_URI is not defined in .env.local");
}

const client = new MongoClient(uri);

async function testConnection() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Successfully connected to MongoDB!");

    const dbAdmin = client.db().admin();
    const databases = await dbAdmin.listDatabases();
    console.log("📂 Databases:", databases.databases);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await client.close();
    console.log("🔌 Disconnected from MongoDB.");
  }
}

testConnection();
