const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const { open } = sqlite;

const dbFileName = "microblog.db";
const BCRYPT_ROUNDS = 10;

const users = [
  { username: "alice_codes",   password: "alice_codespass",   memberSince: "2024-01-05T09:12:00Z" },
  { username: "marcus_writes", password: "marcus_writespass", memberSince: "2024-02-14T18:02:00Z" },
  { username: "pixelpoppy",    password: "pixelpoppypass",    memberSince: "2024-03-22T11:45:00Z" },
  { username: "night_owl",     password: "night_owlpass",     memberSince: "2024-06-08T23:57:00Z" },
  { username: "foodie_finn",   password: "foodie_finnpass",   memberSince: "2024-09-17T07:30:00Z" },
  { username: "trailblazer",   password: "trailblazerpass",   memberSince: "2024-11-03T06:15:00Z" },
  { username: "musiclover42",  password: "musiclover42pass",  memberSince: "2025-02-11T20:20:00Z" },
  { username: "student_life",  password: "student_lifepass",  memberSince: "2025-08-28T14:00:00Z" },
];

const posts = [
  {
    title: "Hello World",
    content: `# Hello World

This is my **first post** with some _Markdown_ content.

Here is a link to [Google](https://www.google.com).

\`\`\`javascript
console.log("Hello, world!");
\`\`\``,
    username: "alice_codes",
    timestamp: "2024-01-05T10:00:00Z",
    likes: 3,
  },
  {
    title: "Why I Love Sunday Mornings",
    content: `## Subheading

- Fresh coffee
- A good book
- Zero meetings

> The quieter you become, the more you can hear.

Enjoy your weekend!`,
    username: "marcus_writes",
    timestamp: "2024-02-18T08:45:00Z",
    likes: 12,
  },
  {
    title: "Mountain Views",
    content: `### A view I won't forget

![Mountain](https://img.freepik.com/free-photo/painting-mountain-lake-with-mountain-background_188544-9126.jpg?size=626&ext=jpg)

Took a 6-hour hike to get here. Worth every blister.`,
    username: "trailblazer",
    timestamp: "2024-11-10T16:22:00Z",
    likes: 248,
  },
  {
    title: "Grandma's Pasta Sauce (secret recipe)",
    content: `Let's be honest — "secret" means *I'm sharing it anyway*.

**Ingredients**
- 2 cans San Marzano tomatoes
- 4 cloves garlic
- 1 yellow onion
- Olive oil, salt, sugar, basil

**Steps**
1. Sauté onion + garlic until translucent
2. Add tomatoes, crush by hand
3. Pinch of sugar to balance acidity
4. Simmer 45 minutes, uncovered
5. Finish with fresh basil

Serve over anything. Thank me later.`,
    username: "foodie_finn",
    timestamp: "2024-10-02T19:15:00Z",
    likes: 891,
  },
  {
    title: "3 AM Thoughts",
    content: `Why do we call it *falling* asleep?
We don't fall into it. We surrender.

There's a difference.

🌙 ✨`,
    username: "night_owl",
    timestamp: "2024-06-11T03:12:00Z",
    likes: 420,
  },
  {
    title: "My First JavaScript One-Liner Trick",
    content: `TIL you can swap two variables without a temp:

\`\`\`javascript
let a = 1, b = 2;
[a, b] = [b, a];
console.log(a, b); // 2, 1
\`\`\`

Destructuring assignment is wild. What's your favorite one-liner?`,
    username: "alice_codes",
    timestamp: "2025-03-14T13:42:00Z",
    likes: 57,
  },
  {
    title: "New Album Obsession",
    content: `I've had "Midnights (3am Edition)" on repeat for a week straight.

Tracks that hit hardest:
1. **Would've, Could've, Should've**
2. **Bigger Than the Whole Sky**
3. **Dear Reader**

What's on *your* playlist this month?`,
    username: "musiclover42",
    timestamp: "2025-03-01T21:00:00Z",
    likes: 134,
  },
  {
    title: "Shipped My First Feature",
    content: `Two weeks of debugging. Three espresso-fueled nights. One working pull request.

Lessons:
- Read the error message. *Actually* read it.
- \`console.log\` is not beneath you.
- Ask for help at hour 3, not hour 12.

Onwards 🚀`,
    username: "alice_codes",
    timestamp: "2025-05-20T17:30:00Z",
    likes: 76,
  },
  {
    title: "Design Critique of the Week",
    content: `Saw a landing page today with **seven** CTA buttons above the fold.

Seven.

If everything is urgent, nothing is. Pick one call to action, make it obvious, and trust your users to scroll.

[Good reading on this](https://www.nngroup.com/articles/call-to-action/)`,
    username: "pixelpoppy",
    timestamp: "2025-07-09T10:05:00Z",
    likes: 203,
  },
  {
    title: "Essay: On Doing Less",
    content: `I used to think productivity meant output per hour. Now I think it means *not doing the wrong thing for eight hours*.

The hardest skill isn't working harder. It's choosing correctly. It's saying no to five good things so you can say yes to the one that matters.

Still learning this. Probably always will be.`,
    username: "marcus_writes",
    timestamp: "2025-09-15T11:33:00Z",
    likes: 512,
  },
  {
    title: "Quick Ramen Upgrade",
    content: `Instant ramen is fine. **Instant ramen with a 6-minute egg, sesame oil, and scallions** is a religious experience.

Try it tonight. Thank me tomorrow.`,
    username: "foodie_finn",
    timestamp: "2025-10-06T20:40:00Z",
    likes: 328,
  },
  {
    title: "Trail Report: Lost Lake",
    content: `**Distance**: 11.4 miles round trip
**Elevation**: 2,400 ft
**Difficulty**: Moderate

Started at 6 AM to beat the crowd. Worth it — had the summit to myself for 20 minutes.

Bring layers. The wind at the ridge is no joke.`,
    username: "trailblazer",
    timestamp: "2025-08-24T18:55:00Z",
    likes: 95,
  },
  {
    title: "First Day of Finals",
    content: `3 exams. 4 days. 0 sleep planned.

Coffee: ☕☕☕
Anxiety: 📈
Notes: somewhere, probably

send help 😩`,
    username: "student_life",
    timestamp: "2025-12-09T07:18:00Z",
    likes: 44,
  },
  {
    title: "Why I Switched to Dvorak",
    content: `Three months in. My typing speed finally matched QWERTY. Now I'm faster.

**Pros**
- Less finger travel
- Hands feel less tired after long sessions
- Vowels on the home row feels *right*

**Cons**
- Pair programming is chaos
- Every new laptop = reconfiguration
- Friends think I'm pretentious (correct)`,
    username: "alice_codes",
    timestamp: "2026-01-07T14:00:00Z",
    likes: 188,
  },
  {
    title: "Cozy Weekend Haul",
    content: `Went to the farmer's market. Came back with:

- Sourdough loaf 🥖
- Honeycrisp apples 🍎
- A candle that smells like a campfire 🕯️
- Two pastries I didn't need but deserved 🥐

No regrets.`,
    username: "pixelpoppy",
    timestamp: "2026-02-01T12:00:00Z",
    likes: 267,
  },
  {
    title: "Concert Recap",
    content: `Saw **Hozier** last night. Voice unreal. Stage presence unreal. Crowd singing "Take Me to Church" so loud the venue shook.

If he rolls through your city — go. Don't think about it.

⭐⭐⭐⭐⭐`,
    username: "musiclover42",
    timestamp: "2026-02-23T22:45:00Z",
    likes: 411,
  },
  {
    title: "Debugging Is Just Humility",
    content: `Today's bug: \`undefined is not a function\`.

Two hours of staring at framework code. Convinced the library was broken.

Turns out I typed \`.lenght\` instead of \`.length\`.

Humbling. Every. Single. Time.`,
    username: "alice_codes",
    timestamp: "2026-03-11T15:22:00Z",
    likes: 623,
  },
  {
    title: "On Reading Slowly",
    content: `Finished *The Overstory* by Richard Powers. 500 pages. Took me two months.

I used to speed-read. Now I savor. A good sentence is like a good meal — you don't inhale it.

What are you reading right now?`,
    username: "marcus_writes",
    timestamp: "2026-03-28T09:10:00Z",
    likes: 289,
  },
  {
    title: "Spring Cleaning My Desktop",
    content: `Before: 847 files on my desktop
After: 12

I moved the rest into a folder called "sort_later_2026" which, let's be honest, I will never open.

Small wins count.`,
    username: "student_life",
    timestamp: "2026-04-05T11:00:00Z",
    likes: 156,
  },
  {
    title: "Sunrise Run",
    content: `Woke up at 5:30. Ran 4 miles along the river. Watched the sun come up over the bridge.

Some days start themselves.

🌅`,
    username: "trailblazer",
    timestamp: "2026-04-14T06:05:00Z",
    likes: 178,
  },
];

