export function CukupKeLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CukupKe Side-Eye Tabung"
    >
      {/* Coin dropping into tabung */}
      <circle
        cx="18"
        cy="5.5"
        r="3.1"
        fill="#e9c46a"
        stroke="#1f2421"
        strokeWidth="1.5"
      />

      {/* Translucent green glass jar body */}
      <rect
        x="7"
        y="12.5"
        width="22"
        height="20.5"
        rx="5.5"
        fill="#52b788"
        fillOpacity="0.22"
        stroke="#1f2421"
        strokeWidth="1.7"
      />

      {/* Inner translucent savings fill */}
      <path
        d="M8 24.5H28V27.5C28 30.1 25.9 32.2 23.3 32.2H12.7C10.1 32.2 8 30.1 8 27.5V24.5Z"
        fill="#40916c"
        fillOpacity="0.26"
      />

      {/* Glass reflection highlight */}
      <rect
        x="9.5"
        y="15"
        width="1.8"
        height="13.5"
        rx="0.9"
        fill="#ffffff"
        fillOpacity="0.55"
      />

      {/* Jar lid + coin slot */}
      <rect
        x="8.5"
        y="8.5"
        width="19"
        height="4.2"
        rx="2"
        fill="#74c69d"
        fillOpacity="0.45"
        stroke="#1f2421"
        strokeWidth="1.6"
      />
      <rect x="13.5" y="9.9" width="9" height="1.4" rx="0.7" fill="#1f2421" />

      {/* Skeptical raised eyebrows */}
      <path
        d="M10.5 16.3L15 16.6"
        stroke="#1f2421"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M20.8 15.2C22 14.3 23.8 14.4 25.2 15.3"
        stroke="#1f2421"
        strokeWidth="1.35"
        strokeLinecap="round"
      />

      {/* Side-eyes looking right */}
      <ellipse
        cx="13"
        cy="19.8"
        rx="2.7"
        ry="2.3"
        fill="#ffffff"
        stroke="#1f2421"
        strokeWidth="1.3"
      />
      <circle cx="14.2" cy="19.9" r="1.15" fill="#1f2421" />

      <ellipse
        cx="22.8"
        cy="19.8"
        rx="2.7"
        ry="2.3"
        fill="#ffffff"
        stroke="#1f2421"
        strokeWidth="1.3"
      />
      <circle cx="24" cy="19.9" r="1.15" fill="#1f2421" />

      {/* Deadpan "cukup ke?" mouth */}
      <path
        d="M14.5 26C16.8 25.3 19.2 25.3 21.5 26"
        stroke="#1f2421"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}
