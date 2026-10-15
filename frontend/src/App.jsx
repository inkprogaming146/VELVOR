import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import EditorPanel from './components/EditorPanel';
import SettingsModal from './components/SettingsModal';
import ToolsPanel from './components/ToolsPanel';

const defaultSettings = {
  username: 'Creator',
  mode: 'dark',
  primaryColor: '#8b5cf6',
  secondaryColor: '#22c55e',
  accentColor: '#f59e0b',
};

export default function App() {
  const [settings, setSettings] = useState(defaultSettings);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [filePath, setFilePath] = useState('README.md');

  const themeVars = useMemo(() => ({
    '--primary': settings.primaryColor,
    '--secondary': settings.secondaryColor,
    '--accent': settings.accentColor,
    '--bg': settings.mode === 'dark' ? '#0a0f1c' : '#f5f7fb',
    '--panel': settings.mode === 'dark' ? '#121a2b' : '#ffffff',
    '--panel-alt': settings.mode === 'dark' ? '#192233' : '#eef2ff',
    '--text': settings.mode === 'dark' ? '#edf2ff' : '#111827',
    '--muted': settings.mode === 'dark' ? '#98a7c4' : '#4b5563',
  }), [settings]);

  useEffect(() => {
    axios.get('/api/settings').then(({ data }) => setSettings({ ...defaultSettings, ...data }));
    axios.get('/api/conversations').then(({ data }) => {
      setConversations(data);
      if (data.length) setSelectedConversationId(data[0].id);
    });
  }, []);

  const refreshConversations = async () => {
    const { data } = await axios.get('/api/conversations');
    setConversations(data);
    if (!selectedConversationId && data.length) setSelectedConversationId(data[0].id);
  };

  return (
    <div className={`velvor-root ${settings.mode}`} style={themeVars}>
      <Sidebar
        conversations={conversations}
        onSelectConversation={setSelectedConversationId}
        onNewConversation={async () => {
          const { data } = await axios.post('/api/conversations');
          await refreshConversations();
          setSelectedConversationId(data.id);
        }}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTools={() => setToolsOpen(true)}
        onDeleteConversation={async (id) => {
          await axios.delete(`/api/conversations/${id}`);
          await refreshConversations();
        }}
      />

      <main className="workspace-main">
        <ChatPanel
          conversationId={selectedConversationId}
          username={settings.username}
          onRefreshConversations={refreshConversations}
          onSelectFile={setFilePath}
        />

        <EditorPanel
          filePath={filePath}
          onFileSelect={setFilePath}
          mode={settings.mode}
        />
      </main>

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={async (next) => {
            await axios.post('/api/settings', next);
            setSettings({ ...settings, ...next });
            setSettingsOpen(false);
          }}
        />
      )}

      {toolsOpen && (
        <ToolsPanel
          onClose={() => setToolsOpen(false)}
          onSelectFile={setFilePath}
        />
      )}
    </div>
  );
}