async function runSchema(db, sql) {
  const statements = sql.split(";").map((s) => s.trim()).filter(Boolean);
  for (const s of statements) await db.run(s);
}

async function initializeDB() {
  const db = await open({ filename: dbFileName, driver: sqlite3.Database });

  await runSchema(db, `
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS likes;

    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      hashedGoogleId TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      memberSince DATETIME NOT NULL,
      passwordHash TEXT
    );

    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      username TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      likes INTEGER NOT NULL,
      isMarkdown INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      username TEXT NOT NULL,
      FOREIGN KEY(postId) REFERENCES posts(id),
      FOREIGN KEY(username) REFERENCES users(username)
    );
  `);

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    await db.run(
      "INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince, passwordHash) VALUES (?, ?, ?, ?, ?)",
      [user.username, `local:${user.username}`, "", user.memberSince, passwordHash]
    );
  }

  for (const post of posts) {
    await db.run(
      "INSERT INTO posts (title, content, username, timestamp, likes, isMarkdown) VALUES (?, ?, ?, ?, ?, ?)",
      [post.title, post.content, post.username, post.timestamp, post.likes, 1]
    );
  }

  console.log(`Database populated with ${users.length} users and ${posts.length} posts.`);
  await db.close();
}

initializeDB().catch((err) => {
  console.error("Error initializing database:", err);
});
