import express from 'express';
import wrapAsync from '../middlewares/wrapAsync.js';
import {prisma} from '../lib/prisma.js';
import requiresAuth from '../middlewares/auth.js';

const router=express.Router({mergeParams:true});

router.get("/",wrapAsync(async(req,res,next)=>{
    const categories=await prisma.category.findMany();
    res.json(categories);
}));

router.post("/select",requiresAuth,wrapAsync(async(req,res,next)=>{
    const {catIds}=req.body;   //Could be multiple ids which user wants to see
    await prisma.userCategory.deleteMany({where:{userId:req.userId}});
    await prisma.userCategory.createMany({
        data:catIds.map(cat=>{
            return {
                userId:req.userId,
                categoryId:cat
            }
        })
    });
    return res.json({
        message:'Categories updated'
    });
}));

export default router;