import React, { useState, useEffect, useRef, useCallback } from 'react';

// Lazy loading hook for images
export const useLazyImage = (src, placeholder = null) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageState, setImageState] = useState('loading'); // loading, loaded, error
  const [imageRef, inView] = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    if (inView && src && imageSrc !== src) {
      setImageState('loading');
      
      const img = new Image();
      img.src = src;
      
      img.onload = () => {
        setImageSrc(src);
        setImageState('loaded');
      };
      
      img.onerror = () => {
        setImageState('error');
        console.error(`Failed to load image: ${src}`);
      };
    }
  }, [inView, src, imageSrc]);

  return { imageRef, imageSrc, imageState };
};

// Intersection Observer hook
export const useIntersectionObserver = (options = {}) => {
  const [ref, setRef] = useState(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, options.threshold, options.rootMargin]);

  return [setRef, inView];
};

// Lazy Image Component
export const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/placeholder.jpg',
  onLoad,
  onError,
  ...props 
}) => {
  const { imageRef, imageSrc, imageState } = useLazyImage(src, placeholder);

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} ${imageState === 'loading' ? 'loading' : ''}`}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  );
};

// Infinite Scroll Hook
export const useInfiniteScroll = (callback, options = {}) => {
  const [isFetching, setIsFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      
      if (
        !isFetching &&
        hasMore &&
        scrollTop + clientHeight >= scrollHeight - (options.threshold || 100)
      ) {
        setIsFetching(true);
        callback().then((hasMoreData) => {
          setHasMore(hasMoreData);
          setIsFetching(false);
        }).catch(() => {
          setIsFetching(false);
        });
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [callback, isFetching, hasMore, options.threshold]);

  return { containerRef, isFetching, hasMore };
};

// Lazy Loading Messages Component
export const LazyMessages = ({ 
  messages, 
  onLoadMore, 
  hasMore, 
  isLoading,
  messageComponent: MessageComponent,
  className = ''
}) => {
  const { containerRef, isFetching } = useInfiniteScroll(onLoadMore, { threshold: 200 });
  const [visibleMessages, setVisibleMessages] = useState(messages.slice(0, 20));

  useEffect(() => {
    setVisibleMessages(messages.slice(0, 20));
  }, [messages]);

  const loadMoreMessages = useCallback(() => {
    const currentLength = visibleMessages.length;
    const newMessages = messages.slice(currentLength, currentLength + 20);
    setVisibleMessages(prev => [...prev, ...newMessages]);
  }, [messages, visibleMessages]);

  return (
    <div 
      ref={containerRef}
      className={`lazy-messages-container ${className}`}
      style={{ overflowY: 'auto', maxHeight: '600px' }}
    >
      {visibleMessages.map((message, index) => (
        <MessageComponent key={message._id} message={message} />
      ))}
      
      {(isFetching || isLoading) && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading more messages...</span>
        </div>
      )}
      
      {!hasMore && visibleMessages.length > 0 && (
        <div className="no-more-messages">
          <span>No more messages</span>
        </div>
      )}
    </div>
  );
};

// Virtual List Component for large datasets
export const VirtualList = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  overscan = 5,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length - 1
  );

  const visibleItems = items.slice(visibleStart, visibleEnd + 1);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{ height: containerHeight, overflowY: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              position: 'absolute',
              top: (visibleStart + index) * itemHeight,
              height: itemHeight,
              width: '100%'
            }}
          >
            {renderItem(item, visibleStart + index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// Progressive Image Loader
export const ProgressiveImage = ({ 
  src, 
  placeholderSrc, 
  alt, 
  className = '',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setImgSrc(src);
      setImgLoaded(true);
    };
  }, [src]);

  return (
    <div className={`progressive-image ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        className={`image ${imgLoaded ? 'loaded' : 'loading'}`}
        {...props}
      />
      {!imgLoaded && (
        <div className="image-placeholder">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

// Lazy Load Component for any content
export const LazyLoad = ({ 
  children, 
  className = '',
  placeholder = null,
  rootMargin = '50px',
  threshold = 0.1
}) => {
  const [ref, inView] = useIntersectionObserver({ rootMargin, threshold });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (inView && !isLoaded) {
      setIsLoaded(true);
    }
  }, [inView, isLoaded]);

  return (
    <div ref={ref} className={`lazy-load ${className}`}>
      {isLoaded ? children : placeholder || <div className="loading-placeholder">Loading...</div>}
    </div>
  );
};

// Debounced scroll handler
export const useDebouncedScroll = (callback, delay = 100) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

export default {
  LazyImage,
  LazyMessages,
  VirtualList,
  ProgressiveImage,
  LazyLoad,
  useLazyImage,
  useIntersectionObserver,
  useInfiniteScroll,
  useDebouncedScroll
};
