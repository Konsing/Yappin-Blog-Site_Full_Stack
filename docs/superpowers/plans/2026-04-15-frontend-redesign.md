# Yappin' Frontend Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete visual overhaul from outdated Bootstrap-era styling to a Warm & Playful amber/orange theme with sidebar layout.

**Architecture:** CSS-only redesign plus Handlebars template restructuring. One small backend addition (sidebar stats queries in `server.js`). No new dependencies.

**Tech Stack:** CSS3, Handlebars, Express/Node.js, SQLite, Font Awesome 6

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `public/css/styles.css` | Rewrite | All styling — warm palette, layout grid, components |
| `views/layouts/main.handlebars` | Rewrite | Page shell — sticky header, flex body, footer |
| `views/home.handlebars` | Rewrite | Sidebar + feed layout, compose box, sort bar |
| `views/partials/post.handlebars` | Rewrite | Post card component with new markup |
| `views/loginRegister.handlebars` | Restyle | Warm card styling on existing layout |
| `views/profile.handlebars` | Rewrite | Profile hero card, delete account, user posts |
| `views/editPost.handlebars` | Restyle | Warm card styling |
| `views/error.handlebars` | Restyle | Warm centered card |
| `views/registerUsername.handlebars` | Restyle | Warm card styling |
| `server.js` | Modify | Add sidebar stats queries to `homePageHandler` and `profilePageHandler` |

---

### Task 1: Rewrite CSS

**Files:**
- Rewrite: `public/css/styles.css`

- [ ] **Step 1: Replace the entire CSS file**

Replace `public/css/styles.css` with:

