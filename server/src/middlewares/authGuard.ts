import mongoose from "mongoose";

export async function connectDB(uri: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("Mongo connected:", mongoose.connection.name);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
