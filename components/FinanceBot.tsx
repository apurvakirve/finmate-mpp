import { Feather as Icon } from '@expo/vector-icons';
import { GoogleGenAI } from "@google/genai";
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Get API key from environment variable
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Initialize Google Gen AI client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
interface FinanceBotProps {
  userId?: string | number;
  userSpendingData?: {
    totalIncome?: number;
    totalSpent?: number;
    totalSaved?: number;
    savingsRate?: number;
    topCategories?: Array<{ category: string; amount: number; percentage: number }>;
    overspendingCategories?: string[];
    upcomingBills?: number;
    transactionCount?: number;
    spendingPattern?: string;
  };
  isVisible: boolean;
  onClose: () => void;
  showAsAlert?: boolean;
  alertMessage?: string;
}

export default function FinanceBot({
  userId,
  userSpendingData,
  isVisible,
  onClose,
  showAsAlert = false,
  alertMessage
}: FinanceBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(!showAsAlert);
  const scrollViewRef = useRef<ScrollView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();

      // Add welcome message only if no messages exist
      if (messages.length === 0) {
        const welcomeMsg: Message = {
          id: Date.now().toString(),
          text: getWelcomeMessage(),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([welcomeMsg]);
      }

      // Show alert if provided
      if (showAsAlert && alertMessage) {
        const alertMsg: Message = {
          id: Date.now().toString(),
          text: alertMessage,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([alertMsg]);
        setTimeout(() => {
          setShowChat(true);
        }, 2000);
      }
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, showAsAlert, alertMessage]);

  const getWelcomeMessage = () => {
    if (userSpendingData) {
      const { totalSpent, totalSaved, savingsRate, spendingPattern } = userSpendingData;

      let message = "👋 Hi! I'm your Finance Assistant. I can help you with:\n\n";
      message += "• Spending analysis\n";
      message += "• Budget advice\n";
      message += "• Savings tips\n";
      message += "• Financial planning\n\n";

      if (totalSpent && totalSpent > 0) {
        message += `📊 Quick Overview:\n`;
        message += `• Total Spent: ₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n`;
        if (totalSaved && totalSaved > 0) {
          message += `• Total Saved: ₹${totalSaved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n`;
        }
        if (savingsRate) {
          message += `• Savings Rate: ${savingsRate.toFixed(1)}%\n`;
        }
        if (spendingPattern) {
          message += `• Spending Pattern: ${spendingPattern.charAt(0).toUpperCase() + spendingPattern.slice(1)}\n`;
        }
      }

      message += "\n💬 Ask me anything about your finances!";
      return message;
    }

    return "👋 Hi! I'm your Finance Assistant. I can help you with spending analysis, budget advice, savings tips, and financial planning. Ask me anything!";
  };

  const buildContextPrompt = () => {
    if (!userSpendingData) return '';

    const {
      totalIncome = 0,
      totalSpent = 0,
      totalSaved = 0,
      savingsRate = 0,
      topCategories = [],
      overspendingCategories = [],
      upcomingBills = 0,
      transactionCount = 0,
      spendingPattern = 'moderate'
    } = userSpendingData;

    let context = '\n\nUser Financial Data:\n';
    context += `- Total Income: ₹${totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n`;
    context += `- Total Spent: ₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n`;
    context += `- Total Saved: ₹${totalSaved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n`;
    context += `- Savings Rate: ${savingsRate.toFixed(1)}%\n`;
    context += `- Spending Pattern: ${spendingPattern}\n`;
    context += `- Transaction Count: ${transactionCount}\n`;

    if (upcomingBills > 0) {
      context += `- Upcoming Bills: ₹${upcomingBills.toLocaleString('en-IN', { maximumFractionDigits: 0 })}\n`;
    }

    if (topCategories.length > 0) {
      context += `- Top Spending Categories:\n`;
      topCategories.forEach((cat, idx) => {
        context += `  ${idx + 1}. ${cat.category}: ₹${cat.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${cat.percentage.toFixed(1)}%)\n`;
      });
    }

    if (overspendingCategories.length > 0) {
      context += `- Overspending Areas: ${overspendingCategories.join(', ')}\n`;
    }

    return context;
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Check if API key is configured
    if (!GEMINI_API_KEY) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "⚠️ Chatbot is not configured. Please add your Gemini API key to the .env file.\n\nSteps:\n1. Get a free API key from https://aistudio.google.com/app/apikey\n2. Copy .env.example to .env\n3. Add your API key to EXPO_PUBLIC_GEMINI_API_KEY\n4. Restart the server",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      return;
    }

    try {
      // Prepare the prompt with context
      const prompt = `You are a helpful financial assistant. The user has the following financial data:
      - Total Income: ${userSpendingData?.totalIncome || 0}
      - Total Spent: ${userSpendingData?.totalSpent || 0}
      - Savings Rate: ${userSpendingData?.savingsRate || 0}%
      - Transaction Count: ${userSpendingData?.transactionCount || 0}
      
      User Question: ${inputText}
      
      Please provide a helpful and concise response.`;

      // Call Gemini API using the SDK
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 500,
          topP: 0.8,
          topK: 40
        }
      });

      const aiText = response.text || "I'm sorry, I couldn't process that request.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('Error in handleSend:', error);

      // Check for quota exceeded error specifically
      const isQuotaError = error.message?.includes('429') || error.toString().includes('Quota exceeded');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: isQuotaError
          ? "⚠️ API Quota Exceeded. The free tier limit has been reached. Please try again later or use a different API key."
          : "I'm having trouble connecting to the server. Please check your internet connection and try again.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    await sendMessage();
  };

  const slideStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [600, 0],
        }),
      },
    ],
  };

  if (showAsAlert && !showChat) {
    return (
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertIcon}>
              <Icon name="bell" size={32} color="#FF9500" />
            </View>
            <Text style={styles.alertTitle}>Financial Alert</Text>
            {alertMessage && <Text style={styles.alertMessage}>{alertMessage}</Text>}
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => {
                setShowChat(true);
              }}
            >
              <Text style={styles.alertButtonText}>Chat with Assistant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.alertCloseButton}
              onPress={onClose}
            >
              <Text style={styles.alertCloseText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View style={[styles.chatContainer, slideStyle]}>
          <View style={styles.chatHeader}>
            <View style={styles.chatHeaderLeft}>
              <View style={styles.botAvatar}>
                <Icon name="message-circle" size={24} color="#007AFF" />
              </View>
              <View>
                <Text style={styles.chatHeaderTitle}>Finance Assistant</Text>
                <Text style={styles.chatHeaderSubtitle}>AI-powered financial advisor</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessage : styles.botMessage,
                ]}
              >
                {!message.isUser && (
                  <View style={styles.botMessageIcon}>
                    <Icon name="message-circle" size={16} color="#007AFF" />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.isUser ? styles.userMessageText : styles.botMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              </View>
            ))}
            {isLoading && (
              <View style={[styles.messageContainer, styles.botMessage]}>
                <View style={styles.botMessageIcon}>
                  <Icon name="message-circle" size={16} color="#007AFF" />
                </View>
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your finances..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    maxHeight: 700,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  botAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  botMessageIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  botMessageText: {
    color: '#1a1a1a',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 15,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  // Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  alertIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  alertCloseButton: {
    paddingVertical: 8,
  },
  alertCloseText: {
    color: '#666',
    fontSize: 14,
  },
});

