/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Paleta "Justiniano"
                corpus: {
                    base: "#F5F5F2",      // Off-White / Crema Claro (Fondo Principal)
                    structure: "#3E0040", // Púrpura Imperial Tirio (Nav, Headers)
                    accent: "#D4AF37",    // Oro Bizantino Antiguo (Botones, Alertas)
                    text: "#1A1A1A",      // Negro suave para lectura
                    muted: "#E5E5E5",     // Gris suave para bordes/divisores
                }
            },
            fontFamily: {
                serif: ['Merriweather', 'serif'], // Toque legal/clásico
                sans: ['Inter', 'sans-serif'],    // UI moderna
            }
        },
    },
    plugins: [],
}