```css
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap");

/* ── Reset ── */
*,
*::before,
*::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* ── Base ── */
body {
  font-family: "Nunito", Arial, sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #451a03;
  background: #fef7ed;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

a {
  color: #ea580c;
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

img {
  max-width: 100%;
  height: auto;
}

/* ── Header ── */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fffbeb;
  border-bottom: 3px solid #f59e0b;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}
.header-brand:hover {
  text-decoration: none;
}

.header-brand img {
  width: 44px;
  height: 44px;
  border-radius: 10px;
}

.header-brand span {
  font-weight: 800;
  font-size: 26px;
  color: #92400e;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-nav {
  list-style: none;
  display: flex;
  align-items: center;
  gap: 4px;
}

.header-nav li a {
  display: block;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  color: #78350f;
  transition: background 0.15s;
}
.header-nav li a:hover {
  background: #fef3c7;
  text-decoration: none;
}

.header-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-left: 8px;
  border: 2px solid #fbbf24;
}

/* ── Page wrapper ── */
.page-wrap {
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 24px auto;
  padding: 0 16px;
}

/* ── Main layout (sidebar + feed) ── */
.main-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ── Sidebar ── */
.sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 84px;
}

/* ── Card (shared) ── */
.card {
  background: #fff;
  border: 2px solid #fbbf24;
  border-radius: 20px;
  padding: 20px;
}

/* ── Sidebar profile card ── */
.sidebar-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sidebar-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid #f59e0b;
  margin-bottom: 10px;
}

.sidebar-profile .username {
  font-weight: 800;
  font-size: 16px;
  color: #451a03;
}

.sidebar-profile .member-since {
  font-size: 12px;
  color: #a16207;
  margin-bottom: 12px;
}

.sidebar-stats {
  width: 100%;
  border-top: 2px solid #fef3c7;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #78350f;
}

.sidebar-stats span {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Sidebar community card ── */
.community-stats {
  font-size: 13px;
  color: #78350f;
}

.community-stats h3 {
  font-weight: 800;
  font-size: 14px;
  color: #451a03;
  margin-bottom: 10px;
}

.community-stats .stat-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid #fef3c7;
}
.community-stats .stat-row:last-child {
  border-bottom: none;
}

.community-stats .stat-label {
  color: #a16207;
}

.community-stats .stat-value {
  font-weight: 700;
  color: #451a03;
}

/* ── Feed ── */
.feed {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Sort bar ── */
.sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-bar h2 {
  font-weight: 800;
  font-size: 20px;
  color: #451a03;
}

.sort-bar select {
  padding: 6px 12px;
  border: 2px solid #fde68a;
  border-radius: 12px;
  background: #fffbeb;
  font-family: inherit;
  font-size: 13px;
  color: #78350f;
  cursor: pointer;
}

/* ── Compose box ── */
.compose {
  background: #fff;
  border: 2px solid #fbbf24;
  border-radius: 20px;
  padding: 20px;
}

.compose input[type="text"],
.compose textarea {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #fde68a;
  border-radius: 12px;
  background: #fffbeb;
  font-family: inherit;
  font-size: 14px;
  color: #451a03;
  outline: none;
  transition: border-color 0.15s;
}
.compose input[type="text"]:focus,
.compose textarea:focus {
  border-color: #f59e0b;
}

.compose input[type="text"] {
  margin-bottom: 10px;
}

.compose textarea {
  min-height: 80px;
  resize: vertical;
  margin-bottom: 12px;
}

.compose-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compose-actions .emoji-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  padding: 4px;
}

.compose-actions .md-link {
  font-size: 12px;
  color: #a16207;
}

.compose-actions .post-btn {
  margin-left: auto;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
  font-family: inherit;
  font-weight: 800;
  font-size: 14px;
  border: none;
  border-radius: 20px;
  padding: 10px 28px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  transition: transform 0.15s, box-shadow 0.15s;
}
.compose-actions .post-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.45);
}

/* ── Emoji panel ── */
.emoji-panel {
  background: #fffbeb;
  border: 2px solid #fde68a;
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
}

.emoji-panel input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #fde68a;
  border-radius: 10px;
  background: #fff;
  font-family: inherit;
  font-size: 13px;
  margin-bottom: 10px;
  outline: none;
}

.emoji-panel .emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-panel .emoji-grid span {
  font-size: 24px;
  cursor: pointer;
  padding: 2px;
  border-radius: 6px;
  transition: background 0.1s;
}
.emoji-panel .emoji-grid span:hover {
  background: #fef3c7;
}

/* ── Post card ── */
.post-card {
  background: #fff;
  border: 2px solid #fbbf24;
  border-radius: 20px;
  padding: 20px;
  transition: transform 0.15s, box-shadow 0.15s;
}
.post-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.2);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.post-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #f59e0b;
  flex-shrink: 0;
}

.post-meta .post-author {
  font-weight: 700;
  font-size: 14px;
  color: #451a03;
}

.post-meta .post-date {
  font-size: 12px;
  color: #a16207;
}

.post-title {
  font-weight: 800;
  font-size: 17px;
  color: #451a03;
  margin-bottom: 8px;
}

.post-body {
  font-size: 14px;
  line-height: 1.6;
  color: #78350f;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.post-body img {
  border-radius: 12px;
  margin: 8px 0;
}

.post-body pre {
  background: #451a03;
  color: #fbbf24;
  padding: 14px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 8px 0;
}

.post-body code {
  background: #fef3c7;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.post-body pre code {
  background: none;
  padding: 0;
  color: #fbbf24;
}

.post-footer {
  border-top: 2px solid #fef3c7;
  margin-top: 14px;
  padding-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.upvote-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 20px;
  border: 2px solid #fde68a;
  background: #fffbeb;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #a16207;
  cursor: pointer;
  transition: all 0.15s;
}
.upvote-btn:hover {
  border-color: #f59e0b;
  background: #fef3c7;
}
.upvote-btn.active {
  background: #f59e0b;
  border-color: #f59e0b;
  color: #fff;
}

.post-footer .edit-link,
.post-footer .delete-form button {
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #a16207;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.15s;
}
.post-footer .edit-link:hover,
.post-footer .delete-form button:hover {
  background: #fef3c7;
  text-decoration: none;
}

.post-footer .like-count {
  margin-left: auto;
  font-size: 13px;
  font-weight: 700;
  color: #a16207;
}

/* ── No-posts message ── */
.no-posts {
  text-align: center;
  padding: 40px 20px;
  font-size: 16px;
  color: #a16207;
  font-weight: 600;
}

/* ── Login / Register ── */
.login-register {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 40px;
}

.login-register .auth-card {
  background: #fff;
  border: 2px solid #fbbf24;
  border-radius: 20px;
  padding: 28px;
  width: 380px;
  display: flex;
  flex-direction: column;
}

.login-register .auth-card h2 {
  font-weight: 800;
  font-size: 20px;
  color: #451a03;
  text-align: center;
  margin-bottom: 20px;
}

.login-register .auth-card label {
  font-weight: 600;
  font-size: 13px;
  color: #78350f;
  margin-bottom: 4px;
  display: block;
}

.login-register .auth-card input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #fde68a;
  border-radius: 12px;
  background: #fffbeb;
  font-family: inherit;
  font-size: 14px;
  color: #451a03;
  outline: none;
  margin-bottom: 14px;
  transition: border-color 0.15s;
}
.login-register .auth-card input:focus {
  border-color: #f59e0b;
}

.login-register .auth-card .auth-btn {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
  font-family: inherit;
  font-weight: 800;
  font-size: 14px;
  border: none;
  border-radius: 20px;
  padding: 12px;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  transition: transform 0.15s, box-shadow 0.15s;
  margin-top: 4px;
}
.login-register .auth-card .auth-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.45);
}

.login-register .separator {
  font-weight: 800;
  color: #a16207;
  align-self: center;
  font-size: 16px;
}

.error-msg {
  color: #dc2626;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
}

.success-msg {
  color: #16a34a;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  text-align: center;
}

.google-auth-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: #4285f4;
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  margin-top: 14px;
  transition: background 0.15s;
}
.google-auth-button:hover {
  background: #357ae8;
  text-decoration: none;
}

.login-register .or-text {
  font-size: 12px;
  color: #a16207;
  text-align: center;
  margin-top: 14px;
  margin-bottom: 4px;
}

/* ── Profile page ── */
.profile-hero {
  background: #fff;
  border: 2px solid #fbbf24;
  border-radius: 20px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.profile-hero .profile-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid #f59e0b;
  flex-shrink: 0;
}

.profile-hero .profile-info h2 {
  font-weight: 800;
  font-size: 22px;
  color: #451a03;
  margin-bottom: 4px;
}

.profile-hero .profile-info p {
  font-size: 13px;
  color: #a16207;
  margin-bottom: 4px;
}

.profile-hero .profile-info .profile-stat {
  font-size: 13px;
  color: #78350f;
  font-weight: 600;
}

.profile-hero .delete-account-btn {
  margin-left: auto;
  background: #dc2626;
  color: #fff;
  font-family: inherit;
  font-weight: 700;
  font-size: 13px;
  border: none;
  border-radius: 12px;
  padding: 8px 18px;
  cursor: pointer;
  transition: background 0.15s;
}
.profile-hero .delete-account-btn:hover {
  background: #b91c1c;
}

.user-posts h2 {
  font-weight: 800;
  font-size: 18px;
  color: #451a03;
  margin-bottom: 16px;
}

.user-posts ul {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Edit post ── */
.edit-post-container {
  max-width: 640px;
  margin: 24px auto;
}

.edit-post-container h2 {
  font-weight: 800;
  font-size: 20px;
  color: #451a03;
  margin-bottom: 20px;
  text-align: center;
}

/* ── Register username ── */
.register-username {
  max-width: 440px;
  margin: 60px auto;
}

.register-username h2 {
  font-weight: 800;
  font-size: 20px;
  color: #451a03;
  text-align: center;
  margin-bottom: 20px;
}

.register-username label {
  font-weight: 600;
  font-size: 13px;
  color: #78350f;
  display: block;
  margin-bottom: 4px;
}

.register-username input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #fde68a;
  border-radius: 12px;
  background: #fffbeb;
  font-family: inherit;
  font-size: 14px;
  color: #451a03;
  outline: none;
  margin-bottom: 16px;
}
.register-username input:focus {
  border-color: #f59e0b;
}

.register-username .auth-btn {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #fff;
  font-family: inherit;
  font-weight: 800;
  font-size: 14px;
  border: none;
  border-radius: 20px;
  padding: 12px;
  cursor: pointer;
  width: 100%;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

/* ── Error page ── */
.error-page {
  text-align: center;
  padding: 80px 20px;
}

.error-page h2 {
  font-weight: 800;
  font-size: 24px;
  color: #451a03;
  margin-bottom: 12px;
}

.error-page p {
  font-size: 14px;
  color: #78350f;
  margin-bottom: 8px;
}

/* ── Footer ── */
.footer {
  background: #451a03;
  color: #fbbf24;
  text-align: center;
  padding: 16px;
  font-size: 13px;
  margin-top: auto;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    position: static;
    flex-direction: row;
    overflow-x: auto;
  }
  .sidebar .card {
    min-width: 220px;
  }
  .header {
    padding: 0 12px;
  }
  .header-brand span {
    font-size: 20px;
  }
  .header-nav li a {
    padding: 4px 10px;
    font-size: 13px;
  }
  .page-wrap {
    padding: 0 10px;
    margin: 12px auto;
  }
  .login-register {
    flex-direction: column;
    align-items: center;
  }
  .login-register .auth-card {
    width: 100%;
    max-width: 400px;
  }
  .profile-hero {
    flex-direction: column;
    text-align: center;
  }
  .profile-hero .delete-account-btn {
    margin-left: 0;
    margin-top: 12px;
  }
}
```

