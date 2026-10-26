"use client";

import React, { useId } from "react";

export default function DompetkuLogo({ className = "w-8 h-8", ...props }) {
  const uid = useId().replace(/:/g, "_");

  return (
    <svg
      viewBox="0 0 240 240"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient id={`wbGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id={`wfGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id={`gcGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id={`ccGrad_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.85" />
        </linearGradient>
        <filter id={`shadow_${uid}`} x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#047857" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Floating Soft Background Orbs */}
      <circle cx="45" cy="50" r="18" fill="#a7f3d0" opacity="0.4" />
      <circle cx="195" cy="180" r="14" fill="#6ee7b7" opacity="0.3" />

      {/* Banknote & Card Peeking from Wallet */}
      <g transform="translate(68, 48) rotate(-10)">
        <rect width="48" height="28" rx="6" fill="#6ee7b7" stroke="#059669" strokeWidth="1.5" />
        <circle cx="24" cy="14" r="5" fill="#34d399" />
      </g>
      <g transform="translate(108, 44) rotate(12)">
        <rect width="44" height="28" rx="6" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
        <rect x="5" y="6" width="10" height="7" rx="2" fill="#fde047" />
      </g>

      {/* Wallet Main Body */}
      <rect
        x="42"
        y="70"
        width="144"
        height="110"
        rx="28"
        fill={`url(#wbGrad_${uid})`}
        filter={`url(#shadow_${uid})`}
      />

      {/* Wallet Front Pocket / Flap */}
      <path
        d="M42 98 C42 85 55 75 70 75 L158 75 C173 75 186 85 186 98 L186 112 C186 128 172 142 156 142 L72 142 C56 142 42 128 42 112 Z"
        fill={`url(#wfGrad_${uid})`}
      />

      {/* Cute Wallet Clasp with Gold Lock */}
      <g transform="translate(162, 110)">
        <rect x="-10" y="-12" width="22" height="24" rx="7" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
        <circle cx="1" cy="0" r="4" fill="#ffffff" />
      </g>

      {/* Cute Eyes */}
      <g>
        <circle cx="86" cy="108" r="7" fill="#0f172a" />
        <circle cx="84" cy="106" r="2.8" fill="#ffffff" />
        <circle cx="88.5" cy="110.5" r="1.4" fill="#ffffff" />
        <circle cx="128" cy="108" r="7" fill="#0f172a" />
        <circle cx="126" cy="106" r="2.8" fill="#ffffff" />
        <circle cx="130.5" cy="110.5" r="1.4" fill="#ffffff" />
      </g>

      {/* Cute Rosy Blush Cheeks */}
      <ellipse cx="73" cy="118" rx="6.5" ry="3.5" fill="#f472b6" opacity="0.65" />
      <ellipse cx="141" cy="118" rx="6.5" ry="3.5" fill="#f472b6" opacity="0.65" />

      {/* Cute Happy Smile */}
      <path
        d="M101 114 Q107 122 113 114"
        fill="none"
        stroke="#0f172a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Floating Big Gold Coin (Left) */}
      <g transform="translate(32, 130)">
        <circle cx="16" cy="16" r="16" fill={`url(#gcGrad_${uid})`} stroke="#b45309" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="12" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="3 2" />
        <text x="16" y="21" textAnchor="middle" fill="#78350f" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Rp</text>
      </g>

      {/* Floating Mini Chart Card (Right Bottom) */}
      <g transform="translate(142, 126) rotate(-6)">
        <rect width="64" height="68" rx="14" fill={`url(#ccGrad_${uid})`} stroke="#cbd5e1" strokeWidth="1.5" filter={`url(#shadow_${uid})`} />
        <line x1="12" y1="16" x2="52" y2="16" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        <rect x="14" y="38" width="8" height="18" rx="4" fill="#34d399" />
        <rect x="28" y="30" width="8" height="26" rx="4" fill="#10b981" />
        <rect x="42" y="22" width="8" height="34" rx="4" fill="#059669" />
        <circle cx="46" cy="22" r="3" fill="#f59e0b" />
      </g>

      {/* Floating Small Gold Coin (Top Right) */}
      <g transform="translate(182, 42)">
        <circle cx="12" cy="12" r="12" fill={`url(#gcGrad_${uid})`} stroke="#b45309" strokeWidth="1.5" />
        <path d="M12 7 L12 17 M7 12 L17 12" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Sparkle Twinkles */}
      <g fill="#fde047">
        <path d="M54 36 Q56 42 62 44 Q56 46 54 52 Q52 46 46 44 Q52 42 54 36 Z" />
        <path d="M138 28 Q139 32 143 33 Q139 34 138 38 Q137 34 133 33 Q137 32 138 28 Z" transform="scale(0.8) translate(30, 0)" />
        <circle cx="132" cy="165" r="2.5" fill="#fde047" />
      </g>
    </svg>
  );
}
