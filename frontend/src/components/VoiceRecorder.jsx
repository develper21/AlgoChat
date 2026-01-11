import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onRecordingComplete, onRecordingStart, onRecordingStop }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio analyser for visualization
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm;codecs=opus' });
        onRecordingComplete(audioFile);
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      onRecordingStart();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start audio level visualization
      updateAudioLevel();

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      onRecordingStop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  // Update audio level for visualization
  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const calculateVolume = () => {
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      return sum / dataArray.length;
    };

    const animate = () => {
      if (!isRecording || isPaused) return;
      
      const volume = calculateVolume();
      setAudioLevel(volume);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // Cancel recording
  const cancelRecording = () => {
    stopRecording();
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
      }
    };
  }, []);

  return (
    <div className="voice-recorder">
      {/* Recording Controls */}
      <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
        {/* Audio Level Indicator */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-1 h-4 rounded-full transition-colors ${
                audioLevel > i * 20 
                  ? 'bg-red-500' 
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Recording Status */}
        <div className="flex items-center gap-2">
          {isRecording && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-red-600">
                {formatTime(recordingTime)}
              </span>
              {isPaused && <span className="text-xs text-gray-500">(Paused)</span>}
            </div>
          )}

          {/* Control Buttons */}
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              title="Start recording"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 0114 0m-7 7v4m0 0v4" />
              </svg>
              <span className="text-sm">Record</span>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={togglePause}
                className="px-2 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197 2.132a1 1 0 00.555-.832V9.87a1 1 0 00-.555-.832L14.752 11.168zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              
              <button
                onClick={stopRecording}
                className="px-2 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title="Stop recording"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1v4a1 1 0 11-2 0v-4a1 1 0 012 0z" />
                </svg>
              </button>

              <button
                onClick={cancelRecording}
                className="px-2 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                title="Cancel recording"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!isRecording && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          Click to record voice message. Maximum duration: 5 minutes
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