- [ ] **Step 2: Verify file was written**

Run: `wc -l public/css/styles.css`
Expected: ~500+ lines

- [ ] **Step 3: Commit**

```bash
git add public/css/styles.css
git commit -m "feat: rewrite CSS with warm & playful amber theme"
```

---

### Task 2: Rewrite Main Layout

**Files:**
- Rewrite: `views/layouts/main.handlebars`

- [ ] **Step 1: Replace the main layout**

Replace `views/layouts/main.handlebars` with:

```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" rel="stylesheet">
    <title>{{appName}}</title>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <header class="header">
        <a href="/" class="header-brand">
            <img src="/images/Blog_Logo.webp" alt="Yappin Logo">
            <span>Yappin'</span>
        </a>
        <div class="header-right">
            <ul class="header-nav">
                {{#if user.loggedIn}}
                    <li><a href="/">Home</a></li>
                    <li><a href="/profile">Profile</a></li>
                    <li><a href="/logout">Logout</a></li>
                {{else}}
                    <li><a href="/">Home</a></li>
                    <li><a href="/login">Login / Register</a></li>
                {{/if}}
            </ul>
            {{#if user.loggedIn}}
                <img src="{{#if user.avatar_url}}{{user.avatar_url}}{{else}}/avatar/{{user.username}}{{/if}}" alt="Avatar" class="header-avatar">
            {{/if}}
        </div>
    </header>

    <div class="page-wrap">
        {{{body}}}
    </div>

    <footer class="footer">
        &copy; {{copyrightYear}} {{appName}}. All rights reserved.
    </footer>
</body>
</html>
```

