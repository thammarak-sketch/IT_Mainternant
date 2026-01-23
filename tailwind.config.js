/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Kanit', 'sans-serif'],
            },
            colors: {
                theme1: '#26A69A',
                theme2: '#AED581',
                theme3: '#FFCA28',
                theme4: '#FF8A65',
                theme5: '#EF5350',
                theme6: '#4A2C6D',
                theme7: '#D32F2F',
                theme8: '#F57C00',
                theme9: '#FBC02D',
                theme10: '#0288D1',
            }
        },
    },
    plugins: [],
}
