import express from "express";
import "dotenv/config";
import cors from 'cors';
import cron from 'node-cron';

import runScraper from "./scripts/scraper.js";

//Route imports
import authRoute from "./routes/auth.js";
import catRoute from "./routes/categories.js";
import tenderRoute from "./routes/tenders.js";
import {authLimiter,scraperLimiter,apiLimiter} from "./middlewares/rateLimiter.js"

const port = process.env.PORT || 8000;

const app=express();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost, any vercel.app preview domain, or custom CLIENT_URL
    if (
      origin.includes("localhost") ||
      origin.endsWith(".vercel.app") ||
      (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
    ) {
      return callback(null, true);
    }
    return callback(new Error("Blocked by CORS"));
  },
  credentials: true,
}));

app.listen(port,()=>{
    console.log("App started");
});


// Schedule scraper to run every morning at 8:00 AM (server time)
cron.schedule("0 8 * * *", () => {
  console.log("Running scheduled daily tender scraper...");
  runScraper();
},{
  timezone: "Asia/Kolkata" // Sets your local time zone so 8 AM means 8 AM IST
});

app.get("/",(req,res)=>{
    res.send("App is listening");
});

// Endpoint triggered by cron-job.org or monitoring
app.get("/api/cron/scrape", scraperLimiter, async (req, res) => {
  console.log("⏰ Triggering scraper via external cron job...");
  try {
    const stats = await runScraper();
    if (!stats.success) {
      return res.status(502).json({
        message: "Scraper execution failed (possible portal block or network error)",
        stats,
      });
    }
    res.json({
      message: "Scraper executed successfully!",
      stats,
    });
  } catch (err) {
    console.error("Scraper failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.use("/api/auth",authLimiter,authRoute);
app.use('/api/categories',apiLimiter, catRoute);
app.use('/api/tenders',apiLimiter, tenderRoute);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});