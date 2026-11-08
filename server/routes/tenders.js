import express from 'express';

import wrapAsync from '../middlewares/wrapAsync.js';
import requiresAuth from '../middlewares/auth.js';
import {prisma} from '../lib/prisma.js';
import redis from "../lib/redis.js";


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

export default router;