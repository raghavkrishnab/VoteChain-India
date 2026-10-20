import { APP_NAME } from '../config/config';

// 24-spoke wheel inspired by the Ashoka Chakra, with a saffron rim.
export function LogoMark({ size = 32 }) {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = (i * Math.PI) / 12;
    return <line key={i} x1={32 + 5 * Math.cos(a)} y1={32 + 5 * Math.sin(a)} x2={32 + 15 * Math.cos(a)} y2={32 + 15 * Math.sin(a)} />;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#13234a" />
      <circle cx="32" cy="32" r="18" fill="none" stroke="#ff9933" strokeWidth="3" />
      <g stroke="#ffffff" strokeWidth="1.3" strokeLinecap="round">{spokes}</g>
      <circle cx="32" cy="32" r="4" fill="#ffffff" />
      <path d="M22 55h20" stroke="#138808" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ light = false, size = 32 }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className={`font-display font-bold text-lg tracking-tight ${light ? 'text-white' : 'text-brand-900'}`}>{APP_NAME}</span>
    </span>
  );
}
