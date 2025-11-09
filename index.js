import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let lastSpawn = null;
let leaderboard = {}; // { user: count }
let lastGlowUser = null; // pentru efect vizual când cineva urcă în top

// ===========================
// 🔹 POST /spawn — called by your YouTube bot
// ===========================
app.post("/spawn", (req, res) => {
  const { name, user } = req.body;
  console.log("Spawn request:", name, "from", user);

  if (typeof name !== "string") return res.status(400).json({ error: "Invalid name" });

  lastSpawn = {
    name: name.trim().substring(0, 30),
    user: user || "unknown",
    time: Date.now(),
  };

  // update leaderboard
  const username = user || "unknown";
  leaderboard[username] = (leaderboard[username] || 0) + 1;
  lastGlowUser = username;

  res.json({ status: "ok" });
});

// ===========================
// 🔹 GET /getSpawn — Roblox polls this
// ===========================
app.get("/getSpawn", (req, res) => {
  if (lastSpawn) res.json(lastSpawn);
  else res.json({});
});

// ===========================
// 🔹 GET /leaderboard — HTML page for OBS
// ===========================
app.get("/leaderboard", (req, res) => {
  const sorted = Object.entries(leaderboard)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const colors = ["#ff4444", "#44ff44", "#4488ff", "#ffff44", "#ff66ff", "#00ffff"];

  const leaderboardHTML = sorted
    .map(([user, count], i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const crown = i === 0 ? "👑 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : "";

      // dacă userul e cel care tocmai a făcut un spawn, îi dăm efect de glow
      const glowEffect = user === lastGlowUser ? "glow" : "";

      return `
        <div class="entry ${glowEffect}" style="color:${color}; font-size:${40 - i * 5}px;">
          ${crown}${user} — ${count} spawns
        </div>`;
    })
    .join("");

  // Resetăm efectul după ce s-a afișat o dată
  lastGlowUser = null;

  res.send(`
    <html>
    <head>
      <meta http-equiv="refresh" content="3">
      <style>
        body {
          background: transparent;
          color: white;
          font-family: 'Poppins', sans-serif;
          text-align: center;
          overflow: hidden;
          margin: 0;
          padding-top: 20px;
        }

        .entry {
          margin: 8px 0;
          animation: pulse 2s infinite;
          transition: all 0.3s ease;
        }

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.03); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ✨ efect de glow când cineva urcă în top */
        .glow {
          animation: glowPop 1.5s ease-in-out;
          text-shadow: 0 0 20px gold, 0 0 40px gold, 0 0 80px orange;
        }

        @keyframes glowPop {
          0% { transform: scale(1); opacity: 1; }
          30% { transform: scale(1.3); opacity: 1; }
          60% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
      </style>
    </head>
    <body>
      ${leaderboardHTML || "<div>No spawns yet!</div>"}
    </body>
    </html>
  `);
});

// ===========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
