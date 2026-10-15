import React, {useState, useEffect} from "react";
import axios from "axios";

export default function ChatPanel({conversationId}){
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  useEffect(()=>{
    // load conversation messages if needed
  }, [conversationId]);

  const send = async ()=>{
    const res = await axios.post('/api/chat', {conversation_id: conversationId, prompt: input});
    setMessages([...messages, {role:'user',text:input}, {role:'assistant',text:res.data.response}]);
    setInput("");
  }

  return (
    <div className="chat-panel">
      <div className="messages">
        {messages.map((m,i)=>(<div key={i} className={m.role}>{m.text}</div>))}
      </div>
      <div className="input-area">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Say something..." />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
