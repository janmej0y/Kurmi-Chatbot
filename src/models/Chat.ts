import mongoose, { Schema, model, models } from "mongoose";

const ChatSchema = new Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true, // One document per user (stores all their history)
    },
    messages: [
      {
        role: { type: String, required: true }, // "user" or "assistant"
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Chat = models.Chat || model("Chat", ChatSchema);

export default Chat;