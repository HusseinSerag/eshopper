// Floating Dots Loader
function FloatingDots() {
  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-700 to-slate-900 animate-bounce"
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s',
          }}
        ></div>
      ))}
    </div>
  );
}

export function Loader() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 flex flex-col items-center justify-center h-48">
      <FloatingDots />
    </div>
  );
}
