import { Package } from 'lucide-react';
export function DeliveryArtwork() {
  return (
    <div className="city-art">
      <svg viewBox="0 0 600 390" aria-hidden="true">
        <defs>
          <linearGradient id="citybg" x2="0" y2="1">
            <stop stopColor="#407f70" />
            <stop offset="1" stopColor="#163c33" />
          </linearGradient>
        </defs>
        <circle cx="460" cy="68" r="49" fill="#e5cb84" opacity=".9" />
        <path
          d="M0 260V130h44v130h13V80h55v180h19V30h75v230h21V110h53v150h21V64h78v196h18V140h50v120h20V105h75v155h68v130H0Z"
          fill="url(#citybg)"
          opacity=".8"
        />
        {Array.from({ length: 8 }, (_, i) => (
          <g key={i} opacity=".23">
            <path
              d={`M${145 + i * 5} 65v150M320 ${85 + i * 16}h42`}
              stroke="#bde1b2"
              strokeWidth="2"
            />
          </g>
        ))}
        <path d="M-50 345Q240 160 660 275V450H-50" fill="#122e29" />
        <path
          d="M-20 380Q270 220 650 320"
          fill="none"
          stroke="#427565"
          strokeWidth="3"
          strokeDasharray="28 24"
        />
        <ellipse cx="335" cy="334" rx="130" ry="15" fill="#0b2924" />
        <circle cx="262" cy="310" r="31" fill="#092b25" stroke="#93bda6" strokeWidth="8" />
        <circle cx="415" cy="310" r="31" fill="#092b25" stroke="#93bda6" strokeWidth="8" />
        <path
          d="m263 308 49-66 77 12 26 55H300"
          fill="none"
          stroke="#43b98b"
          strokeWidth="17"
          strokeLinejoin="round"
        />
        <path
          d="m390 252 5-38 26-15"
          fill="none"
          stroke="#a9d9ba"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="m305 250 31-48 44 28 11 44"
          fill="none"
          stroke="#e2dbb8"
          strokeWidth="21"
          strokeLinecap="round"
        />
        <path
          d="m333 206-6-56 24-22 27 69 22 17"
          fill="none"
          stroke="#18a778"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <circle cx="344" cy="115" r="23" fill="#e2d0a4" />
        <path d="M321 114q-4-33 25-33t27 35" fill="#1abc87" />
        <path d="m345 105 28 4" stroke="#0c342c" strokeWidth="8" />
        <rect
          x="240"
          y="180"
          width="65"
          height="65"
          rx="9"
          fill="#13a476"
          stroke="#78cfad"
          strokeWidth="2"
        />
        <path
          d="m279 196-18 18h22l-18 18"
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <rect x="287" y="246" width="71" height="11" rx="5" fill="#082f27" />
      </svg>
      <div className="art-delivery">
        <span className="icon-tile">
          <Package size={19} />
        </span>
        <div>
          <strong>Every delivery matters.</strong>
          <small>Your city. Your people. Connected.</small>
        </div>
        <span className="delivery-check">✓</span>
      </div>
    </div>
  );
}
