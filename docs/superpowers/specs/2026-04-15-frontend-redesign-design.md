# Yappin' Frontend Redesign — Design Spec

## Overview

Complete visual overhaul of the Yappin' microblog from its current outdated Bootstrap-era styling to a "Warm & Playful" design with a sidebar layout. No backend feature changes — this is a CSS/template-only redesign with one small backend addition (sidebar stats queries).

## Design Direction

**Warm & Playful**: Amber/orange palette, rounded shapes, friendly typography, casual social-media energy that matches the "Yappin'" brand name.

**Color Palette:**
- Background: `#fef7ed` (warm off-white)
- Card background: `#fff`
- Card border: `#fbbf24` (amber)
- Input background: `#fffbeb`
- Input border: `#fde68a` (light amber)
- Primary accent: `#f59e0b` (amber-500)
- Secondary accent: `#ea580c` (orange-600)
- Gradient CTA: `linear-gradient(135deg, #f59e0b, #ea580c)`
- Text primary: `#451a03` (dark brown)
- Text secondary: `#78350f` (brown)
- Text tertiary: `#a16207` (amber-700)
- Header brand: `#92400e`
- Footer background: `#451a03`
- Footer text: `#fbbf24`
- Upvote active: `#f59e0b` bg, `#fff` text
- Code block: `#451a03` bg, `#fbbf24` text
- Dividers: `#fef3c7`

**Typography:**
- Font family: Nunito (already loaded), weights 400/600/700/800
- Brand: 800 weight, 26px
- Post title: 800 weight, 17px
- Body text: 400 weight, 14px
- Meta/dates: 12px, tertiary color
- All border-radius: 20px for cards, 12px for inputs, 50% for avatars

## Layout Structure

### Header
- Sticky top bar, `#fffbeb` background with 3px amber bottom border
- Left: logo image (44px) + "Yappin'" brand text
- Right: nav links (Home, Profile, Logout) as pill-shaped hover targets + user avatar circle
- Delete Account button removed from header (moves to profile page)

### Main Content Area
- `max-width: 960px`, centered, `24px` gap between sidebar and feed
- Responsive: sidebar stacks below feed on screens under 768px

### Sidebar (260px, left)
Two cards:
1. **Profile card**: avatar circle with gradient, username, member-since date, post count + likes received (stats from DB)
2. **Community card**: total posts, total users, most active user (3 simple SQL count queries added to the homepage handler)

Sidebar only shows when user is logged in. When logged out, feed takes full width.

### Feed (flex: 1, right)
Stacked vertically:
1. **Sort bar**: "Your Feed" heading left, sort dropdown right
2. **Compose box** (authenticated only): title input, content textarea, emoji button + markdown hint + gradient "Post it!" button
3. **Post cards**: avatar + author/date header, title, rendered content, footer with upvote button + edit/delete (owner only) + like count

### Footer
- `#451a03` dark brown background, amber text
- No longer `position: fixed` — sits naturally at page bottom
- `margin-top: auto` on the flex column body keeps it pushed down

## Component Details

### Post Card
- White background, 2px amber border, 20px radius, 20px padding
- Hover: subtle lift (`translateY(-1px)`) + stronger shadow
- Header: 40px gradient avatar circle + author name (bold) + date
- Body: rendered markdown/HTML content, images get `max-width: 100%` and 12px radius
- Footer: 2px `#fef3c7` top divider, flex row with upvote button, edit/delete links, like count right-aligned
- Upvote button: pill-shaped, amber background when active, arrow-up icon from Font Awesome

### Compose Box
- Same card styling as posts
- Title: single-line text input
- Content: textarea with 80px min-height, resizable
- Bottom row: emoji button (left), markdown link (center-left), post button (right)
- Post button: gradient background, white text, 800 weight, rounded pill, box-shadow, hover lift

### Profile Page
- Large avatar circle (100px) with gradient
- Username and member-since info
- "Your Posts" section below with same post card styling
- Delete Account button here (red, with confirmation prompt — already exists)

### Login/Register Page
- Keep the existing side-by-side layout but apply the new warm styling
- Card backgrounds, amber borders, rounded inputs
- Google auth button keeps blue (`#4285f4`) — recognizable brand color
- Register/Login buttons use the amber gradient

### Edit Post Page
- Same warm card styling, centered
- Title input + content textarea + save button with gradient

### Error Page
- Centered card with warm styling
- "Something went wrong" heading + return home link

## Backend Changes (Minimal)

### Homepage Handler — Sidebar Stats
Add three queries to `homePageHandler`:
```
SELECT COUNT(*) as count FROM posts         → totalPosts
SELECT COUNT(*) as count FROM users          → totalUsers  
SELECT username, COUNT(*) as cnt FROM posts GROUP BY username ORDER BY cnt DESC LIMIT 1  → mostActive
```
Pass `sidebarStats: { totalPosts, totalUsers, mostActive }` to the home template.

### Profile Handler — User Stats
Add queries for the logged-in user's post count and total likes received:
```
SELECT COUNT(*) as count FROM posts WHERE username = ?           → postCount
SELECT COALESCE(SUM(likes), 0) as total FROM posts WHERE username = ?  → totalLikes
```
Pass these to the home template as part of `userStats`.

## Files Modified

- `public/css/styles.css` — complete rewrite
- `views/layouts/main.handlebars` — header redesign, footer fix, body flex structure
- `views/home.handlebars` — sidebar + feed layout, compose box restyling
- `views/partials/post.handlebars` — post card markup overhaul
- `views/loginRegister.handlebars` — warm styling applied
- `views/profile.handlebars` — new profile layout, add delete account button
- `views/editPost.handlebars` — warm styling
- `views/error.handlebars` — warm styling
- `views/registerUsername.handlebars` — warm styling
- `server.js` — add sidebar stats queries to homePageHandler, move deleteAccount route rendering context

## Files NOT Modified
- `server.js` routes/auth/security logic (no changes beyond the stats queries)
- `populatedb.js`, `showdb.js` — no changes
- `public/images/` — keep existing logo

## Responsive Breakpoints

- **Desktop (>768px)**: sidebar (260px) + feed side by side
- **Mobile (<=768px)**: sidebar stacks above feed, full width; header nav collapses to smaller text; compose box and cards get full-width treatment with reduced padding
