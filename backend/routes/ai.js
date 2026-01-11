import express from 'express';
import Joi from 'joi';
import aiService from '../services/aiService.js';
import Message from '../models/Message.js';
import Room from '../models/Room.js';
import User from '../models/User.js';

const router = express.Router();

// Validation schemas
const suggestionsSchema = Joi.object({
  context: Joi.string().required(),
  roomId: Joi.string().optional(),
  maxSuggestions: Joi.number().integer().min(1).max(10).default(5)
});

const translationSchema = Joi.object({
  text: Joi.string().required(),
  targetLanguage: Joi.string().required(),
  sourceLanguage: Joi.string().default('auto')
});

const chatbotSchema = Joi.object({
  message: Joi.string().required(),
  roomId: Joi.string().optional(),
  conversationHistory: Joi.array().items(
    Joi.object({
      sender: Joi.string().required(),
      text: Joi.string().required(),
      timestamp: Joi.date().optional()
    })
  ).default([])
});

// Get smart message suggestions
router.post('/suggestions', async (req, res) => {
  try {
    const { error, value } = suggestionsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { context, roomId, maxSuggestions } = value;
    
    // Get user's recent messages for context
    const userHistory = await Message.find({ sender: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('sender', 'name');

    // Get room context if roomId provided
    let roomContext = {};
    if (roomId) {
      const room = await Room.findById(roomId);
      if (room) {
        roomContext = {
          type: room.type,
          topic: room.topic,
          name: room.name
        };
      }
    }

    const suggestions = await aiService.getMessageSuggestions(
      context, 
      userHistory, 
      roomContext
    );

    res.json({
      success: true,
      data: {
        suggestions: suggestions.slice(0, maxSuggestions),
        context: {
          roomContext,
          userMessageCount: userHistory.length
        }
      }
    });
  } catch (error) {
    console.error('Message suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate suggestions',
      code: 'SUGGESTIONS_ERROR'
    });
  }
});

// Translate text
router.post('/translate', async (req, res) => {
  try {
    const { error, value } = translationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { text, targetLanguage, sourceLanguage } = value;

    // Detect language if not specified
    const detectedLanguage = sourceLanguage === 'auto' 
      ? await aiService.detectLanguage(text) 
      : sourceLanguage;

    // Skip translation if source and target are the same
    if (detectedLanguage === targetLanguage) {
      return res.json({
        success: true,
        data: {
          originalText: text,
          translatedText: text,
          sourceLanguage: detectedLanguage,
          targetLanguage,
          wasTranslated: false
        }
      });
    }

    const translatedText = await aiService.translateText(text, targetLanguage, sourceLanguage);

    res.json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        sourceLanguage: detectedLanguage,
        targetLanguage,
        wasTranslated: true
      }
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation failed',
      code: 'TRANSLATION_ERROR'
    });
  }
});

// Detect language
router.post('/detect-language', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text is required',
        code: 'VALIDATION_ERROR'
      });
    }

    const language = await aiService.detectLanguage(text);

    res.json({
      success: true,
      data: {
        text,
        detectedLanguage: language,
        confidence: 0.8 // Placeholder confidence score
      }
    });
  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Language detection failed',
      code: 'LANGUAGE_DETECTION_ERROR'
    });
  }
});

// Chatbot assistant
router.post('/chatbot', async (req, res) => {
  try {
    const { error, value } = chatbotSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }

    const { message, roomId, conversationHistory } = value;

    // Get user context
    const user = await User.findById(req.user._id);
    const userContext = {
      name: user.name,
      preferences: user.preferences || {},
      language: user.language || 'en'
    };

    // Get room context if provided
    let roomContext = {};
    if (roomId) {
      const room = await Room.findById(roomId);
      if (room) {
        roomContext = {
          type: room.type,
          topic: room.topic,
          name: room.name
        };
      }
    }

    const response = await aiService.getChatbotResponse(
      message, 
      conversationHistory, 
      { ...userContext, ...roomContext }
    );

    res.json({
      success: true,
      data: {
        response,
        timestamp: new Date(),
        context: {
          userContext,
          roomContext
        }
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot response failed',
      code: 'CHATBOT_ERROR'
    });
  }
});

