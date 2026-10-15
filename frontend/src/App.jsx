import React, {useState, useEffect} from "react";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import EditorPanel from "./components/EditorPanel";
import "./styles.css";

export default function App(){
  const [selectedConversation, setSelectedConversation] = useState(null);
  return (
    <div className="app-root">
      <Sidebar onSelectConversation={setSelectedConversation}/>
      <main className="main-area">
        <ChatPanel conversationId={selectedConversation}/>
        <EditorPanel />
      </main>
    </div>
  )
}
