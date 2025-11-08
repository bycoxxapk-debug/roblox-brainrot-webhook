import express from "express";
const app = express();
app.use(express.json());

let lastSpawn = null;

// Receive spawn requests from your YouTube chat bot
app.post("/spawn", (req, res) => {
  const { name, user } = req.body;
  console.log("Spawn request:", name, "from", user);
  if (typeof name !== "string") return res.status(400).json({ error: "Invalid name" });

  lastSpawn = {
    name: name.trim().substring(0, 30),
    user: user || "unknown",
    time: Date.now()
  };
  res.json({ status: "ok" });
});

// Roblox polls this to get the latest spawn
app.get("/getSpawn", (req, res) => {
  if (lastSpawn) {
    res.json(lastSpawn);
  } else {
    res.json({});
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
