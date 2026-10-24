import { useState,useEffect } from "react";
import api from "../api.js";


function Categories(){
     const [categories,setCategories]=useState([]);
     const [selected,setSelected]=useState([]);

     useEffect(()=>{
       api.get('/categories')
       .then(res=>setCategories(res.data));
     })

     function toggle(id){
         setSelected(prev=>
            prev.includes(id) ? prev.filter(c=>c!==id) : [...prev,id]
         )
     }

     async function handleSave(){
         await api.post('/categories/select', { catIds: selected });
         alert('Saved!');
     }

     return <div>
       {categories.map(cat=>{
        return <label key={cat.id}>
            <input type="checkbox" checked={selected.includes(cat.id)} onChange={()=>toggle(cat.id)}></input>
            {cat.name}
        </label>
       })}
       <button onClick={handleSave}>Save</button>
     </div>
} 

export default Categories;