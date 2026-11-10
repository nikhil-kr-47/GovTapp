import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generates a concise, structured 3-bullet summary of a tender.
 * @param {Object} tender - Tender details from database
 * @returns {Promise<string>} - The AI-generated summary
 */
export async function summarizeTender(tender) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the server environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build the prompt with context
  const prompt = `
You are an expert procurement analyst for Indian government tenders.
Summarize the following tender clearly for business owners and contractors.

Tender Details:
- Title: ${tender.title}
- Department / Organisation: ${tender.department || "Not specified"}
- Reference Number: ${tender.referenceNo || "Not specified"}
- Category: ${tender.category?.name || tender.category || "General"}
- Deadline: ${tender.deadline ? new Date(tender.deadline).toDateString() : "Not specified"}

Format Requirements:
- Maximum 3 concise bullet points:
  • Scope: What work or supply is actually needed.
  • Key Requirement / Department: Who is issuing it and critical criteria.
  • Submission / Urgency: Deadline context.
- Keep the entire summary under 75 words.
- Use plain, professional English. Do not invent details not present in the input.
`;

  // Google GenAI production models
  const candidateModels = ["gemini-3.8-flash", "gemini-3.5-flash-lite"];
  let lastError;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} attempt failed, trying fallback:`, err.message);
    }
  }

  throw lastError;
}