const express = require("express");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dotenv = require("dotenv");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const { engine } = require("express-handlebars");
const axios = require("axios");
const { createCanvas } = require("canvas");
const marked = require("marked");
const bcrypt = require("bcrypt");
const sanitizeHtml = require("sanitize-html");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BCRYPT_ROUNDS = 10;
const dbFileName = "microblog.db";
let db;

const SANITIZE_OPTS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img", "h1", "h2", "script", "iframe",
    "svg", "g", "path",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "width", "height", "srcset", "sizes", "crossorigin", "decoding", "class", "style"],
    a: ["href", "name", "target", "rel", "style"],
    blockquote: ["class", "data-*", "style"],
    p: ["lang", "dir", "style"],
    div: ["class", "style"],
    script: ["src", "async", "charset"],
    iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "style"],
    svg: ["width", "height", "viewBox", "version", "xmlns", "xmlns:xlink"],
    g: ["stroke", "stroke-width", "fill", "fill-rule", "transform"],
    path: ["d", "fill"],
  },
  allowVulnerableTags: true,
  allowedSchemes: ["http", "https", "mailto"],
  allowedScriptDomains: ["platform.twitter.com", "platform.x.com", "www.instagram.com"],
  allowedIframeHostnames: ["www.youtube.com", "player.vimeo.com", "platform.twitter.com", "www.instagram.com"],
  allowedStyles: {
    "*": {
      "background": [/^.+$/], "background-color": [/^.+$/],
      "border": [/^.+$/], "border-radius": [/^.+$/], "border-top": [/^.+$/], "border-left": [/^.+$/], "border-bottom": [/^.+$/], "border-right": [/^.+$/],
      "box-shadow": [/^.+$/],
      "color": [/^.+$/],
      "display": [/^.+$/],
      "flex-direction": [/^.+$/], "flex-grow": [/^.+$/], "align-items": [/^.+$/], "justify-content": [/^.+$/],
      "font-family": [/^.+$/], "font-size": [/^.+$/], "font-style": [/^.+$/], "font-weight": [/^.+$/],
      "height": [/^.+$/], "width": [/^.+$/], "max-width": [/^.+$/], "min-width": [/^.+$/],
      "line-height": [/^.+$/],
      "margin": [/^.+$/], "margin-top": [/^.+$/], "margin-bottom": [/^.+$/], "margin-left": [/^.+$/], "margin-right": [/^.+$/],
      "object-fit": [/^.+$/], "overflow": [/^.+$/],
      "padding": [/^.+$/], "padding-top": [/^.+$/], "padding-bottom": [/^.+$/],
      "text-align": [/^.+$/], "text-decoration": [/^.+$/], "text-overflow": [/^.+$/],
      "transform": [/^.+$/],
      "white-space": [/^.+$/],
    },
  },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
};

function renderPostContent(post) {
  if (!post) return post;
  const raw = post.isMarkdown ? marked.parse(post.content || "") : (post.content || "");
  return { ...post, renderedContent: sanitizeHtml(raw, SANITIZE_OPTS) };
}

async function columnExists(table, column) {
  const cols = await db.all(`PRAGMA table_info(${table})`);
  return cols.some((c) => c.name === column);
}

async function runSchema(sql) {
  const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
  for (const s of statements) await db.run(s);
}

