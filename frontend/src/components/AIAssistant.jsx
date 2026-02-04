// frontend/src/components/AIAssistant.jsx
import { useState, useEffect } from "react";

export default function AIAssistant({ editorCode = "", language = "javascript" }) {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("");

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const apiUrl = `${baseUrl}/api/test`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.keyFound) {
        setConnectionStatus("✓ Connected");
      } else {
        setConnectionStatus("✗ API key not found");
      }
    } catch (err) {
      setConnectionStatus("✗ Cannot connect");
    }
  }

  async function handleAsk() {
    if (!prompt.trim() && !editorCode) {
      setReply("Please type a question or supply code context.");
      return;
    }

    setLoading(true);
    setReply("");
    try {
      // Use full URL from env var, or relative path if not set
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const apiUrl = `${baseUrl}/api/assistant`;
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          code: editorCode,
          language: language
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}: ${res.statusText}` }));
        const errorMessage = errorData.error || `Server returned ${res.status}`;
        
        // Format error message nicely
        let formattedError = `❌ Error: ${errorMessage}`;
        if (errorData.status) {
          formattedError += `\n\nStatus Code: ${errorData.status}`;
        }
        if (errorData.errorCode) {
          formattedError += `\nError Code: ${errorData.errorCode}`;
        }
        
        setReply(formattedError);
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.error) {
        const errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error, null, 2);
        setReply(`❌ Error: ${errorMsg}`);
      } else {
        setReply(data.reply || "No response received from assistant.");
      }
    } catch (err) {
      console.error("AI Assistant error:", err);
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        setReply("Request failed: Cannot connect to server. Make sure the backend is running on http://localhost:5000");
      } else {
        setReply(`Request failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      padding: "1.5rem",
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(10px)",
      color: "#e6eef6",
      borderRadius: "16px",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          AI Assistant
        </h3>
        <span style={{
          fontSize: "0.75rem",
          padding: "0.25rem 0.75rem",
          borderRadius: "12px",
          background: connectionStatus.includes("✓") ? "rgba(74, 222, 128, 0.2)" : "rgba(239, 68, 68, 0.2)",
          color: connectionStatus.includes("✓") ? "#4ade80" : "#ef4444",
          border: `1px solid ${connectionStatus.includes("✓") ? "rgba(74, 222, 128, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
          fontWeight: 500
        }}>
          {connectionStatus}
        </span>
      </div>

      <textarea
        placeholder="Ask the assistant (bug fix, explain, optimize, write tests)..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          fontFamily: "inherit",
          padding: "0.875rem 1rem",
          borderRadius: "10px",
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#e6eef6",
          fontSize: "0.9rem",
          resize: "vertical",
          transition: "all 0.3s ease"
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#667eea";
          e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.2)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
          e.target.style.boxShadow = "none";
        }}
      />

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          onClick={handleAsk}
          disabled={loading || (!prompt.trim() && !editorCode)}
          style={{
            flex: 1,
            padding: "0.75rem 1.25rem",
            background: loading || (!prompt.trim() && !editorCode)
              ? "rgba(255, 255, 255, 0.1)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: loading || (!prompt.trim() && !editorCode) ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            opacity: loading || (!prompt.trim() && !editorCode) ? 0.5 : 1,
            boxShadow: loading || (!prompt.trim() && !editorCode) ? "none" : "0 4px 12px rgba(102, 126, 234, 0.4)"
          }}
          onMouseEnter={(e) => {
            if (!loading && (prompt.trim() || editorCode)) {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = loading || (!prompt.trim() && !editorCode) ? "none" : "0 4px 12px rgba(102, 126, 234, 0.4)";
          }}
        >
          {loading ? "⏳ Thinking..." : "💬 Ask"}
        </button>
        <button
          onClick={() => { setPrompt(""); setReply(""); }}
          style={{
            padding: "0.75rem 1.25rem",
            background: "rgba(255, 255, 255, 0.1)",
            color: "#e6eef6",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "10px",
            fontSize: "0.9rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.15)";
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.1)";
            e.target.style.transform = "translateY(0)";
          }}
        >
          🗑️ Clear
        </button>
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <label style={{ fontSize: "0.85rem", opacity: 0.8, fontWeight: 500, display: "block", marginBottom: "0.75rem" }}>
          Assistant Reply:
        </label>
        <pre style={{
          whiteSpace: "pre-wrap",
          background: "#000",
          color: "#4ade80",
          padding: "1rem",
          borderRadius: "10px",
          maxHeight: "400px",
          overflow: "auto",
          fontSize: "0.85rem",
          lineHeight: "1.6",
          border: "1px solid rgba(74, 222, 128, 0.2)",
          fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace"
        }}>
          {reply || (loading ? "⏳ Waiting for response..." : "💭 No reply yet.")}
        </pre>
      </div>
    </div>
  );
}
