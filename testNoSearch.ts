import { GoogleGenAI } from "@google/genai";

async function run() {
  const keys = process.env.CHAT_CNR_API_KEY?.split(",") || [];
  if (keys.length === 0) return console.error("No key");
  const ai = new GoogleGenAI({ apiKey: keys[0].trim() });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: "Tell me about the latest news in Turkey from today."
    });
    console.log("Success:", response.text);
  } catch (e: any) {
    console.error("Error:", JSON.stringify(e));
  }
}
run();