// Analyze message (spam detection + content moderation)
router.post('/analyze', async (req, res) => {
  try {
    const { message, roomId } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        code: 'VALIDATION_ERROR'
      });
    }

    // Get user history for spam detection
    const userHistory = await Message.find({ sender: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Run spam detection
    const spamScore = await aiService.detectSpam(message, userHistory);

    // Run content moderation
    const moderation = await aiService.moderateContent(message);

    // Combine results
    const analysis = {
      message,
      spam: {
        score: spamScore,
        isSpam: spamScore > 0.7,
        confidence: spamScore
      },
      moderation: {
        isAppropriate: moderation.isAppropriate,
        categories: moderation.categories,
        confidence: moderation.confidence,
        filteredText: moderation.filteredText
      },
      overall: {
        shouldBlock: spamScore > 0.7 || !moderation.isAppropriate,
        requiresReview: spamScore > 0.5 || moderation.confidence > 0.6,
        confidence: Math.max(spamScore, moderation.confidence)
      }
    };

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Message analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Message analysis failed',
      code: 'ANALYSIS_ERROR'
    });
  }
});

// Get AI-powered room insights
router.get('/room-insights/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    
    // Verify user is member of the room
    const room = await Room.findById(roomId);
    if (!room || !room.members.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Get recent messages for analysis
    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'name');

    // Analyze message patterns
    const insights = {
      totalMessages: messages.length,
      activityLevel: messages.length > 50 ? 'high' : messages.length > 20 ? 'medium' : 'low',
      languages: await analyzeLanguages(messages),
      sentiment: await analyzeSentiment(messages),
      topTopics: await extractTopics(messages),
      spamScore: await calculateRoomSpamScore(messages),
      moderationFlags: await countModerationFlags(messages)
    };

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Room insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate room insights',
      code: 'INSIGHTS_ERROR'
    });
  }
});

// Helper functions
async function analyzeLanguages(messages) {
  const languages = {};
  for (const message of messages) {
    if (message.text && message.text.trim()) {
      try {
        const lang = await aiService.detectLanguage(message.text);
        languages[lang] = (languages[lang] || 0) + 1;
      } catch (error) {
        languages['unknown'] = (languages['unknown'] || 0) + 1;
      }
    }
  }
  return languages;
}

async function analyzeSentiment(messages) {
  const sentiments = { positive: 0, negative: 0, neutral: 0 };
  for (const message of messages) {
    if (message.text && message.text.trim()) {
      const moderation = await aiService.moderateContent(message.text);
      // Use sentiment analysis from moderation
      const score = moderation.sentiment || 0;
      if (score > 2) sentiments.positive++;
      else if (score < -2) sentiments.negative++;
      else sentiments.neutral++;
    }
  }
  return sentiments;
}

async function extractTopics(messages) {
  // Simple keyword extraction for topics
  const wordCount = {};
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be']);
  
  for (const message of messages) {
    if (message.text) {
      const words = message.text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        word = word.replace(/[^\w]/g, '');
        if (word.length > 3 && !stopWords.has(word)) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    }
  }
  
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => ({ word, count }));
}

async function calculateRoomSpamScore(messages) {
  let totalSpamScore = 0;
  let messageCount = 0;
  
  for (const message of messages) {
    if (message.text) {
      const spamScore = await aiService.detectSpam(message.text, []);
      totalSpamScore += spamScore;
      messageCount++;
    }
  }
  
  return messageCount > 0 ? totalSpamScore / messageCount : 0;
}

async function countModerationFlags(messages) {
  let flags = 0;
  for (const message of messages) {
    if (message.text) {
      const moderation = await aiService.moderateContent(message.text);
      if (!moderation.isAppropriate) flags++;
    }
  }
  return flags;
}

export default router;
