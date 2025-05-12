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
  FiVolume2,
} from "react-icons/fi";
import { AiOutlineUser } from "react-icons/ai";
import { RiRobot2Line } from "react-icons/ri";
import "../styles/pages/chat.css";
import "../styles/components/tts-settings.css";
import { startRecording, stopRecording } from "../utils/useRecorder";
import { textToSpeech, playAudio } from "../utils/tts";
import { WS_BASE_URL } from "../config";
import { logoutUser } from "../api/auth";
import { notifySuccess, notifyError, notifyInfo } from "../utils/toast";
import axios from "axios";
import TTSSettings from "../components/TTSSettings";
import {
  fetchChats,
  createChat,
  deleteChat,
  sendMessage,
  getChatMessages,
  renameChat,
  uploadFile,
  getChatFiles,
} from "../api/chat";

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Merhaba! Ben Syllexa AI, disleksi dostu asistanın. Nasıl yardımcı olabilirim?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [chats, setChats] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTTSSettings, setShowTTSSettings] = useState(false);
  const [inputText, setInputText] = useState("");
  const [chatFiles, setChatFiles] = useState([]);
  const [selectedChatOptions, setSelectedChatOptions] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChatDetails, setSelectedChatDetails] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggleOptions = (chatId) => {
    setSelectedChatOptions((prev) => (prev === chatId ? null : chatId));
  };

  const handleShowDetails = async (chatId) => {
    const token = localStorage.getItem("access_token");
    const chat = chats.find((c) => c.id === chatId);
    setSelectedChatDetails(chat);
    setShowDetailsModal(true);
    setSelectedChatOptions(null);

    try {
      const files = await getChatFiles(chatId, token);
      setChatFiles(files);
    } catch (error) {
      notifyError("Sohbete ait dosyalar alınamadı.");
    }
  };

  const handleDeleteChat = async (chatId) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      try {
        console.log("Sohbet silme işlemi başlatıldı..."); // Loglama: Başlangıç

        // 1. API çağrısı yaparak sohbeti siliyoruz
        await deleteChat(chatId, token);

        console.log(`Sohbet başarıyla silindi: ${chatId}`); // Loglama: Başarı

        // 2. Sohbeti sohbet listesinden çıkarıyoruz
        const updatedChats = chats.filter((chat) => chat.id !== chatId);
        setChats(updatedChats);

        // 3. Kullanıcıya başarı mesajı gösteriyoruz
        notifyInfo("Sohbet başarıyla silindi.");
      } catch (error) {
        // 4. Hata durumu: Hata mesajını logluyoruz
        console.error("Sohbet silinirken hata oluştu:", error);
        notifyError("Sohbet silinirken bir hata oluştu.");
      }
    } else {
      console.log("Token bulunamadı!"); // Token yoksa loglama
      notifyError("Giriş yapmadınız. Lütfen giriş yapın.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (inputText.trim() === "") return;

    const token = localStorage.getItem("access_token");
    const chatId = selectedChatDetails?.id || chats[0]?.id;

    if (!chatId) {
      notifyError("Lütfen önce bir sohbet seçin.");
      return;
    }

    // Kullanıcı mesajını ekliyoruz
    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText(""); // Mesaj kutusunu sıfırlıyoruz

    try {
      // Backend'e mesajı gönderiyoruz ve yanıtı alıyoruz
      const response = await sendMessage(chatId, inputText, token);

      console.log("Backend'den alınan yanıt:", response); // Backend yanıtını logluyoruz

      // Backend'den dönen yanıtı kontrol ediyoruz
      const aiText = response.reply || "AI'dan yanıt alınamadı."; // Yanıtı kontrol et

      // Asistanın yanıtını mesajlar arasına ekliyoruz
      // auto_tts_flag ekleyelim ki useEffect'te bu mesajın otomatik seslendirilmesi gerektiğini bilelim
      const aiMessage = {
        id: messages.length + 2,
        text: aiText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        auto_tts_flag: true // Otomatik seslendirme için işaret
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Asistan yanıtını veritabanına göndermek için backend'e tekrar istek yapıyoruz
      await sendMessage(chatId, aiText, token, "ai");
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      notifyError("Mesaj gönderilemedi.");
    }
  };

  // TTS ile mesajı seslendir
  const speakMessage = async (text) => {
    const isTtsEnabled = localStorage.getItem("tts_enabled") !== "false";
    const apiKey = localStorage.getItem("elevenlabs_api_key");
    
    if (!isTtsEnabled || !apiKey) return;
    
    try {
      setIsSpeaking(true);
      const audioData = await textToSpeech(text, apiKey);
      playAudio(audioData);
    } catch (error) {
      console.error("Ses sentezleme hatası:", error);
      
      // Sessiz hata - kullanıcıya bildirim göstermiyoruz (otomatik konuşma için)
      if (error.message.includes('404')) {
        console.warn("Ses bulunamadı. Varsayılan ses kullanılacak.");
      } else if (error.message.includes('401') || error.message.includes('403')) {
        notifyError("API anahtarı geçersiz. Lütfen ayarları kontrol edin.");
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  // Belirli bir mesajı seslendir
  const speakSpecificMessage = async (messageText) => {
    const apiKey = localStorage.getItem('elevenlabs_api_key');
    if (!apiKey) {
      notifyError("Lütfen Eleven Labs API anahtarını ayarlarda tanımlayın.");
      setShowTTSSettings(true);
      return;
    }
    
    try {
      setIsSpeaking(true);
      
      const audioData = await textToSpeech(messageText, apiKey);
      playAudio(audioData);
      
      notifySuccess("Sesli yanıt başarıyla oluşturuldu");
    } catch (error) {
      console.error("Ses sentezleme hatası:", error);
      
      // Daha açıklayıcı hata mesajları
      if (error.message.includes('404')) {
        notifyError("Ses bulunamadı. Varsayılan ses kullanılacak.");
      } else if (error.message.includes('401') || error.message.includes('403')) {
        notifyError("API anahtarı geçersiz. Lütfen doğru API anahtarını girin.");
        setShowTTSSettings(true);
      } else {
        notifyError("Ses oluşturulamadı: " + error.message);
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  const handleNewChat = async () => {
    // 1. Token'ı kontrol edelim
    const token = localStorage.getItem("access_token");
    console.log("Token kontrolü: ", token);

    if (token) {
      try {
        // 2. Yeni sohbet başlığını ayarlıyoruz
        const chatTitle = `Yeni Sohbet ${chats.length + 1}`;
        console.log("Yeni sohbet başlığı: ", chatTitle);

        // 3. createChat fonksiyonunu çağırıyoruz
        console.log("createChat çağrıldı...");
        const newChat = await createChat(chatTitle, token);
        console.log("Yeni sohbet başarıyla oluşturuldu:", newChat);

        // 4. Yeni sohbeti ekliyoruz
        setChats([...chats, newChat]);
        setInputText(""); // Inputu sıfırlıyoruz
        console.log("Sohbetler güncellendi: ", chats);
      } catch (error) {
        // 5. Hata durumunu logluyoruz
        console.error("Sohbet oluşturulurken hata oluştu:", error);
        notifyError("Sohbet oluşturulurken bir hata oluştu.");
      }
    } else {
      console.log("Token bulunamadı!");
      notifyError("Giriş yapmadınız. Lütfen giriş yapın.");
    }
  };

  const handleRenameChat = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };

  const submitRenameChat = async () => {
    const token = localStorage.getItem("access_token");

    if (!editingTitle || editingTitle.trim() === "") {
      notifyError("Geçerli bir isim girilmedi.");
      return;
    }

    try {
      await renameChat(editingChatId, editingTitle, token); // 👈 direkt chat.js fonksiyonunu çağırıyoruz

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === editingChatId ? { ...chat, title: editingTitle } : chat
        )
      );

      notifySuccess("Sohbet ismi güncellendi.");
    } catch (error) {
      console.error("İsim güncellenirken hata oluştu:", error);
      notifyError("Sohbet ismi değiştirilemedi.");
    } finally {
      setEditingChatId(null);
      setEditingTitle("");
    }
  };

  const handleRenameKeyPress = (e) => {
    if (e.key === "Enter") {
      submitRenameChat();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const token = localStorage.getItem("access_token");
    const chatId = selectedChatDetails?.id || chats[0]?.id;

    if (!file || !chatId || !token) {
      notifyError("Dosya yüklenemedi. Lütfen geçerli bir sohbet seçin.");
      return;
    }

    try {
      await uploadFile(chatId, file, token);

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
    } catch (error) {
      console.error("Dosya yüklenirken hata oluştu:", error);
      notifyError("Dosya yüklenemedi.");
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
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token"); // Token'ı yerel depolamadan alıyoruz
    console.log("Token:", token); // Loglama: Token alındı
    if (token) {
      fetchChats(token)
        .then((data) => {
          console.log("Alınan sohbetler:", data); // Loglama: Sohbet verisi alındı
          setChats(data); // API'den gelen sohbetleri state'e kaydediyoruz
        })
        .catch((error) => {
          console.error("Sohbetler alınırken bir hata oluştu:", error); // Loglama: Hata
        });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (selectedChatDetails && token) {
      getChatMessages(selectedChatDetails.id, token)
        .then((data) => {
          const formattedMessages = data.map((msg, i) => ({
            id: i + 1,
            text: msg.message,
            isUser: msg.role === "student",
            timestamp: msg.timestamp || new Date().toLocaleTimeString(),
          }));
          setMessages(formattedMessages);
          
          // Bu mesajlar ilk yüklendiğinde otomatik seslendirmiyoruz
          // Son AI mesajını otomatik olarak SESLENDIRME
          // Kullanıcı ses düğmesine basarak dinleyebilir
        })
        .catch((error) => {
          console.error("Mesajlar yüklenirken hata:", error);
          notifyError("Sohbet geçmişi alınamadı.");
        });
    }
  }, [selectedChatDetails]);
  
  // Mesajlar değiştiğinde otomatik seslendirme
  useEffect(() => {
    // Mesajlar dizisi boş değilse ve en az bir mesaj varsa
    if (messages.length > 0) {
      // Son mesajı al
      const lastMessage = messages[messages.length - 1];
      
      // Eğer son mesaj asistandan geldiyse (isUser=false) ve auto_tts_flag varsa seslendir
      if (!lastMessage.isUser && !lastMessage.file && lastMessage.auto_tts_flag) {
        // auto_tts_flag'i silelim ki bu mesaj bir daha seslendirilmesin
        lastMessage.auto_tts_flag = false;
        
        // Otomatik seslendirme için kullanıcı ayarlarını kontrol et
        const isTtsEnabled = localStorage.getItem("tts_enabled") !== "false";
        const isAutoTtsEnabled = localStorage.getItem("auto_tts_enabled") !== "false";
        
        if (isTtsEnabled && isAutoTtsEnabled) {
          // Mesaj görüntülendikten sonra seslendirmeyi başlat (kısa bir gecikmeyle)
          setTimeout(() => {
            speakMessage(lastMessage.text);
          }, 300);
        }
      }
    }
  }, [messages]); // Mesajlar değiştiğinde bu efekti çalıştır

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
              <div
                key={chat.id}
                className={`chat-item ${
                  selectedChatDetails?.id === chat.id ? "active" : ""
                }`}
              >
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={submitRenameChat}
                    onKeyDown={handleRenameKeyPress}
                    autoFocus
                    className="rename-input"
                  />
                ) : (
                  <span onClick={() => setSelectedChatDetails(chat)}>
                    {chat.title}
                  </span>
                )}

                <div className="chat-options-wrapper">
                  <button
                    className="chat-options-button"
                    onClick={() => handleToggleOptions(chat.id)}
                  >
                    ⋮
                  </button>

                  {selectedChatOptions === chat.id && (
                    <div className="chat-options-menu">
                      <button
                        onClick={() => {
                          handleShowDetails(chat.id);
                          setSelectedChatOptions(null); // 👈 menüyü kapat
                        }}
                      >
                        Detaylar
                      </button>

                      <button
                        onClick={() => {
                          handleRenameChat(chat.id, chat.title);
                          setSelectedChatOptions(null); // 👈 menüyü kapat
                        }}
                      >
                        İsim Değiştir
                      </button>

                      <button
                        onClick={() => {
                          handleDeleteChat(chat.id);
                          setSelectedChatOptions(null); // 👈 menüyü kapat
                        }}
                      >
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
                {!message.isUser && !message.file && (
                  <button 
                    className={`speak-button ${isSpeaking ? 'speaking' : ''}`} 
                    onClick={() => speakSpecificMessage(message.text)}
                    disabled={isSpeaking}
                  >
                    <FiVolume2 />
                  </button>
                )}
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
                {chatFiles.length > 0 ? (
                  chatFiles.map((file, index) => (
                    <div className="file-card" key={index}>
                      <div className="file-card-header">
                        <FiFile className="file-icon" />
                        <div className="file-name">{file.original_name}</div>
                      </div>
                      <div className="file-info">
                        <span>
                          <strong>Tür:</strong> {file.mimetype || "bilinmiyor"}
                        </span>
                        <span>
                          <strong>Boyut:</strong>{" "}
                          {file.size
                            ? `${(file.size / 1024).toFixed(1)} KB`
                            : "?"}
                        </span>
                        <span>
                          <strong>Yüklenme:</strong> {file.uploaded_at}
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
                className="modern-btn"
                onClick={() => setShowTTSSettings(true)}
              >
                <FiVolume2 className="btn-icon" />
                Ses Sentezi Ayarları
              </button>

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

      {showTTSSettings && (
        <div
          className="modern-modal-overlay"
          onClick={() => setShowTTSSettings(false)}
        >
          <div className="modern-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FiVolume2 className="icon" />
                Ses Ayarları
              </h2>

              <button
                className="icon-btn"
                onClick={() => setShowTTSSettings(false)}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="modern-modal-content">
              <TTSSettings onClose={() => setShowTTSSettings(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
