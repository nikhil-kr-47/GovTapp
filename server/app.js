import express from "express";
import "dotenv/config";
import cors from 'cors';
import cron from 'node-cron';

import runScraper from "./scripts/scraper.js";

//Route imports
import authRoute from "./routes/auth.js";
import catRoute from "./routes/categories.js";
import tenderRoute from "./routes/tenders.js";

const port = process.env.PORT || 8000;

const app=express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))

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

app.use("/api/auth",authRoute);
app.use('/api/categories', catRoute);
app.use('/api/tenders', tenderRoute);