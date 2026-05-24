# MX Space Admin

The dashboard for [MX Space](https://github.com/mx-space), a personal space management system. Built with **React**, **Base UI**, and **UnoCSS**.

> v4.0 for Mix Space Server v5.0

## Preview

### Desktop

| Dashboard | Posts |
|-----------|-------|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Posts](docs/screenshots/posts.png) |

| Notes | Comments |
|-------|----------|
| ![Notes](docs/screenshots/notes.png) | ![Comments](docs/screenshots/comments.png) |

| Post Editor | Settings |
|-------------|----------|
| ![Post Editor](docs/screenshots/post-edit.png) | ![Settings](docs/screenshots/setting.png) |

| Says | AI |
|------|-----|
| ![Says](docs/screenshots/says.png) | ![AI](docs/screenshots/ai.png) |

### Mobile

<p float="left">
  <img src="docs/screenshots/mobile-dashboard.png" width="200" />
  <img src="docs/screenshots/mobile-posts.png" width="200" />
  <img src="docs/screenshots/mobile-says.png" width="200" />
</p>

## Features

- React Router application shell with Base UI primitives
- Content and operations surfaces for comments, says, projects, friends, subscribers, webhooks, backups, cron tasks, search index, and markdown import/export
- Authentication and setup flows
- Debug labs for toast, passkey, socket event, and serverless function diagnostics
- Dark mode with Vercel-style neutral theme

## Getting Started

```bash
git clone https://github.com/mx-space/mx-admin.git
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

## Tech Stack

- [React](https://react.dev/) + TSX
- [Base UI](https://base-ui.com/) - Headless component primitives
- [React Router](https://reactrouter.com/) - Routing
- [UnoCSS](https://unocss.dev/) - Atomic CSS engine
- [TanStack Query](https://tanstack.com/query) - Server state management
- [Sonner](https://sonner.emilkowal.ski/) - Toast notifications
- [Socket.IO](https://socket.io/) - Real-time communication

## License

MIT. © 2021-present Mix Space & Innei
