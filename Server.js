// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

// Master M3U URL (jisme naya 6hr token har channel ke liye hota hai)
const MASTER_M3U = "https://raw.githubusercontent.com/Akash802980/nxtm3u/refs/heads/main/Aki.m3u";

// Cache to avoid fetching on every request
let cache = { data: null, time: 0 };

// Helper: Get latest M3U data
async function getM3U() {
  const now = Date.now();
  if (cache.data && (now - cache.time < 5 * 60 * 1000)) {
    // cache valid for 5 min
    return cache.data;
  }
  const res = await fetch(MASTER_M3U);
  const text = await res.text();
  cache = { data: text, time: now };
  return text;
}

// Endpoint: /:tvgid
app.get("/:tvgid", async (req, res) => {
  try {
    const tvgid = req.params.tvgid;
    const m3u = await getM3U();

    // Find channel block by tvg-id
    const regex = new RegExp(`#EXTINF:[^\\n]*tvg-id="${tvgid}"[\\s\\S]*?(https[^\\s]+index\\.mpd[^\\s]*)`, "i");
    const match = m3u.match(regex);

    if (!match) {
      return res.status(404).send("Channel not found in M3U");
    }

    const url = match[1]; // latest 6hr link
    return res.redirect(url);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error fetching channel");
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
