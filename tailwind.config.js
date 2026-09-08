/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#293548',
          850: '#172033',
        },
        team: {
          Consumer: '#3b82f6',
          Levelup: '#8b5cf6',
          Netcom: '#10b981',
          Artemis: '#f59e0b',
          Dispatch: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
