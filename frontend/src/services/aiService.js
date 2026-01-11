import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AIService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Get smart message suggestions
  async getMessageSuggestions(context, roomId = null, maxSuggestions = 5) {
    try {
      const response = await this.api.post('/ai/suggestions', {
        context,
        roomId,
        maxSuggestions
      });
      
      if (response.data.success) {
        return response.data.data.suggestions;
      } else {
        throw new Error(response.data.message || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('Error getting message suggestions:', error);
      return this.getFallbackSuggestions();
    }
  }

  getFallbackSuggestions() {
    return [
      "That's interesting! Tell me more.",
      "I see what you mean.",
      "Thanks for sharing!",
      "Good point!",
      "How does that work?"
    ];
  }

  // Translate text
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      const response = await this.api.post('/ai/translate', {
        text,
        targetLanguage,
        sourceLanguage
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: 'en',
        targetLanguage,
        wasTranslated: false
      };
    }
  }

  // Detect language
  async detectLanguage(text) {
    try {
      const response = await this.api.post('/ai/detect-language', {
        text
      });
      
      if (response.data.success) {
        return response.data.data.detectedLanguage;
      } else {
        throw new Error(response.data.message || 'Language detection failed');
      }
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en';
    }
  }

  // Chatbot assistant
  async getChatbotResponse(message, roomId = null, conversationHistory = []) {
    try {
      const response = await this.api.post('/ai/chatbot', {
        message,
        roomId,
        conversationHistory
      });
      
      if (response.data.success) {
        return response.data.data.response;
      } else {
        throw new Error(response.data.message || 'Chatbot response failed');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      return "I'm sorry, I'm having trouble responding right now. Please try again later.";
    }
  }

  // Analyze message (spam detection + content moderation)
  async analyzeMessage(message, roomId = null) {
    try {
      const response = await this.api.post('/ai/analyze', {
        message,
        roomId
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Message analysis failed');
      }
    } catch (error) {
      console.error('Message analysis error:', error);
      return {
        spam: { score: 0, isSpam: false, confidence: 0 },
        moderation: { isAppropriate: true, categories: {}, confidence: 0 },
        overall: { shouldBlock: false, requiresReview: false, confidence: 0 }
      };
    }
  }

  // Get room insights
  async getRoomInsights(roomId) {
    try {
      const response = await this.api.get(`/ai/room-insights/${roomId}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get room insights');
      }
    } catch (error) {
      console.error('Room insights error:', error);
      return {
        totalMessages: 0,
        activityLevel: 'low',
        languages: {},
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        topTopics: [],
        spamScore: 0,
        moderationFlags: 0
      };
    }
  }

  // Auto-translate message based on user preferences
  async autoTranslateMessage(message, userLanguage) {
    try {
      if (!message || !message.trim()) return message;
      
      const detectedLanguage = await this.detectLanguage(message);
      
      // Skip if same language or if detection failed
      if (detectedLanguage === userLanguage || detectedLanguage === 'unknown') {
        return message;
      }
      
      const translation = await this.translateText(message, userLanguage, detectedLanguage);
      
      return translation.wasTranslated ? translation.translatedText : message;
    } catch (error) {
      console.error('Auto-translation error:', error);
      return message;
    }
  }

  // Get supported languages for translation
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'bn', name: 'Bengali' },
      { code: 'ta', name: 'Tamil' },
      { code: 'te', name: 'Telugu' }
    ];
  }
}

export default new AIService();
