/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                corpus: {
                    base: "#F5F5F2",
                    structure: "#3E0040",
                    accent: "#D4AF37",
                    text: "#1A1A1A",
                    muted: "#E5E5E5",
                }
            },
            fontFamily: {
                serif: ['Merriweather', 'serif'],
                sans: ['Inter', 'sans-serif'],
            },
            typography: (theme) => ({
                DEFAULT: {
                    css: {
                        color: theme('colors.corpus.text'),
                        a: {
                            color: theme('colors.corpus.structure'),
                            '&:hover': {
                                color: theme('colors.corpus.accent'),
                            },
                        },
                        strong: {
                            color: theme('colors.corpus.structure'),
                        },
                        '--tw-prose-bullets': theme('colors.corpus.accent'),
                    },
                },
            }),
        },
    },
    plugins: [
        typography,
    ],
}