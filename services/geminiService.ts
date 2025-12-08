import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are Aura, a friendly, supportive, and insightful AI journaling assistant for a Gen-Z user. 
Your goal is to help the user reflect on their day, offer empathy, and ask gentle follow-up questions.
Keep your responses concise (under 50 words usually), conversational, and warm. 
Use emojis occasionally but don't overdo it. 
Never be judgmental. If the user is in distress, suggest seeking professional help gently.
`;

// Hardcoded fallback as a safety net if build injection fails
const FALLBACK_KEY = "AIzaSyAogVbjVnOxsCSKAFNiGRywN1o6tsUOGF4";

let aiInstance: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
    if (!aiInstance) {
        const key = process.env.API_KEY || FALLBACK_KEY;
        if (!key) {
            console.error("CRITICAL: No API Key found. AI features will fail.");
        }
        aiInstance = new GoogleGenAI({ apiKey: key });
    }
    return aiInstance;
};

export const generateJournalResponse = async (history: { role: string; content: string }[], userMessage: string): Promise<string> => {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
      }))
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "I'm listening... 💭";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having a little trouble connecting to my thoughts right now. But I'm listening! 💭";
  }
};

export const analyzeEntryMood = async (text: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the sentiment of this journal entry and return ONLY ONE word from this list: happy, sad, anxious, excited, tired, neutral, angry. Entry: "${text}"`,
        });
        const mood = response.text?.trim().toLowerCase();
        return mood || 'neutral';
    } catch (e) {
        console.error("Mood analysis failed", e);
        return 'neutral';
    }
}

export const generateDailySummary = async (text: string): Promise<string> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize this journal entry into one short, engaging sentence (max 15 words) that captures the core vibe. Entry: "${text}"`,
        });
        return response.text || text.substring(0, 50) + "...";
    } catch (e) {
        return text.substring(0, 50) + "...";
    }
}