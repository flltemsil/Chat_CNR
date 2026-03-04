import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Security Breach Reporting API
  app.post("/api/security/report", (req, res) => {
    const { user, reason, timestamp } = req.body;
    
    console.log("!!! SECURITY BREACH DETECTED !!!");
    console.log(`User: ${user?.name} (${user?.email})`);
    console.log(`Reason: ${reason}`);
    console.log(`Time: ${timestamp}`);
    
    // In a real scenario, we would use a mailer here.
    // Since we are in a sandbox, we log it. 
    // The owner can see these logs or we can simulate a notification.
    
    res.json({ status: "reported", message: "Breach reported to owner." });
  });

  // Master Unlock Status
  app.get("/api/security/status", (req, res) => {
    // This could be dynamic based on owner's remote command
    res.json({ locked: false, masterKey: "CNR_2026_SECURE" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
