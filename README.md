
---

# Yappin' - Microblogging Application

## Overview
**Yappin'** is a microblogging platform with a warm, playful design. Users can create markdown-powered posts, like and interact with others' content, and authenticate via Google OAuth or local username/password registration.

---

## Features

### User Authentication
- **Google OAuth** login via Passport.js (requires `.env` credentials)
- **Local registration** with username/password (bcrypt-hashed)
- Session-based auth with `express-session`
- Users can delete their accounts from the profile page

### Post Management
- Create, edit, and delete posts
- **Markdown** support via `marked` (rendered and sanitized with `sanitize-html`)
- Embedded content support (Twitter/X, Instagram, YouTube iframes)
- Dynamic avatars generated server-side with `canvas`

### Post Interaction
- Upvote/un-upvote posts (AJAX, no page reload)
- Sort by **newest** or **most liked**
- Emoji picker for composing posts

### Sidebar (Logged-In Users)
- Profile card with post count and total likes received
- Community stats: total posts, total users, most active user

### Profile Page
- User stats (posts, likes received)
- List of your posts
- Account deletion with confirmation prompt

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Node.js, Express |
| Templates | Handlebars (express-handlebars) |
| Database | SQLite (via `sqlite` / `sqlite3`) |
| Auth | Passport.js (Google OAuth 2.0), bcrypt |
| Security | sanitize-html (XSS prevention) |
| Rendering | marked (Markdown), canvas (avatars) |
| Styling | Custom CSS (Nunito font, amber/orange palette) |
| Containerization | Docker (node:20-alpine) |

---

## Database Schema

**users** — `id`, `username`, `hashedGoogleId`, `avatar_url`, `memberSince`, `passwordHash`

**posts** — `id`, `title`, `content`, `username`, `timestamp`, `likes`, `isMarkdown`

**likes** — `id`, `postId`, `username`

---

## Docker

```sh
docker build -t yappin .
docker run -p 3000:3000 --env-file .env yappin
```

---

## Screenshots

> Note: Screenshots below are from an earlier version of the UI. The current design uses a warm amber/orange theme with a sidebar layout.

**Login / Register:**

<p align="left">
  <img src="images/loginscreen.png" width="650">
</p>

**Homepage (Logged In):**

<p align="left">
  <img src="images/dashboardloggedin.png" width="650">
</p>

**Homepage (Not Logged In):**

<p align="left">
  <img src="images/dashboardnotloggedin.png" width="650">
</p>

**Profile Page:**

<p align="left">
  <img src="images/profileview.png" width="650">
</p>

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the server |
| `npm run populate-db` | Seed the database with sample data |
| `npm run show-db` | Print database contents to console |

---
