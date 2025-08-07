# WhatsApp API Wrapper - Frontend

A modern frontend application built with Next.js and TypeScript for the WhatsApp Web.js REST API wrapper.

## Features

- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality
- Absolute imports with `@/` alias

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:4000](http://localhost:4000) with your browser to see the result.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── components/
├── public/
├── package.json
└── tsconfig.json
```

## Development

- `npm run dev` - Start development server on port 4000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
