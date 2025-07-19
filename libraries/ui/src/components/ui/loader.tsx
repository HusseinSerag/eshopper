// Floating Dots Loader
function FloatingDots() {
  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-bounce"
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
      <h3 className="text-white text-lg mb-6 font-semibold">Floating Dots</h3>
      <FloatingDots />
    </div>
  );
}
