const express = require("express");
const path = require("path");
const jobController = require("./controllers/jobController");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

// API Routes
app.post("/api/start", jobController.startJob);
app.get("/api/status/:jobId", jobController.getJobStatus);
app.get("/api/cancel/:jobId", jobController.cancelJob);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
