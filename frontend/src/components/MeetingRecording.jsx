import React, { useState, useRef, useEffect } from 'react';
import { FiCircle, FiSquare, FiDownload, FiPlay, FiPause, FiSettings } from 'react-icons/fi';
import './MeetingRecording.css';

const MeetingRecording = ({
  isRecording,
  isPaused,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDownloadRecording,
  localUser,
  meeting
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [recordingQuality, setRecordingQuality] = useState('720p');
  const [recordAudio, setRecordAudio] = useState(true);
  const [recordVideo, setRecordVideo] = useState(true);
  const [recordScreenShare, setRecordScreenShare] = useState(true);
  const [recordChat, setRecordChat] = useState(true);
  const [storageLocation, setStorageLocation] = useState('cloud');
  const [autoSave, setAutoSave] = useState(true);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);

  const qualities = [
    { label: '360p', value: '360p', width: 640, height: 360 },
    { label: '480p', value: '480p', width: 854, height: 480 },
    { label: '720p', value: '720p', width: 1280, height: 720 },
    { label: '1080p', value: '1080p', width: 1920, height: 1080 }
  ];

  useEffect(() => {
    if (isRecording && !isPaused) {
      const interval = setInterval(() => {
        // Update recording duration
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, isPaused]);

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const selectedQuality = qualities.find(q => q.value === recordingQuality);

      // Create canvas for recording
      const canvas = document.createElement('canvas');
      canvas.width = selectedQuality.width;
      canvas.height = selectedQuality.height;
      const ctx = canvas.getContext('2d');

      // Get all video streams
      const streams = [];

      if (recordVideo) {
        const localVideo = document.querySelector('.local-video video');
        if (localVideo && localVideo.srcObject) {
          streams.push(localVideo.srcObject);
        }
      }

      // Add screen share stream if active
      if (recordScreenShare) {
        const screenVideo = document.querySelector('.screen-share video');
        if (screenVideo && screenVideo.srcObject) {
          streams.push(screenVideo.srcObject);
        }
      }

      if (streams.length === 0) {
        alert('No video streams available for recording');
        return;
      }

      // Combine streams
      const combinedStream = new MediaStream();
      streams.forEach(stream => {
        stream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      });

      // Add audio if enabled
      if (recordAudio) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getAudioTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      }

      streamRef.current = combinedStream;

      // Create media recorder
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: recordingQuality === '1080p' ? 5000000 :
          recordingQuality === '720p' ? 2500000 :
            recordingQuality === '480p' ? 1000000 : 500000
      };

      mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
      recordedChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        handleRecordingComplete(blob);
      };

      mediaRecorderRef.current.start();
      onStartRecording();

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check camera and microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();

      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      onStopRecording();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      onPauseRecording();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      onResumeRecording();
    }
  };

  const handleRecordingComplete = async (blob) => {
    // Create download URL
    const url = URL.createObjectURL(blob);

    if (autoSave || storageLocation === 'cloud') {
      // Upload to cloud storage
      try {
        const formData = new FormData();
        formData.append('recording', blob, `meeting-${meeting._id}-${Date.now()}.webm`);
        formData.append('meetingId', meeting._id);
        formData.append('duration', recordingDuration);
        formData.append('quality', recordingQuality);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meetings/${meeting._id}/upload-recording`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('algonive_token')}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Recording uploaded successfully:', data);
        }
      } catch (error) {
        console.error('Error uploading recording:', error);
      }
    }

    if (storageLocation === 'local' || !autoSave) {
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-${meeting._id}-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const isHost = localUser?.isHost;

  if (!isHost) {
    return null; // Only host can control recording
  }

  return (
    <div className="meeting-recording">
      <div className="recording-controls">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="record-btn start-record"
            title="Start Recording"
          >
            <FiCircle /> Record
          </button>
        ) : (
          <div className="recording-active">
            <div className="recording-indicator">
              <div className="recording-dot"></div>
              <span>REC {formatDuration(recordingDuration || 0)}</span>
            </div>

            <div className="recording-actions">
              {!isPaused ? (
                <button
                  onClick={pauseRecording}
                  className="record-btn pause-record"
                  title="Pause Recording"
                >
                  <FiPause />
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="record-btn resume-record"
                  title="Resume Recording"
                >
                  <FiPlay />
                </button>
              )}

              <button
                onClick={stopRecording}
                className="record-btn stop-record"
                title="Stop Recording"
              >
                <FiSquare /> Stop
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`record-btn settings-btn ${showSettings ? 'active' : ''}`}
          title="Recording Settings"
        >
          <FiSettings />
        </button>
      </div>

      {showSettings && (
        <div className="recording-settings">
          <h4>Recording Settings</h4>

          <div className="setting-group">
            <label>Video Quality</label>
            <select
              value={recordingQuality}
              onChange={(e) => setRecordingQuality(e.target.value)}
              disabled={isRecording}
            >
              {qualities.map(quality => (
                <option key={quality.value} value={quality.value}>
                  {quality.label}
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <label>Record Audio</label>
            <input
              type="checkbox"
              checked={recordAudio}
              onChange={(e) => setRecordAudio(e.target.checked)}
              disabled={isRecording}
            />
          </div>

          <div className="setting-group">
            <label>Record Video</label>
            <input
              type="checkbox"
              checked={recordVideo}
              onChange={(e) => setRecordVideo(e.target.checked)}
              disabled={isRecording}
            />
          </div>

          <div className="setting-group">
            <label>Record Screen Share</label>
            <input
              type="checkbox"
              checked={recordScreenShare}
              onChange={(e) => setRecordScreenShare(e.target.checked)}
              disabled={isRecording}
            />
          </div>

          <div className="setting-group">
            <label>Record Chat</label>
            <input
              type="checkbox"
              checked={recordChat}
              onChange={(e) => setRecordChat(e.target.checked)}
              disabled={isRecording}
            />
          </div>

          <div className="setting-group">
            <label>Storage Location</label>
            <select
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              disabled={isRecording}
            >
              <option value="cloud">Cloud Storage</option>
              <option value="local">Local Download</option>
            </select>
          </div>

          <div className="setting-group">
            <label>Auto-save</label>
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              disabled={isRecording || storageLocation === 'local'}
            />
          </div>

          <div className="recording-info">
            <p><strong>Note:</strong> Recording requires camera and microphone permissions.</p>
            <p>Recordings will be stored according to your settings above.</p>
            {meeting?.allowRecording === false && (
              <p className="warning">Recording is disabled for this meeting.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRecording;
