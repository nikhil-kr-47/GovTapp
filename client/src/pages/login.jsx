import { useState } from "react";
import api from "../api.js";
import { useNavigate } from "react-router-dom";

function Login(){
    const [email,setMail]=useState("");
    const [password,setPass]=useState("");
     const [error,setErr]=useState("");
    const navigate=useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try{
        const res= await api.post("/auth/login",{email,password});
        localStorage.setItem('token',res.data.token);
        navigate("/categories");
        }catch(err){
          setErr(err.response?.data?.error||'Invalid email or password.');
        }
    }

    return <>
       <form onSubmit={handleSubmit}>
        <input type="email" value={email} required placeholder="Email" onChange={(e)=>setMail(e.target.value)}></input>
        <input type="password" value={password} required placeholder="Password" onChange={(e)=>setPass(e.target.value)}></input>
        <button type="submit">Log in</button>
        {error && <p>{error}</p>}
       </form>
    </>
}

export default Login;