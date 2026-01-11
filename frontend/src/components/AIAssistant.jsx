import React, { useState, useEffect } from 'react';
import { FaRobot, FaLanguage, FaLightbulb, FaShieldAlt } from 'react-icons/fa';
import aiService from '../services/aiService.js';

const AIAssistant = ({ 
  roomId, 
  onMessageSend, 
  currentMessage, 
  userLanguage = 'en',
  isVisible,
  onClose 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [chatbotResponse, setChatbotResponse] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [translatedMessage, setTranslatedMessage] = useState('');
  const [showTranslation, setShowTranslation] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  useEffect(() => {
    if (isVisible && currentMessage && currentMessage.trim()) {
      generateSuggestions(currentMessage);
      checkForTranslation(currentMessage);
    }
  }, [currentMessage, isVisible]);

  const generateSuggestions = async (context) => {
    try {
      const newSuggestions = await aiService.getMessageSuggestions(context, roomId);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const checkForTranslation = async (message) => {
    try {
      const detectedLanguage = await aiService.detectLanguage(message);
      if (detectedLanguage !== userLanguage && detectedLanguage !== 'unknown') {
        const translation = await aiService.translateText(message, userLanguage);
        if (translation.wasTranslated) {
          setTranslatedMessage(translation.translatedText);
          setShowTranslation(true);
        }
      } else {
        setShowTranslation(false);
      }
    } catch (error) {
      console.error('Translation check error:', error);
    }
  };

  const handleChatbotMessage = async (message) => {
    if (!message.trim()) return;

    setIsTyping(true);
    const newHistory = [
      ...conversationHistory,
      { sender: 'user', text: message, timestamp: new Date() }
    ];
    setConversationHistory(newHistory);

    try {
      const response = await aiService.getChatbotResponse(message, roomId, newHistory);
      setChatbotResponse(response);
      
      setConversationHistory([
        ...newHistory,
        { sender: 'bot', text: response, timestamp: new Date() }
      ]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setChatbotResponse("Sorry, I'm having trouble responding. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  const useSuggestion = (suggestion) => {
    onMessageSend(suggestion);
    setSuggestions([]);
  };

  const useTranslation = () => {
    if (translatedMessage) {
      onMessageSend(translatedMessage);
      setShowTranslation(false);
      setTranslatedMessage('');
    }
  };

  const clearChatbot = () => {
    setConversationHistory([]);
    setChatbotResponse('');
  };

  if (!isVisible) return null;

  return (
    <div className="ai-assistant-panel">
      <div className="ai-assistant-header">
        <h3><FaRobot /> AI Assistant</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="ai-tabs">
        <button 
          className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <FaLightbulb /> Suggestions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chatbot' ? 'active' : ''}`}
          onClick={() => setActiveTab('chatbot')}
        >
          <FaRobot /> Chatbot
        </button>
        <button 
          className={`tab-btn ${activeTab === 'translation' ? 'active' : ''}`}
          onClick={() => setActiveTab('translation')}
        >
          <FaLanguage /> Translation
        </button>
      </div>

      <div className="ai-content">
        {activeTab === 'suggestions' && (
          <div className="suggestions-panel">
            <h4>Message Suggestions</h4>
            {suggestions.length > 0 ? (
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index}
                    className="suggestion-item"
                    onClick={() => useSuggestion(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            ) : (
              <p>Type a message to get smart suggestions...</p>
            )}
          </div>
        )}

        {activeTab === 'chatbot' && (
          <div className="chatbot-panel">
            <div className="chatbot-messages">
              {conversationHistory.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender}`}>
                  <div className="message-content">{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="chat-message bot typing">
                  <div className="typing-indicator">...</div>
                </div>
              )}
            </div>
            
            <div className="chatbot-input">
              <input 
                type="text"
                placeholder="Ask me anything..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleChatbotMessage(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
              <button onClick={clearChatbot}>Clear</button>
            </div>
          </div>
        )}

        {activeTab === 'translation' && (
          <div className="translation-panel">
            <h4>Auto-Translation</h4>
            {showTranslation ? (
              <div className="translation-result">
                <div className="original-text">
                  <strong>Original:</strong> {currentMessage}
                </div>
                <div className="translated-text">
                  <strong>Translated ({userLanguage}):</strong> {translatedMessage}
                </div>
                <button className="use-translation-btn" onClick={useTranslation}>
                  Use Translation
                </button>
              </div>
            ) : (
              <div className="translation-info">
                <p>Type a message in any language to see translation options.</p>
                <div className="supported-languages">
                  <strong>Supported languages:</strong>
                  <div className="language-grid">
                    {aiService.getSupportedLanguages().slice(0, 8).map(lang => (
                      <span key={lang.code} className="language-tag">
                        {lang.name}
                      </span>
                    ))}
                    <span className="language-more">+7 more</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
