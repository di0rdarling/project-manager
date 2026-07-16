type ProjectManagerLogoProps = {
  className?: string;
};

/**
 * Wordmark logo used in the sidebar, mobile navbar, and landing page header.
 *
 * The icon mark reuses the exact same coordinates and color scheme as the
 * favicon (app/icon.svg) so the two stay visually identical. The viewBox is
 * cropped tightly around the icon + text (no trailing empty canvas) so the
 * mark actually fills whatever height it's rendered at, rather than
 * shrinking to fit inside a mostly-empty box.
 */
export function ProjectManagerLogo({ className }: Readonly<ProjectManagerLogoProps>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 106 32"
      fill="none"
      role="img"
      aria-label="Project Manager"
      className={className}
    >
      <title>Project Manager</title>
      <style>{`
        .pmlogo-back { fill: #3f3f46; }
        .pmlogo-mid { fill: #52525b; }
        .pmlogo-front { fill: #fafafa; }
        .pmlogo-line { stroke: #18181b; }
        .pmlogo-dot-o { fill: #fafafa; }
        .pmlogo-dot-m { fill: #71717a; }
        .pmlogo-dot-i { fill: #fafafa; }
        .pmlogo-manager-text { fill: #d4d4d8; }
      `}</style>

      {/* Back layer */}
      <rect x="10" y="10" width="16" height="13" rx="2.5" className="pmlogo-back" />
      {/* Mid layer */}
      <rect x="7" y="7" width="16" height="13" rx="2.5" className="pmlogo-mid" />
      {/* Front layer */}
      <rect x="4" y="4" width="16" height="13" rx="2.5" className="pmlogo-front" />
      {/* Document lines */}
      <line
        x1="7.5"
        y1="9"
        x2="17"
        y2="9"
        strokeWidth="2"
        strokeLinecap="round"
        className="pmlogo-line"
      />
      <line
        x1="7.5"
        y1="13"
        x2="14"
        y2="13"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
        className="pmlogo-line"
      />
      {/* AI dot */}
      <circle cx="23" cy="23" r="5" className="pmlogo-dot-o" />
      <circle cx="23" cy="23" r="3.2" className="pmlogo-dot-m" />
      <circle cx="23" cy="23" r="1.5" className="pmlogo-dot-i" />

      {/* Wordmark */}
      <text
        x="38"
        y="14"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
        fontSize="14"
        fontWeight="600"
        letterSpacing="-0.2"
        className="pmlogo-front"
      >
        Project
      </text>
      <text
        x="38"
        y="27"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
        fontSize="14"
        fontWeight="500"
        letterSpacing="-0.2"
        className="pmlogo-manager-text"
      >
        Manager
      </text>
    </svg>
  );
}
