// backend/routes/assistant.js
import express from "express";
const router = express.Router();

// Test endpoint to verify API key
router.get("/test", async (req, res) => {
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY?.trim();
  if (!OPENROUTER_KEY) {
    return res.json({ 
      status: "error", 
      message: "OPENROUTER_API_KEY not found in environment variables",
      keyFound: false 
    });
  }
  
  return res.json({ 
    status: "ok", 
    message: "API key found",
    keyFound: true,
    keyPrefix: OPENROUTER_KEY.substring(0, 10) + "...",
    keyLength: OPENROUTER_KEY.length
  });
});

router.post("/assistant", async (req, res) => {
  console.log("AI Assistant request received:", { 
    hasPrompt: !!req.body?.prompt, 
    hasCode: !!req.body?.code,
    language: req.body?.language 
  });
  
  try {
    const { prompt, code, language } = req.body || {};
    if (!prompt && !code) {
      console.log("Missing prompt and code");
      return res.status(400).json({ error: "Provide prompt or code." });
    }

    let fullPrompt = "";
    if (prompt) fullPrompt += `${prompt}\n\n`;
    if (code) {
      fullPrompt += `Here is the user's code (language: ${language || "unknown"}):\n\n\`\`\`\n${code}\n\`\`\`\n\nPlease provide concise, actionable help.`;
    }

    const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY?.trim();
    if (!OPENROUTER_KEY) {
      console.error("OPENROUTER_API_KEY missing!");
      return res.status(500).json({ error: "OpenRouter API key not configured on server." });
    }
    
    console.log("Using OpenRouter API key (first 10 chars):", OPENROUTER_KEY.substring(0, 10) + "...");

    // Use OpenRouter API endpoint
    const endpoint = "https://openrouter.ai/api/v1/chat/completions";
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"; // Default model
    const payload = {
      model: model,
      messages: [
        { role: "system", content: "You are a helpful coding assistant." },
        { role: "user", content: fullPrompt }
      ],
      max_tokens: 800,
      temperature: 0.2
    };

    console.log("Sending request to OpenRouter API...");
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:5000", // Optional but recommended
        "X-Title": process.env.OPENROUTER_APP_NAME || "Realtime Code Editor" // Optional but recommended
      },
      body: JSON.stringify(payload),
    });

    const status = resp.status;
    const text = await resp.text(); // read text first (safe even if not JSON)

    // Log for debugging
    console.log("OpenRouter response status:", status);
    if (status !== 200) {
      console.error("OpenRouter API Error Response:", text);
    }

    if (!resp.ok) {
      // Try to parse error details
      let errorMessage = "Unknown error";
      let errorCode = null;
      try {
        const errorJson = JSON.parse(text);
        errorMessage = errorJson.error?.message || errorJson.error?.type || "API Error";
        errorCode = errorJson.error?.code || errorJson.error?.type;
        
        // Provide helpful messages for common errors
        if (status === 401) {
          errorMessage = "Invalid API key. Please check your OPENROUTER_API_KEY in the .env file.";
        } else if (status === 429) {
          errorMessage = "Rate limit exceeded. Please try again later.";
        } else if (status === 402) {
          errorMessage = "Payment required. Please check your OpenRouter account credits.";
        } else if (status === 403) {
          errorMessage = "API key doesn't have permission to access this endpoint.";
        }
      } catch (e) {
        errorMessage = text.substring(0, 500); // First 500 chars if not JSON
      }
      
      console.error("OpenRouter API Error:", status, errorMessage);
      return res.status(500).json({ 
        error: `OpenRouter API error (${status}): ${errorMessage}`,
        status: status,
        errorCode: errorCode,
        details: text.substring(0, 1000) // Limit details size
      });
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("Failed to parse OpenRouter JSON:", parseErr);
      // Return raw text so frontend can display it
      return res.status(500).json({ error: "Failed to parse OpenRouter response", raw: text });
    }

    const assistantMessage = data.choices?.[0]?.message?.content ?? "";
    return res.json({ reply: assistantMessage, raw: data });
  } catch (err) {
    console.error("assistant route error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

export default router;
