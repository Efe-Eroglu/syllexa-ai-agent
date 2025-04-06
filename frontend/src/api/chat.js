import axios from "axios";
import { API_BASE_URL } from "../config";

const CHAT_URL = `${API_BASE_URL}/chats`;

export const fetchChats = async (token) => {
  const response = await axios.get(CHAT_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
