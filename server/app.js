import express from "express";
import "dotenv/config";

//Route imports
import authRoute from "./routes/auth.js";
import catRoute from "./routes/categories.js";
import tenderRoute from "./routes/tenders.js";

const port=8000;

const app=express();

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.listen(port,()=>{
    console.log("App started");
})

app.get("/",(req,res)=>{
    res.send("App is listening");
});

app.use("/api/auth",authRoute);
app.use('/api/categories', catRoute);
app.use('/api/tenders', tenderRoute);