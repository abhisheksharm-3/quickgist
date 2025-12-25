# QuickGist

<p align="center"><img src="https://socialify.git.ci/abhisheksharm-3/quickgist/image?font=KoHo&language=1&name=1&owner=1&pattern=Charlie%20Brown&stargazers=1&theme=Dark" alt="QuickGist"></p>

**Share code, text, or files instantly.** No sign up required.

## 🚀 Demo

[quickgist.vercel.app](https://quickgist.vercel.app)

## ✨ Features

- **Instant Sharing** - Paste content, get a link in seconds
- **File Attachments** - Upload files up to 10MB
- **Syntax Highlighting** - Beautiful code formatting
- **No Account Required** - Share anonymously or sign in to manage your gists
- **Dark Theme** - Easy on the eyes

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Clerk

## 📦 Getting Started

### Frontend

```bash
cd frontend
bun install
bun dev
```

### Environment Variables

Create `.env.local` in the frontend directory:

```
VITE_SERVER_URI=http://localhost:3000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```