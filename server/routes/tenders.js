import express from 'express';

import wrapAsync from '../middlewares/wrapAsync.js';
import requiresAuth from '../middlewares/auth.js';
import {prisma} from '../lib/prisma.js';
import redis from "../lib/redis.js";
import { streamTenderSummary } from '../lib/ai.js';


const router=express.Router();

router.get("/matching",requiresAuth,wrapAsync(async(req,res,next)=>{
   const cacheKey=`tenders:user:${req.userId}`;
   const cachedTenders= await redis.get(cacheKey);
   if(cachedTenders){
      return res.json(cachedTenders);
   }
   
   const userCategories=await prisma.userCategory.findMany({where:{userId:req.userId}});
   const catIds=userCategories.map(uc=>uc.categoryId);

   const now = new Date();
   const tenders=await prisma.tender.findMany({
     where:{
       categoryId:{in:catIds},
       OR: [
         { deadline: { gte: now } },
         { deadline: null } // Include tenders if portal has not specified deadline
       ]
     },
     include: { category: true },
     orderBy:[
       { deadline: 'asc' }, // Soonest closing tenders appear first
       { scrapedAt: 'desc' }
     ]
   });

   // Cache for 5 minutes (300 seconds) so active feed stays fresh
   await redis.set(cacheKey, tenders, {ex: 300});

   res.json(tenders);
}));

// GET /api/tenders/saved - Fetch all active saved tenders for logged-in user
router.get("/saved", requiresAuth, wrapAsync(async (req, res) => {
   const now = new Date();
   const records = await prisma.savedTender.findMany({
     where: { 
       userId: req.userId,
       tender: {
         OR: [
           { deadline: { gte: now } },
           { deadline: null } // Include tenders without strict deadline
         ]
       }
     },
     include: {
       tender: {
         include: { category: true }
       }
     },
     orderBy: { savedAt: "desc" }
   });

   const savedTenders = records.map(r => ({
     ...r.tender,
     savedAt: r.savedAt,
     isSaved: true
   }));

   res.json(savedTenders);
}));

// GET /api/tenders/saved/ids - Lightweight list of active saved IDs for fast icon matching
router.get("/saved/ids", requiresAuth, wrapAsync(async (req, res) => {
   const now = new Date();
   const records = await prisma.savedTender.findMany({
     where: { 
       userId: req.userId,
       tender: {
         OR: [
           { deadline: { gte: now } },
           { deadline: null }
         ]
       }
     },
     select: { tenderId: true }
   });

   res.json(records.map(r => r.tenderId));
}));

// POST /api/tenders/:id/save - Toggle bookmark for a tender
router.post("/:id/save", requiresAuth, wrapAsync(async (req, res) => {
   const { id: tenderId } = req.params;

   const existing = await prisma.savedTender.findUnique({
     where: {
       userId_tenderId: {
         userId: req.userId,
         tenderId,
       }
     }
   });

   if (existing) {
     await prisma.savedTender.delete({
       where: {
         userId_tenderId: {
           userId: req.userId,
           tenderId,
         }
       }
     });
     return res.json({ saved: false });
   } else {
     await prisma.savedTender.create({
       data: {
         userId: req.userId,
         tenderId,
       }
     });
     return res.json({ saved: true });
   }
}));

// POST /api/tenders/:id/summarize
// Generates or returns cached AI summary for a specific tender
router.post("/:id/summarize", requiresAuth, wrapAsync(async (req, res) => {
   const { id } = req.params;

   // 1. Fetch tender from DB
   const tender = await prisma.tender.findUnique({
     where: { id },
     include: { category: true },
   });

   if (!tender) {
     return res.status(404).json({ error: "Tender not found" });
   }

   res.setHeader("Content-Type", "text/event-stream");
   res.setHeader("Cache-Control", "no-cache");
   res.setHeader("Connection", "keep-alive");

   
   // 2. Cache-aside check: If summary already exists in DB, stream cached text instantly
   if (tender.summary) {
     

     res.write(`data: ${JSON.stringify({ text: tender.summary, cached: true })}\n\n`);
     res.write(`data: ${JSON.stringify({ text: "[DONE]" })}\n\n`);
     return res.end();
   }

   
   // 3. Otherwise, generate summary using Gemini AI stream
   const generatedSummary = await streamTenderSummary({
     ...tender,
     category: tender.category?.name || "General",
   });

   let fullSummary = "";
   for await (const chunk of generatedSummary) {
     if (chunk.text) {
       fullSummary += chunk.text; // Fixed: chunk.text instead of chunk (prevents "[object Object]")
       res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
     }
   }

   // 4. Persist summary into Neon DB so future requests cost $0 and take 0ms
   await prisma.tender.update({
     where: { id },
     data: { summary: fullSummary.trim() },
   });

   res.write(`data: ${JSON.stringify({ text: "[DONE]" })}\n\n`);
   res.end();
}));

export default router;