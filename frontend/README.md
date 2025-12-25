# QuickGist Frontend

Modern React frontend for QuickGist - a fast snippet sharing service.

## ✨ Features

- Animated hero with ColorBends background
- Glassmorphism navbar
- Form validation with react-hook-form + zod
- React Query for data fetching
- Clerk authentication
- Responsive design with mobile-first approach

## 🛠️ Stack

- **React 19** with TypeScript
- **Vite** for blazing fast dev
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **React Query** for server state
- **Clerk** for auth

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build for production
bun run build
```

## 📁 Structure

```
src/
├── app/           # App entry, providers, router
├── pages/         # Route pages
├── components/    # UI and layout components
├── lib/           # API client, utilities
└── types/         # TypeScript types
```

## 🎨 Design System

- **Colors**: Amber Warmth theme
- **Borders**: Sharp 2px borders
- **Typography**: Google Sans
- **Animations**: Subtle, purposeful

## 📝 Environment

```env
VITE_SERVER_URI=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```
