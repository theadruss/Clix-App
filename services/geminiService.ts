
import { GoogleGenAI } from "@google/genai";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// Assume this variable is pre-configured, valid, and accessible.

export const generateEventContent = async (topic: string, type: 'description' | 'tagline' | 'poster_idea') => {
  // Use process.env.API_KEY string directly when initializing the @google/genai client instance.
  if (!process.env.API_KEY) {
    console.warn("API Key is missing for Gemini Service");
    return "AI generation unavailable (Missing API Key).";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  let prompt = "";

  if (type === 'description') {
    prompt = `Write a compelling, professional, yet exciting 2-sentence description for a college event about: "${topic}". Keep it under 50 words.`;
  } else if (type === 'tagline') {
    prompt = `Write a catchy, short tagline for a college event about: "${topic}". Max 10 words.`;
  } else if (type === 'poster_idea') {
    prompt = `Describe a minimalist, black and white abstract geometric poster design concept for an event about: "${topic}".`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text?.trim() || "Could not generate content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please try again.";
  }
};

export const generateEventReport = async (title: string, stats: any, feedback: any[]) => {
  if (!process.env.API_KEY) return "API Key missing.";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const feedbackStr = feedback.length > 0 ? feedback.map(f => f.comment).join("; ") : "No specific feedback provided.";
  const prompt = `Write a professional post-event report for the college event "${title}".
  
  Statistics:
  - Registrations: ${stats.registered} / ${stats.capacity}
  - Revenue: ${stats.revenue}
  
  Student Feedback:
  ${feedbackStr}

  Structure the report with the following sections (use Markdown):
  1. Executive Summary
  2. Participation & Engagement Analysis
  3. Feedback Highlights

  IMPORTANT: Do not use placeholders like [Insert Date] or fill-in-the-blanks. Use the provided data. If data is missing, make a reasonable professional assumption or omit the specific detail. Do not use asterisks for bolding, use standard Markdown headers. The tone should be formal and objective.`;

  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
  } catch (e) {
    console.error(e);
    return "Error generating report. Please try again.";
  }
};

export const generateImage = async (prompt: string) => {
  if (!process.env.API_KEY) return null;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash-image";
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: prompt }] },
    });
    
    // Extract image from response
    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (e) {
    console.error("Image Generation Error:", e);
    return null;
  }
};

export const checkVenueConflicts = async (venueName: string, date: string, time: string, existingEvents: any[]) => {
  if (!process.env.API_KEY) return "API Key missing.";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";

  const eventsStr = existingEvents.map(e => `- ${e.title} on ${e.date} at ${e.time}`).join('\n');
  const prompt = `Analyze the following schedule for venue "${venueName}" and check for conflicts with a new event proposed for ${date} at ${time}.
  
  Existing Schedule:
  ${eventsStr}
  
  New Event: ${date} at ${time}.
  
  If there is a conflict, explain it clearly. If not, confirm availability. Suggest alternative times if conflict exists. Keep it concise.`;

  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
  } catch (e) {
    console.error(e);
    return "Error checking conflicts.";
  }
};
