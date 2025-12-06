import React from 'react';

// Brand Palette - Justiniano
const colors = {
    structure: "#3E0040", // Tyrian Imperial Purple
    accent: "#D4AF37",    // Ancient Byzantine Gold
    base: "#F5F5F2",      // Off-White Background (for negative spaces)
};

interface LogoProps {
    className?: string;
    size?: number;
}

/**
 * Justiniano Logo Component.
 * * Represents the Byzantine Imperial Crown (Stemma) with Pendilia.
 * Symbolizes Authority (Auctoritas) and the codification of Law.
 */
export const Logo: React.FC<LogoProps> = ({
    className = "",
    size = 64
}) => {

    const svgProps = {
        width: size,
        height: size,
        viewBox: "0 0 64 64",
        fill: "none",
        xmlns: "http://www.w3.org/2000/svg",
        className: `transition-transform duration-300 hover:scale-105 ${className}`
    };

    return (
        <svg {...svgProps} aria-label="Justiniano Logo - Imperial Diadem">
            {/* --- PENDILIA (Hanging Ornaments) --- 
          These represent the jeweled chains hanging from the Byzantine crown (Stemma).
          Rendered first to stay in the background.
      */}

            {/* Left Pendilia */}
            <line x1="14" y1="38" x2="14" y2="52" stroke={colors.structure} strokeWidth="1.5" />
            <circle cx="14" cy="42" r="2" fill={colors.accent} />
            <circle cx="14" cy="48" r="2" fill={colors.accent} />
            <circle cx="14" cy="54" r="2.5" fill={colors.structure} />

            {/* Right Pendilia */}
            <line x1="50" y1="38" x2="50" y2="52" stroke={colors.structure} strokeWidth="1.5" />
            <circle cx="50" cy="42" r="2" fill={colors.accent} />
            <circle cx="50" cy="48" r="2" fill={colors.accent} />
            <circle cx="50" cy="54" r="2.5" fill={colors.structure} />

            {/* --- STEMMA (The Crown Body) --- */}

            {/* 1. Structural Base (Solid Purple Arch) - Represents the velvet/structure */}
            <path
                d="M10 38C10 24 20 14 32 14C44 14 54 24 54 38"
                stroke={colors.structure}
                strokeWidth="10"
                strokeLinecap="butt"
            />

            {/* 2. Gold Inlay (Inner Gold Arch) - Represents the gold plating */}
            <path
                d="M10 38C10 24 20 14 32 14C44 14 54 24 54 38"
                stroke={colors.accent}
                strokeWidth="4"
                strokeLinecap="butt"
            />

            {/* 3. Central Jewel (The Focus) - Represents central authority */}
            {/* Rotated square (rhombus) for dynamic visual weight */}
            <rect
                x="28"
                y="8"
                width="8"
                height="8"
                rx="1"
                fill={colors.structure}
                stroke={colors.accent}
                strokeWidth="2"
                transform="rotate(45 32 12)"
            />

            {/* 4. Upper Pearls - Decorative details on the rim */}
            <circle cx="18" cy="18" r="2" fill={colors.base} />
            <circle cx="46" cy="18" r="2" fill={colors.base} />

        </svg>
    );
};