async function initializeDB() {
  try {
    db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    await runSchema(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        hashedGoogleId TEXT NOT NULL UNIQUE,
        avatar_url TEXT,
        memberSince DATETIME NOT NULL
      );
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        username TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        likes INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        postId INTEGER NOT NULL,
        username TEXT NOT NULL,
        FOREIGN KEY(postId) REFERENCES posts(id),
        FOREIGN KEY(username) REFERENCES users(username)
      );
    `);

    if (!(await columnExists("users", "passwordHash"))) {
      await db.run("ALTER TABLE users ADD COLUMN passwordHash TEXT");
      const legacy = await db.all("SELECT id, hashedGoogleId FROM users");
      for (const u of legacy) {
        const hashed = await bcrypt.hash(String(u.hashedGoogleId), BCRYPT_ROUNDS);
        await db.run("UPDATE users SET passwordHash = ? WHERE id = ?", [hashed, u.id]);
      }
      console.log(`Migrated ${legacy.length} user(s) to bcrypt.`);
    }

    if (!(await columnExists("posts", "isMarkdown"))) {
      await db.run("ALTER TABLE posts ADD COLUMN isMarkdown INTEGER NOT NULL DEFAULT 0");
      console.log("Added posts.isMarkdown column.");
    }

    // Migrate locale-format timestamps (e.g. "6/5/2024, 3:38:00 PM") to ISO format
    const posts = await db.all("SELECT id, timestamp FROM posts");
    for (const p of posts) {
      if (p.timestamp && !p.timestamp.match(/^\d{4}-/)) {
        const d = new Date(p.timestamp);
        if (!isNaN(d.getTime())) {
          await db.run("UPDATE posts SET timestamp = ? WHERE id = ?", [d.toISOString(), p.id]);
        }
      }
    }
    const users = await db.all("SELECT id, memberSince FROM users");
    for (const u of users) {
      if (u.memberSince && !u.memberSince.match(/^\d{4}-/)) {
        const d = new Date(u.memberSince);
        if (!isNaN(d.getTime())) {
          await db.run("UPDATE users SET memberSince = ? WHERE id = ?", [d.toISOString(), u.id]);
        }
      }
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize the database:", error);
    process.exit(1);
  }
}

const googleOAuthEnabled = !!(process.env.CLIENT_ID && process.env.CLIENT_SECRET);

if (googleOAuthEnabled) {
  const callbackURL = `http://localhost:${PORT}/auth/google/callback`;
  console.log("[oauth] Google OAuth enabled");
  console.log("[oauth]   callbackURL =", callbackURL);
  console.log(
    "[oauth]   CLIENT_ID     =",
    (process.env.CLIENT_ID || "").slice(0, 16) + "... (len " + (process.env.CLIENT_ID || "").length + ")"
  );
  console.log(
    "[oauth]   CLIENT_SECRET present, length =",
    (process.env.CLIENT_SECRET || "").length
  );
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL,
      },
      async (token, tokenSecret, profile, done) => {
        try {
          let user = await db.get(
            "SELECT * FROM users WHERE hashedGoogleId = ?",
            [profile.id]
          );
          if (!user) {
            user = {
              id: null,
              username: null,
              hashedGoogleId: profile.id,
              memberSince: new Date().toISOString(),
            };
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );
} else {
  console.warn("CLIENT_ID / CLIENT_SECRET not set; Google OAuth is disabled.");
}

passport.serializeUser((user, done) => {
  done(null, user.hashedGoogleId);
});

passport.deserializeUser(async (hashedGoogleId, done) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE hashedGoogleId = ?", [
      hashedGoogleId,
    ]);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET not set; using insecure dev fallback. Set it in .env for production.");
}
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-insecure-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.engine(
  "handlebars",
  engine({
    helpers: {
      ifCond: function (v1, v2, options) {
        if (v1 === v2) return options.fn(this);
        return options.inverse(this);
      },
      ifUserMatch: function (userUsername, postUsername, options) {
        if (userUsername === postUsername) return options.fn(this);
        return options.inverse(this);
      },
      includes: function (array, value, options) {
        if (array && array.includes(value)) return options.fn(this);
        return options.inverse(this);
      },
      formatDate: function (isoString) {
        if (!isoString) return "";
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      },
    },
  })
);
app.set("view engine", "handlebars");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use((req, res, next) => {
  res.locals.appName = "Yappin";
  res.locals.copyrightYear = 2024;
  next();
});

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user && req.session.user.loggedIn) return next();
  if (req.method === "GET") return res.redirect("/login");
  return res.status(401).json({ error: "Not authenticated" });
}

