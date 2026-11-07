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
   const tenders=await prisma.tender.findMany({where:{categoryId:{in:catIds}},
    include: { category: true },
     orderBy:{scrapedAt:'desc'}

   });

   await redis.set(cacheKey, tenders, {ex: 3600});

   res.json(tenders);
}));

export default router;