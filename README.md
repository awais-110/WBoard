# 🎨 Real-Time Collaborative Whiteboard

A production-grade, real-time collaborative whiteboard application built with **Next.js 14**, **Supabase**, **Fabric.js**, and **Tailwind CSS**. Deployed on **Vercel** with WebSocket-based real-time synchronization.

[![Next.js](https://img.shields.io/badge/Next.js%2014-000?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase)](https://supabase.com)
[![Fabric.js](https://img.shields.io/badge/Fabric.js-5-blue)](http://fabricjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com)

## ✨ Features

### 🎯 Drawing & Tools
- Pen, Rectangle, Circle, Line, Text, Sticky Notes, Eraser
- Real-time synchronized drawing across all collaborators
- Undo/Redo (50-step history)
- Keyboard shortcuts for all tools
- Zoom & Pan controls with mouse wheel support

### 🤝 Real-Time Collaboration  
- Live cursors with collaborator names and colors
- Supabase Realtime (WebSocket-based) for instant sync
- Role-based access control (Viewer, Editor, Admin)
- Invite collaborators by email
- Presence tracking for online status

### 💾 Persistence & Export
- Auto-save to database every 30 seconds
- Download as PNG (2x retina), SVG, or JSON
- Board thumbnails
- Full canvas snapshots for offline use

### 🔐 Security
- Supabase Row-Level Security (RLS)
- Email/password authentication
- Authorization checks on all API routes
- No secrets exposed to client

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier available)

### Local Development

```bash
# 1. Clone & install
git clone <repo-url>
cd collaborative-whiteboard
npm install

# 2. Setup environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Run Supabase migration
# Copy contents of supabase/migrations/001_initial.sql
# Paste into Supabase Dashboard > SQL Editor

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy to Vercel

```bash
git push origin main
# Go to vercel.com/new → Import GitHub repo → Deploy
# Set environment variables in Vercel project settings
```

## 📁 Project Structure

```
├── app/
│   ├── (auth)/login, register pages
│   ├── (dashboard)/board list & whiteboard
│   ├── api/boards endpoints
│   └── layout.tsx, globals.css
├── components/
│   ├── auth/LoginForm, RegisterForm
│   ├── board/Canvas, Toolbar, BoardHeader, etc
│   └── dashboard/BoardCard, BoardGrid
├── hooks/
│   ├── useCanvas - Fabric.js initialization
│   ├── useCollaboration - Real-time sync
│   ├── usePresence - Live cursors
│   ├── useHistory - Undo/redo
│   └── useBoards - Board CRUD
├── lib/
│   ├── supabase/client, server
│   └── fabric/tools, serialize, export
├── stores/
│   ├── canvasStore - Canvas state
│   └── collaborationStore - Presence state
└── supabase/migrations/001_initial.sql
```

## 🎮 Usage

1. **Sign Up**: Create account at `/register`
2. **Create Board**: Click "New Board" on dashboard
3. **Draw**: Select tool from left toolbar and draw on canvas
4. **Invite**: Click "Share" button to invite collaborators
5. **Collaborate**: See changes in real-time as others draw
6. **Export**: Download as PNG, SVG, or JSON

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select |
| P | Pen |
| R | Rectangle |
| C | Circle |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Delete | Delete selected |

## 🔒 Security

- **RLS Policies**: Database-level access control
- **Auth**: Supabase email/password with session management
- **API**: Authorization checks on all routes
- **Data**: JSONB serialization with validation

## 📊 Architecture

```
Client (Fabric.js Canvas)
    ↓
Next.js API Routes (Auth, CRUD)
    ↓
Supabase (PostgreSQL + Realtime WebSocket)
    ↓
Real-time Delta Events to All Clients
```

## 🚢 Production Checklist

- [x] Authentication & Session management
- [x] Role-based access control via RLS
- [x] Real-time collaboration with Realtime
- [x] Auto-save every 30 seconds
- [x] Error handling & validation
- [x] Responsive UI with Tailwind
- [x] Export functionality
- [x] Environment variables configured

## 📈 Performance

- Delta events (not full snapshots)
- Debounced auto-save
- In-memory presence (no DB writes)
- Code splitting with Next.js
- Optimized Fabric.js serialization

## 🤖 Tech Stack

- **Frontend**: React 18, Next.js 14, TypeScript
- **State**: Zustand, React hooks
- **Canvas**: Fabric.js 5
- **Real-time**: Supabase Realtime (WebSocket)
- **Database**: PostgreSQL with RLS
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Notifications**: React Hot Toast

## 🐛 Troubleshooting

**Session expired?**
- Clear cookies, log in again

**Real-time not working?**
- Check Supabase Dashboard > Realtime > Subscriptions
- Verify canvas_events table has replication enabled
- Check browser console for errors

**Canvas not loading?**
- Verify board exists: check `/api/boards/:boardId`
- Check browser DevTools > Network tab
- Ensure Fabric.js canvas element is mounted

## 📝 License

MIT

## 🙏 Credits

Built with Next.js, Supabase, Fabric.js, and Tailwind CSS.

---

**Live Demo**: [your-app.vercel.app](https://your-app.vercel.app)
