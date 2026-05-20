import { GoogleGenAI } from "@google/genai";

async function run() {
  const keys = process.env.CHAT_CNR_API_KEY?.split(",") || [];
  if (keys.length === 0) return console.error("No key");
  const ai = new GoogleGenAI({ apiKey: keys[0].trim() });
  
  const models = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-3.1-flash",
    "gemini-3.0-flash",
  ];

  for (const model of models) {
    try {
      console.log(`\nTesting ${model} with search...`);
      const response = await ai.models.generateContent({
        model: model,
        contents: "What is the Bitcoin price right now? Tell me the exact number.",
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      console.log(`[SUCCESS] ${model}:`, response.text?.slice(0, 50));
    } catch (e: any) {
      console.error(`[ERROR] ${model}:`, e.message);
    }
  }
}
run();
