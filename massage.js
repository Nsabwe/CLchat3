import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String }, // null for public chat
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Message", messageSchema);