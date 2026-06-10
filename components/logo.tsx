import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      fill="none"
      role="img"
      aria-label="Vasool"
    >
      <defs>
        <linearGradient
          id="vasool-mark"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#FB7185" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#vasool-mark)" />
      {/* Rupee-style top bar + a bold "V" — money collected, settled up */}
      <path
        d="M10.5 11h11"
        stroke="white"
        strokeWidth="2.3"
        strokeLinecap="round"
      />
      <path
        d="M10.5 14.5 16 23l5.5-8.5"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