- [ ] **Step 2: Verify no syntax errors**

Run: `node -e "const hbs = require('express-handlebars'); console.log('OK')"`
Expected: OK (just checks handlebars loads)

- [ ] **Step 3: Commit**

```bash
git add views/layouts/main.handlebars
git commit -m "feat: redesign main layout with sticky header and flex body"
```

---

### Task 3: Rewrite Homepage with Sidebar + Server Stats

**Files:**
- Rewrite: `views/home.handlebars`
- Modify: `server.js:236-250` (homePageHandler) and `server.js:513-524` (profilePageHandler)

- [ ] **Step 1: Add sidebar stats queries to homePageHandler in server.js**

Replace the `homePageHandler` function (lines 236-250) with:

```javascript
const homePageHandler = async (req, res) => {
  const sort = req.query.sort || "recency";
  const rows = sort === "likes"
    ? await db.all("SELECT * FROM posts ORDER BY likes DESC, timestamp DESC")
    : await db.all("SELECT * FROM posts ORDER BY timestamp DESC");

  let sidebarStats = null;
  let userStats = null;

  const totalPosts = await db.get("SELECT COUNT(*) as count FROM posts");
  const totalUsers = await db.get("SELECT COUNT(*) as count FROM users");
  const mostActive = await db.get("SELECT username, COUNT(*) as cnt FROM posts GROUP BY username ORDER BY cnt DESC LIMIT 1");
  sidebarStats = {
    totalPosts: totalPosts.count,
    totalUsers: totalUsers.count,
    mostActive: mostActive ? mostActive.username : "N/A",
  };

  if (req.session.user && req.session.user.loggedIn) {
    const postCount = await db.get("SELECT COUNT(*) as count FROM posts WHERE username = ?", [req.session.user.username]);
    const totalLikes = await db.get("SELECT COALESCE(SUM(likes), 0) as total FROM posts WHERE username = ?", [req.session.user.username]);
    userStats = {
      postCount: postCount.count,
      totalLikes: totalLikes.total,
    };
  }

  res.render("home", {
    title: "Home",
    user: req.session.user,
    posts: rows.map(renderPostContent),
    sort,
    sidebarStats,
    userStats,
    showNavBar: true,
    layout: "main",
  });
};
```

