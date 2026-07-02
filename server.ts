import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// API Route for Secure Text-to-Speech proxy
app.get("/api/tts", async (req, res) => {
  try {
    const text = req.query.text as string;
    const lang = (req.query.lang as string) || "ar";

    if (!text) {
      res.status(400).json({ error: "Text parameter is required" });
      return;
    }

    console.log(`[TTS API] Requesting speech for: "${text}" in language: "${lang}"`);

    // Fetch from a robust cloud TTS service (Google Translate TTS API)
    // Using a server-side request completely bypasses CORS, browser frame policies, and mobile WebView constraints.
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch TTS from upstream service: ${response.statusText}`);
    }

    // Read the MP3 stream from the response and send it back with the correct headers
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.send(buffer);
  } catch (error: any) {
    console.error("[TTS API Error]:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Setup Vite middleware for development or serve built files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite middleware loaded in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    console.log(`[Server] Serving static files from: ${distPath}`);
    
    // Serve index.html for all non-API routing in SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
