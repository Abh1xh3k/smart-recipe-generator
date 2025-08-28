
const mongoose = require("mongoose");
require("dotenv").config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected Successfully!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Connection Failed:", error.message);
  }
}

testConnection();
