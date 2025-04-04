import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Card } from 'react-native-paper';
import { MESSAGE_ROLES } from '../lib/types';

const ChatBubble = ({ message }) => {
  const isUser = message.role === MESSAGE_ROLES.USER;

  // Format timestamp for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer
    ]}>
      <Card style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble
      ]}>
        <Card.Content style={styles.content}>
          {/* Render user uploaded image if it exists */}
          {isUser && message.imageData && (
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: `data:image/jpeg;base64,${message.imageData}` }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Message text content */}
          <Text style={[
            styles.text,
            isUser ? styles.userText : styles.assistantText
          ]}>
            {message.content}
          </Text>

          {/* Render fashion trends data if it exists */}
          {!isUser && message.data && (
            <View style={styles.dataContainer}>
              {message.data.colors && message.data.colors.length > 0 && (
                <View style={styles.colorsContainer}>
                  {message.data.colors.map((color, index) => (
                    <View key={index} style={styles.colorItem}>
                      <View 
                        style={[
                          styles.colorSwatch, 
                          { backgroundColor: color.hexCode }
                        ]} 
                      />
                      <Text style={styles.colorName}>{color.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Message timestamp */}
          <Text style={styles.timestamp}>
            {formatTime(message.timestamp)}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#6366F1',
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 8,
  },
  text: {
    fontSize: 16,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  dataContainer: {
    marginTop: 8,
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorName: {
    fontSize: 14,
    color: '#4B5563',
  },
});

export default ChatBubble;