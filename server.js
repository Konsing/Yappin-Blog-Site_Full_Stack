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

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 3000;
const dbFileName = "microblog.db";
let db;

// Initialize the SQLite database connection
async function initializeDB() {
  try {
    db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });
    await db.exec(`
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
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize the database:", error);
    process.exit(1); // Exit the process with an error code
  }
}

// Configure passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `http://localhost:${PORT}/auth/google/callback`,
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
            memberSince: new Date().toLocaleString(),
          };
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.hashedGoogleId);
});

passport.deserializeUser(async (hashedGoogleId, done) => {
  try {
    let user = await db.get("SELECT * FROM users WHERE hashedGoogleId = ?", [
      hashedGoogleId,
    ]);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(
  session({
    secret: "oneringtorulethemall",
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
        if (v1 === v2) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
      ifUserMatch: function (userUsername, postUsername, options) {
        if (userUsername === postUsername) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
      includes: function (array, value, options) {
        if (array && array.includes(value)) {
          return options.fn(this);
        }
        return options.inverse(this);
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

// Route handlers
const homePageHandler = async (req, res) => {
  const sort = req.query.sort || "recency";
  let sortedPosts;

  if (sort === "likes") {
    sortedPosts = await db.all(
      "SELECT * FROM posts ORDER BY likes DESC, timestamp DESC"
    );
  } else {
    sortedPosts = await db.all("SELECT * FROM posts ORDER BY timestamp DESC");
  }

  res.render("home", {
    title: "Home",
    user: req.session.user,
    posts: sortedPosts,
    sort: sort,
    showNavBar: true,
    layout: "main",
  });
};

const loginPageHandler = (req, res) => {
  res.render("loginRegister", {
    title: "Login",
    formType: "Login",
    isLogin: true,
    showNavBar: false,
    layout: "main",
  });
};

const registerPageHandler = (req, res) => {
  res.render("loginRegister", {
    title: "Register",
    formType: "Register",
    isLogin: false,
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
      formType: "Register",
      isLogin: false,
      registerError: "All fields are required.",
      showNavBar: false,
      layout: "main",
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).render("loginRegister", {
      formType: "Register",
      isLogin: false,
      registerError: "Passwords do not match.",
      showNavBar: false,
      layout: "main",
    });
  }

  try {
    const existingUser = await db.get(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUser) {
      return res.status(400).render("loginRegister", {
        formType: "Register",
        isLogin: false,
        registerError: "User already exists.",
        showNavBar: false,
        layout: "main",
      });
    }

    const newUser = {
      username,
      hashedGoogleId: password, // Replace this with actual hashed password
      avatar_url: undefined,
      memberSince: new Date().toLocaleString(),
    };
    await db.run(
      "INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)",
      [
        newUser.username,
        newUser.hashedGoogleId,
        newUser.avatar_url,
        newUser.memberSince,
      ]
    );

    req.session.registerSuccess = "Registered Successfully";
    res.redirect("/register");
  } catch (err) {
    console.error(err);
    res.status(500).render("loginRegister", {
      formType: "Register",
      isLogin: false,
      registerError: "Server error.",
      showNavBar: false,
      layout: "main",
    });
  }
};

const loginHandler = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).render("loginRegister", {
      formType: "Login",
      isLogin: true,
      loginError: "All fields are required.",
      showNavBar: false,
      layout: "main",
    });
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (!user || user.hashedGoogleId !== password) {
      // Replace with actual password comparison
      return res.status(400).render("loginRegister", {
        formType: "Login",
        isLogin: true,
        loginError: "Invalid credentials.",
        showNavBar: false,
        layout: "main",
      });
    }

    req.session.user = {
      id: user.id,
      loggedIn: true,
      username: user.username,
      createdAt: user.memberSince,
    };

    if (!req.session.userAvatarColors) {
      req.session.userAvatarColors = {};
    }
    if (!req.session.userAvatarColors[username]) {
      req.session.userAvatarColors[username] = getRandomColor();
    }

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).render("loginRegister", {
      formType: "Login",
      isLogin: true,
      loginError: "Server error.",
      showNavBar: false,
      layout: "main",
    });
  }
};

const logoutHandler = (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/googleLogout");
  });
};

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    if (!req.user || !req.user.hashedGoogleId) {
      return res.redirect("/login"); // Handle unexpected cases
    }

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

app.get("/registerUsername", (req, res) => {
  res.render("registerUsername", { error: req.session.error, layout: "main" });
  req.session.error = null;
});

app.post("/registerUsername", async (req, res) => {
  const username = req.body.username;
  try {
    const existingUser = await db.get(
      "SELECT * FROM users WHERE username = ?",
      [username]
    );
    if (existingUser) {
      req.session.error = "Username already taken.";
      return res.redirect("/registerUsername");
    }

    await db.run(
      "INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)",
      [
        username,
        req.session.passport.hashedGoogleId,
        null,
        new Date().toLocaleString(),
      ]
    );

    // Fetch the newly created user to get the id
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    req.session.user = {
      id: user.id,
      loggedIn: true,
      username: username,
      createdAt: user.memberSince,
    };

    res.redirect("/");
  } catch (error) {
    console.error(error);
    req.session.error = "Server error.";
    res.redirect("/registerUsername");
  }
});

app.get("/logout", logoutHandler);

app.get("/googleLogout", (req, res) => {
  res.render("googleLogout", { layout: false });
});

app.get("/logoutCallback", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Server error.");
    }
    res.redirect("/");
  });
});

