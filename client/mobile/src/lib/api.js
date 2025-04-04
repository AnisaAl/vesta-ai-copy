import axios from 'axios';

// For development, replace this with your actual server URL
// When running in Expo Go, you'll need to use your machine's IP address, not localhost
const API_URL = 'http://192.168.1.100:5000/api';  // Update this with your actual IP address

// Create an axios instance for API calls
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods
export const sendMessage = async (content, imageData = null) => {
  try {
    const response = await api.post('/chat', {
      message: content,
      imageData,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getChatHistories = async () => {
  try {
    const response = await api.get('/chat/histories');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat histories:', error);
    throw error;
  }
};

export const getChatHistory = async (id) => {
  try {
    const response = await api.get(`/chat/history/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching chat history ${id}:`, error);
    throw error;
  }
};

export const createChatHistory = async (messages) => {
  try {
    const response = await api.post('/chat/history', { messages });
    return response.data;
  } catch (error) {
    console.error('Error creating chat history:', error);
    throw error;
  }
};

export const updateChatHistory = async (id, messages) => {
  try {
    const response = await api.put(`/chat/history/${id}`, { messages });
    return response.data;
  } catch (error) {
    console.error(`Error updating chat history ${id}:`, error);
    throw error;
  }
};