const homePageHandler = async (req, res) => {
  const sort = req.query.sort || "recency";
  const rows = sort === "likes"
    ? await db.all("SELECT * FROM posts ORDER BY likes DESC, timestamp DESC")
    : await db.all("SELECT * FROM posts ORDER BY timestamp DESC");

  const totalPosts = await db.get("SELECT COUNT(*) as count FROM posts");
  const totalUsers = await db.get("SELECT COUNT(*) as count FROM users");
  const mostActive = await db.get("SELECT username, COUNT(*) as cnt FROM posts GROUP BY username ORDER BY cnt DESC LIMIT 1");
  const sidebarStats = {
    totalPosts: totalPosts.count,
    totalUsers: totalUsers.count,
    mostActive: mostActive ? mostActive.username : "N/A",
  };

  let userStats = null;
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

const loginPageHandler = (req, res) => {
  res.render("loginRegister", {
    title: "Login",
    formType: "Login",
    isLogin: true,
    googleOAuthEnabled,
    showNavBar: false,
    layout: "main",
  });
};

const registerPageHandler = (req, res) => {
  res.render("loginRegister", {
    title: "Register",
    formType: "Register",
    isLogin: false,
    googleOAuthEnabled,
    showNavBar: false,
    layout: "main",
    registerSuccess: req.session.registerSuccess || null,
  });
  req.session.registerSuccess = null;
};

const registerHandler = async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res.status(400).render("loginRegister", {
      formType: "Register", isLogin: false,
      registerError: "All fields are required.",
      googleOAuthEnabled, showNavBar: false, layout: "main",
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).render("loginRegister", {
      formType: "Register", isLogin: false,
      registerError: "Passwords do not match.",
      googleOAuthEnabled, showNavBar: false, layout: "main",
    });
  }

  try {
    const existingUser = await db.get("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUser) {
      return res.status(400).render("loginRegister", {
        formType: "Register", isLogin: false,
        registerError: "User already exists.",
        googleOAuthEnabled, showNavBar: false, layout: "main",
      });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const localSentinel = `local:${uuidv4()}`;

    await db.run(
      "INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince, passwordHash) VALUES (?, ?, ?, ?, ?)",
      [username, localSentinel, null, new Date().toISOString(), passwordHash]
    );

    req.session.registerSuccess = "Registered Successfully";
    res.redirect("/register");
  } catch (err) {
    console.error(err);
    res.status(500).render("loginRegister", {
      formType: "Register", isLogin: false,
      registerError: "Server error.",
      googleOAuthEnabled, showNavBar: false, layout: "main",
    });
  }
};

const loginHandler = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).render("loginRegister", {
      formType: "Login", isLogin: true,
      loginError: "All fields are required.",
      googleOAuthEnabled, showNavBar: false, layout: "main",
    });
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    const ok = user && user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!ok) {
      return res.status(400).render("loginRegister", {
        formType: "Login", isLogin: true,
        loginError: "Invalid credentials.",
        googleOAuthEnabled, showNavBar: false, layout: "main",
      });
    }

    req.session.user = {
      id: user.id,
      loggedIn: true,
      username: user.username,
      createdAt: user.memberSince,
    };

    if (!req.session.userAvatarColors) req.session.userAvatarColors = {};
    if (!req.session.userAvatarColors[username]) {
      req.session.userAvatarColors[username] = getRandomColor();
    }

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).render("loginRegister", {
      formType: "Login", isLogin: true,
      loginError: "Server error.",
      googleOAuthEnabled, showNavBar: false, layout: "main",
    });
  }
};

const logoutHandler = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/googleLogout");
  });
};

if (googleOAuthEnabled) {
  app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

  app.get("/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", (err, user) => {
      if (err) {
        console.error("[oauth] callback error:", err.name, "-", err.message);
        if (err.oauthError) {
          console.error("[oauth]   oauthError.statusCode =", err.oauthError.statusCode);
          console.error("[oauth]   oauthError.data       =", err.oauthError.data);
        }
        if (err.code) console.error("[oauth]   code =", err.code);
        return res.redirect("/login");
      }
      if (!user) return res.redirect("/login");
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        next();
      });
    })(req, res, next);
  }, async (req, res) => {
      if (!req.user || !req.user.hashedGoogleId) return res.redirect("/login");

      const user = await db.get("SELECT * FROM users WHERE hashedGoogleId = ?", [
        req.user.hashedGoogleId,
      ]);
      if (user) {
        req.session.user = {
          id: user.id,
          loggedIn: true,
          username: user.username,
          createdAt: user.memberSince,
        };
        res.redirect("/");
      } else {
        req.session.passport = req.user;
        res.redirect("/registerUsername");
    }
  }
  );
}

app.get("/registerUsername", (req, res) => {
  res.render("registerUsername", { error: req.session.error, layout: "main" });
  req.session.error = null;
});

app.post("/registerUsername", async (req, res) => {
  const username = req.body.username;
  if (!req.session.passport || !req.session.passport.hashedGoogleId) {
    return res.redirect("/login");
  }
  try {
    const existingUser = await db.get("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUser) {
      req.session.error = "Username already taken.";
      return res.redirect("/registerUsername");
    }

    await db.run(
      "INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)",
      [username, req.session.passport.hashedGoogleId, null, new Date().toISOString()]
    );

    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    req.session.user = {
      id: user.id,
      loggedIn: true,
      username,
      createdAt: user.memberSince,
    };
    res.redirect("/");
  } catch (error) {
    console.error(error);
    req.session.error = "Server error.";
    res.redirect("/registerUsername");
  }
});

app.get("/googleLogout", (req, res) => {
  res.render("googleLogout", { layout: false });
});

app.get("/logoutCallback", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Server error.");
    res.redirect("/");
  });
});

const createPostHandler = async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.redirect("/");

  await db.run(
    "INSERT INTO posts (title, content, username, timestamp, likes, isMarkdown) VALUES (?, ?, ?, ?, ?, ?)",
    [title, content, req.session.user.username, new Date().toISOString(), 0, 1]
  );
  res.redirect("/");
};

