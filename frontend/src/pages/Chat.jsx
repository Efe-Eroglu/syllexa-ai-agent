import React, { useEffect, useState } from "react";
import {
  FiSend,
  FiMenu,
  FiPlus,
  FiMic,
  FiFile,
  FiSettings,
  FiTrash2,
  FiLogOut,
  FiX,
} from "react-icons/fi";
import { AiOutlineUser } from "react-icons/ai";
import { RiRobot2Line } from "react-icons/ri";
import "../styles/pages/chat.css";
import { startRecording, stopRecording } from "../utils/useRecorder";
import { WS_BASE_URL } from "../config";
import { logoutUser } from "../api/auth";
import { notifySuccess, notifyError, notifyInfo } from "../utils/toast";

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Merhaba! Ben Syllexa AI, disleksi dostu asistanın. Nasıl yardımcı olabilirim?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [chats, setChats] = useState([
    { id: 1, title: "Disleksi Hakkında" },
    { id: 2, title: "Ödev Yardımı" },
  ]);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [inputText, setInputText] = useState("");
  const [selectedChatOptions, setSelectedChatOptions] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChatDetails, setSelectedChatDetails] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleOptions = (chatId) => {
    setSelectedChatOptions((prev) => (prev === chatId ? null : chatId));
  };

  const handleShowDetails = (chatId) => {
    const chat = chats.find((c) => c.id === chatId);
    setSelectedChatDetails(chat);
    setShowDetailsModal(true);
    setSelectedChatOptions(null);
  };

  const handleDeleteChat = (chatId) => {
    const updatedChats = chats.filter((chat) => chat.id !== chatId);
    setChats(updatedChats);
    setSelectedChatOptions(null);
    notifyInfo("Sohbet silindi.");
  };

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
        uploadedAt: new Date().toLocaleString(),
        fileSize: file.size,
        fileType: file.type,
      };
      setMessages([...messages, newMessage]);
      notifySuccess("Dosya başarıyla yüklendi!");
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      await startRecording();
    } else {
      setIsRecording(false);
      const wavBlob = await stopRecording();

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

  const handleLogout = async () => {
    await logoutUser();
    notifySuccess("Çıkış yapıldı.");
  };

  return (
    <>
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
                <span>{chat.title}</span>
                <div className="chat-options-wrapper">
                  <button
                    className="chat-options-button"
                    onClick={() => handleToggleOptions(chat.id)}
                  >
                    ⋮
                  </button>
                  {selectedChatOptions === chat.id && (
                    <div className="chat-options-menu">
                      <button onClick={() => handleShowDetails(chat.id)}>
                        Detaylar
                      </button>
                      <button onClick={() => handleDeleteChat(chat.id)}>
                        Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="menu-footer">
            <button
              className="settings-button"
              onClick={() => setShowSettingsModal(true)}
            >
              <FiSettings className="icon" />
              <span className="text">Ayarlar</span>
            </button>
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

      {showDetailsModal && selectedChatDetails && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailsModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedChatDetails.title} – Detaylar</h3>
            <div className="modal-section">
              <h4>Yüklenen Dosyalar:</h4>
              <div className="file-card-grid">
                {messages.filter((msg) => msg.file).length > 0 ? (
                  messages
                    .filter((msg) => msg.file)
                    .map((msg, index) => (
                      <div className="file-card" key={index}>
                        <div className="file-card-header">
                          <FiFile className="file-icon" />
                          <div className="file-name">{msg.file.name}</div>
                        </div>
                        <div className="file-info">
                          <span>
                            <strong>Tür:</strong> {msg.fileType || "bilinmiyor"}
                          </span>
                          <span>
                            <strong>Boyut:</strong>{" "}
                            {msg.fileSize
                              ? (msg.fileSize / 1024).toFixed(1) + " KB"
                              : "?"}
                          </span>
                          <span>
                            <strong>Yüklenme:</strong>{" "}
                            {msg.uploadedAt || msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="no-files">
                    <p>📁 Henüz bu sohbette dosya yüklenmemiş.</p>
                  </div>
                )}
              </div>
            </div>

            <button
              className="modal-close-button"
              onClick={() => setShowDetailsModal(false)}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div
          className="modern-modal-overlay"
          onClick={() => setShowSettingsModal(false)}
        >
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FiSettings className="icon" />
                Ayarlar
              </h2>

              <button
                className="icon-btn"
                onClick={() => setShowSettingsModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="modern-modal-content">
              <button
                className="modern-btn danger"
                onClick={() => {
                  setMessages([]);
                  setChats([]);
                  setShowSettingsModal(false);
                  notifyInfo("Tüm sohbetler silindi.");
                }}
              >
                <FiTrash2 className="btn-icon" />
                Tüm Sohbetleri Sil
              </button>

              <button className="modern-btn outline" onClick={handleLogout}>
                <FiLogOut className="btn-icon" />
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
