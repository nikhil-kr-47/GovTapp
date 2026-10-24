import { useState } from "react";
import api from "../api.js";
import {useNavigate} from 'react-router-dom';

function Signup(){
    const [email,setMail]=useState("");
    const [password,setPass]=useState("");
    const [confirmPassword,setConfirmPass]=useState("");
    const [error,setErr]=useState("");
    const navigate=useNavigate();

    async function handleSubmit(e){
       e.preventDefault();
       try{
        await api.post(`/auth/signup`,{email,password,confirmPassword});

        navigate("/login");
       }catch(err){
        setErr(err.response?.data?.error || 'Signup failed');
        console.log(err);
       }
    }

    return <>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} placeholder="Email" required onChange={(e)=>setMail(e.target.value)}></input>
        <input type="password" value={password} placeholder="Password" required onChange={(e)=>setPass(e.target.value)}></input>
        <input type="password" value={confirmPassword} placeholder="Confirm Password" required onChange={(e)=>setConfirmPass(e.target.value)}></input>
        {error && <p>{error}</p>}
        <button type="submit">Sign up</button>
      </form>
    </>
}

export default Signup;