- [ ] **Step 2: Add user stats to profilePageHandler in server.js**

Replace the `profilePageHandler` function (lines 513-524) with:

```javascript
const profilePageHandler = async (req, res) => {
  const username = req.session.user.username;
  const rows = await db.all("SELECT * FROM posts WHERE username = ?", [username]);
  const postCount = await db.get("SELECT COUNT(*) as count FROM posts WHERE username = ?", [username]);
  const totalLikes = await db.get("SELECT COALESCE(SUM(likes), 0) as total FROM posts WHERE username = ?", [username]);

  res.render("profile", {
    title: "Profile",
    user: req.session.user,
    userPosts: rows.map(renderPostContent),
    userStats: {
      postCount: postCount.count,
      totalLikes: totalLikes.total,
    },
    showNavBar: true,
    layout: "main",
  });
};
```

- [ ] **Step 3: Rewrite home.handlebars**

Replace `views/home.handlebars` with:

```handlebars
{{#if user.loggedIn}}
<div class="main-layout">
    <aside class="sidebar">
        <div class="card sidebar-profile">
            <img src="{{#if user.avatar_url}}{{user.avatar_url}}{{else}}/avatar/{{user.username}}{{/if}}" alt="Avatar" class="sidebar-avatar">
            <div class="username">{{user.username}}</div>
            <div class="member-since">Member since {{user.createdAt}}</div>
            {{#if userStats}}
            <div class="sidebar-stats">
                <span><i class="fas fa-pen"></i> {{userStats.postCount}} posts</span>
                <span><i class="fas fa-heart"></i> {{userStats.totalLikes}} likes received</span>
            </div>
            {{/if}}
        </div>

        {{#if sidebarStats}}
        <div class="card community-stats">
            <h3>Community</h3>
            <div class="stat-row">
                <span class="stat-label">Total Posts</span>
                <span class="stat-value">{{sidebarStats.totalPosts}}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Total Users</span>
                <span class="stat-value">{{sidebarStats.totalUsers}}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Most Active</span>
                <span class="stat-value">{{sidebarStats.mostActive}}</span>
            </div>
        </div>
        {{/if}}
    </aside>

    <main class="feed">
        <div class="sort-bar">
            <h2>Your Feed</h2>
            <select id="sort-by" onchange="sortPosts()">
                <option value="recency" {{#ifCond sort 'recency'}}selected{{/ifCond}}>Newest</option>
                <option value="likes" {{#ifCond sort 'likes'}}selected{{/ifCond}}>Most Liked</option>
            </select>
        </div>

        <div class="compose">
            <form action="/posts" method="POST">
                <input type="text" id="title" name="title" placeholder="Post title..." required>
                <textarea id="content" name="content" placeholder="What's on your mind?" required></textarea>
                <div class="compose-actions">
                    <button type="button" class="emoji-btn" onclick="toggleEmojiPanel()">&#128512;</button>
                    <a href="https://www.markdownguide.org/basic-syntax/" target="_blank" class="md-link">Markdown supported</a>
                    <button type="submit" class="post-btn">Post it!</button>
                </div>
            </form>
            <div id="emoji-container" class="emoji-panel" style="display: none;">
                <input type="text" id="emoji-search" oninput="searchEmojis()" placeholder="Search emojis...">
                <div id="emoji-grid" class="emoji-grid"></div>
            </div>
        </div>

        {{#if posts.length}}
            {{#each posts}}
                {{> post this user=../user}}
            {{/each}}
        {{else}}
            <p class="no-posts">No posts yet. Be the first to yap about something!</p>
        {{/if}}
    </main>
</div>
{{else}}
<main class="feed">
    <div class="sort-bar">
        <h2>Recent Posts</h2>
        <select id="sort-by" onchange="sortPosts()">
            <option value="recency" {{#ifCond sort 'recency'}}selected{{/ifCond}}>Newest</option>
            <option value="likes" {{#ifCond sort 'likes'}}selected{{/ifCond}}>Most Liked</option>
        </select>
    </div>

    {{#if posts.length}}
        {{#each posts}}
            {{> post this user=../user}}
        {{/each}}
    {{else}}
        <p class="no-posts">No posts yet. Be the first to yap about something!</p>
    {{/if}}
</main>
{{/if}}

<script>
var allEmojis = [];

function toggleEmojiPanel() {
    var container = document.getElementById('emoji-container');
    var isHidden = container.style.display === 'none';
    container.style.display = isHidden ? 'block' : 'none';

    if (isHidden && allEmojis.length === 0) {
        fetch('/emojis?page=0')
            .then(function(response) { return response.json(); })
            .then(function(data) {
                allEmojis = data.emojis;
                displayEmojis(allEmojis);
            })
            .catch(function(error) {
                console.error("Error fetching emojis:", error);
            });
    }
}

function displayEmojis(emojis, limit) {
    limit = limit || 200;
    var container = document.getElementById('emoji-grid');
    while (container.firstChild) { container.removeChild(container.firstChild); }
    emojis.slice(0, limit).forEach(function(emoji) {
        var span = document.createElement('span');
        span.textContent = emoji.character;
        span.title = emoji.name;
        span.style.cursor = 'pointer';
        span.onclick = function() { insertEmoji(emoji.character); };
        container.appendChild(span);
    });
}

function searchEmojis() {
    var searchTerm = document.getElementById('emoji-search').value.toLowerCase();
    var filtered = allEmojis.filter(function(emoji) {
        return emoji.name.toLowerCase().indexOf(searchTerm) !== -1;
    });
    displayEmojis(filtered);
}

function insertEmoji(emoji) {
    var textarea = document.getElementById('content');
    textarea.value += emoji;
    textarea.focus();
}

function sortPosts() {
    var sortBy = document.getElementById('sort-by').value;
    var url = new URL(window.location.href);
    url.searchParams.set('sort', sortBy);
    window.location.href = url.toString();
}
</script>
```

