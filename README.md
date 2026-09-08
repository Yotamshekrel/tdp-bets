# TDP Placement Bets 🎯

A single-page application built with React 18, TypeScript, Vite, Tailwind CSS, and Firebase Firestore for predicting and tracking TDP member team placements.

## Features
- **Real-Time Live Updates**: Firebase Firestore live sync.
- **GitHub Pages Ready**: HashRouter and relative asset resolution (`base: './'`).
- **Responsive & Mobile-First**: Sticky headers, progress indicators, chips selection, and sticky first column table.
- **Automated Deployment**: GitHub Actions workflow included.

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set your Firebase configuration in `src/services/firebase.ts`.
3. Start development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
