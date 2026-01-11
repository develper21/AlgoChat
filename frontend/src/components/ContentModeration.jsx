import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import aiService from '../services/aiService.js';

const ContentModeration = ({ 
  message, 
  onModerationResult, 
  showWarnings = true,
  autoModerate = false 
}) => {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (message && message.trim()) {
      analyzeMessage(message);
    }
  }, [message]);

  const analyzeMessage = async (text) => {
    setIsAnalyzing(true);
    try {
      const result = await aiService.analyzeMessage(text);
      setAnalysis(result);
      
      // Pass moderation result to parent
      if (onModerationResult) {
        onModerationResult(result);
      }
      
      // Auto-moderate if enabled
      if (autoModerate && result.overall.shouldBlock) {
        console.warn('Message blocked by auto-moderation:', result);
      }
    } catch (error) {
      console.error('Content analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (score) => {
    if (score > 0.7) return '#dc3545'; // red
    if (score > 0.4) return '#ffc107'; // yellow
    return '#28a745'; // green
  };

  const getSeverityIcon = (score) => {
    if (score > 0.7) return <FaExclamationTriangle />;
    if (score > 0.4) return <FaExclamationTriangle />;
    return <FaCheckCircle />;
  };

  if (!showWarnings && (!analysis || analysis.overall.confidence < 0.4)) {
    return null;
  }

  return (
    <div className="content-moderation">
      {isAnalyzing && (
        <div className="moderation-analyzing">
          <FaShieldAlt className="spinning" />
          <span>Analyzing content...</span>
        </div>
      )}

      {analysis && !isAnalyzing && (
        <div className="moderation-result">
          {analysis.overall.shouldBlock ? (
            <div className="moderation-alert high">
              <FaExclamationTriangle />
              <span>This message contains inappropriate content and has been blocked.</span>
            </div>
          ) : analysis.overall.requiresReview ? (
            <div className="moderation-alert medium">
              <FaExclamationTriangle />
              <span>This message may contain inappropriate content.</span>
            </div>
          ) : (
            <div className="moderation-safe">
              <FaCheckCircle />
              <span>Content appears appropriate</span>
            </div>
          )}

          {/* Detailed Analysis */}
          {(showWarnings || analysis.overall.confidence > 0.3) && (
            <div className="moderation-details">
              <button 
                className="details-toggle"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>

              {showDetails && (
                <div className="details-content">
                  {/* Spam Analysis */}
                  <div className="analysis-section">
                    <h4>Spam Detection</h4>
                    <div className="score-bar">
                      <div 
                        className="score-fill spam"
                        style={{ 
                          width: `${analysis.spam.score * 100}%`,
                          backgroundColor: getSeverityColor(analysis.spam.score)
                        }}
                      />
                    </div>
                    <span className="score-text">
                      {getSeverityIcon(analysis.spam.score)} 
                      {(analysis.spam.score * 100).toFixed(1)}% spam probability
                    </span>
                  </div>

                  {/* Content Moderation */}
                  <div className="analysis-section">
                    <h4>Content Moderation</h4>
                    <div className="score-bar">
                      <div 
                        className="score-fill moderation"
                        style={{ 
                          width: `${analysis.moderation.confidence * 100}%`,
                          backgroundColor: getSeverityColor(analysis.moderation.confidence)
                        }}
                      />
                    </div>
                    <span className="score-text">
                      {getSeverityIcon(analysis.moderation.confidence)} 
                      {(analysis.moderation.confidence * 100).toFixed(1)}% confidence
                    </span>

                    {/* Moderation Categories */}
                    {Object.keys(analysis.moderation.categories).length > 0 && (
                      <div className="moderation-categories">
                        {Object.entries(analysis.moderation.categories).map(([category, flagged]) => (
                          <span 
                            key={category}
                            className={`category-tag ${flagged ? 'flagged' : 'safe'}`}
                          >
                            {category}: {flagged ? '⚠️' : '✓'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filtered Text */}
                  {analysis.moderation.filteredText !== message && (
                    <div className="filtered-text-section">
                      <h4>Content Filtering</h4>
                      <div className="text-comparison">
                        <div className="original-text">
                          <strong>Original:</strong> {message}
                        </div>
                        <div className="filtered-text">
                          <strong>Filtered:</strong> {analysis.moderation.filteredText}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentModeration;
