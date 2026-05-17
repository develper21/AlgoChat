const EnhancedChatBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100" />
      
      {/* Square box grid pattern */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute inset-0">
            {Array.from({ length: 15 }).map((_, j) => {
              const colors = ['bg-blue-200/20', 'bg-purple-200/20', 'bg-pink-200/20', 'bg-green-200/20', 'bg-yellow-200/20'];
              const sizes = ['w-8 h-8', 'w-6 h-6', 'w-10 h-10', 'w-4 h-4', 'w-12 h-12'];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
              const delay = Math.random() * 5;
              
              return (
                <div
                  key={`${i}-${j}`}
                  className={`absolute ${randomSize} ${randomColor} border border-white/30 rounded-sm animate-pulse`}
                  style={{
                    left: `${i * 5}%`,
                    top: `${j * 6.67}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: '3s'
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Floating square boxes */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => {
          const colors = ['bg-blue-300/30', 'bg-purple-300/30', 'bg-pink-300/30', 'bg-green-300/30'];
          const color = colors[i % colors.length];
          const size = 20 + Math.random() * 30;
          const left = Math.random() * 80;
          const top = Math.random() * 80;
          const delay = Math.random() * 10;
          
          return (
            <div
              key={`float-${i}`}
              className={`absolute ${color} border-2 border-white/40 rounded-sm shadow-lg`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                animation: `float-square ${8 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${delay}s`
              }}
            />
          );
        })}
      </div>

      {/* Overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-white/30" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/80 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white/60 to-transparent" />

      {/* Custom animations */}
      <style>{`
        @keyframes float-square {
          0%, 100% { 
            transform: translateY(0) rotate(0deg) scale(1); 
            opacity: 0.3;
          }
          25% { 
            transform: translateY(-20px) rotate(90deg) scale(1.1); 
            opacity: 0.5;
          }
          50% { 
            transform: translateY(0) rotate(180deg) scale(1); 
            opacity: 0.4;
          }
          75% { 
            transform: translateY(20px) rotate(270deg) scale(0.9); 
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedChatBackground;
