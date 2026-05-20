import { GoogleGenAI } from "@google/genai";

async function test() {
  const ai = new GoogleGenAI({ apiKey: "" });
  try {
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "hello",
    });
  } catch (err: any) {
    console.log("ERROR MESSAGE:");
    console.log(err.message);
  }
}
test();
