import api from "../api.js";
import { useState,useEffect } from "react";

function Dashboard(){
    
    const [tenders,setTenders]=useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(()=>{
        api.get("/tenders/matching")
        .then(res=>{
            setTenders(res.data);
        })
        .finally(()=>setLoading(false));
    },[])

    if (loading) return <p>Loading...</p>;
    if (tenders.length === 0) return <p>No matching tenders yet.</p>;

    return (
        <>
          <table>
             <thead>
               <tr>
                <th>Title</th>
                <th>Department</th>
                <th>Reference No</th>
               </tr>
             </thead>
             <tbody>
                {tenders.map((t) => (
                   <tr key={t.id}>
                     <td>{t.title}</td>
                     <td>{t.department}</td>
                     <td>{t.referenceNo}</td>
                   </tr>
                ))}
             </tbody>
          </table>
        </>
    )
}

export default Dashboard;