export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="22" fill="url(#cdg)" />
      <circle cx="24" cy="24" r="15" stroke="white" strokeWidth="3" />
      <circle cx="24" cy="24" r="4" fill="white" />
      <path d="M9.5 17a15 15 0 0 1 29 0" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M9.5 31a15 15 0 0 0 29 0" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 39V28M12.8 33l7.6-5M35.2 33l-7.6-5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <defs>
        <linearGradient id="cdg" x1="2" y1="2" x2="46" y2="46">
          <stop stopColor="#2563eb" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  );
}