const createPostHandler = async (req, res) => {
  const { title, content } = req.body;
  const newPost = {
    title,
    content: marked.parse(content), // Convert Markdown to HTML using marked.parse
    username: req.session.user.username,
    timestamp: new Date().toLocaleString(),
    likes: 0,
  };
  await db.run(
    "INSERT INTO posts (title, content, username, timestamp, likes) VALUES (?, ?, ?, ?, ?)",
    [
      newPost.title,
      newPost.content,
      newPost.username,
      newPost.timestamp,
      newPost.likes,
    ]
  );
  res.redirect("/");
};

const likePostHandler = async (req, res) => {
  const postId = req.params.id;
  const username = req.session.user.username;

  const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (post.username === username) {
    return res.status(400).json({ error: "Cannot like your own post" });
  }

  const likedByUser = await db.get(
    "SELECT COUNT(*) as count FROM likes WHERE postId = ? AND username = ?",
    [postId, username]
  );

  if (likedByUser.count === 0) {
    await db.run("INSERT INTO likes (postId, username) VALUES (?, ?)", [
      postId,
      username,
    ]);
    await db.run("UPDATE posts SET likes = likes + 1 WHERE id = ?", [postId]);
  } else {
    await db.run("DELETE FROM likes WHERE postId = ? AND username = ?", [
      postId,
      username,
    ]);
    await db.run("UPDATE posts SET likes = likes - 1 WHERE id = ?", [postId]);
  }

  const updatedPost = await db.get("SELECT likes FROM posts WHERE id = ?", [
    postId,
  ]);
  res.json({ likes: updatedPost.likes, likedByUser: likedByUser.count === 0 });
};

const deletePostHandler = async (req, res) => {
  const postId = req.params.id;
  await db.run("DELETE FROM posts WHERE id = ? AND username = ?", [
    postId,
    req.session.user.username,
  ]);
  res.redirect("/");
};

const getPostByIdHandler = async (req, res) => {
  const postId = req.params.id;
  const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);

  if (!post) {
    return res.redirect("/error");
  }

  res.render("post", {
    title: post.title,
    post,
    user: req.session.user,
    showNavBar: true,
    layout: "main",
  });
};

const errorPageHandler = (req, res) => {
  res.render("error", {
    title: "Error",
    showNavBar: true,
    layout: "main",
  });
};

