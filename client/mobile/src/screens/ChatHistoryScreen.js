import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Divider, ActivityIndicator } from 'react-native-paper';
import { getChatHistories } from '../lib/api';
import { MESSAGE_ROLES } from '../lib/types';

const ChatHistoryScreen = ({ navigation }) => {
  const [chatHistories, setChatHistories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load chat histories when component mounts
    loadChatHistories();
    
    // Add listener for when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadChatHistories();
    });

    return unsubscribe;
  }, [navigation]);

  const loadChatHistories = async () => {
    setIsLoading(true);
    try {
      const histories = await getChatHistories();
      setChatHistories(histories);
      setError(null);
    } catch (err) {
      console.error('Failed to load chat histories:', err);
      setError('Failed to load chat history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get a preview of the chat history
  const getPreviewText = (history) => {
    if (!history.messages || history.messages.length === 0) {
      return 'Empty conversation';
    }
    
    // Find the first non-system message
    const userMessages = history.messages.filter(
      msg => msg.role === MESSAGE_ROLES.USER
    );
    
    if (userMessages.length > 0) {
      const preview = userMessages[0].content;
      return preview.length > 50 ? `${preview.substring(0, 50)}...` : preview;
    }
    
    return 'No user messages';
  };

  // Format the timestamp for display
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Navigate to chat screen with selected history
  const handleSelectHistory = (history) => {
    // In a real app, you'd navigate to the chat screen with this history
    // For now, we'll just go back to Home (this would be enhanced later)
    navigation.navigate('Home', { historyId: history.id });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading chat history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (chatHistories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No chat history yet</Text>
        <Text style={styles.emptySubtext}>
          Start a conversation to create history
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chatHistories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelectHistory(item)}>
            <Card style={styles.historyCard}>
              <Card.Content>
                <Text style={styles.previewText}>{getPreviewText(item)}</Text>
                <Text style={styles.dateText}>
                  {formatDate(item.createdAt)}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
  },
  historyCard: {
    marginVertical: 4,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  previewText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  divider: {
    marginVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ChatHistoryScreen;