import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';
import { Appbar, TextInput, Button, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { nanoid } from 'nanoid/non-secure';

import { sendMessage } from '../lib/api';
import { MESSAGE_ROLES } from '../lib/types';
import ChatBubble from '../components/ChatBubble';

const HomeScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  // Add a welcome message when the component mounts
  useEffect(() => {
    const welcomeMessage = {
      id: nanoid(),
      content: "Hello! I'm your fashion assistant. Ask me anything about style, trends, or upload a photo for personalized advice!",
      role: MESSAGE_ROLES.ASSISTANT,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  // Pick an image from the gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0]);
    }
  };

  // Convert image file to base64 data
  const imageToBase64 = (imageAsset) => {
    if (!imageAsset || !imageAsset.base64) return null;
    return imageAsset.base64;
  };

  // Send a message
  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userMessage = {
      id: nanoid(),
      content: inputText.trim(),
      role: MESSAGE_ROLES.USER,
      timestamp: new Date().toISOString(),
      imageData: selectedImage ? imageToBase64(selectedImage) : undefined
    };

    // Update UI immediately with user message
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      // Send to API
      const response = await sendMessage(
        userMessage.content, 
        userMessage.imageData
      );

      // Create AI response message
      const aiMessage = {
        id: nanoid(),
        content: response.message,
        role: MESSAGE_ROLES.ASSISTANT,
        timestamp: new Date().toISOString(),
        data: response.data
      };

      // Add AI response to messages
      setMessages(prevMessages => [...prevMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage = {
        id: nanoid(),
        content: "Sorry, I couldn't process your request. Please try again later.",
        role: MESSAGE_ROLES.ASSISTANT,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear the current chat
  const handleClearChat = () => {
    const welcomeMessage = {
      id: nanoid(),
      content: "Chat cleared! How can I help with your fashion needs today?",
      role: MESSAGE_ROLES.ASSISTANT,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* App Bar */}
      <Appbar.Header>
        <Appbar.Content title="Fashion Chat" />
        <Appbar.Action icon="history" onPress={() => navigation.navigate('ChatHistory')} />
        <Appbar.Action icon="delete" onPress={handleClearChat} />
      </Appbar.Header>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatBubble message={item} />}
        contentContainerStyle={styles.chatContainer}
      />

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <IconButton 
            icon="close" 
            size={20} 
            onPress={() => setSelectedImage(null)} 
            style={styles.removeImageButton}
          />
          <Text style={styles.imageAttachedText}>Image attached</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      )}

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputContainer}>
          <IconButton
            icon="camera"
            size={24}
            onPress={pickImage}
            style={styles.cameraButton}
          />
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            mode="outlined"
            right={
              <TextInput.Icon 
                icon={isLoading ? 'loading' : 'send'}
                disabled={isLoading || (!inputText.trim() && !selectedImage)}
                onPress={handleSend}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#FFFFFF',
  },
  cameraButton: {
    marginRight: 4,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  imagePreviewContainer: {
    backgroundColor: '#E8F0FE',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageAttachedText: {
    marginLeft: 8,
    color: '#4B5563',
  },
  removeImageButton: {
    margin: 0,
  },
});

export default HomeScreen;