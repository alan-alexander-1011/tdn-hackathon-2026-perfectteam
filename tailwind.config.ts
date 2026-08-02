import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#babbf1',
          dark: '#a2a4e8',
          light: '#d5d6f8',
        }
      },
    },
  },
  plugins: [],
}
export default config