const likePostHandler = async (req, res) => {
  const postId = req.params.id;
  const username = req.session.user.username;

  const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.username === username) return res.status(400).json({ error: "Cannot like your own post" });

  const likedByUser = await db.get(
    "SELECT COUNT(*) as count FROM likes WHERE postId = ? AND username = ?",
    [postId, username]
  );

  if (likedByUser.count === 0) {
    await db.run("INSERT INTO likes (postId, username) VALUES (?, ?)", [postId, username]);
    await db.run("UPDATE posts SET likes = likes + 1 WHERE id = ?", [postId]);
  } else {
    await db.run("DELETE FROM likes WHERE postId = ? AND username = ?", [postId, username]);
    await db.run("UPDATE posts SET likes = likes - 1 WHERE id = ?", [postId]);
  }

  const updatedPost = await db.get("SELECT likes FROM posts WHERE id = ?", [postId]);
  res.json({ likes: updatedPost.likes, likedByUser: likedByUser.count === 0 });
};

const deletePostHandler = async (req, res) => {
  const postId = req.params.id;
  await db.run("DELETE FROM posts WHERE id = ? AND username = ?", [
    postId, req.session.user.username,
  ]);
  res.redirect("/");
};

const getPostByIdHandler = async (req, res) => {
  const postId = req.params.id;
  const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!post) return res.redirect("/error");

  res.render("post", {
    title: post.title,
    post: renderPostContent(post),
    user: req.session.user,
    showNavBar: true,
    layout: "main",
  });
};

const errorPageHandler = (req, res) => {
  res.render("error", { title: "Error", showNavBar: true, layout: "main" });
};

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

const deleteAccountHandler = async (req, res) => {
  const username = req.session.user.username;
  try {
    await db.run("DELETE FROM likes WHERE username = ?", [username]);
    await db.run("DELETE FROM posts WHERE username = ?", [username]);
    await db.run("DELETE FROM users WHERE username = ?", [username]);

    req.session.destroy((err) => {
      if (err) return res.status(500).send("Server error.");
      res.redirect("/");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete the account.");
  }
};

const getRandomColor = () => {
  const colors = ["#FF5733","#33FF57","#3357FF","#F39C12","#8E44AD","#3498DB","#E74C3C","#1ABC9C"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const avatarHandler = async (req, res) => {
  const { username } = req.params;

  if (!req.session.userAvatarColors) req.session.userAvatarColors = {};
  if (!req.session.userAvatarColors[username]) {
    req.session.userAvatarColors[username] = getRandomColor();
  }
  const backgroundColor = req.session.userAvatarColors[username];

  const canvas = createCanvas(200, 200);
  const context = canvas.getContext("2d");
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = "bold 128px Sans";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#FFFFFF";
  context.fillText((username || "?").charAt(0).toUpperCase(), canvas.width / 2, canvas.height / 2);

  res.setHeader("Content-Type", "image/png");
  res.send(canvas.toBuffer("image/png"));
};

const API_URL = "https://emoji-api.com/emojis";
const fetchEmojisHandler = async (req, res) => {
  try {
    const apiKey = process.env.EMOJI_API_KEY;
    const response = await axios.get(API_URL, { params: { access_key: apiKey } });
    const emojis = response.data.map((e) => ({ character: e.character, name: e.unicodeName }));
    res.json({ emojis, totalPages: 1 });
  } catch (error) {
    console.error("Error fetching emojis:", error);
    res.status(500).json({ error: "Failed to fetch emojis" });
  }
};

const editPostPageHandler = async (req, res) => {
  const postId = req.params.id;
  const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!post) return res.redirect("/error");
  if (post.username !== req.session.user.username) return res.status(403).send("Unauthorized");

  res.render("editPost", { title: "Edit Post", post, showNavBar: true, layout: "main" });
};

const editPostHandler = async (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;

  const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!post) return res.redirect("/error");
  if (post.username !== req.session.user.username) return res.status(403).send("Unauthorized");

  await db.run(
    "UPDATE posts SET title = ?, content = ?, isMarkdown = 1 WHERE id = ?",
    [title, content, postId]
  );
  res.redirect("/");
};

app.get("/", homePageHandler);
app.get("/login", loginPageHandler);
app.get("/register", registerPageHandler);
app.post("/register", registerHandler);
app.post("/login", loginHandler);
app.get("/logout", logoutHandler);
app.post("/posts", isAuthenticated, createPostHandler);
app.post("/like/:id", isAuthenticated, likePostHandler);
app.post("/delete/:id", isAuthenticated, deletePostHandler);
app.get("/post/:id", getPostByIdHandler);
app.get("/error", errorPageHandler);
app.get("/profile", isAuthenticated, profilePageHandler);
app.get("/avatar/:username", avatarHandler);
app.get("/emojis", fetchEmojisHandler);
app.get("/edit/:id", isAuthenticated, editPostPageHandler);
app.post("/edit/:id", isAuthenticated, editPostHandler);
app.post("/deleteAccount", isAuthenticated, deleteAccountHandler);

initializeDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize the database:", err);
  });
