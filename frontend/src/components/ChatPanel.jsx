import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ChatPanel({ conversationId, username, onRefreshConversations, onSelectFile }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [snippetsOpen, setSnippetsOpen] = useState(false);
  const [snippets, setSnippets] = useState([]);
  const [snippetTitle, setSnippetTitle] = useState('New Prompt');
  const [snippetBody, setSnippetBody] = useState('');

  const loadConversation = async (id) => {
    if (!id) {
      setMessages([]);
      return;
    }
    const { data } = await axios.get(`/api/conversation/${id}`);
    setMessages(data.messages || []);
  };

  const loadSnippets = async () => {
    const { data } = await axios.get('/api/snippets');
    setSnippets(data);
  };

  useEffect(() => {
    loadConversation(conversationId);
  }, [conversationId]);

  useEffect(() => {
    loadSnippets();
  }, []);

  const sendPrompt = async () => {
    if (!input.trim()) return;
    const trimmed = input.trim();
    setInput('');
    const { data } = await axios.post('/api/chat', { conversation_id: conversationId, prompt: trimmed });
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }, { role: 'assistant', text: data.response }]);
    onRefreshConversations();
    onSelectFile('README.md');
  };

  const saveSnippet = async () => {
    await axios.post('/api/snippets', { title: snippetTitle || 'New snippet', body: snippetBody || '' });
    setSnippetBody('');
    setSnippetTitle('New snippet');
    loadSnippets();
  };

  return (
    <section className="chat-panel relative">
      <div className="chat-header">
        <h2>{username}'s workspace</h2>
        <button className="icon-button" onClick={() => setSnippetsOpen((v) => !v)}>⋯</button>
      </div>

      {snippetsOpen && (
        <div className="snippet-menu">
          <div className="field">
            <label>Snippet title</label>
            <input value={snippetTitle} onChange={(e) => setSnippetTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Prompt body</label>
            <textarea rows={4} value={snippetBody} onChange={(e) => setSnippetBody(e.target.value)} />
          </div>
          <div className="row-actions">
            <button className="secondary-btn" onClick={() => setSnippetsOpen(false)}>Close</button>
            <button className="primary-btn" onClick={saveSnippet}>Save</button>
          </div>

          <div style={{ marginTop: 14 }}>
            {snippets.map((snippet) => (
              <div key={snippet.id} className="tool-item" style={{ marginBottom: 8 }}>
                <strong>{snippet.title}</strong>
                <button className="secondary-btn" onClick={() => { setInput(snippet.body); setSnippetsOpen(false); }}>Use</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={`${msg.role}-${index}`} className={`message ${msg.role}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          value={input}
          placeholder="Ask VELVOR to build an app, script, or feature..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendPrompt()}
        />
        <button className="primary-btn" onClick={sendPrompt}>Send</button>
      </div>
    </section>
  );
}
