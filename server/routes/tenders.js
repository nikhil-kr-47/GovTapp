import express from 'express';

import wrapAsync from '../middlewares/wrapAsync.js';
import requiresAuth from '../middlewares/auth.js';
import {prisma} from '../lib/prisma.js';

const router=express.Router();

router.get("/matching",requiresAuth,wrapAsync(async(req,res,next)=>{
   const userCategories=await prisma.userCategory.findMany({where:{userId:req.userId}});
   const catIds=userCategories.map(uc=>uc.categoryId);
   const tenders=await prisma.tender.findMany({where:{categoryId:{in:catIds}},
     orderBy:{scrapedAt:'desc'}

   });
   res.json(tenders);
}));

export default router;