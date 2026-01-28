import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import Webcam from 'react-webcam';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiPhone, FiMessageSquare, FiUsers, FiSettings, FiShare2, FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import './MeetingRoom.css';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef();
  const webcamRef = useRef();
  const screenShareRef = useRef();
  const peersRef = useRef({});
  const localStreamRef = useRef();
  const screenStreamRef = useRef();

  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [localUser, setLocalUser] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('algonive_token');
    if (!token) {
      navigate('/login');
      return;
    }

    socketRef.current = io(import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL, {
      auth: { token }
    });

    socketRef.current.on('connect', () => {
      setConnectionStatus('connected');
      joinMeeting();
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('error', (data) => {
      setError(data.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [meetingId, navigate]);

  // Join meeting
  const joinMeeting = useCallback(() => {
    if (socketRef.current && meetingId) {
      socketRef.current.emit('joinMeeting', { meetingId });
    }
  }, [meetingId]);

  // Socket event handlers
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on('meetingJoined', ({ meeting, participants, isHost }) => {
      setMeeting(meeting);
      setParticipants(participants);
      setLocalUser({ ...meeting.host, isHost });
      initializeMedia();
    });

    socketRef.current.on('participantJoined', ({ userId, participant }) => {
      setParticipants(prev => [...prev, participant]);
      createPeerConnection(userId);
    });

    socketRef.current.on('participantLeft', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.user._id !== userId));
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
    });

    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handleIceCandidate);

    socketRef.current.on('participantAudioChanged', ({ userId, isMuted }) => {
      setParticipants(prev =>
        prev.map(p =>
          p.user._id === userId ? { ...p, isMuted } : p
        )
      );
    });

    socketRef.current.on('participantVideoChanged', ({ userId, isVideoOff }) => {
      setParticipants(prev =>
        prev.map(p =>
          p.user._id === userId ? { ...p, isVideoOff } : p
        )
      );
    });

    socketRef.current.on('participantScreenShareChanged', ({ userId, isScreenSharing }) => {
      setParticipants(prev =>
        prev.map(p =>
          p.user._id === userId ? { ...p, isScreenSharing } : p
        )
      );
    });

    socketRef.current.on('participantHandRaised', ({ userId, handRaised }) => {
      setParticipants(prev =>
        prev.map(p =>
          p.user._id === userId ? { ...p, handRaised } : p
        )
      );
    });

    socketRef.current.on('meetingMessage', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socketRef.current.on('recordingStarted', ({ startedAt }) => {
      setIsRecording(true);
    });

    socketRef.current.on('recordingStopped', ({ duration }) => {
      setIsRecording(false);
    });

    return () => {
      socketRef.current?.off('meetingJoined');
      socketRef.current?.off('participantJoined');
      socketRef.current?.off('participantLeft');
      socketRef.current?.off('offer');
      socketRef.current?.off('answer');
      socketRef.current?.off('ice-candidate');
      socketRef.current?.off('participantAudioChanged');
      socketRef.current?.off('participantVideoChanged');
      socketRef.current?.off('participantScreenShareChanged');
      socketRef.current?.off('participantHandRaised');
      socketRef.current?.off('meetingMessage');
      socketRef.current?.off('recordingStarted');
      socketRef.current?.off('recordingStopped');
    };
  }, []);

  // Initialize media devices
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;

      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }

      // Create peer connections for existing participants
      participants.forEach(participant => {
        if (participant.user._id !== localUser?._id) {
          createPeerConnection(participant.user._id);
        }
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      setError('Failed to access camera and microphone');
    }
  };

  // WebRTC peer connection management
  const createPeerConnection = (userId) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById(`remote-video-${userId}`);
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    peersRef.current[userId] = peerConnection;

    // Create and send offer if we are the host
    if (localUser?.isHost) {
      peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
          if (socketRef.current) {
            socketRef.current.emit('offer', {
              targetUserId: userId,
              offer: peerConnection.localDescription
            });
          }
        });
    }

    return peerConnection;
  };

  // WebRTC signal handlers
  const handleOffer = async ({ fromUserId, offer }) => {
    const peerConnection = peersRef.current[fromUserId] || createPeerConnection(fromUserId);

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    if (socketRef.current) {
      socketRef.current.emit('answer', {
        targetUserId: fromUserId,
        answer
      });
    }
  };

  const handleAnswer = async ({ fromUserId, answer }) => {
    const peerConnection = peersRef.current[fromUserId];
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleIceCandidate = async ({ fromUserId, candidate }) => {
    const peerConnection = peersRef.current[fromUserId];
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  // Media control functions
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);

        if (socketRef.current) {
          socketRef.current.emit('toggleAudio', { isMuted: !audioTrack.enabled });
        }
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);

        if (socketRef.current) {
          socketRef.current.emit('toggleVideo', { isVideoOff: !videoTrack.enabled });
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);

        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream;
        }

        // Add screen share to all peer connections
        Object.values(peersRef.current).forEach(peerConnection => {
          const sender = peerConnection.getSenders().find(s =>
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });

        if (socketRef.current) {
          socketRef.current.emit('toggleScreenShare', { isScreenSharing: true });
        }

        // Handle screen share end
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } else {
        stopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
      setError('Failed to share screen');
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    setIsScreenSharing(false);

    // Restore camera video
    if (localStreamRef.current && webcamRef.current) {
      Object.values(peersRef.current).forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
        }
      });
    }

    if (socketRef.current) {
      socketRef.current.emit('toggleScreenShare', { isScreenSharing: false });
    }
  };

  const toggleHandRaise = () => {
    const newHandRaised = !handRaised;
    setHandRaised(newHandRaised);

    if (socketRef.current) {
      socketRef.current.emit('raiseHand', { handRaised: newHandRaised });
    }
  };

  const leaveMeeting = () => {
    if (socketRef.current) {
      socketRef.current.emit('leaveMeeting');
    }

    // Stop all streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach(peerConnection => {
      peerConnection.close();
    });

    navigate('/meetings');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim() && socketRef.current) {
      socketRef.current.emit('sendMeetingMessage', {
        message: messageInput.trim()
      });
      setMessageInput('');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="meeting-loading">
        <div className="spinner"></div>
        <p>Connecting to meeting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meeting-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/meetings')}>Back to Meetings</button>
      </div>
    );
  }

  return (
    <div className="meeting-room">
      {/* Main Video Area */}
      <div className="video-container">
        {/* Local Video */}
        <div className="video-item local-video">
          <Webcam
            ref={webcamRef}
            audio={false}
            muted={true}
            className={isVideoOff ? 'hidden' : ''}
          />
          {isVideoOff && (
            <div className="video-placeholder">
              <div className="avatar">
                {localUser?.name?.charAt(0).toUpperCase()}
              </div>
              <span>{localUser?.name}</span>
            </div>
          )}
          <div className="video-info">
            <span>{localUser?.name} (You)</span>
            {isAudioMuted && <FiMicOff className="muted-indicator" />}
            {handRaised && <span className="hand-raised">✋</span>}
          </div>
        </div>

        {/* Remote Videos */}
        {participants.map(participant => (
          <div key={participant.user._id} className="video-item">
            <video
              id={`remote-video-${participant.user._id}`}
              autoPlay
              playsInline
              className={participant.isVideoOff ? 'hidden' : ''}
            />
            {participant.isVideoOff && (
              <div className="video-placeholder">
                <div className="avatar">
                  {participant.user.name?.charAt(0).toUpperCase()}
                </div>
                <span>{participant.user.name}</span>
              </div>
            )}
            <div className="video-info">
              <span>{participant.user.name}</span>
              {participant.isMuted && <FiMicOff className="muted-indicator" />}
              {participant.handRaised && <span className="hand-raised">✋</span>}
              {participant.isHost && <span className="host-badge">Host</span>}
            </div>
          </div>
        ))}

        {/* Screen Share */}
        {isScreenSharing && (
          <div className="video-item screen-share">
            <video
              ref={screenShareRef}
              autoPlay
              playsInline
              className="screen-video"
            />
            <div className="video-info">
              <span>Screen Share</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="meeting-controls">
        <div className="controls-left">
          <button
            onClick={toggleAudio}
            className={`control-btn ${isAudioMuted ? 'muted' : ''}`}
          >
            {isAudioMuted ? <FiMicOff /> : <FiMic />}
          </button>

          <button
            onClick={toggleVideo}
            className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
          >
            {isVideoOff ? <FiVideoOff /> : <FiVideo />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          >
            <FiMonitor />
          </button>

          <button
            onClick={toggleHandRaise}
            className={`control-btn ${handRaised ? 'active' : ''}`}
          >
            ✋
          </button>
        </div>

        <div className="controls-center">
          <button onClick={leaveMeeting} className="control-btn leave-btn">
            <FiPhone /> Leave
          </button>
        </div>

        <div className="controls-right">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`control-btn ${isChatOpen ? 'active' : ''}`}
          >
            <FiMessageSquare />
          </button>

          <button
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className={`control-btn ${isParticipantsOpen ? 'active' : ''}`}
          >
            <FiUsers />
          </button>

          <button onClick={toggleFullscreen} className="control-btn">
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>

          <button className="control-btn">
            <FiSettings />
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      {isChatOpen && (
        <div className="chat-sidebar">
          <div className="chat-header">
            <h3>Meeting Chat</h3>
            <button onClick={() => setIsChatOpen(false)}>×</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((message, index) => (
              <div key={index} className="chat-message">
                <strong>{message.sender.name}:</strong> {message.message}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="chat-input">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}

      {/* Participants Sidebar */}
      {isParticipantsOpen && (
        <div className="participants-sidebar">
          <div className="participants-header">
            <h3>Participants ({participants.length + 1})</h3>
            <button onClick={() => setIsParticipantsOpen(false)}>×</button>
          </div>
          <div className="participants-list">
            <div className="participant-item">
              <span>{localUser?.name} (You)</span>
              <div className="participant-status">
                {localUser?.isHost && <span className="host-badge">Host</span>}
                {isAudioMuted && <FiMicOff />}
                {isVideoOff && <FiVideoOff />}
                {handRaised && <span>✋</span>}
              </div>
            </div>
            {participants.map(participant => (
              <div key={participant.user._id} className="participant-item">
                <span>{participant.user.name}</span>
                <div className="participant-status">
                  {participant.isHost && <span className="host-badge">Host</span>}
                  {participant.isMuted && <FiMicOff />}
                  {participant.isVideoOff && <FiVideoOff />}
                  {participant.handRaised && <span>✋</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          Recording
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
