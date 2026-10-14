const express=require("express");

const port=8000;

const app=express();

app.listen(port,()=>{
    console.log("App started");
})

app.get("/",(req,res)=>{
    res.send("App is listening");
})