const profilePageHandler = async (req, res) => {
  const userPosts = await db.all("SELECT * FROM posts WHERE username = ?", [
    req.session.user.username,
  ]);

  res.render("profile", {
    title: "Profile",
    user: req.session.user,
    userPosts: userPosts,
    showNavBar: true,
    layout: "main",
  });
};

const deleteAccountHandler = async (req, res) => {
  const username = req.session.user.username;

  try {
    // Delete likes associated with the user
    await db.run("DELETE FROM likes WHERE username = ?", [username]);

    // Delete posts associated with the user
    await db.run("DELETE FROM posts WHERE username = ?", [username]);

    // Delete the user account
    await db.run("DELETE FROM users WHERE username = ?", [username]);

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Server error.");
      }
      res.redirect("/");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete the account.");
  }
};

app.post("/deleteAccount", deleteAccountHandler);

const getRandomColor = () => {
  const colors = [
    "#FF5733", // Red
    "#33FF57", // Green
    "#3357FF", // Blue
    "#F39C12", // Orange
    "#8E44AD", // Purple
    "#3498DB", // Light Blue
    "#E74C3C", // Light Red
    "#1ABC9C", // Teal
  ];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
};

const avatarHandler = async (req, res) => {
  const { username } = req.params;

  if (!req.session.userAvatarColors) {
    req.session.userAvatarColors = {};
  }

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

  const firstLetter = username.charAt(0).toUpperCase();
  context.fillText(firstLetter, canvas.width / 2, canvas.height / 2);

  const buffer = canvas.toBuffer("image/png");
  res.setHeader("Content-Type", "image/png");
  res.send(buffer);
};

const API_URL = "https://emoji-api.com/emojis";

const fetchEmojisHandler = async (req, res) => {
  try {
    const apiKey = process.env.EMOJI_API_KEY;

    const response = await axios.get(API_URL, {
      params: {
        access_key: apiKey,
      },
    });

    const emojis = response.data.map((emoji) => ({
      character: emoji.character,
      name: emoji.unicodeName,
    }));

    res.json({ emojis, totalPages: 1 });
  } catch (error) {
    console.error("Error fetching emojis:", error);
    res.status(500).json({ error: "Failed to fetch emojis" });
  }
};

const editPostPageHandler = async (req, res) => {
  const postId = req.params.id;
  const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);

  if (!post) {
    return res.redirect("/error");
  }

  if (post.username !== req.session.user.username) {
    return res.status(403).send("Unauthorized");
  }

  res.render("editPost", {
    title: "Edit Post",
    post,
    showNavBar: true,
    layout: "main",
  });
};

const editPostHandler = async (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;

  const post = await db.get("SELECT * FROM posts WHERE id = ?", [postId]);

  if (!post) {
    return res.redirect("/error");
  }

  if (post.username !== req.session.user.username) {
    return res.status(403).send("Unauthorized");
  }

  await db.run(
    "UPDATE posts SET title = ?, content = ? WHERE id = ?",
    [title, marked.parse(content), postId] // Convert Markdown to HTML using marked.parse
  );

  res.redirect("/");
};

app.get("/", homePageHandler);
app.get("/login", loginPageHandler);
app.get("/register", registerPageHandler);
app.post("/register", registerHandler);
app.post("/login", loginHandler);
app.get("/logout", logoutHandler);
app.post("/posts", createPostHandler);
app.post("/like/:id", likePostHandler);
app.post("/delete/:id", deletePostHandler);
app.get("/post/:id", getPostByIdHandler);
app.get("/error", errorPageHandler);
app.get("/profile", profilePageHandler);
app.get("/avatar/:username", avatarHandler);
app.get("/emojis", fetchEmojisHandler);
app.get("/edit/:id", editPostPageHandler);
app.post("/edit/:id", editPostHandler);

initializeDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize the database:", err);
  });
