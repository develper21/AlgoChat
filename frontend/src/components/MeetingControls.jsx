import React, { useState, useRef, useEffect } from 'react';
import { FiSettings, FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhone, FiMessageSquare, FiUsers, FiShare2, FiMaximize2, FiMinimize2, FiCamera, FiCameraOff, FiVolume2, FiVolumeX, FiWifi, FiWifiOff } from 'react-icons/fi';
import './MeetingControls.css';

const MeetingControls = ({
  isAudioMuted,
  isVideoOff,
  isScreenSharing,
  isChatOpen,
  isParticipantsOpen,
  isFullscreen,
  isRecording,
  handRaised,
  localUser,
  meeting,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeaveMeeting,
  onToggleChat,
  onToggleParticipants,
  onToggleFullscreen,
  onToggleHandRaise,
  onStartRecording,
  onStopRecording,
  onToggleSettings
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [networkQuality, setNetworkQuality] = useState('good');
  const settingsRef = useRef();

  useEffect(() => {
    getMediaDevices();
    
    // Monitor network quality
    const interval = setInterval(() => {
      checkNetworkQuality();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      
      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);
      
      if (audioInputs.length > 0) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
      if (videoInputs.length > 0) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting media devices:', error);
    }
  };

  const checkNetworkQuality = () => {
    // Simple network quality check - in production, you'd use WebRTC stats
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const { effectiveType, downlink } = connection;
      if (effectiveType === '4g' && downlink > 2) {
        setNetworkQuality('excellent');
      } else if (effectiveType === '4g' || downlink > 1) {
        setNetworkQuality('good');
      } else if (effectiveType === '3g') {
        setNetworkQuality('fair');
      } else {
        setNetworkQuality('poor');
      }
    }
  };

  const changeAudioDevice = async (deviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false
      });
      
      // Update audio track in peer connections
      // This would need to be integrated with the main MeetingRoom component
      setSelectedAudioDevice(deviceId);
    } catch (error) {
      console.error('Error changing audio device:', error);
    }
  };

  const changeVideoDevice = async (deviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: deviceId } }
      });
      
      // Update video track in peer connections
      // This would need to be integrated with the main MeetingRoom component
      setSelectedVideoDevice(deviceId);
    } catch (error) {
      console.error('Error changing video device:', error);
    }
  };

  const getNetworkQualityIcon = () => {
    switch (networkQuality) {
      case 'excellent':
      case 'good':
        return <FiWifi />;
      case 'fair':
        return <FiWifiOff />;
      case 'poor':
        return <FiWifiOff />;
      default:
        return <FiWifi />;
    }
  };

  const getNetworkQualityColor = () => {
    switch (networkQuality) {
      case 'excellent':
        return '#28a745';
      case 'good':
        return '#17a2b8';
      case 'fair':
        return '#ffc107';
      case 'poor':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="meeting-controls">
        <div className="controls-left">
          <button
            onClick={onToggleAudio}
            className={`control-btn ${isAudioMuted ? 'muted' : ''}`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? <FiMicOff /> : <FiMic />}
          </button>
          
          <button
            onClick={onToggleVideo}
            className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
            title={isVideoOff ? 'Start Video' : 'Stop Video'}
          >
            {isVideoOff ? <FiVideoOff /> : <FiVideo />}
          </button>
          
          <button
            onClick={onToggleScreenShare}
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            <FiMonitor />
          </button>
          
          <button
            onClick={onToggleHandRaise}
            className={`control-btn ${handRaised ? 'active' : ''}`}
            title={handRaised ? 'Lower Hand' : 'Raise Hand'}
          >
            ✋
          </button>

          {/* Network Quality Indicator */}
          <div className="network-indicator" title={`Network Quality: ${networkQuality}`}>
            {getNetworkQualityIcon()}
            <span 
              className="network-dot" 
              style={{ backgroundColor: getNetworkQualityColor() }}
            ></span>
          </div>
        </div>

        <div className="controls-center">
          <div className="meeting-info">
            <span className="meeting-title">{meeting?.title}</span>
            {isRecording && (
              <div className="recording-indicator">
                <div className="recording-dot"></div>
                REC
              </div>
            )}
          </div>
          
          <button onClick={onLeaveMeeting} className="control-btn leave-btn">
            <FiPhone /> Leave
          </button>
        </div>

        <div className="controls-right">
          <button
            onClick={onToggleChat}
            className={`control-btn ${isChatOpen ? 'active' : ''}`}
            title="Toggle Chat"
          >
            <FiMessageSquare />
          </button>
          
          <button
            onClick={onToggleParticipants}
            className={`control-btn ${isParticipantsOpen ? 'active' : ''}`}
            title="Toggle Participants"
          >
            <FiUsers />
          </button>
          
          <button onClick={onToggleFullscreen} className="control-btn" title="Toggle Fullscreen">
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
          
          <div className="settings-dropdown" ref={settingsRef}>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`control-btn ${showSettings ? 'active' : ''}`}
              title="Settings"
            >
              <FiSettings />
            </button>
            
            {showSettings && (
              <div className="settings-menu">
                <div className="settings-section">
                  <h4>Audio</h4>
                  <select 
                    value={selectedAudioDevice}
                    onChange={(e) => changeAudioDevice(e.target.value)}
                  >
                    {audioDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="settings-section">
                  <h4>Video</h4>
                  <select 
                    value={selectedVideoDevice}
                    onChange={(e) => changeVideoDevice(e.target.value)}
                  >
                    {videoDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {localUser?.isHost && (
                  <div className="settings-section">
                    <h4>Recording</h4>
                    <button 
                      onClick={isRecording ? onStopRecording : onStartRecording}
                      className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                    >
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                  </div>
                )}

                <div className="settings-section">
                  <h4>Network</h4>
                  <div className="network-status">
                    <span>Quality: {networkQuality}</span>
                    <div 
                      className="network-bar"
                      style={{ backgroundColor: getNetworkQualityColor() }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts">
        <div className="shortcuts-toggle">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="shortcuts-btn"
          >
            ?
          </button>
        </div>
        
        {showSettings && (
          <div className="shortcuts-help">
            <h4>Keyboard Shortcuts</h4>
            <div className="shortcut-item">
              <kbd>Space</kbd> Push to talk
            </div>
            <div className="shortcut-item">
              <kbd>M</kbd> Mute/Unmute
            </div>
            <div className="shortcut-item">
              <kbd>V</kbd> Video On/Off
            </div>
            <div className="shortcut-item">
              <kbd>S</kbd> Screen Share
            </div>
            <div className="shortcut-item">
              <kbd>R</kbd> Raise Hand
            </div>
            <div className="shortcut-item">
              <kbd>C</kbd> Toggle Chat
            </div>
            <div className="shortcut-item">
              <kbd>P</kbd> Toggle Participants
            </div>
            <div className="shortcut-item">
              <kbd>F</kbd> Fullscreen
            </div>
            <div className="shortcut-item">
              <kbd>Esc</kbd> Leave Meeting
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MeetingControls;
