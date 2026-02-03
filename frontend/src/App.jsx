import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import RunPanel from "./components/RunPanel";
import AIAssistant from "./components/AIAssistant";

const socket = io("https://code-editor-8eh5.onrender.com");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("# start code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is Typing`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("# start code here");
    setLanguage("python");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🚀</span>
            <h2>Room: {roomId}</h2>
          </div>
          <button onClick={copyRoomId} className="copy-button">
            📋 Copy Room ID
          </button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <div>
          <h3>👥 Users in Room ({users.length})</h3>
          {users.length === 0 ? (
            <p style={{ fontSize: "0.85rem", opacity: 0.6, marginTop: "0.5rem" }}>No other users yet</p>
          ) : (
            <ul>
              {users.map((user, index) => (
                <li key={index}>
                  <span style={{ marginRight: "0.5rem" }}>👤</span>
                  {user.slice(0, 12)}
                  {user.length > 12 && "..."}
                </li>
              ))}
            </ul>
          )}
        </div>
        {typing && <p className="typing-indicator">⌨️ {typing}</p>}
        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
        </select>
        <button className="leave-button" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="editor-wrapper">
        {/* top area: Monaco editor */}
        <div className="editor-top">
          <Editor
            height={"100%"}
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
            }}
          />
        </div>

        {/* bottom area: run panel */}
        <div className="run-panel">
          <RunPanel code={code} setCode={(newCode) => setCode(newCode)} />
        </div>
      </div>

      <div className="sidebar-right">
        <div style={{ marginTop: 12 }}>
          <AIAssistant editorCode={code} language={language} />
        </div>
      </div>
    </div>
  );
};

export default App;
