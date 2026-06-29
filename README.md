# Skinstric AI

An AI-powered skin-analysis platform built to a pixel-perfect Figma spec during a software development internship at Skinstric. Users take a live selfie or upload a photo, the image is sent base64-encoded to an AI REST API, and the results render in an interactive demographics dashboard with editable confidence scores.

**Live demo:** https://skinstric-internship1.vercel.app

## Features

- Live selfie capture via `getUserMedia`, or upload a photo instead
- Multi-step flow: Landing -> Upload -> Select -> Testing -> Demographics
- Image sent base64-encoded to an AI REST API for analysis
- Interactive demographics dashboard with editable confidence scores
- Built to a pixel-perfect Figma spec using a reusable component library
- Fully responsive across desktop, tablet, and mobile
- Shipped through a CI/CD pipeline to Vercel

## Tech Stack

React 19, Vite, React Router, Tailwind CSS, react-icons, REST APIs, getUserMedia

## Project Structure

```
src/
  assets/        static assets
  components/    reusable UI components
  pages/
    Landing.jsx
    Upload.jsx
    Select.jsx
    Testing.jsx
    Demographics.jsx
  App.jsx
  main.jsx
```

## Getting Started

```
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

To build for production:

```
npm run build
npm run preview
```

## About

Built during a software development internship at Skinstric.
