import axios from "axios";
import { API_BASE_URL } from "../config";

const CHAT_URL = `${API_BASE_URL}/chats`;

// 🎯 [1] Sohbet listesini al
export const fetchChats = async (token) => {
  try {
    const response = await axios.get(`${CHAT_URL}/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Sohbetler alınırken hata oluştu:", error);
    throw error;
  }
};

// 🎯 [2] Yeni sohbet oluştur
export const createChat = async (chatTitle, token) => {
  try {
    const response = await axios.post(
      `${CHAT_URL}/create`,
      { title: chatTitle },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Sohbet oluşturulurken hata oluştu:", error);
    throw error;
  }
};

// 🎯 [3] Sohbet sil
export const deleteChat = async (chatId, token) => {
  try {
    const response = await axios.delete(`${CHAT_URL}/${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Sohbet silinirken hata oluştu:", error);
    throw error;
  }
};

// 🎯 [4] Mesaj gönder
export const sendMessage = async (chatId, message, token) => {
  try {
    const response = await axios.post(
      `${CHAT_URL}/send`,
      {
        chat_id: chatId,
        role: "student",
        message: message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Mesaj gönderilirken hata oluştu:", error);
    throw error;
  }
};

// 🎯 [5] Sohbetin mesajlarını getir
export const getChatMessages = async (chatId, token) => {
  try {
    const response = await axios.get(`${CHAT_URL}/${chatId}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Mesajlar alınırken hata oluştu:", error);
    throw error;
  }
};

// 📤 [6] Dosya yükle (chat'e ait)
export const uploadFile = async (chatId, file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(
      `${CHAT_URL}/${chatId}/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // FormData için içerik tipi belirtelim
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Dosya yüklenirken hata oluştu:", error);
    throw error;
  }
};

// 📦 [7] Sohbete ait dosyaları getir
export const getChatFiles = async (chatId, token) => {
  try {
    const response = await axios.get(`${CHAT_URL}/chat_files/${chatId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Dosyalar alınırken hata oluştu:", error);
    throw error;
  }
};

// ❌ [8] Dosya sil
export const deleteFile = async (fileId, token) => {
  try {
    const response = await axios.delete(`${CHAT_URL}/chat_files/${fileId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Dosya silinirken hata oluştu:", error);
    throw error;
  }
};

// ✏️ [9] Sohbet ismini değiştir
export const renameChat = async (chatId, newTitle, token) => {
  try {
    const response = await axios.put(
      `${CHAT_URL}/${chatId}/rename`,
      { title: newTitle }, // Sohbet ismini yeni başlık ile gönderiyoruz
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Sohbet ismi değiştirilirken hata oluştu:", error);
    throw error;
  }
};

// [10] Sohbet istatistiklerini getir
export const getChatStats = async (chatId, token) => {
  try {
    const response = await axios.get(`${CHAT_URL}/${chatId}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Sohbet istatistikleri alınırken hata oluştu:", error);
    throw error;
  }
};

// [11] Sohbet Geçmişini getir
export const getChatHistory = async (chatId, token) => {
  try {
    const response = await axios.get(`${CHAT_URL}/${chatId}/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Sohbet geçmişi alınırken hata oluştu:", error);
    throw error;
  }
};

// [12] Sohbet Sabitleme
export const pinChat = async (chatId, token) => {
  try {
    const response = await axios.post(
      `${CHAT_URL}/${chatId}/pin`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Sohbet sabitlenirken hata oluştu:", error);
    throw error;
  }
};

// [13] Sabitlenmiş Sohbetleri Getir
export const getPinnedChats = async (token) => {
  try {
    const response = await axios.get(`${CHAT_URL}/pinned`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Sabitlenmiş sohbetler alınırken hata oluştu:", error);
    throw error;
  }
};
