export default async function handler(req, res) {
  try {
    // Vercel serverless helper parses query parameters into req.query
    const text = req.query.text;
    const lang = req.query.lang || "ar";

    if (!text) {
      return res.status(400).json({ error: "Text parameter is required" });
    }

    console.log(`[Vercel TTS API] Requesting speech for: "${text}" in language: "${lang}"`);

    // Fetch from Google Translate TTS API
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
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("[Vercel TTS API Error]:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
