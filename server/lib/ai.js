import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// 1. Initialize the Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generates a concise, structured 3-bullet summary of a tender.
 * @param {Object} tender - Tender details from database
 * @returns {Promise<string>} - The AI-generated summary
 */
export async function summarizeTender(tender) {
  // 2. Build the prompt with context
  const prompt = `
You are an expert procurement analyst for Indian government tenders.
Summarize the following tender clearly for business owners and contractors.

Tender Details:
- Title: ${tender.title}
- Department / Organisation: ${tender.department || "Not specified"}
- Reference Number: ${tender.referenceNo || "Not specified"}
- Category: ${tender.category || "General"}
- Deadline: ${tender.deadline ? new Date(tender.deadline).toDateString() : "Not specified"}

Format Requirements:
- Maximum 3 concise bullet points:
  • Scope: What work or supply is actually needed.
  • Key Requirement / Department: Who is issuing it and critical criteria.
  • Submission / Urgency: Deadline context.
- Keep the entire summary under 75 words.
- Use plain, professional English. Do not invent details not present in the input.
`;

  // 3. Request generation from Gemini 1.5 Flash
  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
  });

  return response.text.trim();
}