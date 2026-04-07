# MX Space Admin

The dashboard for [MX Space](https://github.com/mx-space), a personal space management system. Built with **Vue 3**, **Naive UI**, and **UnoCSS**.

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

- Real-time dashboard with live visitor stats, content analytics, and trend charts
- Full content management: posts, notes, pages, drafts, comments, says
- Rich text editor with AI-assisted writing
- AI-powered content summarization and translation
- File management with orphan image detection
- Friend links and project showcase management
- Responsive design with mobile support
- Dark mode with Vercel-style neutral theme
- WebSocket-based real-time updates

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

- [Vue 3](https://vuejs.org/) + Composition API + TSX
- [Naive UI](https://www.naiveui.com/) - Component library
- [UnoCSS](https://unocss.dev/) - Atomic CSS engine
- [TanStack Query](https://tanstack.com/query) - Server state management
- [Pinia](https://pinia.vuejs.org/) - Store management
- [CodeMirror](https://codemirror.net/) / [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editors
- [Socket.IO](https://socket.io/) - Real-time communication

## License

MIT. © 2021-present Mix Space & Innei
