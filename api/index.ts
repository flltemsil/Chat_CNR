import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Stripe from "stripe";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Gemini API Proxy (Server-Side)
app.post("/api/chat/stream", async (req, res) => {
  const { prompt, history, model, systemInstruction, isPro } = req.body;
  
  const envKeyStandard = process.env.CHAT_CNR_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  const envKeyPro = process.env.CHAT_CNR_PRO_API_KEY || "";
  const envKey = isPro ? (envKeyPro || envKeyStandard) : envKeyStandard;

  if (!envKey || envKey.length < 5) {
    return res.status(500).json({ error: "API_KEY_MISSING_ON_SERVER" });
  }

  const apiKeys = envKey.split(',').map(k => k.trim()).filter(k => k.length > 5);
  
  // Model variations to try if 404 occurs
  const modelVariations = isPro 
    ? ['gemini-1.5-pro', 'gemini-1.5-pro-latest', 'gemini-pro'] 
    : ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-002', 'gemini-pro'];

  // Set headers for SSE (Streaming)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let success = false;
  
  // Try each key
  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const apiKey = apiKeys[keyIndex];
    const genAI = new GoogleGenerativeAI(apiKey);

    // Try each model variation
    for (const activeModel of modelVariations) {
      try {
        console.log(`[Server Proxy] Trying key ${keyIndex + 1}/${apiKeys.length} with model ${activeModel}`);
        const generativeModel = genAI.getGenerativeModel({ 
          model: activeModel,
          systemInstruction: systemInstruction,
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        });

        // Gemini history MUST start with 'user' and alternate roles
        const sanitizedHistory = [];
        let lastRole = null;

        if (Array.isArray(history)) {
          for (const m of history) {
            if (!m.text || !m.text.trim()) continue;
            
            const currentRole = m.role === 'model' ? 'model' : 'user';
            
            // Skip if it's the first message and it's from the model
            if (sanitizedHistory.length === 0 && currentRole === 'model') continue;
            
            // Skip if it's the same role as the last one (Gemini requires alternation)
            if (currentRole === lastRole) continue;

            sanitizedHistory.push({
              role: currentRole,
              parts: [{ text: m.text }]
            });
            lastRole = currentRole;
          }
        }

        console.log(`[Server Proxy] Sanitized History length: ${sanitizedHistory.length}, Prompt: "${prompt.substring(0, 50)}..."`);

        let result;
        try {
          if (sanitizedHistory.length === 0) {
            // First message or history was invalid/empty
            console.log(`[Server Proxy] Using generateContentStream (First Message)`);
            result = await generativeModel.generateContentStream({
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
          } else {
            // Continuing a conversation
            console.log(`[Server Proxy] Using sendMessageStream (Conversation)`);
            const chatSession = generativeModel.startChat({
              history: sanitizedHistory
            });
            result = await chatSession.sendMessageStream(prompt);
          }
        } catch (initError: any) {
          console.warn(`[Server Proxy] Initial call failed for ${activeModel}: ${initError.message}. Trying direct prompt fallback...`);
          result = await generativeModel.generateContentStream({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
        }

        let chunkCount = 0;
        try {
          for await (const chunk of result.stream) {
            try {
              const chunkText = chunk.text();
              if (chunkText) {
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                chunkCount++;
              }
            } catch (e) {
              const finishReason = chunk.candidates?.[0]?.finishReason;
              console.warn(`[Server Proxy] Chunk ${chunkCount + 1} has no text. FinishReason: ${finishReason}`);
              if (finishReason === 'SAFETY') {
                res.write(`data: ${JSON.stringify({ error: "İçerik güvenlik filtresine takıldı." })}\n\n`);
              }
            }
          }
        } catch (streamError: any) {
          console.error(`[Server Proxy Stream Error] ${activeModel}:`, streamError.message);
          if (chunkCount === 0) throw streamError;
          else {
            res.write(`data: ${JSON.stringify({ error: "Yayın sırasında bir hata oluştu." })}\n\n`);
            res.end();
            return;
          }
        }

        if (chunkCount === 0) {
          console.warn(`[Server Proxy] Stream was empty for model ${activeModel}.`);
          throw new Error("EMPTY_STREAM");
        }

        console.log(`[Server Proxy] Stream completed successfully with ${chunkCount} chunks.`);
        res.write('data: [DONE]\n\n');
        res.end();
        success = true;
        break; // Success with this model
      } catch (error: any) {
        console.error(`[Server Proxy Attempt Failed] Key ${keyIndex + 1}, Model ${activeModel}:`, error.message);
        
        // Fallback: Try without history if it's the last model variation
        if (activeModel === modelVariations[modelVariations.length - 1] && history && history.length > 0) {
          try {
            console.log(`[Server Proxy] FALLBACK: Trying without history...`);
            const generativeModel = genAI.getGenerativeModel({ 
              model: activeModel, 
              systemInstruction,
              safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              ]
            });
            const fallbackResult = await generativeModel.generateContentStream({
              contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            
            let fallbackChunks = 0;
            for await (const chunk of fallbackResult.stream) {
              const txt = chunk.text();
              if (txt) {
                res.write(`data: ${JSON.stringify({ text: txt })}\n\n`);
                fallbackChunks++;
              }
            }
            if (fallbackChunks > 0) {
              res.write('data: [DONE]\n\n');
              res.end();
              success = true;
              break;
            }
          } catch (fallbackErr) {
            console.error(`[Server Proxy Fallback Failed]:`, fallbackErr);
          }
        }

        const isQuota = error.message?.includes('429') || error.message?.includes('quota');
        const isNotFound = error.message?.includes('404') || error.message?.includes('not found');

        if (isNotFound || error.message === "EMPTY_STREAM") {
          console.warn(`[Server Proxy] Retrying with next variation due to: ${error.message}`);
          continue; 
        }

        if (isQuota && keyIndex < apiKeys.length - 1) {
          console.warn(`[Server Proxy] Quota exceeded for key ${keyIndex + 1}. Trying next key...`);
          break; // Break model loop to try next key
        }
      }
    }
    if (success) break;
  }

  if (!success && !res.writableEnded) {
    res.write(`data: ${JSON.stringify({ error: "Tüm API anahtarları ve model varyasyonları denendi ancak sonuç alınamadı." })}\n\n`);
    res.end();
  }
});

// Image Generation Proxy
app.post("/api/chat/image", async (req, res) => {
  const { prompt } = req.body;
  const envKey = process.env.CHAT_CNR_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY || "";
  if (!envKey) return res.status(500).json({ error: "API_KEY_MISSING" });
  const apiKeys = envKey.split(',').map(k => k.trim());

  for (const apiKey of apiKeys) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // For images, we use the specific multimodal capabilities of 1.5 Flash
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent([
        prompt,
        "Generate a high quality image based on this description. Return the image data."
      ]);
      
      const response = await result.response;
      // Gemini 1.5 Flash can return inlineData if configured, 
      // but standard generateContent usually returns text.
      // If the user wants actual DALL-E style image gen, they'd need a different model.
      // For now, we'll return the text or any inline data found.
      const part = response.candidates?.[0]?.content?.parts?.[0];
      
      if (part?.inlineData) {
        res.json({ imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` });
      } else {
        res.json({ text: response.text() });
      }
      return;
    } catch (error: any) {
      if (error.message?.includes('429') && apiKeys.indexOf(apiKey) < apiKeys.length - 1) continue;
      res.status(500).json({ error: error.message });
      return;
    }
  }
});

// Stripe Checkout Session Route
app.post("/api/stripe/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Stripe is not configured" });
  }

  const { userId, userEmail, priceId } = req.body;
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId || "price_1Q...your_test_price_id", // User should replace this
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${appUrl}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?payment_cancelled=true`,
      customer_email: userEmail,
      metadata: {
        userId: userId,
      },
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Customer Portal Route
app.post("/api/stripe/create-portal-session", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
  
  const { userEmail } = req.body;
  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

  try {
    // Find customer by email
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    if (customers.data.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: appUrl,
    });

    res.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Stripe Portal Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Session Verification Route
app.get("/api/stripe/verify-session", async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured" });
  
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "No session ID" });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id as string);
    if (session.payment_status === "paid") {
      res.json({ status: "success", userId: session.metadata?.userId });
    } else {
      res.json({ status: "pending" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite / Static logic
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.all("*", async (req, res, next) => {
    // Express 5 requires a different approach for catch-all if using regex, 
    // but for simple middleware it might still work depending on the router version.
    // However, to be safe with Express 5's path-to-regexp v8, we use the most compatible string.
    const url = req.originalUrl;
    try {
      let template = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  const distPath = path.join(__dirname, "..", "dist");
  console.log(`[Server] Serving static files from: ${distPath}`);
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    // If it's an API request that wasn't caught, return 404 JSON
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: `API endpoint ${req.path} not found.` });
    }
    
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Frontend build not found. Please run 'npm run build' first.");
    }
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    path: req.path
  });
});

// Start the server only if not on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Handle server errors
  server.on('error', (err) => {
    console.error('Server failed to start:', err);
  });
}

export default app;
