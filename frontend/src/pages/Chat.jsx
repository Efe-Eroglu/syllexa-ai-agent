import React, { useEffect, useState, useRef } from "react";
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
import { startRecording, stopRecording, createVolumeAnalyzer } from "../utils/useRecorder";
import { textToSpeech, playAudio } from "../utils/tts";
import { useEnhancedSpeechRecognition } from "../utils/useSpeechRecognition";
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

// Add this at the top level, outside any component or function
let lastSpokenText = "";
let lastSpokenTime = 0;
const MIN_SPEAK_INTERVAL = 2000; // minimum time between identical messages in ms

export default function Chat() {
  const [messages, setMessages] = useState([]);

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
  const [recognitionText, setRecognitionText] = useState("");
  const [recognitionInstance, setRecognitionInstance] = useState(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const volumeAnalyzerRef = React.useRef(null);
  const messagesEndRef = useRef(null);
  const spokenMessagesRef = useRef(new Set());

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
        console.log("Sohbet silme işlemi başlatıldı...");

        await deleteChat(chatId, token);

        console.log(`Sohbet başarıyla silindi: ${chatId}`);

        const updatedChats = chats.filter((chat) => chat.id !== chatId);
        setChats(updatedChats);

        if (selectedChatDetails && selectedChatDetails.id === chatId) {
          if (updatedChats.length > 0) {
            const sortedChats = [...updatedChats].sort((a, b) => {
              const dateA = a.updated_at || a.created_at || 0;
              const dateB = b.updated_at || b.created_at || 0;
              return new Date(dateB) - new Date(dateA);
            });
            
            const newSelectedChat = sortedChats[0];
            setSelectedChatDetails(newSelectedChat);
            
            getChatMessages(newSelectedChat.id, token)
              .then((messages) => {
                const formattedMessages = messages.map((msg, i) => ({
                  id: i + 1,
                  text: msg.message,
                  isUser: msg.role === "student",
                  timestamp: msg.timestamp || new Date().toLocaleTimeString(),
                }));
                setMessages(formattedMessages);
              })
              .catch((error) => {
                console.error("Mesajlar yüklenirken hata:", error);
              });
          } else {
            setSelectedChatDetails(null);
            setMessages([
              {
                id: 1,
                text: "Merhaba! Ben Syllexa AI, disleksi dostu asistanın. Nasıl yardımcı olabilirim?",
                isUser: false,
                timestamp: new Date().toLocaleTimeString(),
                auto_tts_flag: true
              },
            ]);
          }
        }

        notifyInfo("Sohbet başarıyla silindi.");
      } catch (error) {
        console.error("Sohbet silinirken hata oluştu:", error);
        notifyError("Sohbet silinirken bir hata oluştu.");
      }
    } else {
      console.log("Token bulunamadı!");
      notifyError("Giriş yapmadınız. Lütfen giriş yapın.");
    }
  };

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
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

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    
    setTimeout(() => scrollToBottom(), 100);

    try {
      const response = await sendMessage(chatId, inputText, token);

      console.log("Backend'den alınan yanıt:", response);

      const aiText = response.reply || "AI'dan yanıt alınamadı.";

      const aiMessage = {
        id: messages.length + 2,
        text: aiText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        auto_tts_flag: true
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      setTimeout(() => scrollToBottom(), 100);

      await sendMessage(chatId, aiText, token, "ai");
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      notifyError("Mesaj gönderilemedi.");
    }
  };

  const speakMessage = async (text) => {
    // Check if this exact text was spoken recently
    const now = Date.now();
    if (text === lastSpokenText && now - lastSpokenTime < MIN_SPEAK_INTERVAL) {
      console.log("Preventing duplicate speech", text);
      return;
    }
    
    // Update the last spoken tracking
    lastSpokenText = text;
    lastSpokenTime = now;
    
    // Get the API key
    const apiKey = localStorage.getItem("elevenlabs_api_key");
    
    if (!apiKey) {
      notifyError("Lütfen Eleven Labs API anahtarını ayarlarda tanımlayın.");
      setShowTTSSettings(true);
      return;
    }
    
    try {
      setIsSpeaking(true);
      console.log("Speaking:", text);
      const audioData = await textToSpeech(text, apiKey);
      await playAudio(audioData);
    } catch (error) {
      console.error("Ses sentezleme hatası:", error);
      
      if (error.message.includes('404')) {
        console.warn("Ses bulunamadı. Varsayılan ses kullanılacak.");
        notifyError("Ses bulunamadı. Lütfen ses ayarlarınızı kontrol edin.");
        setShowTTSSettings(true);
      } else if (error.message.includes('401') || error.message.includes('403')) {
        notifyError("API anahtarı geçersiz. Lütfen ayarları kontrol edin.");
        setShowTTSSettings(true);
      }
    } finally {
      setIsSpeaking(false);
    }
  };

  const speakSpecificMessage = async (messageText) => {
    // Check if this exact text was spoken recently
    const now = Date.now();
    if (messageText === lastSpokenText && now - lastSpokenTime < MIN_SPEAK_INTERVAL) {
      console.log("Preventing duplicate specific speech", messageText);
      return;
    }
    
    // Update the last spoken tracking
    lastSpokenText = messageText;
    lastSpokenTime = now;
    
    const apiKey = localStorage.getItem('elevenlabs_api_key');
    if (!apiKey) {
      notifyError("Lütfen Eleven Labs API anahtarını ayarlarda tanımlayın.");
      setShowTTSSettings(true);
      return;
    }
    
    try {
      setIsSpeaking(true);
      console.log("Speaking specific:", messageText);
      
      const audioData = await textToSpeech(messageText, apiKey);
      await playAudio(audioData);
      
    } catch (error) {
      console.error("Ses sentezleme hatası:", error);
      
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
    const token = localStorage.getItem("access_token");
    console.log("Token kontrolü: ", token);

    if (token) {
      try {
        const chatTitle = `Yeni Sohbet ${chats.length + 1}`;
        console.log("Yeni sohbet başlığı: ", chatTitle);

        console.log("createChat çağrıldı...");
        const newChat = await createChat(chatTitle, token);
        console.log("Yeni sohbet başarıyla oluşturuldu:", newChat);

        setChats((prevChats) => [...prevChats, newChat]);
        setSelectedChatDetails(newChat);
        
        // Reset spoken messages when creating a new chat
        spokenMessagesRef.current = new Set();
        
        setMessages([
          {
            id: 1,
            text: "Merhaba! Ben Syllexa AI, disleksi dostu asistanın. Nasıl yardımcı olabilirim?",
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
            auto_tts_flag: true
          },
        ]);
        
        setInputText("");
        notifySuccess("Yeni sohbet oluşturuldu");
      } catch (error) {
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
      await renameChat(editingChatId, editingTitle, token);

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

  const handleRecognitionResult = (text, isFinal) => {
    setRecognitionText(text);
  };

  const handleRecognitionError = (error) => {
    console.error("Konuşma tanıma hatası:", error);
    notifyError(error);
    setIsRecording(false);
  };

  const handleFinalRecognition = (finalText) => {
    if (finalText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: finalText,
        isUser: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setMessages((prev) => [...prev, newMessage]);
      
      sendMessageToServer(finalText);
    }
    
    setRecognitionText("");
  };

  const sendMessageToServer = async (text) => {
    const token = localStorage.getItem("access_token");
    const chatId = selectedChatDetails?.id || chats[0]?.id;

    if (!chatId) {
      notifyError("Lütfen önce bir sohbet seçin.");
      return;
    }

    try {
      const response = await sendMessage(chatId, text, token);

      console.log("Backend'den alınan yanıt:", response);

      const aiText = response.reply || "AI'dan yanıt alınamadı.";

      const aiMessage = {
        id: messages.length + 2,
        text: aiText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        auto_tts_flag: true
      };

      setMessages((prev) => [...prev, aiMessage]);
      
      setTimeout(() => scrollToBottom(), 100);

      await sendMessage(chatId, aiText, token, "ai");
    } catch (error) {
      console.error("Mesaj gönderme hatası:", error);
      notifyError("Mesaj gönderilemedi.");
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecognitionText("");
      
      const recordingStarted = await startRecording({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100,
      });
      
      if (!recordingStarted) {
        notifyError("Mikrofon erişimi sağlanamadı.");
        setIsRecording(false);
        return;
      }
      
      volumeAnalyzerRef.current = createVolumeAnalyzer((level) => {
        setVolumeLevel(level);
      });
      
      const speechRecognition = useEnhancedSpeechRecognition(
        (text, isFinal) => {
          setRecognitionText(text);
          console.log(`Tanıma: "${text}" ${isFinal ? '(Final)' : '(Ara)'}`);
          
          if (text.length > 0) {
            setTimeout(() => scrollToBottom(), 50);
          }
        },
        (error) => {
          console.error("Konuşma tanıma hatası:", error);
          notifyError(error);
          setIsRecording(false);
        },
        (finalText) => {
          if (finalText && finalText.trim().length > 0) {
            console.log(`Final tanıma: "${finalText}"`);
            
            const newMessage = {
              id: messages.length + 1,
              text: finalText,
              isUser: true,
              timestamp: new Date().toLocaleTimeString(),
            };
            
            setMessages((prev) => [...prev, newMessage]);
            
            sendMessageToServer(finalText);
            
            stopRecording();
            setIsRecording(false);
            setRecognitionInstance(null);
            setRecognitionText("");
            
            setTimeout(() => scrollToBottom(), 100);
          }
        },
        {
          confidenceThreshold: 0.5,
          autoStopTimeout: 3000,
        }
      );
      
      const started = speechRecognition.startListening();
      
      if (started) {
        setRecognitionInstance(speechRecognition);
        notifyInfo("Konuşma tanıma başladı. Konuşunuz...");
      } else {
        stopRecording();
        setIsRecording(false);
        notifyError("Konuşma tanıma başlatılamadı");
      }
    } else {
      setIsRecording(false);
      
      if (recognitionInstance) {
        if (recognitionText.trim()) {
          handleFinalRecognition(recognitionText.trim());
        }
        
        recognitionInstance.stopListening();
        setRecognitionInstance(null);
      }
      
      if (volumeAnalyzerRef.current) {
        volumeAnalyzerRef.current();
        volumeAnalyzerRef.current = null;
      }
      setVolumeLevel(0);
      
      await stopRecording();
      setRecognitionText("");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    console.log("Token:", token);
    if (token) {
      fetchChats(token)
        .then((data) => {
          console.log("Alınan sohbetler:", data);
          setChats(data);
          
          if (data && data.length > 0) {
            const sortedChats = [...data].sort((a, b) => {
              const dateA = a.updated_at || a.created_at || 0;
              const dateB = b.updated_at || b.created_at || 0;
              return new Date(dateB) - new Date(dateA);
            });
            
            const mostRecentChat = sortedChats[0];
            console.log("En son sohbet otomatik olarak açıldı:", mostRecentChat.title);
            setSelectedChatDetails(mostRecentChat);
            
            // Reset spoken messages when loading initial messages
            spokenMessagesRef.current = new Set();
            
            getChatMessages(mostRecentChat.id, token)
              .then((messages) => {
                const formattedMessages = messages.map((msg, i) => ({
                  id: i + 1,
                  text: msg.message,
                  isUser: msg.role === "student",
                  timestamp: msg.timestamp || new Date().toLocaleTimeString(),
                }));
                setMessages(formattedMessages);
              })
              .catch((error) => {
                console.error("Son sohbetin mesajları yüklenirken hata:", error);
              });
          } else {
            // Reset spoken messages when setting welcome message
            spokenMessagesRef.current = new Set();
            
            setMessages([
              {
                id: 1,
                text: "Merhaba! Ben Syllexa AI, disleksi dostu asistanın. Nasıl yardımcı olabilirim?",
                isUser: false,
                timestamp: new Date().toLocaleTimeString(),
                auto_tts_flag: true
              },
            ]);
          }
        })
        .catch((error) => {
          console.error("Sohbetler alınırken bir hata oluştu:", error);
        });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (selectedChatDetails && token) {
      // Reset spoken messages when switching chats
      spokenMessagesRef.current = new Set();
      
      getChatMessages(selectedChatDetails.id, token)
        .then((data) => {
          const formattedMessages = data.map((msg, i) => ({
            id: i + 1,
            text: msg.message,
            isUser: msg.role === "student",
            timestamp: msg.timestamp || new Date().toLocaleTimeString(),
            auto_tts_flag: false
          }));
          
          setMessages(formattedMessages);
          
          setTimeout(() => scrollToBottom(false), 150);
        })
        .catch((error) => {
          console.error("Mesajlar yüklenirken hata:", error);
          notifyError("Sohbet geçmişi alınamadı.");
        });
    }
  }, [selectedChatDetails]);
  
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage.isUser && !lastMessage.file && lastMessage.auto_tts_flag && 
          localStorage.getItem("auto_tts_enabled") === "true" && 
          !spokenMessagesRef.current.has(lastMessage.id)) {
        
        lastMessage.auto_tts_flag = false;
        spokenMessagesRef.current.add(lastMessage.id);
        
        setTimeout(() => {
          speakMessage(lastMessage.text);
        }, 300);
      }
      
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (volumeAnalyzerRef.current) {
        volumeAnalyzerRef.current();
        volumeAnalyzerRef.current = null;
      }
      
      if (recognitionInstance) {
        recognitionInstance.stopListening();
      }
      stopRecording();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [messages.length]);

  useEffect(() => {
    if (localStorage.getItem("tts_enabled") === null) {
      localStorage.setItem("tts_enabled", "true");
    }
    if (localStorage.getItem("auto_tts_enabled") === null) {
      localStorage.setItem("auto_tts_enabled", "true");
    }
  }, []);

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
                          setSelectedChatOptions(null);
                        }}
                      >
                        Detaylar
                      </button>

                      <button
                        onClick={() => {
                          handleRenameChat(chat.id, chat.title);
                          setSelectedChatOptions(null);
                        }}
                      >
                        İsim Değiştir
                      </button>

                      <button
                        onClick={() => {
                          handleDeleteChat(chat.id);
                          setSelectedChatOptions(null);
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
            
            {isRecording && recognitionText && (
              <div className="message user recording-message">
                <div className="message-avatar">
                  <AiOutlineUser />
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {recognitionText}
                    <span className="recording-indicator"></span>
                  </div>
                  <div className="volume-meter-container">
                    <div 
                      className="volume-meter" 
                      style={{ width: `${volumeLevel}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Invisible element to scroll to */}
            <div ref={messagesEndRef} className="scroll-anchor" />
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
                title={isRecording ? "Kaydı Durdur" : "Sesli Mesaj Gönder"}
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