- [ ] **Step 4: Start the server and verify homepage loads**

Run: `node server.js &`
Then: `curl -s http://localhost:3000 | head -30`
Expected: HTML output with `main-layout` or `feed` class present

- [ ] **Step 5: Kill the test server**

Run: `kill %1 2>/dev/null; lsof -ti :3000 | xargs kill -9 2>/dev/null`

- [ ] **Step 6: Commit**

```bash
git add server.js views/home.handlebars
git commit -m "feat: add sidebar stats and redesign homepage layout"
```

---

### Task 4: Rewrite Post Card Partial

**Files:**
- Rewrite: `views/partials/post.handlebars`

- [ ] **Step 1: Replace post.handlebars**

Replace `views/partials/post.handlebars` with:

```handlebars
<div class="post-card">
    <div class="post-header">
        <img src="{{#if this.avatar_url}}{{this.avatar_url}}{{else}}/avatar/{{this.username}}{{/if}}" alt="Avatar" class="post-avatar">
        <div class="post-meta">
            <div class="post-author">{{username}}</div>
            <div class="post-date">{{timestamp}}</div>
        </div>
    </div>

    <div class="post-title">{{title}}</div>
    <div class="post-body">{{{renderedContent}}}</div>

    <div class="post-footer">
        {{#ifUserMatch user.username username}}
            <form action="/delete/{{id}}" method="POST" class="delete-form">
                <button type="submit"><i class="fas fa-trash-alt"></i> Delete</button>
            </form>
            <a href="/edit/{{id}}" class="edit-link"><i class="fas fa-edit"></i> Edit</a>
        {{else}}
            <button class="upvote-btn" data-id="{{id}}">
                <i class="fas fa-arrow-up"></i> <span class="upvote-label">Upvote</span>
            </button>
        {{/ifUserMatch}}
        <span class="like-count">{{likes}} likes</span>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function () {
    var isAuthenticated = {{#if user}}true{{else}}false{{/if}};

    var likeButtons = document.querySelectorAll('.upvote-btn');
    likeButtons.forEach(function(button) {
        if (button.dataset.listenerAdded) return;
        button.dataset.listenerAdded = 'true';

        button.addEventListener('click', function(event) {
            event.preventDefault();
            var btn = this;
            var postId = btn.getAttribute('data-id');

            if (!isAuthenticated) {
                window.location.href = "/login";
                return;
            }

            fetch('/like/' + postId, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
            .then(function(response) { return response.json(); })
            .then(function(data) {
                if (data.redirect) {
                    window.location.href = data.redirect;
                } else if (data.likes !== undefined) {
                    var likeCountSpan = btn.closest('.post-footer').querySelector('.like-count');
                    likeCountSpan.textContent = data.likes + ' likes';
                    var label = btn.querySelector('.upvote-label');
                    if (data.likedByUser) {
                        btn.classList.add('active');
                        label.textContent = 'Upvoted';
                    } else {
                        btn.classList.remove('active');
                        label.textContent = 'Upvote';
                    }
                }
            })
            .catch(function(error) {
                console.error('Error:', error);
            });
        });
    });
});
</script>
```

