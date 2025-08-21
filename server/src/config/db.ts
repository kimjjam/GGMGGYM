import mongoose from "mongoose";

export async function connectDB(uri: string) {
  await mongoose.connect(uri);
  console.log("Mongo connected");
}

export function dbState() {
  // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  return mongoose.connection.readyState;
}
