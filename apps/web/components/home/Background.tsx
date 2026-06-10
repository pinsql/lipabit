export default function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* Base grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Orange glow — top left */}
      <div
        className="absolute rounded-full"
        style={{
          width: 900,
          height: 900,
          top: -300,
          left: -200,
          background: 'radial-gradient(circle, rgba(247,147,26,0.18) 0%, transparent 70%)',
          animation: 'orbFloat1 18s ease-in-out infinite',
        }}
      />

      {/* Blue/indigo glow — bottom right */}
      <div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          bottom: -250,
          right: -150,
          background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)',
          animation: 'orbFloat2 22s ease-in-out infinite',
        }}
      />

      {/* Subtle center radial */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(247,147,26,0.06) 0%, transparent 60%)',
        }}
      />
    </div>
  );
}
