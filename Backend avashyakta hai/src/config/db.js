const dns = require("dns");
const mongoose = require("mongoose");
const env = require("./env");

// Fix for MongoDB Atlas SRV DNS resolution on certain networks/Windows
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
  dns.setDefaultResultOrder("ipv4first");
} catch (dnsError) {
  console.warn("DNS configuration warning:", dnsError.message);
}

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    if (!env.MONGODB_URL) {
      throw new Error("MONGODB_URL is missing in environment variables (.env)");
    }

    const conn = await mongoose.connect(env.MONGODB_URL, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database] Connection Error: ${error.message}`);
    console.warn("⚠️ Warning: Server will still run, but database operations will fail until MONGODB_URL in 'Backend avashyakta hai/.env' is corrected.");
    if (
      error.message.includes("SSL") ||
      error.message.includes("whitelist") ||
      error.message.includes("buffering timed out") ||
      error.message.includes("auth")
    ) {
      console.error("\n💡 Quick Fix:");
      console.error("1. Verify your MongoDB username & password in 'Backend avashyakta hai/.env'");
      console.error("2. Go to MongoDB Atlas (https://cloud.mongodb.com) -> 'Network Access' -> Add IP (0.0.0.0/0 for dev).\n");
    }
  }
};

module.exports = connectDB;
