import OpenAI from 'openai';
import { Translate } from '@google-cloud/translate/build/src/v2/index.js';
import natural from 'natural';
import Filter from 'bad-words';
import Sentiment from 'sentiment';
import * as tf from '@tensorflow/tfjs-node';

class AIService {
  constructor() {
    // Initialize OpenAI only if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    // Initialize Google Translate only if credentials are available
    if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_KEY_FILE) {
      this.translateClient = new Translate({
        projectId: process.env.GOOGLE_PROJECT_ID,
        keyFilename: process.env.GOOGLE_KEY_FILE
      });
    }
    
    this.filter = new Filter();
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    
    // Load pre-trained models for spam detection
    this.spamModel = null;
    this.moderationModel = null;
    this.loadModels();
  }

  async loadModels() {
    try {
      // Load or create spam detection model
      this.spamModel = await this.loadSpamModel();
      
      // Load or create content moderation model
      this.moderationModel = await this.loadModerationModel();
    } catch (error) {
      console.error('Error loading AI models:', error);
    }
  }

  // Initialize AI Service - called during server startup
  async initialize() {
    try {
      // Check OpenAI availability
      if (this.openai) {
        console.log('OpenAI client initialized successfully');
      } else {
        console.warn('OpenAI not available - missing API key');
      }
      
      // Check Google Translate availability
      if (this.translateClient) {
        console.log('Google Translate client initialized successfully');
      } else {
        console.warn('Google Translate not available - missing credentials');
      }
      
      // Load ML models
      await this.loadModels();
      console.log('AI models loaded successfully');
      
      return true;
    } catch (error) {
      console.error('AI Service initialization failed:', error);
      return false;
    }
  }

  // Smart Message Suggestions
  async getMessageSuggestions(context, userHistory = [], roomContext = {}) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not available');
      }
      
      const messages = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful chat assistant. Generate 3-5 relevant message suggestions based on the context. 
            Consider the conversation history and room context. Keep suggestions natural and conversational.
            Format as a JSON array of strings.`
          },
          {
            role: 'user',
            content: `Context: ${context}
            Recent messages: ${userHistory.slice(-5).map(m => m.text).join('\n')}
            Room type: ${roomContext.type || 'general'}
            Topic: ${roomContext.topic || 'general conversation'}`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      const suggestions = JSON.parse(messages.choices[0].message.content);
      return suggestions;
    } catch (error) {
      console.error('Error generating message suggestions:', error);
      return this.getFallbackSuggestions(context);
    }
  }

  getFallbackSuggestions(context) {
    const fallbackSuggestions = [
      "That's interesting! Tell me more.",
      "I see what you mean.",
      "Thanks for sharing!",
      "Good point!",
      "How does that work?"
    ];
    
    return fallbackSuggestions.slice(0, 3);
  }

  // Auto-translation Service
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    try {
      if (!text || !text.trim()) return text;
      
      if (!this.translateClient) {
        console.warn('Google Translate service not available');
        return text;
      }
      
      const [translation] = await this.translateClient.translate(text, {
        from: sourceLanguage,
        to: targetLanguage
      });
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  }

  async detectLanguage(text) {
    try {
      if (!this.translateClient) {
        console.warn('Google Translate service not available');
        return 'en'; // Default to English
      }
      
      const [detection] = await this.translateClient.detect(text);
      return detection[0].language;
    } catch (error) {
      console.error('Language detection error:', error);
      return 'en'; // Default to English
    }
  }

  // Spam Detection
  async detectSpam(message, userHistory = []) {
    try {
      // Rule-based spam detection
      const spamScore = this.calculateSpamScore(message, userHistory);
      
      // ML-based detection if model is loaded
      if (this.spamModel) {
        const mlScore = await this.mlSpamDetection(message);
        return Math.max(spamScore, mlScore);
      }
      
      return spamScore;
    } catch (error) {
      console.error('Spam detection error:', error);
      return 0.1; // Low default score
    }
  }

  calculateSpamScore(message, userHistory) {
    let score = 0;
    
    // Check for excessive caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.7) score += 0.3;
    
    // Check for excessive punctuation
    const punctRatio = (message.match(/[!?]/g) || []).length / message.length;
    if (punctRatio > 0.2) score += 0.2;
    
    // Check for spam keywords
    const spamKeywords = ['free', 'win', 'prize', 'click', 'buy now', 'limited offer'];
    const lowerMessage = message.toLowerCase();
    spamKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) score += 0.2;
    });
    
    // Check for repeated messages
    const recentMessages = userHistory.slice(-5);
    const duplicateCount = recentMessages.filter(m => m.text === message).length;
    score += duplicateCount * 0.3;
    
    // Check for URL patterns
    if (/(https?:\/\/[^\s]+)/.test(message)) score += 0.2;
    
    return Math.min(score, 1.0);
  }

  async mlSpamDetection(message) {
    try {
      // Preprocess text
      const tokens = this.tokenizer.tokenize(message.toLowerCase());
      const features = this.extractFeatures(tokens);
      
      // Make prediction
      const prediction = this.spamModel.predict(features);
      return prediction.dataSync()[0];
    } catch (error) {
      console.error('ML spam detection error:', error);
      return 0.1;
    }
  }

  // Content Moderation
  async moderateContent(message) {
    try {
      const moderation = {
        isAppropriate: true,
        categories: {},
        confidence: 0,
        filteredText: message
      };

      // Profanity filter
      if (this.filter.isProfane(message)) {
        moderation.isAppropriate = false;
        moderation.categories.profanity = true;
        moderation.filteredText = this.filter.clean(message);
      }

      // Sentiment analysis for toxicity
      const sentimentResult = this.sentiment.analyze(message);
      if (sentimentResult.score < -3) {
        moderation.isAppropriate = false;
        moderation.categories.toxicity = true;
        moderation.confidence = Math.abs(sentimentResult.score) / 10;
      }

      // ML-based moderation if model is loaded
      if (this.moderationModel) {
        const mlModeration = await this.mlContentModeration(message);
        if (!mlModeration.isAppropriate) {
          moderation.isAppropriate = false;
          Object.assign(moderation.categories, mlModeration.categories);
          moderation.confidence = Math.max(moderation.confidence, mlModeration.confidence);
        }
      }

      return moderation;
    } catch (error) {
      console.error('Content moderation error:', error);
      return {
        isAppropriate: true,
        categories: {},
        confidence: 0,
        filteredText: message
      };
    }
  }

  async mlContentModeration(message) {
    try {
      const features = this.extractTextFeatures(message);
      const prediction = this.moderationModel.predict(features);
      const categories = ['toxicity', 'severe_toxicity', 'obscene', 'threat', 'insult', 'identity_hate'];
      
      const results = {};
      let maxConfidence = 0;
      let isAppropriate = true;
      
      categories.forEach((category, index) => {
        const score = prediction.dataSync()[index];
        results[category] = score > 0.5;
        if (score > maxConfidence) maxConfidence = score;
        if (score > 0.7) isAppropriate = false;
      });
      
      return {
        isAppropriate,
        categories: results,
        confidence: maxConfidence
      };
    } catch (error) {
      console.error('ML content moderation error:', error);
      return {
        isAppropriate: true,
        categories: {},
        confidence: 0
      };
    }
  }

  // Chatbot Assistant
  async getChatbotResponse(message, conversationHistory = [], userContext = {}) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not available');
      }
      
      const systemPrompt = `You are a helpful AI assistant for a chat application. 
      Be friendly, helpful, and concise. If you don't know something, admit it. 
      Keep responses under 150 words unless more detail is needed.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.sender === 'bot' ? 'assistant' : 'user',
          content: msg.text
        })),
        { role: 'user', content: message }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 200,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Chatbot response error:', error);
      return "I'm sorry, I'm having trouble responding right now. Please try again later.";
    }
  }

  // Helper methods
  extractFeatures(tokens) {
    // Simple feature extraction for ML models
    const features = [];
    // Add token count, average word length, etc.
    features.push(tokens.length);
    features.push(tokens.reduce((sum, token) => sum + token.length, 0) / tokens.length);
    return tf.tensor2d([features]);
  }

  extractTextFeatures(text) {
    // Extract features for content moderation
    const features = [];
    features.push(text.length);
    features.push((text.match(/[A-Z]/g) || []).length);
    features.push((text.match(/[!?]/g) || []).length);
    features.push((text.match(/\d/g) || []).length);
    features.push(this.filter.isProfane(text) ? 1 : 0);
    
    const sentiment = this.sentiment.analyze(text);
    features.push(sentiment.score);
    
    return tf.tensor2d([features]);
  }

  async loadSpamModel() {
    try {
      // In a real implementation, load a pre-trained model
      // For now, return a simple mock model
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [2], units: 10, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
      });
      
      model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      return model;
    } catch (error) {
      console.error('Error loading spam model:', error);
      return null;
    }
  }

  async loadModerationModel() {
    try {
      // In a real implementation, load a pre-trained model
      // For now, return a simple mock model
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ inputShape: [7], units: 20, activation: 'relu' }),
          tf.layers.dense({ units: 10, activation: 'relu' }),
          tf.layers.dense({ units: 6, activation: 'sigmoid' })
        ]
      });
      
      model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });
      
      return model;
    } catch (error) {
      console.error('Error loading moderation model:', error);
      return null;
    }
  }
}

export default new AIService();
