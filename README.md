# Time Pilot (React + TypeScript)

A modernized version of the original Time Pilot prototype, now running as a React component in a TypeScript + Vite app.

## Quick Start

1. Install dependencies:

   npm install

2. Run the development server:

   npm run dev

3. Build for production:

   npm run build

## What Changed

- Migrated legacy AMD modules into ESM TypeScript modules under src/game.
- Added a reusable React component at src/components/TimePilotGame.tsx.
- Added a Vite + React + TypeScript toolchain.
- Moved runtime asset serving to Vite public assets (fonts, sprites, sounds).

## Component Usage

Use the game component directly in React:

import TimePilotGame from "./components/TimePilotGame";

function App() {
return <TimePilotGame debug />;
}

## Notes

- The initial migration prioritizes behavior parity. Legacy game modules are currently marked with @ts-nocheck and can be typed incrementally in follow-up passes.
