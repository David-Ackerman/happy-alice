import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Create a single chat instance to reuse while the page is open.
// The chat can be seeded by sending an initial system/context message.
export const chat = ai.chats.create({ model: "gemini-2.5-flash", history: [] });
export default chat;
