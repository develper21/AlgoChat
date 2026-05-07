// Ultra Premium Chat Background - Next Level Design
// Revolutionary animated background with advanced visual effects

const EnhancedChatBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Multi-layer gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/3 via-transparent to-primary/3" />
        <div className="absolute inset-0 bg-gradient-to-bl from-secondary/2 via-transparent to-accent/2" />
      </div>

      {/* Advanced animated gradient orbs */}
      <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-gradient-to-r from-primary/8 to-secondary/6 rounded-full blur-[120px] animate-pulse" style={{animationDuration: '15s'}} />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-gradient-to-r from-accent/8 to-primary/6 rounded-full blur-[100px] animate-pulse" style={{animationDuration: '18s', animationDelay: '2s'}} />
      <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-gradient-to-r from-secondary/10 to-accent/8 rounded-full blur-[80px] animate-pulse" style={{animationDuration: '20s', animationDelay: '4s'}} />

      {/* Dynamic mesh pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="mesh" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 0 20 L 20 0 M 20 40 L 40 20 M 0 20 L 40 20 M 20 0 L 20 40" stroke="currentColor" strokeWidth="0.5" fill="none"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mesh)" />
      </svg>

      {/* Premium floating elements with enhanced animations */}
      <div className="absolute inset-0">
        {/* Animated chat bubbles with rotation */}
        <div className="absolute top-[8%] left-[10%] w-12 h-12 bg-primary/10 rounded-2xl backdrop-blur-sm animate-float-rotate" style={{animationDuration: '12s'}}>
          <div className="w-full h-full rounded-2xl border border-primary/20" />
        </div>
        
        <div className="absolute top-[25%] right-[15%] w-10 h-10 bg-secondary/10 rounded-2xl backdrop-blur-sm animate-float-rotate" style={{animationDuration: '15s', animationDelay: '1s'}}>
          <div className="w-full h-full rounded-2xl border border-secondary/20" />
        </div>

        <div className="absolute bottom-[30%] left-[8%] w-8 h-8 bg-accent/10 rounded-2xl backdrop-blur-sm animate-float-rotate" style={{animationDuration: '18s', animationDelay: '2s'}}>
          <div className="w-full h-full rounded-2xl border border-accent/20" />
        </div>

        {/* Glowing hearts with pulsing effect */}
        <div className="absolute top-[12%] right-[30%] animate-heart-pulse" style={{animationDuration: '4s'}}>
          <svg className="w-6 h-6 text-pink-500/20 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>

        <div className="absolute bottom-[25%] right-[20%] animate-heart-pulse" style={{animationDuration: '5s', animationDelay: '1s'}}>
          <svg className="w-5 h-5 text-pink-500/15 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>

        {/* Sparkling stars with enhanced glow */}
        <div className="absolute top-[5%] left-[40%] animate-star-sparkle" style={{animationDuration: '3s'}}>
          <svg className="w-5 h-5 text-yellow-500/30 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        <div className="absolute top-[40%] right-[8%] animate-star-sparkle" style={{animationDuration: '4s', animationDelay: '1s'}}>
          <svg className="w-4 h-4 text-yellow-500/25 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        <div className="absolute bottom-[40%] left-[35%] animate-star-sparkle" style={{animationDuration: '5s', animationDelay: '2s'}}>
          <svg className="w-3 h-3 text-yellow-500/20 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        {/* Floating paper planes with trail effect */}
        <div className="absolute top-[35%] left-[5%] animate-plane-float" style={{animationDuration: '16s'}}>
          <svg className="w-6 h-6 text-blue-500/20 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </div>

        <div className="absolute bottom-[20%] right-[25%] animate-plane-float" style={{animationDuration: '20s', animationDelay: '3s'}}>
          <svg className="w-5 h-5 text-blue-500/15 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </div>

        {/* Rotating geometric shapes */}
        <div className="absolute top-[15%] left-[60%] animate-rotate-scale" style={{animationDuration: '25s'}}>
          <div className="w-4 h-4 border-2 border-purple-500/20 rounded-sm transform rotate-45" />
        </div>

        <div className="absolute top-[70%] right-[15%] animate-rotate-scale" style={{animationDuration: '30s', animationDelay: '5s'}}>
          <div className="w-3 h-3 border-2 border-purple-500/15 rounded-full" />
        </div>

        {/* Pulsing dots with glow */}
        <div className="absolute top-[20%] left-[75%] animate-ping" style={{animationDuration: '3s'}}>
          <div className="w-2 h-2 bg-green-500/30 rounded-full" />
        </div>
        <div className="absolute top-[60%] left-[20%] animate-ping" style={{animationDuration: '4s', animationDelay: '1s'}}>
          <div className="w-2 h-2 bg-green-500/25 rounded-full" />
        </div>
        <div className="absolute bottom-[35%] right-[40%] animate-ping" style={{animationDuration: '3.5s', animationDelay: '2s'}}>
          <div className="w-1.5 h-1.5 bg-green-500/20 rounded-full" />
        </div>

        {/* Sound waves */}
        <div className="absolute top-[45%] right-[5%] animate-sound-wave" style={{animationDuration: '6s'}}>
          <svg className="w-5 h-5 text-orange-500/20 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </div>

        <div className="absolute bottom-[15%] left-[25%] animate-sound-wave" style={{animationDuration: '7s', animationDelay: '2s'}}>
          <svg className="w-4 h-4 text-orange-500/15 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>

        {/* Floating emoji faces */}
        <div className="absolute top-[55%] left-[45%] animate-emoji-float" style={{animationDuration: '22s', animationDelay: '4s'}}>
          <svg className="w-6 h-6 text-yellow-400/20 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="15.5" cy="9.5" r="1.5"/>
            <circle cx="8.5" cy="9.5" r="1.5"/>
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </div>

        {/* Camera icons */}
        <div className="absolute bottom-[8%] right-[18%] animate-camera-bounce" style={{animationDuration: '16s', animationDelay: '3s'}}>
          <svg className="w-5 h-5 text-cyan-500/20 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 15.2A3.2 3.2 0 1 0 8.8 12 3.2 3.2 0 0 0 12 15.2zm0-4.8c.88 0 1.6.72 1.6 1.6s-.72 1.6-1.6 1.6-1.6-.72-1.6-1.6.72-1.6 1.6-1.6zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
          </svg>
        </div>

        {/* Link icons */}
        <div className="absolute top-[30%] left-[35%] animate-link-pulse" style={{animationDuration: '9s', animationDelay: '1.5s'}}>
          <svg className="w-4 h-4 text-indigo-500/20 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V15h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
          </svg>
        </div>
      </div>

      {/* Advanced glass morphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-base-100/30 via-transparent to-base-100/20 backdrop-blur-[1px]" />

      {/* Premium noise texture */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-base-100/40 to-transparent pointer-events-none" />

      {/* Top gradient fade */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-base-100/30 to-transparent pointer-events-none" />

      {/* Custom advanced animations */}
      <style>{`
        @keyframes float-rotate {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-30px) rotate(90deg) scale(1.1); }
          50% { transform: translateY(0) rotate(180deg) scale(1); }
          75% { transform: translateY(30px) rotate(270deg) scale(0.9); }
        }
        
        @keyframes heart-pulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          25% { transform: scale(1.2); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.4; }
          75% { transform: scale(1.15); opacity: 0.45; }
        }
        
        @keyframes star-sparkle {
          0%, 100% { opacity: 0.2; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.6; transform: scale(1.3) rotate(180deg); }
        }
        
        @keyframes plane-float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(20px, -15px) rotate(15deg); }
          50% { transform: translate(0, -30px) rotate(0deg); }
          75% { transform: translate(-20px, -15px) rotate(-15deg); }
        }
        
        @keyframes rotate-scale {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.5); }
        }
        
        @keyframes sound-wave {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          25% { transform: scale(1.1); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.25; }
          75% { transform: scale(1.1); opacity: 0.35; }
        }
        
        @keyframes emoji-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-25px) rotate(120deg); }
          66% { transform: translateY(25px) rotate(240deg); }
        }
        
        @keyframes camera-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(-10deg); }
          75% { transform: translateY(20px) rotate(10deg); }
        }
        
        @keyframes link-pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.2); opacity: 0.4; }
        }
        
        .animate-float-rotate {
          animation: float-rotate ease-in-out infinite;
        }
        
        .animate-heart-pulse {
          animation: heart-pulse ease-in-out infinite;
        }
        
        .animate-star-sparkle {
          animation: star-sparkle ease-in-out infinite;
        }
        
        .animate-plane-float {
          animation: plane-float ease-in-out infinite;
        }
        
        .animate-rotate-scale {
          animation: rotate-scale linear infinite;
        }
        
        .animate-sound-wave {
          animation: sound-wave ease-in-out infinite;
        }
        
        .animate-emoji-float {
          animation: emoji-float ease-in-out infinite;
        }
        
        .animate-camera-bounce {
          animation: camera-bounce ease-in-out infinite;
        }
        
        .animate-link-pulse {
          animation: link-pulse ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default EnhancedChatBackground;
