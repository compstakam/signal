export default function SignalLogo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="32" height="30" viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* City skyline - 4 buildings of varying heights */}
        {/* Building 1 - short left */}
        <rect x="2" y="22" width="6" height="14" fill="#228FFF" />
        {/* Building 2 - medium */}
        <rect x="10" y="16" width="7" height="20" fill="#22D4FF" />
        {/* Building 3 - tallest (beacon source) */}
        <rect x="19" y="8" width="7" height="28" fill="#228FFF" />
        {/* Building 4 - medium-short right */}
        <rect x="28" y="20" width="6" height="16" fill="#22D4FF" />

        {/* Building windows - subtle detail */}
        <rect x="4" y="25" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="4" y="29" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="12" y="19" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="12" y="23" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="12" y="27" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="21" y="11" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="21" y="15" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="21" y="19" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="21" y="23" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="30" y="23" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />
        <rect x="30" y="27" width="2" height="2" rx="0.3" fill="#0a1628" opacity="0.4" />

        {/* Beacon dot on tallest building */}
        <circle cx="22.5" cy="5" r="1.5" fill="#22D4FF" />

        {/* Radiating beacon arcs - concentric waves with decreasing opacity */}
        <path
          d="M16.5 5 A6 6 0 0 1 28.5 5"
          stroke="#22D4FF"
          strokeWidth="1.2"
          fill="none"
          opacity="0.7"
          strokeLinecap="round"
          transform="rotate(-90, 22.5, 5)"
        />
        <path
          d="M14 5 A8.5 8.5 0 0 1 31 5"
          stroke="#22D4FF"
          strokeWidth="1"
          fill="none"
          opacity="0.45"
          strokeLinecap="round"
          transform="rotate(-90, 22.5, 5)"
        />
        <path
          d="M11.5 5 A11 11 0 0 1 33.5 5"
          stroke="#22D4FF"
          strokeWidth="0.8"
          fill="none"
          opacity="0.2"
          strokeLinecap="round"
          transform="rotate(-90, 22.5, 5)"
        />
      </svg>
      <span className="text-lg font-bold text-white tracking-tight uppercase">Signal</span>
    </div>
  );
}
