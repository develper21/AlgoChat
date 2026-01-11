import React, { useState } from 'react';

const FilePreview = ({ fileUrl, fileType, fileName, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getFileTypeIcon = (type) => {
    if (!type) return '📄';
    
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return '🗜️';
    if (type.includes('text')) return '📄';
    
    return '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileExtension = (url) => {
    return url.split('.').pop().toLowerCase();
  };

  const isImageFile = (type, url) => {
    return type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(getFileExtension(url));
  };

  const isVideoFile = (type, url) => {
    return type?.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(getFileExtension(url));
  };

  const isAudioFile = (type, url) => {
    return type?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac'].includes(getFileExtension(url));
  };

  const isPdfFile = (type, url) => {
    return type?.includes('pdf') || getFileExtension(url) === 'pdf';
  };

  const renderPreview = () => {
    if (isImageFile(fileType, fileUrl)) {
      return (
        <div className="image-preview">
          <img
            src={fileUrl}
            alt={fileName || 'Image'}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load image');
            }}
            className="max-w-full max-h-96 rounded-lg shadow-lg"
          />
        </div>
      );
    }

    if (isVideoFile(fileType, fileUrl)) {
      return (
        <div className="video-preview">
          <video
            controls
            className="max-w-full max-h-96 rounded-lg shadow-lg"
            onLoadStart={() => setIsLoading(false)}
          >
            <source src={fileUrl} type={fileType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (isAudioFile(fileType, fileUrl)) {
      return (
        <div className="audio-preview p-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎵</div>
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={fileUrl} type={fileType} />
                Your browser does not support the audio element.
              </audio>
              <p className="text-sm text-gray-600 mt-2">{fileName || 'Audio file'}</p>
            </div>
          </div>
        </div>
      );
    }

    if (isPdfFile(fileType, fileUrl)) {
      return (
        <div className="pdf-preview">
          <iframe
            src={fileUrl}
            className="w-full h-96 rounded-lg shadow-lg"
            title={fileName || 'PDF Document'}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load PDF');
            }}
          />
        </div>
      );
    }

    // Default file preview
    return (
      <div className="file-preview p-8 text-center">
        <div className="text-6xl mb-4">{getFileTypeIcon(fileType)}</div>
        <h3 className="text-lg font-medium mb-2">{fileName || 'Unknown File'}</h3>
        <p className="text-gray-600 mb-4">{fileType || 'Unknown type'}</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          download={fileName}
        >
          Download File
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-screen overflow-auto relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading...</span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Open in New Tab
            </a>
          </div>
        )}

        {/* File preview */}
        {!isLoading && !error && renderPreview()}
      </div>
    </div>
  );
};

export default FilePreview;
