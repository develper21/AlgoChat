import React, { useState, useEffect } from 'react';
import { FaLanguage, FaGlobe, FaExchangeAlt } from 'react-icons/fa';
import aiService from '../services/aiService.js';

const TranslationWidget = ({ 
  message, 
  onTranslatedMessage,
  userLanguage = 'en',
  showWidget = true,
  compact = false 
}) => {
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(userLanguage);
  const [supportedLanguages] = useState(aiService.getSupportedLanguages());

  useEffect(() => {
    if (message && message.trim()) {
      detectLanguage();
    } else {
      setDetectedLanguage('');
      setTranslatedText('');
      setShowTranslation(false);
    }
  }, [message]);

  const detectLanguage = async () => {
    try {
      const detected = await aiService.detectLanguage(message);
      setDetectedLanguage(detected);
      
      // Auto-translate if different from user language
      if (detected !== userLanguage && detected !== 'unknown') {
        translateMessage(detected, userLanguage);
      } else {
        setShowTranslation(false);
      }
    } catch (error) {
      console.error('Language detection error:', error);
    }
  };

  const translateMessage = async (sourceLang = detectedLanguage, targetLang = targetLanguage) => {
    if (!message || !message.trim()) return;

    setIsTranslating(true);
    try {
      const result = await aiService.translateText(message, targetLang, sourceLang);
      setTranslatedText(result.translatedText);
      setShowTranslation(result.wasTranslated);
      
      if (onTranslatedMessage && result.wasTranslated) {
        onTranslatedMessage(result.translatedText, result);
      }
    } catch (error) {
      console.error('Translation error:', error);
      setShowTranslation(false);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageChange = (newTargetLanguage) => {
    setTargetLanguage(newTargetLanguage);
    if (detectedLanguage && detectedLanguage !== 'unknown') {
      translateMessage(detectedLanguage, newTargetLanguage);
    }
  };

  const getLanguageName = (code) => {
    const language = supportedLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  if (!showWidget || !message || !message.trim()) {
    return null;
  }

  if (compact) {
    return (
      <div className="translation-widget compact">
        {isTranslating ? (
          <span className="translating">Translating...</span>
        ) : showTranslation && translatedText !== message ? (
          <div className="compact-translation">
            <FaLanguage />
            <span className="translated-text">{translatedText}</span>
            <small className="language-info">
              {getLanguageName(detectedLanguage)} → {getLanguageName(targetLanguage)}
            </small>
          </div>
        ) : detectedLanguage && detectedLanguage !== userLanguage ? (
          <button 
            className="translate-btn"
            onClick={() => translateMessage(detectedLanguage, userLanguage)}
            disabled={isTranslating}
          >
            <FaExchangeAlt /> Translate
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="translation-widget">
      <div className="translation-header">
        <h4><FaLanguage /> Translation</h4>
        {detectedLanguage && (
          <div className="detected-language">
            <FaGlobe />
            <span>Detected: {getLanguageName(detectedLanguage)}</span>
          </div>
        )}
      </div>

      {isTranslating && (
        <div className="translating">
          <div className="spinner"></div>
          <span>Translating...</span>
        </div>
      )}

      {showTranslation && translatedText !== message && (
        <div className="translation-result">
          <div className="original-message">
            <strong>Original ({getLanguageName(detectedLanguage)}):</strong>
            <p>{message}</p>
          </div>
          
          <div className="translated-message">
            <strong>Translated ({getLanguageName(targetLanguage)}):</strong>
            <p>{translatedText}</p>
          </div>

          <div className="translation-actions">
            <button 
              className="use-translation-btn"
              onClick={() => onTranslatedMessage && onTranslatedMessage(translatedText)}
            >
              Use Translation
            </button>
          </div>
        </div>
      )}

      {!showTranslation && detectedLanguage && detectedLanguage !== userLanguage && (
        <div className="translation-options">
          <p>Message is in {getLanguageName(detectedLanguage)}. Translate to:</p>
          
          <div className="language-selector">
            <select 
              value={targetLanguage} 
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            
            <button 
              onClick={() => translateMessage(detectedLanguage, targetLanguage)}
              disabled={isTranslating}
            >
              <FaExchangeAlt /> Translate
            </button>
          </div>
        </div>
      )}

      {!showTranslation && (!detectedLanguage || detectedLanguage === userLanguage) && (
        <div className="no-translation">
          <p>Message is already in your preferred language.</p>
          {message && (
            <div className="manual-translate">
              <p>Translate to another language:</p>
              <div className="language-selector">
                <select 
                  value={targetLanguage} 
                  onChange={(e) => setTargetLanguage(e.target.value)}
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                
                <button 
                  onClick={() => translateMessage(userLanguage, targetLanguage)}
                  disabled={isTranslating}
                >
                  <FaExchangeAlt /> Translate
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslationWidget;
