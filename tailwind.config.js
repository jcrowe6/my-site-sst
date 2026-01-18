/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-librefranklin)'],
      }
    },
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '800px',
      // => @media (min-width: 768px) { ... }
      
      'lg': '1536px',
      // removing higher screens sets default to mobile size - which is what I want for this style of website
      //'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      //'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      //'2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    }
  },
  plugins: [],
}