- [ ] **Step 2: Commit**

```bash
git add views/partials/post.handlebars
git commit -m "feat: redesign post card with warm styling and upvote pill"
```

---

### Task 5: Restyle Login/Register Page

**Files:**
- Rewrite: `views/loginRegister.handlebars`

- [ ] **Step 1: Replace loginRegister.handlebars**

Replace `views/loginRegister.handlebars` with:

```handlebars
{{#> main}}
<section class="login-register">
    <div class="auth-card">
        <h2>Login</h2>
        {{#if loginError}}
            <p class="error-msg">{{loginError}}</p>
        {{/if}}
        <form action="/login" method="POST">
            <label for="login-username">Username</label>
            <input type="text" id="login-username" name="username" required>
            <label for="login-password">Password</label>
            <input type="password" id="login-password" name="password" required>
            <button type="submit" class="auth-btn">Login</button>
        </form>
        <p class="or-text">Or login with:</p>
        <a href="/auth/google" class="google-auth-button">
            <i class="fab fa-google"></i> Sign in with Google
        </a>
    </div>

    <span class="separator">OR</span>

    <div class="auth-card">
        <h2>Register</h2>
        {{#if registerError}}
            <p class="error-msg">{{registerError}}</p>
        {{/if}}
        {{#if registerSuccess}}
            <p class="success-msg">{{registerSuccess}}</p>
        {{/if}}
        <form action="/register" method="POST">
            <label for="reg-username">Username</label>
            <input type="text" id="reg-username" name="username" required>
            <label for="reg-password">Password</label>
            <input type="password" id="reg-password" name="password" required>
            <label for="reg-confirm">Confirm Password</label>
            <input type="password" id="reg-confirm" name="confirmPassword" required>
            <button type="submit" class="auth-btn">Register</button>
        </form>
    </div>
</section>
{{/main}}
```

- [ ] **Step 2: Commit**

```bash
git add views/loginRegister.handlebars
git commit -m "feat: restyle login/register with warm card design"
```

---

### Task 6: Rewrite Profile Page

**Files:**
- Rewrite: `views/profile.handlebars`

- [ ] **Step 1: Replace profile.handlebars**

Replace `views/profile.handlebars` with:

