import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Sidebar({
  conversations,
  onSelectConversation,
  onNewConversation,
  onOpenSettings,
  onOpenTools,
  onDeleteConversation,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="brand">VELVOR</span>
        <button className="icon-button" onClick={onOpenSettings}>⚙️</button>
      </div>

      <button className="new-chat" onClick={onNewConversation}>+ New Chat</button>

      <div className="conversation-list">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="conv-item">
            <button className="conv-button" onClick={() => onSelectConversation(conversation.id)}>
              {conversation.title || 'Untitled'}
            </button>
            <button className="delete-btn" onClick={() => onDeleteConversation(conversation.id)}>🗑</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        <button className="secondary-btn" style={{ width: '100%' }} onClick={onOpenTools}>📦 Tools</button>
      </div>
    </aside>
  );
}
