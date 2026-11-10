import express from 'express';

import wrapAsync from '../middlewares/wrapAsync.js';
import requiresAuth from '../middlewares/auth.js';
import {prisma} from '../lib/prisma.js';
import redis from "../lib/redis.js";
import { summarizeTender } from '../lib/ai.js';


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

   // 2. Cache-aside check: If summary already exists in DB, return it instantly
   if (tender.summary) {
     return res.json({
       summary: tender.summary,
       cached: true,
     });
   }

   // 3. Otherwise, generate summary using Gemini AI
   const generatedSummary = await summarizeTender({
     ...tender,
     category: tender.category?.name || "General",
   });

   // 4. Persist summary into Neon DB so future requests cost $0 and take 0ms
   const updated = await prisma.tender.update({
     where: { id },
     data: { summary: generatedSummary },
     include: { category: true },
   });

   res.json({
     summary: updated.summary,
     cached: false,
   });
}));

export default router;