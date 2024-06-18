const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const { open } = sqlite;
const marked = require("marked");

const dbFileName = "microblog.db";

const users = [
  {
    username: "user1",
    hashedGoogleId: "hashedGoogleId1",
    avatar_url: "",
    memberSince: "2024-01-01 12:00:00",
  },
  {
    username: "user2",
    hashedGoogleId: "hashedGoogleId2",
    avatar_url: "",
    memberSince: "2024-01-02 12:00:00",
  },
  {
    username: "user3",
    hashedGoogleId: "hashedGoogleId3",
    avatar_url: "",
    memberSince: "2024-01-03 12:00:00",
  },
];

const posts = [
  {
    title: "First Post",
    content: `# Hello World

This is my **first post** with some _Markdown_ content.

Here is a link to [Google](https://www.google.com).

\`\`\`javascript
console.log("Hello, world!");
\`\`\`
`,
    username: "user1",
    timestamp: "2024-01-01 12:30:00",
    likes: 0,
  },
  {
    title: "Second Post",
    content: `## Subheading

- Item 1
- Item 2
- Item 3

> This is a blockquote.

Enjoy reading!`,
    username: "user2",
    timestamp: "2024-01-02 12:30:00",
    likes: 0,
  },
  {
    title: "Fourth Post with Image",
    content: `### Image Example

Here is an image: 
<br>
<img src="https://img.freepik.com/free-photo/painting-mountain-lake-with-mountain-background_188544-9126.jpg?size=626&ext=jpg&ga=GA1.1.1518270500.1717459200&semt=sph" width="300"/>
`,
    username: "user1",
    timestamp: "2024-01-04 10:15:00",
    likes: 5000,
  },
];

async function initializeDB() {
  const db = await open({ filename: dbFileName, driver: sqlite3.Database });

  await db.exec(`
        DROP TABLE IF EXISTS users;
        DROP TABLE IF EXISTS posts;
        DROP TABLE IF EXISTS likes;

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

  // Insert sample data into the database
  await Promise.all(
    users.map((user) => {
      return db.run(
        "INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)",
        [user.username, user.hashedGoogleId, user.avatar_url, user.memberSince]
      );
    })
  );

  await Promise.all(
    posts.map((post) => {
      return db.run(
        "INSERT INTO posts (title, content, username, timestamp, likes) VALUES (?, ?, ?, ?, ?)",
        [
          post.title,
          marked.parse(post.content),
          post.username,
          post.timestamp,
          post.likes,
        ] // Convert Markdown to HTML using marked.parse
      );
    })
  );

  console.log("Database populated with initial data.");
  await db.close();
}

initializeDB().catch((err) => {
  console.error("Error initializing database:", err);
});
