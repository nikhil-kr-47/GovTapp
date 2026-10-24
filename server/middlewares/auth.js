import jwt from "jsonwebtoken";

function requiresAuth(req,res,next){
    const authHeader=req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({ error: 'You are not logged in.' });
    }

    const token=authHeader.split(' ')[1];

    try{
        const payload=jwt.verify(token, process.env.JWT_SECRET);
        req.userId=payload.userId;
       next();
    }catch(err){
        return res.status(401).json({ error: 'Log in again.' });
    }
}

export default requiresAuth;