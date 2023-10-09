/** @type {import('tailwindcss').Config} */
module.exports = {
    safelist: [
        "bg-success",
        "bg-danger",
        "bg-warning",
        "bg-caution",
        "bg-unavailable",
        "bg-primary",
        "shadow-success",
        "shadow-danger",
        "shadow-warning",
        "shadow-caution",
        "shadow-unavailable",
        "shadow-primary"
    ],
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        fontFamily: {
            'sans': ['Poppins', 'sans-serif'],
        },
        extend: {},
        colors: {
            'primary': 'var(--primary-color)',
            'primary-text': 'var(--primary-color-text)',
            'primary-darker': 'var(--primary-color-darker)',
            'white': 'var(--surface-a)',
            'bg': 'var(--bg)',
            'text': 'var(--text-color)',
            'surface-300': 'var(--surface-300)',
            'surface-500': 'var(--surface-500)',
            'warning': 'var(--warning)',
            'danger': 'var(--danger)',
            'success': 'var(--success)',
            'caution': 'var(--caution)',
            'unavailable': 'var(--unavailable)'
        },
    },
    plugins: [],
}
