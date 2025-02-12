import { connectDB } from './mongodb.js';
import Conversation from '../models/Conversation.js';

/**
 * Retrieves the conversation history for a user.
 * @param {string} userId - The user's ID.
 * @returns {Array} - The conversation messages.
 */
export async function getConversation(userId) {
  await connectDB();

  let conversation = await Conversation.findOne({ userId });

  if (!conversation) {
    conversation = new Conversation({ userId, messages: [] });
    await conversation.save();
  }

  return conversation.messages;
}

/**
 * Saves a message to the user's conversation history.
 * @param {string} userId - The user's ID.
 * @param {Array} messages - The conversation messages.
 */
export async function saveMessage(userId, messages) {
  await connectDB();

  await Conversation.updateOne(
    { userId },
    { $set: { messages } },
    { upsert: true }
  );
}

module.exports = {
  getConversation,
  saveMessage,
}; 