/** Декоративный фон: орбы + лёгкая сетка (не блокирует клики). */
export default function AppBackground() {
  return (
    <div className="app-bg" aria-hidden>
      <div className="app-bg-orb app-bg-orb-1" />
      <div className="app-bg-orb app-bg-orb-2" />
      <div className="app-bg-orb app-bg-orb-3" />
      <div className="app-bg-grid" />
    </div>
  );
}
