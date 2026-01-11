import React, { useState, useRef, useEffect } from 'react';
import { FiImage, FiVolume2, FiVolumeX, FiSliders, FiCamera, FiMic } from 'react-icons/fi';
import './MeetingEffects.css';

const MeetingEffects = ({
  localStream,
  onStreamUpdate,
  isOpen,
  onClose
}) => {
  const [backgroundType, setBackgroundType] = useState('none');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [blurIntensity, setBlurIntensity] = useState(10);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [autoGainControl, setAutoGainControl] = useState(true);
  const [videoFilter, setVideoFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  const videoRef = useRef();
  const canvasRef = useRef();
  const audioContextRef = useRef();
  const sourceRef = useRef();
  const processorRef = useRef();
  const gainNodeRef = useRef();
  const animationFrameRef = useRef();

  const backgroundOptions = [
    { value: 'none', label: 'None', preview: null },
    { value: 'blur', label: 'Blur', preview: null },
    { value: 'image', label: 'Custom Image', preview: null },
    { value: 'office', label: 'Office', preview: '/images/office-bg.jpg' },
    { value: 'nature', label: 'Nature', preview: '/images/nature-bg.jpg' },
    { value: 'abstract', label: 'Abstract', preview: '/images/abstract-bg.jpg' }
  ];

  const videoFilters = [
    { value: 'none', label: 'None' },
    { value: 'grayscale', label: 'Grayscale' },
    { value: 'sepia', label: 'Sepia' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'cold', label: 'Cold' },
    { value: 'warm', label: 'Warm' }
  ];

  useEffect(() => {
    if (localStream && isOpen) {
      initializeEffects();
    }
    
    return () => {
      cleanupEffects();
    };
  }, [localStream, isOpen]);

  useEffect(() => {
    if (backgroundType !== 'none' && localStream) {
      applyBackgroundEffect();
    } else {
      stopBackgroundEffect();
    }
  }, [backgroundType, blurIntensity, backgroundImage]);

  useEffect(() => {
    if (localStream) {
      applyAudioEffects();
    }
  }, [noiseSuppression, echoCancellation, autoGainControl]);

  useEffect(() => {
    if (localStream) {
      applyVideoFilters();
    }
  }, [videoFilter, brightness, contrast, saturation]);

  const initializeEffects = () => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play();
    }
  };

  const applyBackgroundEffect = async () => {
    if (!localStream) return;

    try {
      // Stop any existing background processing
      stopBackgroundEffect();

      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = 640;
      canvas.height = 480;

      const processFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          if (backgroundType === 'blur') {
            applyBlurEffect(ctx, canvas);
          } else if (backgroundType === 'image' && backgroundImage) {
            applyImageBackground(ctx, canvas, backgroundImage);
          } else if (backgroundType !== 'none') {
            // Apply predefined background
            applyPresetBackground(ctx, canvas, backgroundType);
          }

          // Create new stream from canvas
          const newStream = canvas.captureStream(30);
          
          // Replace video track
          const videoTrack = newStream.getVideoTracks()[0];
          const oldVideoTrack = localStream.getVideoTracks()[0];
          
          if (oldVideoTrack) {
            oldVideoTrack.stop();
          }

          // Update stream
          const audioTracks = localStream.getAudioTracks();
          audioTracks.forEach(track => newStream.addTrack(track));
          
          onStreamUpdate(newStream);
        }

        animationFrameRef.current = requestAnimationFrame(processFrame);
      };

      processFrame();
    } catch (error) {
      console.error('Error applying background effect:', error);
    }
  };

  const applyBlurEffect = (ctx, canvas) => {
    // Simple blur effect using CSS filter on canvas
    ctx.filter = `blur(${blurIntensity}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  };

  const applyImageBackground = (ctx, canvas, imageUrl) => {
    const img = new Image();
    img.onload = () => {
      // Draw background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw video on top (you'd need person detection here)
      // This is a simplified version - real implementation would use ML models
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(canvas, 0, 0);
    };
    img.src = imageUrl;
  };

  const applyPresetBackground = (ctx, canvas, preset) => {
    // Apply preset background colors/gradients
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    switch (preset) {
      case 'office':
        gradient.addColorStop(0, '#2c3e50');
        gradient.addColorStop(1, '#34495e');
        break;
      case 'nature':
        gradient.addColorStop(0, '#27ae60');
        gradient.addColorStop(1, '#2ecc71');
        break;
      case 'abstract':
        gradient.addColorStop(0, '#8e44ad');
        gradient.addColorStop(0.5, '#3498db');
        gradient.addColorStop(1, '#e74c3c');
        break;
      default:
        return;
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const stopBackgroundEffect = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const applyAudioEffects = async () => {
    if (!localStream) return;

    try {
      // Clean up existing audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(localStream);
      sourceRef.current = source;

      // Create audio processing chain
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const gainNode = audioContext.createGain();
      gainNodeRef.current = gainNode;

      // Apply audio constraints
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const track = audioTracks[0];
        const constraints = track.getConstraints();
        
        track.applyConstraints({
          ...constraints,
          noiseSuppression,
          echoCancellation,
          autoGainControl
        });
      }

      // Simple noise reduction (you'd implement more sophisticated algorithms here)
      processor.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer;
        const outputBuffer = e.outputBuffer;
        
        for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
          const inputData = inputBuffer.getChannelData(channel);
          const outputData = outputBuffer.getChannelData(channel);
          
          for (let i = 0; i < inputData.length; i++) {
            // Simple noise gate
            if (Math.abs(inputData[i]) < 0.01) {
              outputData[i] = 0;
            } else {
              outputData[i] = inputData[i];
            }
          }
        }
      };

      source.connect(processor);
      processor.connect(gainNode);
      gainNode.connect(audioContext.destination);

    } catch (error) {
      console.error('Error applying audio effects:', error);
    }
  };

  const applyVideoFilters = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    let filterString = '';

    switch (videoFilter) {
      case 'grayscale':
        filterString = 'grayscale(100%)';
        break;
      case 'sepia':
        filterString = 'sepia(100%)';
        break;
      case 'vintage':
        filterString = 'sepia(50%) contrast(120%) brightness(90%)';
        break;
      case 'cold':
        filterString = 'hue-rotate(180deg) saturate(120%)';
        break;
      case 'warm':
        filterString = 'hue-rotate(30deg) saturate(120%) brightness(110%)';
        break;
      default:
        filterString = 'none';
    }

    // Add brightness, contrast, saturation adjustments
    if (brightness !== 100 || contrast !== 100 || saturation !== 100) {
      const adjustments = [];
      if (brightness !== 100) adjustments.push(`brightness(${brightness}%)`);
      if (contrast !== 100) adjustments.push(`contrast(${contrast}%)`);
      if (saturation !== 100) adjustments.push(`saturate(${saturation}%)`);
      
      filterString = filterString === 'none' 
        ? adjustments.join(' ')
        : `${filterString} ${adjustments.join(' ')}`;
    }

    video.style.filter = filterString;
  };

  const cleanupEffects = () => {
    stopBackgroundEffect();
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const handleBackgroundImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target.result);
        setBackgroundType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="meeting-effects">
      <div className="effects-header">
        <h3>Video & Audio Effects</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="effects-content">
        {/* Video Preview */}
        <div className="video-preview">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="preview-video"
          />
          <canvas
            ref={canvasRef}
            className="hidden-canvas"
          />
        </div>

        {/* Background Effects */}
        <div className="effect-section">
          <h4><FiImage /> Background</h4>
          <div className="background-options">
            {backgroundOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setBackgroundType(option.value)}
                className={`bg-option ${backgroundType === option.value ? 'active' : ''}`}
              >
                {option.preview ? (
                  <img src={option.preview} alt={option.label} />
                ) : (
                  <div className="bg-placeholder">
                    {option.value === 'blur' && 'Blur'}
                    {option.value === 'none' && 'None'}
                    {option.value === 'image' && 'Custom'}
                  </div>
                )}
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {backgroundType === 'blur' && (
            <div className="effect-control">
              <label>Blur Intensity: {blurIntensity}px</label>
              <input
                type="range"
                min="1"
                max="50"
                value={blurIntensity}
                onChange={(e) => setBlurIntensity(parseInt(e.target.value))}
              />
            </div>
          )}

          {backgroundType === 'image' && (
            <div className="effect-control">
              <label>Custom Background Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundImageUpload}
              />
            </div>
          )}
        </div>

        {/* Video Filters */}
        <div className="effect-section">
          <h4><FiCamera /> Video Filters</h4>
          <div className="filter-options">
            {videoFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setVideoFilter(filter.value)}
                className={`filter-option ${videoFilter === filter.value ? 'active' : ''}`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="video-adjustments">
            <div className="adjustment-control">
              <label>Brightness: {brightness}%</label>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value))}
              />
            </div>
            <div className="adjustment-control">
              <label>Contrast: {contrast}%</label>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value))}
              />
            </div>
            <div className="adjustment-control">
              <label>Saturation: {saturation}%</label>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Audio Effects */}
        <div className="effect-section">
          <h4><FiMic /> Audio Enhancement</h4>
          <div className="audio-controls">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={noiseSuppression}
                onChange={(e) => setNoiseSuppression(e.target.checked)}
              />
              Noise Suppression
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={echoCancellation}
                onChange={(e) => setEchoCancellation(e.target.checked)}
              />
              Echo Cancellation
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoGainControl}
                onChange={(e) => setAutoGainControl(e.target.checked)}
              />
              Auto Gain Control
            </label>
          </div>
        </div>

        {/* Reset Button */}
        <div className="effects-actions">
          <button
            onClick={() => {
              setBackgroundType('none');
              setVideoFilter('none');
              setBrightness(100);
              setContrast(100);
              setSaturation(100);
              setNoiseSuppression(true);
              setEchoCancellation(true);
              setAutoGainControl(true);
            }}
            className="reset-btn"
          >
            Reset All Effects
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingEffects;
