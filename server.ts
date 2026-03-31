import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Stripe from "stripe";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY) 
  : null;

const app = express();
const PORT = 3000;

app.use(express.json());

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
      let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start the server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server failed to start:', err);
});
