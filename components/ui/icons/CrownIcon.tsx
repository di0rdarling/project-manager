import type { SVGProps } from "react";

export function CrownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 17h18M5.5 17 7 10l2.5 3.5L12 8l2.5 5.5L17 10l1.5 7M5.5 17h13"
      />
    </svg>
  );
}