```handlebars
{{#> main}}
<div class="profile-hero">
    <img src="{{#if user.avatar_url}}{{user.avatar_url}}{{else}}/avatar/{{user.username}}{{/if}}" alt="Avatar" class="profile-avatar">
    <div class="profile-info">
        <h2>{{user.username}}</h2>
        <p>Member since {{user.createdAt}}</p>
        {{#if userStats}}
            <span class="profile-stat">{{userStats.postCount}} posts &middot; {{userStats.totalLikes}} likes received</span>
        {{/if}}
    </div>
    <form action="/deleteAccount" method="POST" onsubmit="return confirm('Are you sure you want to delete your account? This action cannot be undone.');">
        <button type="submit" class="delete-account-btn">Delete Account</button>
    </form>
</div>

<section class="user-posts">
    <h2>Your Posts</h2>
    {{#if userPosts.length}}
        <ul>
            {{#each userPosts}}
                <li>{{> post this user=../user}}</li>
            {{/each}}
        </ul>
    {{else}}
        <p class="no-posts">You haven't posted anything yet.</p>
    {{/if}}
</section>
{{/main}}
```

- [ ] **Step 2: Commit**

```bash
git add views/profile.handlebars
git commit -m "feat: redesign profile page with hero card and delete account"
```

---

### Task 7: Restyle Remaining Pages

**Files:**
- Rewrite: `views/editPost.handlebars`
- Rewrite: `views/error.handlebars`
- Rewrite: `views/registerUsername.handlebars`

- [ ] **Step 1: Replace editPost.handlebars**

Replace `views/editPost.handlebars` with:

```handlebars
{{#> main}}
<div class="edit-post-container">
    <div class="compose card">
        <h2>Edit Post</h2>
        <form action="/edit/{{post.id}}" method="POST">
            <input type="text" id="title" name="title" value="{{post.title}}" required>
            <textarea id="content" name="content" rows="6" required>{{post.content}}</textarea>
            <div class="compose-actions">
                <span></span>
                <button type="submit" class="post-btn">Save Changes</button>
            </div>
        </form>
    </div>
</div>
{{/main}}
```

- [ ] **Step 2: Replace error.handlebars**

Replace `views/error.handlebars` with:

```handlebars
{{#> main}}
<div class="error-page">
    <div class="card" style="max-width: 480px; margin: 60px auto; text-align: center; padding: 40px;">
        <h2>Something went wrong</h2>
        <p>The page you were looking for could not be found.</p>
        <p><a href="/">Return home</a></p>
    </div>
</div>
{{/main}}
```

- [ ] **Step 3: Replace registerUsername.handlebars**

Replace `views/registerUsername.handlebars` with:

```handlebars
{{#> main}}
<div class="register-username card">
    <h2>Choose a Username</h2>
    {{#if error}}
        <p class="error-msg">{{error}}</p>
    {{/if}}
    <form action="/registerUsername" method="POST">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" required>
        <button type="submit" class="auth-btn">Register</button>
    </form>
</div>
{{/main}}
```

- [ ] **Step 4: Commit**

```bash
git add views/editPost.handlebars views/error.handlebars views/registerUsername.handlebars
git commit -m "feat: restyle edit post, error, and register username pages"
```

---

### Task 8: Smoke Test

- [ ] **Step 1: Start the server**

Run: `node server.js &`
Expected: "Server is running on http://localhost:3000"

- [ ] **Step 2: Test homepage loads**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: 200

- [ ] **Step 3: Test login page loads**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login`
Expected: 200

- [ ] **Step 4: Test error page loads**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/error`
Expected: 200

- [ ] **Step 5: Verify sidebar stats render on homepage**

Run: `curl -s http://localhost:3000 | grep -o "Community"`
Expected: "Community" (from the sidebar community card)

- [ ] **Step 6: Verify warm theme CSS is loaded**

Run: `curl -s http://localhost:3000/css/styles.css | grep -o "#fef7ed"`
Expected: "#fef7ed" (the warm background color)

- [ ] **Step 7: Kill the test server**

Run: `kill %1 2>/dev/null; lsof -ti :3000 | xargs kill -9 2>/dev/null`

- [ ] **Step 8: Final commit (if any fixes needed)**

If any fixes were made during smoke testing, commit them:

```bash
git add -A
git commit -m "fix: address smoke test issues from frontend redesign"
```
