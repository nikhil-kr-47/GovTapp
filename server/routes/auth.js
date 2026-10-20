import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {prisma} from "../lib/prisma.js";
import express from "express";
import wrapAsync from "../middlewares/wrapAsync.js";
import ExpressError from "../utils/expressError.js";

const saltRounds=10;

const router=express.Router();

router.post("/signup",wrapAsync(async(req,res,next)=>{
    const {email,password,confirmPassword}=req.body;

    if(!email || !password || !confirmPassword) return res.status(404).json({ error: 'Insufficient data.' });
    if(password !==confirmPassword) return res.status(400).json({ error: 'Password did not match.' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
       return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email, password: hashedPassword },
    });
    res.status(201).json({ success:"Registration successful" });
}));

router.post("/login",wrapAsync(async(req,res,next)=>{
    const {email,password}=req.body;
    if(!email || !password) return res.status(404).json({ error: 'Insufficient data.' });
    
    const user=await prisma.user.findUnique({where:{email}});
    if(!user)  return res.status(401).json({ error: 'Account not found.' });

    const passCompare=await bcrypt.compare(password, user.password);

    if(!passCompare)return res.status(401).json({ error: 'Invalid username or password.' });

    const token = jwt.sign(
        { userId: user.id },
          process.env.JWT_SECRET,
         { expiresIn: '7d' }
    );
    res.json({token});
}));

export default router;