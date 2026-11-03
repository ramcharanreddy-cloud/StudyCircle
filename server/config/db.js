const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (typeof uri !== "string" || !uri.trim()) {
    throw new Error("MONGO_URI is not configured. Check server/.env.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri.trim(), {
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[StudyCircle] MongoDB connected (${mongoose.connection.name}).`);
  return mongoose.connection;
};

module.exports = connectDB;
