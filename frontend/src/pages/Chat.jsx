import React, { useState } from "react";
import { FiSend, FiMenu, FiPlus, FiMic, FiFile } from "react-icons/fi";
import { AiOutlineUser } from "react-icons/ai";
import { RiRobot2Line } from "react-icons/ri";
import "../styles/pages/chat.css";
import { startRecording, stopRecording } from "../utils/useRecorder";
import { WS_BASE_URL } from "../config";

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Merhaba! Ben Syllexa AI, disleksi dostu asistanın. Nasıl yardımcı olabilirim?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [chats, setChats] = useState([
    { id: 1, title: "Disleksi Hakkında" },
    { id: 2, title: "Ödev Yardımı" },
  ]);
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages([...messages, newMessage]);
    setInputText("");

    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "Bu konuda size yardımcı olabilirim. Lütfen biraz daha detay verebilir misiniz?",
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleNewChat = () => {
    const newChat = {
      id: chats.length + 1,
      title: `Yeni Sohbet ${chats.length + 1}`,
    };
    setChats([...chats, newChat]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newMessage = {
        id: messages.length + 1,
        text: `Belge yüklendi: ${file.name}`,
        isUser: true,
        timestamp: new Date().toLocaleTimeString(),
        file,
      };
      setMessages([...messages, newMessage]);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      await startRecording(); // Başlat
    } else {
      setIsRecording(false);
      const wavBlob = await stopRecording(); // Bitir

      // WebSocket ile gönder
      const ws = new WebSocket(`${WS_BASE_URL}/speech`);
      ws.onopen = () => {
        ws.send(wavBlob);
      };

      ws.onmessage = (event) => {
        const text = event.data.trim();
        if (text) {
          const newMessage = {
            id: messages.length + 1,
            text: text,
            isUser: true,
            timestamp: new Date().toLocaleTimeString(),
          };
          setMessages((prev) => [...prev, newMessage]);
        }
      };
    }
  };

  return (
    <div className="chat-container">
      <div className={`side-menu ${isMenuOpen ? "open" : ""}`}>
        <div className="menu-header">
          <h3>Sohbetler</h3>
          <button className="new-chat-button" onClick={handleNewChat}>
            <FiPlus />
          </button>
        </div>

        <div className="chat-list">
          {chats.map((chat) => (
            <div key={chat.id} className="chat-item">
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-chat-area">
        <div className="chat-header">
          <button
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <FiMenu />
          </button>
          <div className="chat-header-content">
            <RiRobot2Line className="chat-header-icon" />
            <h2>Syllexa AI</h2>
            <span className="chat-status">Çevrimiçi</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isUser ? "user" : "ai"}`}
            >
              <div className="message-avatar">
                {message.isUser ? <AiOutlineUser /> : <RiRobot2Line />}
              </div>
              <div className="message-content">
                {message.file ? (
                  <div className="file-message">
                    <FiFile className="file-icon" />
                    <span>{message.text}</span>
                  </div>
                ) : (
                  <div className="message-text">{message.text}</div>
                )}
                <div className="message-timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}
        </div>

        <form className="chat-input-area" onSubmit={handleSend}>
          <div className="input-actions">
            <label className="file-upload-button">
              <input
                type="file"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <FiFile />
            </label>
            <button
              type="button"
              className={`record-button ${isRecording ? "recording" : ""}`}
              onClick={toggleRecording}
            >
              <FiMic />
            </button>
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Syllexa AI'ya bir şeyler sor..."
            className="chat-input"
          />

          <button type="submit" className="send-button">
            <FiSend />
          </button>
        </form>
      </div>
    </div>
  );
}
