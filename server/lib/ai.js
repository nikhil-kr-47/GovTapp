import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;


/**
 * Generates a concise, structured 3-bullet summary of a tender.
 * @param {Object} tender - Tender details from database
 * @returns {Promise<string>} - The AI-generated summary
 */
export async function streamTenderSummary(tender) {

   if (!ai) {
    throw new Error("GEMINI_API_KEY is not set in server environment variables.");
  }
  
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

  // Use Gemini 3.5 Flash-Lite (Fastest inference, 1.4s generation, highly reliable)
  const candidateModels = ["gemini-3.5-flash-lite", "gemini-3.5-flash"];
  let lastError;

  for (const model of candidateModels) {
    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
      });
      if (responseStream) {
        return responseStream;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} attempt failed, trying fallback:`, err.message);
    }
  }

  throw lastError;
}

/**
 * Generates a 768-dimensional vector embedding for a given text.
 * @param {string} text - Title or search query
 * @returns {Promise<number[]>} - Array of 768 floating point numbers
 */
export async function generateEmbedding(text) {
   if(!ai){
    throw new Error("GEMINI_API_KEY is not set in server environment variables.");

   }

   const response=await ai.models.embedContent({
    model:"gemini-embedding-001",
    contents:text,
    config: {
      outputDimensionality: 768, // Keeps our 768-dimension pgvector compatibility
    },
   });

   return response.embeddings[0].values;
}

