/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#f8f9fa',
                primary: {
                    50: '#f0f7ff',
                    100: '#e0effe',
                    500: '#007aff', // Apple/Toss Blue
                    600: '#0062cc',
                },
                slate: {
                    900: '#1c1c1e', // Apple Dark
                }
            },
            borderRadius: {
                '3xl': '24px',
                '4xl': '32px',
            },
            boxShadow: {
                'premium': '0 4px 24px rgba(0, 0, 0, 0.04)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
            }
        },
    },
    plugins: [],
}
