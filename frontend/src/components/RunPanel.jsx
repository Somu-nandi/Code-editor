// frontend/src/components/RunPanel.jsx
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// local backend in development
const socket = io(import.meta.env.VITE_API_URL || "https://code-editor-8eh5.onrender.com");

export default function RunPanel({ code = "", setCode }) {
  const [lang, setLang] = useState("python");
  const [stdin, setStdin] = useState("");
  const outputRef = useRef(null);

  useEffect(() => {
    socket.on("run-output", (msg) => {
      const outEl = outputRef.current;
      if (!outEl) return;
      if (msg.system) outEl.value += msg.system;
      if (msg.stdout) outEl.value += msg.stdout;
      if (msg.stderr) outEl.value += msg.stderr;
      outEl.scrollTop = outEl.scrollHeight;
    });

    return () => socket.off("run-output");
  }, []);

  function handleRun() {
    if (outputRef.current) outputRef.current.value = "";
    socket.emit("run-code", { code, lang, stdin });
  }

  return (
    <div style={{
      padding: "1.25rem",
      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      background: "linear-gradient(180deg, #0f1720 0%, #0a0e1a 100%)",
      color: "#e6eef6",
      height: "100%",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        marginBottom: "1.25rem",
        flexWrap: "wrap"
      }}>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={{
            padding: "0.75rem 2.5rem 0.75rem 1rem",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "10px",
            color: "#e6eef6",
            fontSize: "0.9rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.3s ease",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23e6eef6' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.75rem center",
            backgroundSize: "12px",
            minWidth: "180px"
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#667eea";
            e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.2)";
            e.target.style.background = "rgba(102, 126, 234, 0.15)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
            e.target.style.boxShadow = "none";
            e.target.style.background = "rgba(255, 255, 255, 0.08)";
          }}
          onMouseEnter={(e) => {
            if (document.activeElement !== e.target) {
              e.target.style.borderColor = "rgba(102, 126, 234, 0.5)";
              e.target.style.background = "rgba(255, 255, 255, 0.12)";
            }
          }}
          onMouseLeave={(e) => {
            if (document.activeElement !== e.target) {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.15)";
              e.target.style.background = "rgba(255, 255, 255, 0.08)";
            }
          }}
        >
          <option value="python" style={{ background: "#1a1f2e", color: "#e6eef6" }}>🐍 Python</option>
          <option value="java" style={{ background: "#1a1f2e", color: "#e6eef6" }}>☕ Java</option>
          <option value="c" style={{ background: "#1a1f2e", color: "#e6eef6" }}>⚙️ C (gcc)</option>
          <option value="cpp" style={{ background: "#1a1f2e", color: "#e6eef6" }}>⚙️ C++ (g++)</option>
        </select>
        <button
          onClick={handleRun}
          style={{
            padding: "0.625rem 1.5rem",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.9rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.4)"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
          }}
        >
          ▶️ Run
        </button>
        <div style={{
          fontSize: "0.75rem",
          opacity: 0.6,
          padding: "0.5rem 0.75rem",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.1)"
        }}>
          💡 <strong>Requirements:</strong> Python, Java (javac/java), gcc (for C), & g++ (for C++) must be installed and in your system PATH
        </div>
      </div>

      {/* SIDE BY SIDE INPUT + OUTPUT */}
      <div style={{ display: "flex", gap: "1rem", flex: 1, minHeight: 0 }}>

        {/* LEFT — Input */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            color: "#dbe7f0",
            fontSize: "0.85rem",
            fontWeight: 500
          }}>
            📥 Input (stdin):
          </label>
          <textarea
            style={{
              width: "100%",
              flex: 1,
              fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
              padding: "0.875rem",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#e6eef6",
              fontSize: "0.85rem",
              resize: "none",
              transition: "all 0.3s ease"
            }}
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = "#667eea";
              e.target.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.2)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* RIGHT — Output */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <label style={{
            display: "block",
            marginBottom: "0.5rem",
            color: "#dbe7f0",
            fontSize: "0.85rem",
            fontWeight: 500
          }}>
            📤 Output:
          </label>
          <textarea
            ref={outputRef}
            readOnly
            style={{
              width: "100%",
              flex: 1,
              fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
              background: "#000",
              color: "#4ade80",
              padding: "0.875rem",
              borderRadius: "8px",
              fontSize: "0.85rem",
              border: "1px solid rgba(74, 222, 128, 0.2)",
              resize: "none"
            }}
          />
        </div>

      </div>
    </div>
  );
}
