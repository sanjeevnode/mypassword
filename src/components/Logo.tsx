export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="MyPassword logo">
      <defs>
        <linearGradient id="lg-ring" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="lg-shield" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="1" stopColor="#4c1d95" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {/* black rounded tile with gradient ring */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="#08080c" />
      <rect x="2" y="2" width="60" height="60" rx="16" stroke="url(#lg-ring)" strokeWidth="2.5" />
      {/* shield */}
      <path
        d="M32 11.5 L49 18 V31 C49 41.5 41.5 48.5 32 52.5 C22.5 48.5 15 41.5 15 31 V18 Z"
        fill="url(#lg-shield)"
        stroke="url(#lg-ring)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* keyhole */}
      <circle cx="32" cy="28.5" r="5.5" fill="#ede9fe" />
      <path d="M32 31 L36.2 43 H27.8 Z" fill="#ede9fe" />
    </svg>
  );
}
