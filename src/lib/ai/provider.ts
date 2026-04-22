import { ChatGroq } from "@langchain/groq";

const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";

export function createAdvisorModel() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  return new ChatGroq({
    apiKey,
    model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    temperature: 0.2,
    maxTokens: 900,
  });
}
