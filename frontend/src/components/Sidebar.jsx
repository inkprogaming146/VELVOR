import React, {useEffect, useState} from "react";
import axios from "axios";

export default function Sidebar({onSelectConversation}){
  const [convs, setConvs] = useState([]);
  useEffect(()=>{ axios.get("/api/conversations").then(r=>setConvs(r.data)); }, []);
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h2>VELVOR</h2>
        <button onClick={()=>{/* open settings modal */}}>⚙️</button>
      </div>
      <div className="conversations">
        {convs.map(c => (
          <div key={c.id} className="conv-item">
            <button onClick={()=>onSelectConversation(c.id)}>{c.title}</button>
            <button onClick={()=>{ axios.delete(`/api/conversations/${c.id}`).then(()=>setConvs(convs.filter(x=>x.id!==c.id)))}}>🗑</button>
          </div>
        ))}
      </div>
      <div className="tools-ui">
        <h3>Tools</h3>
        <button onClick={()=>{/* open tools manager */}}>Open Tools</button>
      </div>
    </aside>
  )
}
