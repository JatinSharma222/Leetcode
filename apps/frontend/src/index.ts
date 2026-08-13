import express from "express";
import path from "node:path";

const app = express();
const PORT = process.env.PORT || 3000;

const distDir = path.join(__dirname, "../dist");

// Serve static assets from build output directory
app.use(express.static(distDir));

// Fallback handler for SPA client routing
app.use((_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Frontend Express server running at http://localhost:${PORT}`);
});
